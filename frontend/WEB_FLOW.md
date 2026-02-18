# Niraksh-Guardian — Web Flow (User Navigation Map)

> This document maps **every possible user journey** through the application.
> Use it to verify completeness, catch dead ends, and validate that every action has a clear next step.

---

## 1. Route Map (All 15 Pages)

```
/                         Public    HomePage (hero, disease cards, health tool CTAs)
/about                    Public    About page (static)
/login                    Public    Login form + Google OAuth
/register                 Public    Signup form + Google OAuth
/forgot-password          Public    Email input → sends reset link
/reset-password?token=... Public    New password form (from email link)
/dashboard                Auth      Aggregated user dashboard (risk score, activity, reports)
/assistance               Auth      AI Chat (sidebar + chat window + image upload)
/doctor-suggest           Auth      Symptom analysis + doctor search/filters
/disease                  Auth      Disease info (AI-powered) from disease cards
/prescription             Auth      Upload prescription images → AI analysis
/medicine                 Auth      Medicine search (text or image) → AI analysis
/drug-interaction         Auth      Drug-drug interaction checker
/profile                  Auth      User info + health profile + emergency contacts
/history                  Auth      Tabbed history (medicine, prescription, interaction, symptom)
/reports                  Auth      List + generate PDF health reports
```

---

## 2. Complete User Journeys

### 2.1 First-Time User (New Visitor → Registration → Dashboard)

```
Landing (/)
  │
  ├─ Reads hero section → Clicks "Search" with symptoms
  │   └─ Redirected → /login?returnUrl=/doctor-suggest?symptoms=headache
  │       └─ "Don't have an account?" → /register
  │
  ├─ Clicks Disease Card (e.g., Diabetes)
  │   └─ Redirected → /login?returnUrl=/disease?topic=Diabetes
  │
  ├─ Clicks "Try Now" on Prescription Explainer
  │   └─ Redirected → /login?returnUrl=/prescription
  │
  ├─ Clicks Navbar "Login" → /login
  │   └─ "Don't have an account?" → /register
  │
  └─ Clicks Navbar "Sign Up" → /register

/register
  │
  ├─ Fills: Name, Email, Password, Confirm Password, Gender (optional)
  │   └─ Submit → POST /api/auth/signup
  │       ├─ Success → Store tokens → Redirect to returnUrl or /dashboard
  │       └─ Error → "User already exists" / validation errors shown
  │
  └─ Clicks Google OAuth button
      └─ Google popup → idToken → POST /api/auth/google
          ├─ Success → Store tokens → Redirect to /dashboard
          └─ Error → "Google Authentication Failed" toast

/dashboard (first time — empty state)
  │
  ├─ Sees "Complete your health profile" prompt → Clicks → /profile
  ├─ Sees "Get started" CTAs → Links to health tools
  ├─ Risk score shows 0/100 (no chronic conditions yet)
  └─ Recent activity is empty → "No recent activity"
```

### 2.2 Returning User (Login → Dashboard → Use Features)

```
/login
  │
  ├─ Email + Password → Submit → POST /api/auth/login
  │   ├─ Success → Store tokens + user details → /dashboard (or returnUrl)
  │   └─ Error → "Invalid credentials" message
  │
  ├─ Google OAuth → POST /api/auth/google
  │   └─ Success → /dashboard
  │
  ├─ "Forgot Password?" → /forgot-password
  │
  └─ "Don't have an account?" → /register

/dashboard (returning user — populated)
  │
  ├─ Views Risk Score gauge (0-100, color-coded)
  ├─ Views Health Summary (blood group, allergies, conditions)
  ├─ Quick Actions grid:
  │   ├─ 💊 Medicine Search → /medicine
  │   ├─ 📋 Prescription Explainer → /prescription
  │   ├─ ⚠️ Drug Interaction → /drug-interaction
  │   ├─ 💬 AI Chat → /assistance
  │   ├─ 🩺 Doctor Suggest → /doctor-suggest
  │   └─ 📄 Generate Report → /reports
  │
  ├─ Recent Activity timeline (clicks entry → /history?type=medicine)
  │
  └─ Past Reports section (click → opens PDF, "Generate New" → /reports)
```

### 2.3 Password Reset Flow

```
/login → "Forgot Password?" → /forgot-password
  │
  └─ Enter email → Submit → POST /api/auth/forgot-password
      ├─ Always shows: "If an account exists, a reset link has been sent"
      │   (prevents email enumeration)
      └─ User checks email → Clicks reset link
          └─ /reset-password?token=abc123...
              │
              ├─ Enter New Password + Confirm Password
              │   └─ Submit → POST /api/auth/reset-password { token, password }
              │       ├─ Success → "Password reset successfully" → Redirect to /login
              │       └─ Error → "Invalid or expired token" → Link to /forgot-password
              │
              └─ Token missing/invalid → Error state shown immediately
```

---

## 3. Feature-Level Flows

### 3.1 AI Chat Assistant (`/assistance`)

```
/assistance
  │
  ├─ SIDEBAR (left panel / mobile overlay)
  │   ├─ [+ New Chat] button
  │   │   └─ POST /api/chats { title: "New Chat", language: "en" }
  │   │       └─ New chat appears in sidebar → auto-selected
  │   │
  │   ├─ Chat list (GET /api/chats via SWR)
  │   │   ├─ Click chat → loads messages (GET /api/chats/:chatId)
  │   │   ├─ Edit icon → inline rename → PUT /api/chats/:id { title }
  │   │   └─ Delete icon → Confirm dialog → DELETE /api/chats/:id
  │   │
  │   └─ Language selector dropdown (en, hi, bn, te, mr, ta, ur, gu, kn, ml, pa)
  │
  └─ CHAT WINDOW (right panel)
      ├─ Message history (auto-scroll to bottom)
      │   ├─ User messages (right, teal bg)
      │   └─ AI messages (left, gray bg, markdown rendered)
      │
      ├─ Quick symptom chips (clickable → pre-fill input)
      │
      └─ Input area
          ├─ Text input + Send button
          ├─ 📷 Image upload button → file picker
          │   └─ Shows preview before sending
          └─ Send → POST /api/chats/:chatId/messages (FormData if image)
              ├─ Optimistic: user message appears immediately
              ├─ AI: typing indicator → response streams in
              └─ SWR mutate → chat list refreshes (updatedAt changes)
```

### 3.2 Doctor Suggest (`/doctor-suggest`)

```
/doctor-suggest
  │
  ├─ FROM HOMEPAGE: ?symptoms=headache (auto-trigger analysis)
  ├─ FROM DISEASE PAGE: ?condition=Migraine (auto-set specialization)
  │
  ├─ STEP 1: Symptom Analysis
  │   ├─ Enter symptoms (text) + optional image 📷 + language (default "en")
  │   └─ [Analyze Symptoms] → POST /api/ai/analyze (FormData: symptoms[] + language + image?)
  │       └─ Result displayed:
  │           ├─ Severity badge (Mild 🟢 / Moderate 🟡 / Severe 🔴 / Emergency 🚨)
  │           ├─ Possible conditions list
  │           ├─ Urgency level
  │           ├─ Recommended specialist → auto-fills filter below
  │           ├─ Home remedies
  │           └─ Reasoning text
  │           (Also saved to SymptomAnalysisHistory in background)
  │
  ├─ STEP 1.5: Summarize Chat for Doctor (optional, when arriving from chat)
  │   ├─ Shown when chatId is present in query params
  │   ├─ [Summarize Chat Symptoms] → POST /api/ai/summarize-symptoms { chatId }
  │   └─ Result:
  │       ├─ status: "success" → Display summary card for doctor referral
  │       └─ status: "non_medical" → "This conversation has no medical content"
  │
  ├─ STEP 2: Doctor Search (auto-triggered after analysis)
  │   ├─ Filters:
  │   │   ├─ Specialization dropdown (pre-filled from analysis)
  │   │   ├─ City + State text inputs
  │   │   ├─ Fee range (min/max)
  │   │   ├─ Sort by (name/experience/fee/rating)
  │   │   └─ Sort order (asc/desc)
  │   │
  │   └─ GET /api/doctors?specialization=...&page=1&limit=12 via SWR
  │       └─ Response: { data: Doctor[], meta: { total, page, limit, pages } }
  │           └─ Doctor cards grid (image, name, specialization, rating, fee, location)
  │
  └─ STEP 3: Pagination
      ├─ [← Previous] [Page X of Y] [Next →]
      └─ Scroll to top on page change
```

### 3.3 Health Tools (3 pages, similar flow)

```
/prescription
  │
  ├─ Upload up to 5 images (drag-and-drop zone)
  │   └─ Preview thumbnails shown
  ├─ [Analyze] → POST /api/ai/prescription (FormData, field: "files")
  │   └─ Result:
  │       ├─ Medicine list extracted (names, dosages, instructions)
  │       ├─ Full analysis (markdown)
  │       └─ [Check Drug Interactions →] → /drug-interaction?medicines=med1,med2
  └─ Saved to PrescriptionHistory automatically

/medicine
  │
  ├─ Text input: medicine name  — OR —  📷 Upload image
  ├─ [Analyze] → POST /api/ai/medicine (FormData, name OR image)
  │   └─ Markdown result: name, composition, uses, side effects, dosage, alternatives
  └─ Saved to MedicineHistory automatically

/drug-interaction
  │
  ├─ FROM PRESCRIPTION: ?medicines=Paracetamol,Ibuprofen (pre-filled)
  ├─ Dynamic input list (add/remove medicines, min 2)
  ├─ [Check Interaction] → POST /api/ai/drug-interaction { medicines: [...] }
  │   └─ Markdown result: severity, mechanism, recommendations
  └─ Saved to DrugInteractionHistory automatically
```

### 3.4 Disease Info (`/disease`)

```
/disease
  │
  ├─ FROM HOMEPAGE: ?topic=Diabetes&language=en (auto-fetch)
  │
  ├─ Text input for disease name + Language dropdown
  ├─ [Get Info] → GET /api/disease/info?topic=Diabetes&language=en
  │   └─ Structured result displayed:
  │       ├─ Disease name + description
  │       ├─ Symptoms list
  │       ├─ Causes list
  │       ├─ Prevention steps
  │       ├─ Treatment options
  │       └─ "When to See a Doctor" section
  │
  └─ [Find Related Doctors →] → /doctor-suggest?condition=Diabetes
```

### 3.5 Profile Management (`/profile`)

```
/profile
  │
  ├─ GET /api/profile → { user: {...}, healthProfile: {...} | null }
  │
  ├─ USER INFO SECTION (from user object):
  │   ├─ Name (editable text)
  │   ├─ Email (read-only, display only)
  │   └─ Gender (dropdown: Male/Female/Other)
  │
  ├─ HEALTH PROFILE SECTION (from healthProfile, may be null):
  │   ├─ Blood Group (dropdown: A+, A-, B+, B-, AB+, AB-, O+, O-)
  │   ├─ Allergies (tag input — add/remove pills)
  │   ├─ Chronic Conditions (tag input — add/remove pills)
  │   ├─ Emergency Contact: Name, Phone, Email
  │   └─ Language Preference (dropdown: 11 languages)
  │
  ├─ RISK SCORE DISPLAY (read-only gauge, auto-calculated):
  │   └─ 10 points per chronic condition, max 100
  │
  └─ [Save] → PUT /api/profile { name, gender, languagePreference, bloodGroup, allergies, ... }
      ├─ Success → Toast "Profile updated" → SWR mutate
      └─ Error → Toast with error message
```

### 3.6 Health History (`/history`)

```
/history
  │
  ├─ Tab bar: [All] [Medicine 💊] [Prescription 📋] [Interaction ⚠️] [Symptom 🔬]
  │
  ├─ Fetch all 4 in parallel via SWR:
  │   ├─ GET /api/history/medicine
  │   ├─ GET /api/history/prescription
  │   ├─ GET /api/history/interaction
  │   └─ GET /api/history/symptom
  │
  ├─ Each entry card:
  │   ├─ Date + Type badge
  │   ├─ Key info (medicine name / symptoms / drug names)
  │   ├─ Click to expand → show full analysis (markdown rendered)
  │   └─ 🗑️ Delete → Confirm dialog → DELETE /api/history/:type/:id
  │       └─ SWR mutate → entry removed from list
  │
  └─ FROM DASHBOARD: ?type=medicine → auto-select tab
```

### 3.7 Health Reports (`/reports`)

```
/reports
  │
  ├─ GET /api/reports → list of { id, reportUrl, createdAt }
  │
  ├─ Report cards:
  │   ├─ Date created
  │   └─ [View/Download PDF] → opens reportUrl (Cloudinary)
  │
  ├─ [Generate New Report] → GET /api/reports/health-summary
  │   ├─ Loading state (5-10 seconds)
  │   ├─ Success → SWR mutate → new report appears in list
  │   └─ Error → Toast ("AI Health Analysis Failed" / "Failed to generate health report")
  │
  └─ Note: Max 10 reports stored — oldest auto-deleted on new generation
```

---

## 4. Navigation Graph (Every Link Between Pages)

```
                                    ┌─────────────────┐
                                    │    / (Home)     │
                                    └────────┬────────┘
                           ┌─────────────────┼─────────────────────┐
                           │                 │                     │
                    Hero Search         Disease Cards         Health Tool CTAs
                    (symptoms)          (topic click)         (Rx, Med, Drug, Chat)
                           │                 │                     │
                           ▼                 ▼                     ▼
             ┌──────────────────┐   ┌──────────────┐   ┌───────────────────┐
             │  /doctor-suggest │   │   /disease   │   │ /prescription     │
             │                  │   │              │   │ /medicine         │
             │  ← auto-fill     │◄──┤[Find Doctors]│   │ /drug-interaction │
             │    specialist    │   │              │   │ /assistance       │
             └──────────────────┘   └──────────────┘   └──────┬────────────┘
                                                              │
                                         /prescription ───────┘
                                         extracts medicines
                                              │
                                              ▼
                                    ┌─────────────────────┐
                                    │ /drug-interaction   │
                                    │ ?medicines=a,b,c    │
                                    └─────────────────────┘

  ┌──────────────────────────────────────────────────────────────────────┐
  │                        Navbar (always visible)                       │
  │  Logo(→/)  Home(→/)  About(→/about)  Doctor(→/doctor-suggest)        │
  │  AI Chat(→/assistance)  Dashboard(→/dashboard)                       │
  │  Profile(→/profile)  Login(→/login) / Logout                         │
  └──────────────────────────────────────────────────────────────────────┘

  /dashboard
    ├─ Quick Actions → /medicine, /prescription, /drug-interaction,
    │                  /assistance, /doctor-suggest, /reports
    ├─ Recent Activity → /history?type=<type>
    ├─ "Complete profile" → /profile
    └─ Past Reports → /reports

  /login ↔ /register (cross-links)
  /login → /forgot-password → (email) → /reset-password?token=... → /login

  /profile ← navbar link
  /history ← navbar link or dashboard
  /reports ← dashboard or navbar
```

---

## 5. Auth-Gated Redirect Flow

```
User visits protected route (e.g., /assistance)
  │
  ├─ AuthGuard checks: isAuthenticated?
  │   ├─ YES → Render page
  │   │
  │   └─ NO → Check: has tokens in localStorage?
  │       ├─ YES → Try refresh → POST /api/auth/refresh-token
  │       │   ├─ Success → isAuthenticated = true → Render page
  │       │   └─ Failure → Clear tokens → Redirect
  │       │
  │       └─ NO → Redirect to /login?returnUrl=/assistance
  │                  │
  │                  └─ After successful login → Redirect back to /assistance
  │
  └─ Token expires during session (15 min):
      └─ Next API call → 401 → apiClient auto-refreshes
          ├─ Refresh success → Retry original request silently
          └─ Refresh failure → Clear tokens → /login?returnUrl=current
```

---

## 6. Cross-Page Data Passing

| From               | To                  | Data Passed                   | Method                     |
| ------------------ | ------------------- | ----------------------------- | -------------------------- |
| `/` (hero search)  | `/doctor-suggest`   | symptoms text                 | URL: `?symptoms=headache`  |
| `/` (disease card) | `/disease`          | disease topic                 | URL: `?topic=Diabetes`     |
| `/disease`         | `/doctor-suggest`   | disease name                  | URL: `?condition=Diabetes` |
| `/prescription`    | `/drug-interaction` | extracted medicine names      | URL: `?medicines=a,b`      |
| `/doctor-suggest`  | analysis result     | `?symptoms=` or `?condition=` | URL search params          |
| `/dashboard`       | `/history`          | history type filter           | URL: `?type=medicine`      |
| `/login`           | any protected page  | return URL                    | URL: `?returnUrl=/path`    |
| Email reset link   | `/reset-password`   | reset token                   | URL: `?token=abc123`       |

---

## 7. Edge Cases & Error States

### 7.1 Empty States

| Page              | Empty Condition                    | UI                                        |
| ----------------- | ---------------------------------- | ----------------------------------------- |
| `/dashboard`      | New user, no history               | Welcome message + "Get started" CTAs      |
| `/dashboard`      | No profile set up                  | "Complete your health profile" prompt     |
| `/assistance`     | No chats exist                     | "Start your first conversation" CTA       |
| `/assistance`     | Chat selected but no messages      | AI welcome message                        |
| `/history`        | No history for selected tab        | "No records yet" + link to related tool   |
| `/reports`        | No reports generated               | "Generate your first report" button       |
| `/doctor-suggest` | No doctors match filters           | "No doctors found. Try adjusting filters" |
| `/profile`        | `healthProfile: null` (first time) | Show empty form, all fields optional      |

### 7.2 Error Recovery

| Scenario                      | Behavior                                    |
| ----------------------------- | ------------------------------------------- |
| Network offline               | Toast "No internet connection" + retry      |
| API 500                       | Toast "Something went wrong" + retry option |
| API 429 (rate limited)        | Toast "Too many requests, wait and retry"   |
| Token expired (15 min)        | Auto-refresh silently via apiClient         |
| Refresh token expired (7 day) | Clear all → redirect to /login              |
| Invalid reset token           | Error message + "Request new link" link     |
| File too large (>5MB)         | Client-side validation, toast warning       |
| Unsupported file type         | Client-side validation, toast warning       |
| Chat not found (deleted)      | 404 → redirect to /assistance (fresh)       |

### 7.3 Loading States

| Page/Component    | Loading UX                                      |
| ----------------- | ----------------------------------------------- |
| Any page          | `loading.tsx` skeleton per route                |
| Chat messages     | Message skeleton placeholders                   |
| Doctor cards      | Card grid skeleton (3 × 2)                      |
| Profile           | Form skeleton                                   |
| History           | List skeleton with type badges                  |
| AI analysis       | Animated spinner + "Analyzing..."               |
| Report generation | Progress state (5-10s)                          |
| Button actions    | Button enters loading state (disable + spinner) |

---

## 8. Mobile-Specific Flows

### 8.1 Navigation

```
Mobile (< 768px):
  Navbar → Hamburger icon → MobileMenu (slide-in drawer from right)
    ├─ Nav links (full width, stacked)
    ├─ Auth section at bottom
    └─ Close: tap overlay / swipe right / press Escape

Chat page (< 768px):
  Default → Show chat window only
  Toggle button → Slide-in sidebar overlay (chat list)
  Select chat → Sidebar auto-closes → Chat window loads
```

### 8.2 Touch Targets

- All interactive elements ≥ 44px touch target
- Generous padding on mobile form inputs
- Swipe gestures: none required (tap-only for simplicity)
