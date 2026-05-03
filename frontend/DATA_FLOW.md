# Niraksh-Guardian — Data Flow (API & State Management Map)

> This document traces **every piece of data** through the system: where it originates,
> how it transforms, where it's stored, and how it flows between frontend and backend.
> Use it to catch missing fields, type mismatches, and state management gaps.

---

## Changes

- 2026-05-03: Expanded lab report component model, added SWR caching strategy, streaming SSE handling, and upload state machine. Added Redis Pub/Sub example in backend schema.

## 1. System-Level Data Flow Overview

```
┌───────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                         │
│                                                                   │
│  localStorage                React State              SWR Cache   │
│  ┌────────────┐         ┌──────────────────┐     ┌─────────────┐  │
│  │ JWT_token  │         │ AuthContext      │     │ /api/chats  │  │
│  │ refresh_   │         │ { user,          │     │ /api/profile│  │
│  │   token    │◄───────►│  isAuthenticated │     │ /api/history│  │
│  │ user_      │         │  isLoading }     │     │ /api/doctors│  │
│  │   details  │         ├─────────────────┤│     │ /api/reports│  │
│  └────────────┘         │ ToastContext     │ │   └───────┬─────┘  │
│                         └──────────────────┘ │     SWR mutate()   │
│                         │ { toasts[] }     │ │           │        │
│                                              │           │        │
│  ┌───────────────────────────────────────────┤           │        │
│  │           apiClient<T>(endpoint, opts)     ◄──────────┘        │
│  │  ┌─ Inject Bearer token                   │                    │
│  │  ├─ Check token expiry                    │                    │
│  │  ├─ Auto-refresh if expired               │                    │
│  │  ├─ Handle 401 → redirect /login          │                    │
│  │  └─ Parse JSON / handle errors            │                    │
│  └───────────────────────┬───────────────────┘                    │
│                          │ HTTPS                                  │
└──────────────────────────┼────────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────┴────────────────────────────────────────┐
│                     BACKEND (Express + Vercel)                    │
│                                                                   │
│  Middleware Chain:                                                │
│  ┌──────┐  ┌──────────┐  ┌────────────┐  ┌──────────┐             │
│  │ CORS │→ │ Helmet   │→ │ Rate Limit │→ │ Body     │             │
│  │      │  │ (security│  │ (Redis)    │  │ Parser   │             │
│  │      │  │  headers)│  │ 100/15min  │  │ JSON 1MB │             │
│  └──────┘  └──────────┘  └────────────┘  └──────────┘             │
│                                    │                              │
│                     ┌──────────────┼──────────────┐               │
│                     │   authenticate middleware   │               │
│                     │   JWT verify → req.user =   │               │
│                     │   { userId: "uuid" }        │               │
│                     └──────────────┬──────────────┘               │
│                                    │                              │
│              ┌─────────────────────┼─────────────────────┐        │
│              │          Route Handlers                   │        │
│              │  Controllers → Services → Prisma → DB     │        │
│              └─────────────────────┬─────────────────────┘        │
│                                    │                              │
│  ┌─────────────┐  ┌───────────┐  ┌─┴──────────┐  ┌─────────────┐  │
│  │ PostgreSQL  │  │ Redis     │  │ Cloudinary │  │ Google AI   │  │
│  │ (Prisma     │  │ (token    │  │ (images,   │  │ (Gemini     │  │
│  │  Accelerate)│  │  blacklist│  │  PDFs)     │  │  2.5 Flash) │  │
│  │             │  │  rate     │  │            │  │             │  │
│  │ 13 models   │  │  limits)  │  │ 4 folders  │  │ 7 functions │  │
│  └─────────────┘  └───────────┘  └────────────┘  └─────────────┘  │
└───────────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication Data Flow

### 2.1 Signup

```
FRONTEND                              BACKEND                            DATABASE
────────                              ───────                            ────────
SignupForm                             auth.controller.ts                 PostgreSQL
  │                                      │                                  │
  ├─ Zod validate:                       │                                  │
  │  { email, password(min8),            │                                  │
  │    name?, gender? }                  │                                  │
  │                                      │                                  │
  └─ POST /api/auth/signup ─────────────►│                                  │
     { email, password,                  ├─ signupSchema.parse()            │
       name?, gender? }                  ├─ Check: user exists? ───────────►│ SELECT users
                                         │◄─ null (good) ───────────────────│
                                         ├─ hashPassword(password)          │
                                         ├─ Create user ───────────────────►│ INSERT users
                                         │◄─ { id, email, name, gender } ───│
                                         ├─ generateAccessToken(id) [15m]   │
                                         ├─ generateRefreshToken(id) [7d]   │
                                         ├─ hashToken(refreshToken)         │
                                         ├─ Store refresh token ───────────►│ INSERT refresh_tokens
                                         │                                  │
  ◄───── 201 Response ───────────────────│                                  │
  {                                      │
    message: "User created successfully",│
    user: { id, email, name, gender },   │
    tokens: { accessToken, refreshToken }│
  }                                      │
  │                                      │
  ├─ localStorage.setItem("JWT_token", accessToken)
  ├─ localStorage.setItem("refresh_token", refreshToken)
  ├─ localStorage.setItem("user_details", JSON.stringify(user))
  ├─ AuthContext.login(tokens, user)
  └─ router.push(returnUrl || "/dashboard")
```

### 2.2 Token Refresh (Silent)

```
apiClient detects: token expired (JWT exp < now)
  │
  ├─ POST /api/auth/refresh-token ──────► Backend
  │  { refreshToken }                     ├─ Verify JWT
  │                                       ├─ Find stored token (not revoked, not expired)
  │                                       ├─ Revoke old token (rotation!)
  │                                       ├─ Generate new access + refresh tokens
  │                                       ├─ Store new refresh token in DB
  │  ◄── { accessToken, refreshToken } ──┤
  │  (NOTE: flat response, NOT wrapped in "tokens")
  │
  ├─ Update localStorage with new tokens
  ├─ Retry original failed request with new accessToken
  └─ User never notices (seamless)
```

### 2.3 Logout

```
FRONTEND                              BACKEND                     REDIS
────────                              ───────                     ─────
  │                                     │                           │
  └─ POST /api/auth/logout ───────────► │                           │
     { refreshToken }                   ├─ Revoke refreshToken ───►DB
     Header: Bearer <accessToken>       ├─ Blacklist accessToken ─► │ SET token TTL=remaining
                                        │                           │
  ◄── { message: "Logged out successfully" } ─│                     │
  │
  ├─ localStorage.clear()
  ├─ AuthContext.logout()
  └─ router.push("/login")
```

---

## 3. Chat Data Flow

### 3.1 Send Message (with image)

```
FRONTEND                            BACKEND                              EXTERNAL
────────                            ───────                              ────────
ChatWindow
  │
  ├─ User types message + attaches image
  │
  ├─ Build FormData:
  │   formData.append("content", "I have a rash")
  │   formData.append("language", "en")      [optional]
  │   formData.append("image", file)         [optional]
  │
  └─ POST /api/chats/:chatId/messages ─────► chat.controller.ts
     (multipart/form-data)                    │
                                              ├─ authenticate → req.user.userId
                                              ├─ Verify chat ownership
                                              ├─ If image:
                                              │   └─ Set content = `[Image Uploaded] ${content}`
                                              │      (image buffer passed directly to Gemini, NOT uploaded to Cloudinary)
                                              │
                                              ├─ Save user message ──────────► DB: messages
                                              ├─ Fetch last 20 messages (context window)
                                              │
                                              ├─ generateAIResponse( ─────────► Google Gemini
                                              │    history, content,              (gemini-2.5-flash-lite)
                                              │    language, imageBuffer)
                                              │◄─ AI response text ──────────┘
                                              │
                                              ├─ Save AI message ────────────► DB: messages
                                              │
   ◄── { userMessage, aiMessage } ────────────┤
  │                                           │
  ├─ Append both messages to chat window
  ├─ Auto-scroll to bottom
  └─ SWR mutate("/api/chats") → refresh sidebar (updatedAt changed)
```

### 3.2 Chat Data Model (Complete)

```
SWR Cache Key           API Endpoint            DB Tables         Response Shape
─────────────           ────────────            ─────────         ──────────────
"/api/chats"            GET /api/chats          chats +           [{ id, title,
                                                messages            createdAt, updatedAt,
                                                (last 1)            messages: [{
                                                                      id, role, content,
                                                                      createdAt }] }]
                                                                    (1-element messages array)

"/api/chats/:id"        GET /api/chats/:id      messages          [{ id, chatId, role,
                                                (all, asc)          content, createdAt }]
                                                                    (flat messages array, NO
                                                                     chat wrapper object)

POST /api/chats             { title, language }   chats             { id, userId, title,
(create)                                                              createdAt, updatedAt }

PUT /api/chats/:id          { title }             chats             { id, userId, title,
(update title)                                                        createdAt, updatedAt }

DELETE /api/chats/:id       (no body)             chats             { message: "Chat deleted
(delete)                                                               successfully" }
```

> **⚠️ Field name mapping (symptom analysis):** The fresh POST response from
> Gemini uses `possibleConditions` and `urgency`, but the DB (and GET
> `/api/history/symptom`) stores them as `predictedConditions` and
> `urgencyLevel`. The history record also omits `severity`, `reasoning`,
> and `homeRemedies` (not persisted).

---

## 4. Health Tools Data Flow

### 4.1 Symptom Analysis → History → Report Chain

This is the **most critical data chain** — symptoms feed into history, which feeds into health reports.

```
/doctor-suggest                    Backend                           Database
───────────────                    ───────                           ────────
User enters symptoms + image
  │
  └─ POST /api/ai/analyze ──────► symptom.controller.ts
     FormData:                       │
       symptoms[]: ["headache",      ├─ analyzeSymptomsSchema.parse()
                    "nausea"]        │
       language: "en" (default)      ├─ analyzeSymptoms() ──────────► Gemini AI
       image: file (optional)        │◄─ { possibleConditions,        (structured JSON)
                                     │    severity, urgency,
                                     │    reasoning, recommendedSpecialist,
                                     │    homeRemedies }
                                     │
                                     ├─ Upload image (optional) ────► Cloudinary
                                     │   folder: niraksh_symptoms      (niraksh_symptoms/)
                                     │
                                     ├─ Save to history ────────────► symptom_analysis_history
                                     │   { userId, symptoms[],          INSERT
                                     │     imageUrl?, predictedConditions,
                                     │     urgencyLevel, recommendedSpecialist }
                                     │
   ◄── analysis result ──────────────│

  ... later, user generates report ...

/reports
  └─ GET /api/reports/health-summary ──► report.controller.ts
                                          │
                                          ├─ Fetch user + profile ─────► users + patient_health_profiles
                                          ├─ Fetch last 5 symptoms ────► symptom_analysis_history ◄── THIS DATA
                                          ├─ Fetch last 5 medicines ───► medicine_history
                                          │
                                          ├─ generateContent(prompt) ──► Gemini AI
                                          │   (includes all fetched data)
                                          │
                                          ├─ Generate PDF (PDFKit)
                                          ├─ Upload PDF ───────────────► Cloudinary
                                          │   folder: niraksh_reports     (niraksh_reports/)
                                          │
                                          ├─ Enforce 10-report limit:
                                          │   count > 10? → delete oldest from DB + Cloudinary
                                          │
                                          ├─ Save report record ───────► health_reports
                                          │                                INSERT
    ◄── { message, reportUrl } ───────────│
```

### 4.1.1 Summarize Chat Symptoms for Doctor Referral

```
/doctor-suggest (with chatId)       Backend                         Gemini AI
─────────────────────────────       ───────                         ─────────
User clicks "Summarize for Doctor"
  │
  └─ POST /api/ai/summarize-symptoms ──► symptom.controller.ts
     Body: { chatId }                      │
                                           ├─ Verify chat exists & owned by user
                                           │   (prisma.chat.findUnique + messages)
                                           │
                                           ├─ Extract user messages from chat
                                           │   messages.filter(role === "user")
                                           │   .map(m => m.content).join("\n")
                                           │
                                           └─ Call summarizeChatSymptoms() ──────► Gemini
                                               systemInstruction:                  2.5-flash
                                               "Only talk about medical             │
                                               and healthcare"                     │
                                                                                   │
  ◄── { summary, status } ────────────────────────────────────────────────────────┘
        │
        ├─ status: "success" → Display doctor-ready summary
        └─ status: "non_medical" → "No medical content found"
```

### 4.2 Prescription → Drug Interaction Chain

```
/prescription                        Backend                         Database
─────────────                        ───────                         ────────
User uploads 3 prescription images
  │
  └─ POST /api/ai/prescription ────► healthTools.controller.ts
     FormData:                         │
       files[]: [img1, img2, img3]     ├─ Upload first image ────────► Cloudinary
                                       │   folder: niraksh_prescriptions
                                       │
                                       ├─ analyzePrescription( ──────► Gemini AI
                                       │    imageBuffers[])             (extracts MEDICINES_JSON)
                                       │◄─ { description, medicines[] }
                                       │
                                       ├─ Save to history ───────────► prescription_history
                                       │   { userId, imageUrl,           INSERT
                                       │     extractedText: medicines.join(", "),
                                       │     analysisResult: JSON }
                                       │
    ◄── { description, medicines[] } ──│

Frontend extracts medicine names from medicines[]
  │
  └─ User clicks "Check Drug Interactions"
      └─ router.push("/drug-interaction?medicines=Paracetamol,Amoxicillin")

/drug-interaction                    Backend                         Database
─────────────────                    ───────                         ────────
Pre-filled: medicines = [Paracetamol, Amoxicillin]
  │
  └─ POST /api/ai/drug-interaction ► healthTools.controller.ts
      { medicines: ["Paracetamol",      │
                   "Amoxicillin"] }     ├─ drugInteractionSchema.parse()
                                        ├─ checkDrugInteraction() ───► Gemini AI
                                        │◄─ markdown result            (interaction analysis)
                                        │
                                        ├─ Save to history ──────────► drug_interaction_history
                                        │   { userId, drugs[],           INSERT
                                        │     interactionResult: JSON }
                                        │
    ◄── { description: "markdown..." } ─│
```

### 4.3 Medicine Analysis

```
/medicine                            Backend                         Database
─────────                            ───────                         ────────
Option A: User enters "Paracetamol"
Option B: User uploads image of medicine box
  │
  └─ POST /api/ai/medicine ─────────► healthTools.controller.ts
     FormData:                          │
       name: "Paracetamol"  (OR)        ├─ Either: text prompt with name
       image: file                      │  Or: image analysis via Gemini
                                        │
                                        ├─ Upload image (if any) ────► Cloudinary
                                        │   folder: niraksh_medicines   (niraksh_medicines/)
                                        │
                                        ├─ analyzeMedicine() ────────► Gemini AI
                                        │◄─ markdown result             (medicine details)
                                        │
                                        ├─ Save to history ──────────► medicine_history
                                        │   { userId, imageUrl,          INSERT
                                        │     medicineName?,
                                        │     analysisResult: JSON }
                                        │
    ◄── { description: "markdown..." } ─│
```

---

## 5. Profile & Dashboard Data Flow

### 5.1 Profile Load (Merged User + Health Data)

```
/profile                             Backend                          Database
────────                             ───────                          ────────
Page mount → SWR fetch
  │
  └─ GET /api/profile ──────────────► profile.controller.ts
                                       │
                                       ├─ Fetch user with profile ──► users JOIN
                                       │   select: id, email, name,     patient_health_profiles
                                       │   gender, languagePreference,
                                       │   patientHealthProfile (1:1)
                                       │
   ◄── {                               │
    user: {                            │
      id, email, name,                 │
      gender, languagePreference       │
    },                                 │
    healthProfile: {                   │  ← null if first-time user
      id, bloodGroup, allergies[],     │
      chronicConditions[],             │
      emergencyContactName,            │
      emergencyContactPhone,           │
      emergencyContactEmail,           │
      healthRiskScore,                 │
      createdAt, updatedAt             │
    } | null                           │
  } ───────────────────────────────────│
  │
  ├─ Populate user fields: name, email (readonly), gender
  ├─ Populate health fields (or empty form if null)
  └─ Display risk score gauge (read-only)
```

### 5.2 Profile Update (Single Request, Dual Update)

```
/profile                             Backend                          Database
────────                             ───────                          ────────
User edits name + adds allergy
  │
  └─ PUT /api/profile ──────────────► profile.controller.ts
     {                                 │
       name: "Adarsh",                 ├─ If user fields changed:
       gender: "Male",                 │   └─ prisma.user.update() ──► UPDATE users
       languagePreference: "en",       │
       bloodGroup: "O+",               ├─ Calculate risk score:
       allergies: ["Penicillin"],      │   chronicConditions.length × 10 (max 100)
       chronicConditions: ["Asthma"],  │
       emergencyContactName: "Dad",    ├─ prisma.patientHealthProfile
       emergencyContactPhone: "+91..", │     .upsert() ──────────────► UPSERT
       emergencyContactEmail: "..."    │                                patient_health_profiles
     }                                 │
                                       ├─ Fetch updated user ────────► SELECT users
                                       │
   ◄── {                               │
    user: { id, email, name, gender,   │
            languagePreference },      │
    healthProfile: { ... updated,      │
      healthRiskScore: 10 }            │  ← auto-calculated (1 condition × 10)
  } ───────────────────────────────────│
  │
  ├─ SWR mutate("/api/profile") → cache updated
  ├─ Toast "Profile updated successfully"
  └─ Risk score gauge updates automatically
```

### 5.3 Dashboard Aggregation (6 Parallel Fetches)

```
/dashboard                            Backend APIs                    Database
──────────                            ────────────                    ────────
Page mount → Promise.all via SWR
  │
  ├─ GET /api/profile ──────────────► profile (user + healthProfile)
  ├─ GET /api/history/medicine ─────► medicine_history (all, desc)
  ├─ GET /api/history/prescription ─► prescription_history (all, desc)
  ├─ GET /api/history/interaction ──► drug_interaction_history (all, desc)
  ├─ GET /api/history/symptom ──────► symptom_analysis_history (all, desc)
  └─ GET /api/reports ──────────────► health_reports (all, desc)
      │
      ▼
  Frontend receives all 6 responses
      │
      ├─ RiskScoreCard:    profile.healthProfile.healthRiskScore → gauge (0-100)
      │
      ├─ HealthSummary:    profile.healthProfile.bloodGroup, allergies[],
      │                    chronicConditions[], emergencyContact*
      │
      ├─ QuickActions:     Static links (no data needed)
      │
      ├─ RecentActivity:   Merge all 4 history arrays
      │                    → Sort by createdAt desc
      │                    → Take first 10
      │                    → Display unified timeline with type badges
      │
      └─ PastReports:      reports[] → cards with date + download link
```

### 5.4 Doctor Search Response (Paginated Wrapper)

```
/doctor-suggest                     Backend                           Database
───────────────                     ───────                           ────────
User applies filters + search
  │
  └─ GET /api/doctors?specialization=Neurologist&city=Mumbai
       &sortBy=rating&order=desc&page=1&limit=12
       │
       └──────────────────────────► doctor.controller.ts
                                    │
                                    ├─ doctorSchema.parse(req.query)
                                    ├─ prisma.doctor.findMany() ───► doctors
                                    ├─ prisma.doctor.count() ──────► total
                                    │
  ◄── {                             │
    data: [{                        │
      id, name, email,              │  ← Array of Doctor objects
      phone?, imageUrl?,            │
      specialization,               │
      qualification?,               │
      experienceYears, rating,      │
      consultationFee,              │
      city, state, bio?,            │
      createdAt                     │
    }, ...],                        │
    meta: {                         │  ← Pagination metadata
      total: 42,                    │
      page: 1,                      │
      limit: 12,                    │
      pages: 4                      │
    }                               │
  } ────────────────────────────────│
  │
  ├─ Render doctor cards from response.data (NOT response directly)
  ├─ Render pagination from response.meta
  └─ SWR key includes full query string (cache per filter combo)
```

### 5.5 History Response Shapes (All 4 Types)

```
GET /api/history/medicine        → [{ id, userId, imageUrl, medicineName, analysisResult, createdAt }]
GET /api/history/prescription    → [{ id, userId, imageUrl, extractedText, analysisResult, createdAt }]
GET /api/history/interaction     → [{ id, userId, drugs[], interactionResult, createdAt }]
GET /api/history/symptom         → [{ id, userId, symptoms[], imageUrl, predictedConditions, urgencyLevel,
                                      recommendedSpecialist, createdAt }]

DELETE /api/history/:type/:id    → { message: "Record deleted successfully" }

Note: All history GETs return ALL records (no pagination), sorted by createdAt DESC.
      analysisResult and interactionResult are JSON objects (Prisma Json type).
      predictedConditions is also a JSON type (parsed as array on frontend).
```

---

## 6. Complete Database Model Map (13 Tables)

```
┌──────────────────────────────────────────────────────────────────────┐
│                              users                                   │
│  id | email | passwordHash? | name? | gender? | languagePreference?  │
│  isEmailVerified | isActive | lastLogin? | createdAt | updatedAt     │
├──────────────────────────────────────────────────────────────────────┤
│                          RELATIONS (1:N or 1:1)                      │
└───┬────────┬────────┬───────┬────────┬────────┬────────┬────────┬────┘
    │        │        │       │        │        │        │        │
    ▼        ▼        ▼       ▼        ▼        ▼        ▼        ▼
┌────────┐┌──────┐┌───────┐┌────────┐┌────────┐┌──────┐┌──────┐┌──────┐
│oauth_  ││refre-││pass-  ││chats   ││patient_││medici││prescr││drug_ │
│accounts││sh_   ││word_  ││        ││health_ ││ne_   ││iption││inter-│
│        ││tokens││reset_ ││  │     ││profiles││histo-││_hist-││action│
│provider││      ││tokens ││  ▼     ││(1:1)   ││ry    ││ory   ││_hist-│
│provider││token-││       ││messages││        ││      ││      ││ory   │
│AccountI││Hash  ││token- ││        ││bloodGr-││image-││image-││      │
│d       ││expir-││Hash   ││role    ││oup     ││Url   ││Url   ││drugs │
│        ││esAt  ││expir- ││content ││allerg- ││medic-││extra-││[]=   │
│        ││revok-││esAt   ││createdA││ies[]   ││inNam-││ctedT-││inter-│
│        ││ed    ││used   ││t       ││chronic-││e?    ││ext   ││actio │
│        ││      ││       ││        ││Conditi-││analy-││analy-││nResu │
│        ││      ││       ││        ││ons[]   ││sisRe-││sisRe-││lt    │
│        ││      ││       ││        ││emergen-││sult  ││sult  ││      │
│        ││      ││       ││        ││cy*     ││      ││      ││      │
│        ││      ││       ││        ││healthR-││      ││      ││      │
│        ││      ││       ││        ││iskScore││      ││      ││      │
└────────┘└──────┘└───────┘└────────┘└────────┘└──────┘└──────┘└──────┘

                  ┌──────────────┐  ┌──────────────┐
                  │ symptom_     │  │ health_      │
                  │ analysis_    │  │ reports      │
                  │ history      │  │              │
                  │              │  │ reportUrl    │
                  │ symptoms[]   │  │ publicId?    │
                  │ imageUrl?    │  │ createdAt    │
                  │ predicted-   │  │              │
                  │ Conditions   │  │ (max 10/user)│
                  │ urgencyLevel │  │              │
                  │ recommended- │  │              │
                  │ Specialist   │  │              │
                  └──────────────┘  └──────────────┘
```

---

## 7. SWR Cache Management Map

### 7.1 Cache Keys & Invalidation Rules

| SWR Cache Key                 | Populated By  | Invalidated (mutate) When                          |
| ----------------------------- | ------------- | -------------------------------------------------- |
| `/api/chats`                  | Chat sidebar  | Create chat, Delete chat, Send message (updatedAt) |
| `/api/chats/${chatId}`        | Chat window   | Send message (append messages)                     |
| `/api/doctors?${queryString}` | Doctor search | Filter/sort/page change (new key)                  |
| `/api/profile`                | Profile page  | Profile update (PUT)                               |
| `/api/history/medicine`       | History tab   | New medicine analysis, Delete history              |
| `/api/history/prescription`   | History tab   | New prescription analysis, Delete history          |
| `/api/history/interaction`    | History tab   | New drug interaction check, Delete history         |
| `/api/history/symptom`        | History tab   | New symptom analysis, Delete history               |
| `/api/reports`                | Reports page  | Generate new report                                |
| `/api/disease/info?topic=X`   | Disease page  | Never (1hr stale, immutable per topic)             |

### 7.2 Cross-Page Cache Sharing

```
Scenario: User analyzes symptoms on /doctor-suggest, then visits /history

  /doctor-suggest
    └─ POST /api/ai/analyze
        └─ Backend saves to symptom_analysis_history
            └─ Frontend does NOT mutate /api/history/symptom here
                (it doesn't have that SWR key active)

  /history (user navigates here)
    └─ SWR fetches GET /api/history/symptom
        └─ Fresh data includes the new analysis ✅
        (SWR revalidateOnMount = true by default)

Scenario: User analyzes prescription on /prescription, clicks "Check Interactions"

  /prescription
    └─ POST /api/ai/prescription → returns { medicines: ["A", "B"] }
    └─ [Check Drug Interactions] → router.push("/drug-interaction?medicines=A,B")

  /drug-interaction
    └─ Reads URL params → pre-fills medicine list
    └─ No SWR cache dependency (data passed via URL)

### SWR Caching Strategy (Guidelines)

- Cache key conventions:
  - Use the full query string for list endpoints: `/api/doctors?specialization=...&page=...`
  - Use resource-id keys for single items: `/api/chats/${chatId}`
  - For paginated lists include `page` and `limit` in the key

- TTL / revalidation:
  - Short-lived interactive endpoints (chats, messages): revalidate on focus and after mutation.
  - Profile & static user data: keep until mutate (manual revalidation after PUT).
  - Disease info: cache per-topic+language for 30 days (backend enforces TTL); frontend may set `staleWhileRevalidate: true`.

- Invalidation rules (examples):
  - After POST /api/chats/:chatId/messages → mutate `/api/chats/${chatId}` and `/api/chats`
  - After generating a report → mutate `/api/reports`
  - After analysis saved server-side (symptom/prescription) → mutate relevant history key if active

- Optimistic updates:
  - Use optimistic UI for sending messages: append temporary message with `pending: true` then replace on success.
  - Reconcile by message id or timestamp on server response.

### Streaming Response Handling (Frontend)

- Consumer pattern:
  1. Open SSE connection to `/api/ai/stream?requestId=...` or POST then subscribe.
  2. On `chunk` events, append text to the output buffer and render progressively.
  3. On `meta` events, update progress indicators (tokens used, elapsed time).
  4. On `done`, finalize and persist message to DB if not already saved.
  5. On `error`, show a recoverable UI and offer retry.

- Robustness:
  - Use an incremental backoff when reconnecting; cap total retries.
  - Send a `requestId` on initial POST so reconnection can resume where left off.
  - Log partial transcripts to local IndexedDB if user navigates away unexpectedly.

### Image Upload State Machine

- States: `idle` → `validating` → `uploading` → `processing` → `success` | `error`

- Transitions:
  - `idle` → `validating` when user selects file(s)
  - `validating` → `uploading` if size/type OK (else `error`)
  - `uploading` → `processing` after server acknowledges upload and begins AI analysis
  - `processing` → `success` on analysis completion (server returns result)
  - Any step can move to `error` (show actionable message + retry button)

- Retry strategy:
  - For network failures: exponential backoff (2s, 4s, 8s) up to 3 attempts
  - For server 5xx: surface to user and allow manual retry

```

---

## 8. File Upload Data Flow

### 8.1 Upload Pipeline (All File Types)

```
Frontend                           Backend                          Cloudinary
────────                           ───────                          ──────────
react-dropzone                     multer (memory)                  Upload API
  │                                  │                                │
  ├─ Validate file type              │                                │
  │  (image/jpeg, image/png,         │                                │
  │   image/webp)                    │                                │
  ├─ Validate size (< 5MB)           │                                │
  ├─ Build FormData                  │                                │
  │                                  │                                │
  └─ POST → multipart/form-data ───► │                                │
                                     ├─ Parse into buffer             │
                                     │  (req.file.buffer or           │
                                     │   req.files[].buffer)          │
                                     │                                │
                                     └─ uploadFile(buffer, folder) ──►│
                                        ├─ "niraksh_symptoms"         ├─ Returns { url, publicId }
                                        ├─ "niraksh_medicines"        │
                                        ├─ "niraksh_prescriptions"    │
                                        └─ "niraksh_reports" (PDF)    │
                                        (Chat images NOT uploaded —   │
                                         passed directly to Gemini)   │
                                                                      │
                                      ◄── { url, publicId } ──────────┘
                                     │
                                     └─ Save URL to database
```

### 8.2 Cloudinary Folder Structure

| Folder                   | Content           | Upload Source     | Max Files |
| ------------------------ | ----------------- | ----------------- | --------- |
| `niraksh_symptoms/`      | Symptom images    | Analyze symptoms  | Unlimited |
| `niraksh_medicines/`     | Medicine images   | Medicine analysis | Unlimited |
| `niraksh_prescriptions/` | Prescription imgs | Prescription scan | Unlimited |
| `niraksh_reports/`       | Health PDFs       | Report generation | 10/user   |

---

## 9. Error Data Flow

### 9.1 Backend Error Response Shapes

```
OPERATIONAL ERROR (known):
{
  "error": "User already exists"          ← string message
}
Status: 400 / 401 / 403 / 404 / 429 / 503

VALIDATION ERROR (Zod):
{
  "error": [                               ← array of issues
    {
      "code": "too_small",
      "minimum": 8,
      "path": ["password"],
      "message": "String must contain at least 8 character(s)"
    }
  ]
}
Status: 400

UNHANDLED ERROR:
{
  "error": "Internal Server Error"         ← generic message
}
Status: 500
(In development: also includes "message" field with details)
```

### 9.2 Frontend Error Handling Pipeline

```
apiClient receives response
  │
  ├─ Status 200-299 → Parse JSON → Return typed data
  │
  ├─ Status 401 → Token expired?
  │   ├─ Try refresh → POST /api/auth/refresh-token
  │   │   ├─ Success → Retry original request
  │   │   └─ Failure → Clear localStorage → redirect /login
  │   └─ No refresh token → Clear localStorage → redirect /login
  │
  ├─ Status 400 + error is Array → Zod validation errors
  │   └─ Map to form field errors (React Hook Form setError)
  │
  ├─ Status 400 + error is String → Operational error
  │   └─ Toast notification with error message
  │
  ├─ Status 429 → Rate limited
  │   └─ Toast "Too many requests, please wait"
  │
  ├─ Status 503 → Service unavailable (AI failure)
  │   └─ Toast "AI service temporarily unavailable"
  │
  └─ Status 500 → Server error
      └─ Toast "Something went wrong" + optional retry
```

---

## 10. State Persistence Map

### 10.1 What's Stored Where

| Data                | Storage       | Lifetime         | Cleared When              |
| ------------------- | ------------- | ---------------- | ------------------------- |
| Access token (JWT)  | localStorage  | 15 minutes       | Logout, refresh, 401      |
| Refresh token (JWT) | localStorage  | 7 days           | Logout, refresh (rotated) |
| User details        | localStorage  | Until logout     | Logout                    |
| Auth state          | React Context | Session (memory) | Logout, page refresh†     |
| Toast queue         | React Context | Session (memory) | Auto-dismiss (5s)         |
| Chat list           | SWR cache     | Until mutate     | Create/delete/message     |
| Chat messages       | SWR cache     | Until mutate     | Send message              |
| Doctor results      | SWR cache     | Until key change | New filter/search/page    |
| Profile             | SWR cache     | Until mutate     | Profile update            |
| All history types   | SWR cache     | Until mutate     | New analysis, delete      |
| Reports list        | SWR cache     | Until mutate     | Generate report           |
| Disease info        | SWR cache     | 1 hour stale     | Never (per topic)         |

† On page refresh, AuthContext re-hydrates from localStorage tokens

### 10.2 URL-Carried State (Ephemeral)

| URL Parameter | Source Page        | Target Page         | Purpose                 |
| ------------- | ------------------ | ------------------- | ----------------------- |
| `?symptoms=`  | `/` (hero search)  | `/doctor-suggest`   | Pre-fill symptom input  |
| `?condition=` | `/disease`         | `/doctor-suggest`   | Auto-set specialization |
| `?topic=`     | `/` (disease card) | `/disease`          | Auto-fetch disease info |
| `?language=`  | `/` (disease card) | `/disease`          | Set language preference |
| `?medicines=` | `/prescription`    | `/drug-interaction` | Pre-fill medicine list  |
| `?type=`      | `/dashboard`       | `/history`          | Auto-select history tab |
| `?returnUrl=` | Any protected      | `/login`            | Post-login redirect     |
| `?token=`     | Email link         | `/reset-password`   | Password reset token    |

---

## 11. Rate Limiting Impact on Frontend

| Limiter         | Scope                            | Limit       | Frontend Handling                         |
| --------------- | -------------------------------- | ----------- | ----------------------------------------- |
| Global          | All endpoints                    | 100 / 15min | Nearly impossible to hit normally         |
| Login           | `POST /api/auth/login`           | 10 / 15min  | Show "Too many attempts, wait 15 minutes" |
| Forgot password | `POST /api/auth/forgot-password` | 5 / 30min   | Show "Too many requests, wait 30 minutes" |

**Note:** Rate limiters use Redis with **fail-open** strategy — if Redis is down, requests proceed without rate limiting.

---

## 12. Gemini AI Integration Map

| Frontend Feature  | Backend Function          | Gemini Input                      | Output Format                |
| ----------------- | ------------------------- | --------------------------------- | ---------------------------- |
| Chat message      | `generateAIResponse()`    | 20-msg history + message + image? | Raw text (markdown)          |
| Symptom analysis  | `analyzeSymptoms()`       | symptoms[] + language + image?    | Structured JSON              |
| Disease info      | `getDiseaseInfo()`        | topic + language                  | Structured JSON              |
| Medicine analysis | `analyzeMedicine()`       | name OR image                     | Markdown text                |
| Prescription scan | `analyzePrescription()`   | imageBuffers[] (up to 5)          | { description, medicines[] } |
| Drug interaction  | `checkDrugInteraction()`  | medicines[] (min 2)               | Markdown text                |
| Symptom summary   | `summarizeChatSymptoms()` | chatId → user messages text       | { summary, status }          |
| Health report     | `generateContent()`       | Full patient data prompt          | Structured JSON              |

---

## 13. Data Integrity Checks (Early Warning for Frontend Dev)

### 13.1 Required Null Handling

| Field                             | Can Be Null? | Frontend Must Handle            |
| --------------------------------- | ------------ | ------------------------------- |
| `user.name`                       | Yes          | Display "User" or email prefix  |
| `user.gender`                     | Yes          | Show "Not specified"            |
| `user.languagePreference`         | Yes          | Default to "en"                 |
| `user.passwordHash`               | Yes          | Google-only users (no password) |
| `healthProfile` (entire object)   | Yes          | First-time users → empty form   |
| `healthProfile.bloodGroup`        | Yes          | Show "Not set"                  |
| `healthProfile.emergencyContact*` | Yes          | Show "No emergency contact"     |
| `doctor.qualification`            | Yes          | Don't show if null              |
| `doctor.phone`                    | Yes          | Hide phone section              |
| `doctor.imageUrl`                 | Yes          | Show placeholder avatar         |
| `medicineHistory.medicineName`    | Yes          | Show "Image analysis"           |
| `symptomHistory.imageUrl`         | Yes          | Don't show image icon           |

### 13.2 Array Fields (Never Null, Can Be Empty)

| Field                             | Default | Frontend Empty State          |
| --------------------------------- | ------- | ----------------------------- |
| `healthProfile.allergies`         | `[]`    | Show "No known allergies"     |
| `healthProfile.chronicConditions` | `[]`    | Show "None"                   |
| `symptomHistory.symptoms`         | `[]`    | Should never be empty (min 1) |
| `drugInteractionHistory.drugs`    | `[]`    | Should never be empty (min 2) |
| `chat.messages`                   | `[]`    | Show welcome message          |

### 13.3 Integer Ranges

| Field                    | Min | Max | Default | Frontend Display        |
| ------------------------ | --- | --- | ------- | ----------------------- |
| `healthRiskScore`        | 0   | 100 | 0       | Gauge: green/yellow/red |
| `doctor.experienceYears` | 0   | ∞   | —       | "X years experience"    |
| `doctor.consultationFee` | 0   | ∞   | —       | "₹X"                    |
| `doctor.rating`          | 0   | 5.0 | 0       | Star rating display     |
| Pagination `page`        | 1   | ∞   | 1       | Page X of Y             |
| Pagination `limit`       | 1   | 50  | 10      | Items per page          |

---

## 14. Doctor Relevance Sorting (Implemented)

When the user completes a symptom analysis, the doctor search uses **in-memory relevance scoring** instead of the default DB `ORDER BY`.

### 14.1 Signal Sources

| Signal             | How it arrives                                  | How stored                                          |
| ------------------ | ----------------------------------------------- | --------------------------------------------------- |
| Symptom conditions | `POST /api/ai/analyze` → `possibleConditions[]` | Passed as `matchTags` query param (comma-separated) |
| User location      | `GET /api/profile` → `healthProfile.city/state` | Passed as `userCity`/`userState` query params       |

### 14.2 Scoring Algorithm (backend `doctor.controller.ts`)

```
score = 0

// Tag relevance (case-insensitive substring match)
for each keyword in matchTags:
  if any(doctor.tags).includes(keyword):  score += 10

// Proximity boost
if doctor.city == userCity:   score += 50
elif doctor.state == userState: score += 20

// Quality signals
score += doctor.rating * 3          // 0–15 pts
score += min(experienceYears, 20)/2  // 0–10 pts
score += (10000 - consultationFee) / 1000  // fee inverse
```

Doctors are sorted descending by `_relevanceScore`, with `rating` as tie-breaker. Pagination happens **after** in-memory sort.

### 14.3 Response Shape (when relevance sort active)

Each `Doctor` in the response receives two extra computed fields:

```typescript
_relevanceScore: number; // total score
_isNearby: boolean; // true if city matched userCity
```

`DoctorCard` displays a **"Near You"** pill badge when `_isNearby === true`.

### 14.4 Future: Location from Google OAuth (Planned)

> See `IMPLEMENTATION_PLAN.md` Phase 8 for the full plan.

Currently, location comes only from the user's profile (`city`/`state` fields added in migration `20260219195244`). If the user hasn't filled in their profile, `userCity`/`userState` are omitted and the relevance sort falls back to tag-only scoring.

The planned enhancement: when a user signs in via Google OAuth, attempt to extract location from the Google profile (if available and consented), pre-populate the profile form, and prompt for confirmation on first login.
