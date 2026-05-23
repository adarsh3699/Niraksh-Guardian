# Technical Requirements Document (TRD)

## Niraksh-Guardian — AI-Assisted Healthcare Understanding & Guidance Platform

**Version:** 1.0  
**Date:** May 2026  
**Status:** Baseline  
**Authors:** Engineering Team

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Frontend Architecture](#4-frontend-architecture)
5. [Backend Architecture](#5-backend-architecture)
6. [AI Services Architecture](#6-ai-services-architecture)
7. [Database Design](#7-database-design)
8. [API Design & Contracts](#8-api-design--contracts)
9. [Authentication & Security](#9-authentication--security)
10. [File Storage & Media Management](#10-file-storage--media-management)
11. [Caching Strategy](#11-caching-strategy)
12. [Streaming Architecture](#12-streaming-architecture)
13. [Error Handling Standards](#13-error-handling-standards)
14. [Performance Requirements](#14-performance-requirements)
15. [Observability & Monitoring](#15-observability--monitoring)
16. [Deployment Architecture](#16-deployment-architecture)
17. [Security Requirements](#17-security-requirements)
18. [Testing Strategy](#18-testing-strategy)
19. [Scalability & Future Architecture](#19-scalability--future-architecture)

---

## 1. Introduction

### 1.1 Purpose

This Technical Requirements Document (TRD) specifies the complete technical architecture, engineering standards, infrastructure decisions, and implementation requirements for **Niraksh-Guardian**.

This document is the authoritative reference for backend engineers, frontend engineers, DevOps, and infrastructure teams.

### 1.2 Scope

Covers all technical decisions for:

- Monorepo structure with frontend, backend, and AI-services layers
- REST API design and contracts
- Database schema, ORM usage, and indexing strategy
- Authentication (JWT, OAuth, token rotation)
- AI/LLM integration (Google Gemini + local medgemma1.5 fallback)
- File upload pipeline (Cloudinary)
- Caching (SWR, Redis, DB-level)
- Streaming (SSE protocol)
- Deployment (Vercel frontend, Vercel/cloud backend)
- Observability and monitoring

### 1.3 Definitions

| Term | Definition |
|---|---|
| API | Application Programming Interface |
| JWT | JSON Web Token (RFC 7519) |
| SSE | Server-Sent Events |
| SWR | Stale-While-Revalidate (React data-fetching library) |
| ORM | Object-Relational Mapper (Prisma) |
| CDN | Content Delivery Network |
| TTL | Time-To-Live |
| UUID | Universally Unique Identifier |
| OCR | Optical Character Recognition |
| LLM | Large Language Model |
| CSP | Content Security Policy |

---

## 2. System Architecture Overview

### 2.1 High-Level Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                  Client (Browser / Mobile Web)                │
│  Next.js 16 App Router · React 19 · TypeScript · Tailwind v4 │
└──────────────────────────┬───────────────────────────────────┘
                           │  HTTPS
                           ▼
┌──────────────────────────────────────────────────────────────┐
│               Backend API (Node.js + Express 5)               │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐  │
│  │ CORS /   │ │ Helmet   │ │Rate Limiter│ │ Body Parser  │  │
│  │ Auth     │ │ Security │ │ (Redis)    │ │ (JSON 1 MB)  │  │
│  └──────────┘ └──────────┘ └────────────┘ └──────────────┘  │
│                                                               │
│  Routes: auth · chats · ai · doctors · disease · history      │
│          profile · reports · medicine · research · webhooks   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Services Layer                                       │    │
│  │  auth · jwt · email (SES) · redis · cloudinary · ai  │    │
│  └──────────────────────────────────────────────────────┘    │
└───────┬──────────────┬───────────────┬──────────────┬────────┘
        │              │               │              │
        ▼              ▼               ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐ ┌─────────────┐
│  PostgreSQL  │ │  Redis   │ │  Cloudinary  │ │ Google AI   │
│  (Prisma     │ │  (Rate   │ │  (Images,    │ │ (Gemini     │
│   Accelerate)│ │  Limit,  │ │   PDFs)      │ │  2.5 Flash) │
│              │ │  Blacklist│ │              │ │             │
│  16 models   │ │  Pub/Sub)│ │  4 folders   │ │             │
└──────────────┘ └──────────┘ └──────────────┘ └──────┬──────┘
                                                       │ fallback
                                               ┌───────▼──────┐
                                               │  FastAPI +   │
                                               │ medgemma1.5  │
                                               │  (Ollama)    │
                                               └──────────────┘
```

### 2.2 Repository Structure

```
Niraksh-Guardian/             ← Monorepo root
├── frontend/                 ← Next.js 16 web application
│   ├── src/
│   │   ├── app/              ← Next.js App Router (routes)
│   │   ├── components/       ← Reusable React components
│   │   ├── contexts/         ← Auth, Toast, Modal contexts
│   │   ├── hooks/            ← SWR-based custom hooks
│   │   ├── lib/              ← apiClient, utilities
│   │   └── types/            ← Shared TypeScript types
│   └── package.json
│
├── backend/                  ← Node.js Express API
│   ├── src/
│   │   ├── app.ts            ← Express app setup & middleware
│   │   ├── server.ts         ← HTTP server entry point
│   │   ├── config/           ← env, logger
│   │   ├── controllers/      ← Request handlers
│   │   ├── services/         ← Business logic
│   │   │   ├── auth/         ← JWT, bcrypt, OAuth
│   │   │   ├── email/        ← AWS SES integration
│   │   │   ├── redis/        ← Rate limiting, blacklisting
│   │   │   ├── cloudinary/   ← File upload service
│   │   │   └── ai/           ← Gemini, LLM, FastAPI connector
│   │   ├── middlewares/      ← Auth, rate limiter, error handler
│   │   ├── routes/           ← Express routers (13 files)
│   │   ├── validators/       ← Zod schemas
│   │   ├── types/            ← TypeScript interfaces
│   │   └── utils/            ← Helpers
│   ├── prisma/
│   │   ├── schema.prisma     ← Database schema (16 models)
│   │   └── migrations/       ← Prisma migration history
│   └── package.json
│
└── ai-services/              ← Python FastAPI microservice
    ├── main.py               ← FastAPI app (fallback LLM)
    ├── routers/              ← Route handlers
    ├── services/             ← Ollama client, prompting
    └── requirements.txt
```

---

## 3. Technology Stack

### 3.1 Frontend Stack

| Layer | Technology | Version | Justification |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.1.6 | RSC, file-based routing, Vercel-native deployment |
| UI Library | React | 19.2.3 | Concurrent rendering, server components |
| Language | TypeScript | ^5 | Type safety across entire codebase |
| Styling | Tailwind CSS | v4 | Utility-first, design tokens, @apply |
| Typography | Tailwind Typography Plugin | ^0.5 | Markdown rendering styles |
| Forms | React Hook Form + Zod Resolver | ^7 + ^5 | Declarative forms with schema validation |
| Validation | Zod | ^4.3.6 | Runtime schema validation shared with backend |
| Data Fetching | SWR | ^2.4.0 | Stale-while-revalidate, mutation, optimistic UI |
| File Upload | react-dropzone | ^15.0.0 | Drag-and-drop upload zones |
| Markdown | react-markdown + remark-gfm | ^10 + ^4 | AI response rendering |
| OAuth | @react-oauth/google | ^0.13.4 | Google Sign-In button |
| Icons | lucide-react | ^0.574.0 | Consistent icon set |
| Utilities | clsx + tailwind-merge | ^2 + ^3 | Conditional class management |

### 3.2 Backend Stack

| Layer | Technology | Version | Justification |
|---|---|---|---|
| Runtime | Node.js | LTS | Async I/O, large ecosystem |
| Framework | Express | ^5.2.1 | Minimal, flexible, widely supported |
| Language | TypeScript | ^5.9.3 | Type safety, interfaces for DTOs |
| ORM | Prisma | 7.6.0 | Type-safe DB client, migration tooling |
| DB Acceleration | @prisma/extension-accelerate | ^3.0.1 | Connection pooling for serverless |
| Validation | Zod | ^4.3.6 | Request body/query schema validation |
| Authentication | jsonwebtoken + bcryptjs | ^9 + ^3 | JWT issuance and password hashing |
| OAuth | google-auth-library | ^10.5.0 | Google ID token verification |
| Logging | Pino + pino-http | ^10 + ^11 | Structured JSON logging, low overhead |
| Security | Helmet | ^8.1.0 | HTTP security headers |
| CORS | cors | ^2.8.6 | Configurable origin whitelist |
| Rate Limiting | Custom Redis-based | — | Distributed rate limiting |
| File Upload | Multer | ^2.0.2 | Multipart/form-data parsing to memory |
| Cloud Storage | cloudinary | ^2.9.0 | CDN-backed file storage |
| AI — Primary | @google/genai | ^1.41.0 | Google Gemini 2.5 Flash |
| AI — Email | @aws-sdk/client-sesv2 | ^3.990.0 | Password reset, emergency alerts |
| Cache Store | redis | ^5.10.0 | Token blacklist, rate limits |
| PDF Generation | pdfkit | ^0.17.2 | Server-side PDF creation |
| SNS Validation | sns-validator | ^0.3.5 | AWS SNS webhook signature verification |
| Cookies | cookie-parser | ^1.4.7 | Cookie handling middleware |

### 3.3 AI Services Stack (Fallback)

| Layer | Technology | Version |
|---|---|---|
| Framework | FastAPI | 0.104.1 |
| ASGI Server | Uvicorn | 0.24.0 |
| LLM Runtime | Ollama | Latest |
| Model | medgemma1.5 | Local |
| HTTP Client | requests | 2.31.0 |
| Validation | Pydantic | 2.5.0 |

### 3.4 Infrastructure & Cloud

| Service | Provider | Purpose |
|---|---|---|
| Database | PostgreSQL (Prisma Accelerate) | Primary data store |
| In-Memory Cache | Redis | Rate limiting, token blacklist, pub/sub |
| Object Storage + CDN | Cloudinary | Images, PDFs |
| Email Delivery | AWS SES | Password reset, alerts |
| Webhook/Bounce | AWS SNS | SES bounce/complaint routing |
| Frontend Hosting | Vercel | Next.js deployment |
| Backend Hosting | Vercel / Cloud Run / ECS | Express API deployment |
| Package Manager | pnpm | Efficient monorepo installs |

---

## 4. Frontend Architecture

### 4.1 Next.js App Router Structure

```
src/app/
├── layout.tsx                  ← Root layout (fonts, providers, manifest)
├── globals.css                 ← Global styles + Tailwind imports
├── error.tsx                   ← Global error boundary
├── loading.tsx                 ← Global loading skeleton
├── not-found.tsx               ← 404 page
├── robots.ts                   ← Robots.txt generation
├── sitemap.ts                  ← Sitemap generation
├── manifest.ts                 ← Web app manifest
├── (main)/                     ← Public marketing routes
│   ├── page.tsx                ← / (Home)
│   └── about/page.tsx          ← /about
├── (auth)/                     ← Auth flows (unauthenticated)
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
└── (protected)/                ← Authenticated routes (AuthGuard)
    ├── dashboard/page.tsx
    ├── assistance/page.tsx     ← AI Chat
    ├── doctor-suggest/page.tsx
    ├── disease/page.tsx
    ├── prescription/page.tsx
    ├── medicine/page.tsx
    ├── drug-interaction/page.tsx
    ├── profile/page.tsx
    ├── history/page.tsx
    └── reports/page.tsx
```

### 4.2 Rendering Strategy

| Route Group | Strategy | Rationale |
|---|---|---|
| `(main)` | SSG / SSR | SEO-critical; static content |
| `(auth)` | CSR | Interactive forms, no SEO value |
| `(protected)` | CSR with SWR | User-specific data, requires auth |
| Disease page | Hybrid | SSR for topic param, CSR for interaction |

### 4.3 State Management Architecture

```
State Layer         Managed By          Scope
────────────────────────────────────────────────────
Persistent Auth     localStorage        Tokens, user details
Application State   React Contexts      Auth, Toast, Modal
Server State        SWR (useSWR)        Remote API resources
Form State          React Hook Form     Form values, errors
URL State           Next.js router      Filter params, return URLs
```

### 4.4 `apiClient<T>` Contract

**Location:** `src/lib/apiClient.ts`

**Responsibilities:**

1. Inject `Authorization: Bearer <accessToken>` header
2. Detect token expiry pre-emptively (decode JWT `exp`)
3. On 401 response: attempt silent refresh via `POST /api/auth/refresh-token`
4. On refresh success: update `localStorage`, retry original request
5. On refresh failure: clear all tokens, redirect to `/login?returnUrl=current`
6. Parse JSON response and map backend error shapes to typed exceptions
7. Support `multipart/form-data` requests (file uploads)
8. Support SSE streaming via `onChunk`, `onMeta`, `onDone`, `onError` callbacks

**Error Mapping:**

```typescript
// Backend error shape
{ error: string | ZodIssue[], code?: string, details?: object | null }

// Frontend exception
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown
  ) {}
}
```

### 4.5 SWR Hook Conventions

```typescript
// Profile
useProfile()         → useSWR('/api/profile', fetcher)

// Chat list
useChats()           → useSWR('/api/chats', fetcher)

// Single chat messages
useChatMessages(id)  → useSWR(`/api/chats/${id}`, fetcher)

// Doctor search (key includes full query string)
useDoctorSearch(q)   → useSWR(`/api/doctors?${q}`, fetcher)

// History (4 separate keys)
useMedicineHistory()     → useSWR('/api/history/medicine', fetcher)
usePrescriptionHistory() → useSWR('/api/history/prescription', fetcher)
useInteractionHistory()  → useSWR('/api/history/interaction', fetcher)
useSymptomHistory()      → useSWR('/api/history/symptom', fetcher)

// Reports
useReports()         → useSWR('/api/reports', fetcher)

// Disease info (immutable per topic+language, 30-day TTL)
useDiseaseInfo(t, l) → useSWR(`/api/disease/info?topic=${t}&language=${l}`, fetcher)
```

### 4.6 Image Upload State Machine

```
idle → validating → uploading → processing → success
                  ↓                                  ↗
                error ←────────────────────────────
```

**Validation Rules (client-side):**
- Max file size: 5 MB
- Supported MIME types: `image/jpeg`, `image/png`, `image/webp`

**Retry Strategy:**
- Network failures: exponential backoff (2s → 4s → 8s), max 3 attempts
- Server 5xx: surface to user, offer manual retry button

### 4.7 Accessibility Standards

- WCAG 2.1 AA compliance
- Keyboard navigation (Tab, Enter, Escape)
- Focus management in modals (focus trap, restore on close)
- ARIA labels on dynamic components (toasts, alerts, live regions)
- `role="status"` on AI response streaming indicators
- Color contrast ratios ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- `next/image` for all images (LCP optimization, AVIF/WebP)

### 4.8 Performance Budgets

| Metric | Target |
|---|---|
| Lighthouse Performance | ≥ 90 |
| Lighthouse Accessibility | ≥ 90 |
| First Contentful Paint | < 1.5 s |
| LCP | < 2.5 s |
| CLS | < 0.1 |
| Bundle per route | < 250 KB (gzipped) |

**Optimization techniques:**
- Route-level code splitting via Next.js dynamic imports
- `next/image` with Cloudinary URL transformations
- SWR `staleWhileRevalidate` to prevent layout shifts
- React Server Components for non-interactive page shells

---

## 5. Backend Architecture

### 5.1 Middleware Chain

Every request passes through the following middleware stack in order:

```
Request
  │
  ├─ 1. pinoHttp           → Structured request/response logging
  ├─ 2. Helmet             → HTTP security headers (CSP, HSTS, X-Frame-Options)
  ├─ 3. CORS               → Origin whitelist validation
  │       Allowed: localhost:3000, localhost:5173,
  │                niraksh.bhemu.in, niraksh.vercel.app
  ├─ 4. express.json()     → Parse JSON body (limit: 1 MB)
  ├─ 5. express.urlencoded()→ Parse form-encoded body (limit: 1 MB)
  ├─ 6. cookieParser       → Parse cookies
  ├─ 7. apiRateLimiter     → Redis-based rate limiting (per route)
  ├─ 8. authenticate       → JWT verification → req.user = { userId }
  ├─ 9. Route Handler      → Controller → Service → Prisma → DB
  └─ 10. errorHandler      → Global error boundary → standardized JSON response
```

### 5.2 Route Map

| Route Prefix | Module File | Auth | Rate Limited |
|---|---|---|---|
| `GET /` | Inline | ❌ | ❌ |
| `GET /health` | health.ts | ❌ | ❌ |
| `/api/auth/*` | auth.ts | ❌ (public) | ✅ (per-route) |
| `/webhooks/*` | webhook.ts | ❌ (SNS sig) | ❌ |
| `/api/chats/*` | chat.ts | ✅ | ❌ |
| `/api/ai/*` | symptom.ts | ✅ | ❌ |
| `/api/symptoms/*` | symptomRelationship.ts | ✅ | ❌ |
| `/api/research/*` | research.ts | ✅ | ❌ |
| `/api/reports/*` | report.ts | ✅ | ❌ |
| `/api/doctors/*` | doctor.ts | ✅ | ✅ |
| `/api/disease/*` | education.ts | ✅ | ✅ |
| `/api/history/*` | history.ts | ✅ | ✅ |
| `/api/profile/*` | profile.ts | ✅ | ✅ |
| `/api/medicine/*` | medicine.ts | ✅ | ✅ |

### 5.3 Service Layer Architecture

```
Controller (HTTP in/out)
   └─ Service (business logic, AI calls, DB writes)
       └─ Prisma Client (type-safe DB queries)
           └─ PostgreSQL (via Prisma Accelerate)
```

**AI Service Architecture:**

```
ai/
├── gemini.ts          ← Google Gemini 2.5 Flash client
├── llm.ts             ← FastAPI (local medgemma1.5) connector
├── symptom.ts         ← analyzeSymptoms(), summarizeChatSymptoms()
├── prescription.ts    ← analyzePrescription()
├── medicine.ts        ← analyzeMedicine()
├── drugInteraction.ts ← checkDrugInteraction()
├── disease.ts         ← getDiseaseInfo() with DB cache
└── report.ts          ← generateHealthSummary()
```

### 5.4 AI Fallback & Resilience

**Primary:** Google Gemini 2.5 Flash (`gemini-3.1-flash-lite` for chat, `gemini-2.5-flash` for analysis)

**Fallback Decision Logic:**
1. Call Gemini primary endpoint
2. If Gemini returns error or is rate-limited → attempt local FastAPI (`POST http://localhost:8000/generate`)
3. If FastAPI also fails → return graceful degraded response `{ status: "partial", notes: "..." }`
4. Store partial analysis with flag `partial: true` in DB

**Circuit Breaker:**
- Use `opossum` or equivalent to wrap FastAPI calls
- Alert when fallback rate > 10% of total AI calls

### 5.5 Rate Limiting Design

**Implementation:** Redis-based sliding window counters

```
Rate limit keys:
  rate:api:<userId>          → general API (100 req / 15 min)
  rate:login:<ip>            → login attempts (10 req / 15 min)
  rate:reset:<ip>            → password reset per IP (5 req / hr)
  rate:reset:<email>         → password reset per email (3 req / hr)
  rate:ai:<userId>           → AI analysis (20 req / hr)
```

**On limit exceeded:**
- HTTP 429 response
- `{ "error": "Too many requests", "code": "RATE_LIMITED" }`
- `Retry-After` header set

---

## 6. AI Services Architecture

### 6.1 Google Gemini Integration

**Model Used:**
- **Chat:** `gemini-3.1-flash-lite` (low latency, conversational)
- **Analysis (Symptom / Prescription / Medicine / Drug / Report):** `gemini-2.5-flash` (higher reasoning quality)
- **Disease / Chat Summary:** `gemini-2.5-flash`

**Integration Points:**

| Feature | Function | Input | Output |
|---|---|---|---|
| Chat message | `generateAIResponse()` | history[], message, language, imageBuffer? | Text string |
| Symptom analysis | `analyzeSymptoms()` | symptoms[], language, imageBuffer? | Structured JSON |
| Prescription | `analyzePrescription()` | imageBuffers[] | `{ description, medicines[] }` |
| Medicine | `analyzeMedicine()` | name? / imageBuffer? | Markdown string |
| Drug interaction | `checkDrugInteraction()` | drugs[] | Markdown string |
| Disease info | `getDiseaseInfo()` | topic, language | Structured JSON |
| Health report | `generateContent()` | user data, history | Narrative + PDF |
| Chat summary | `summarizeChatSymptoms()` | messages[] | Summary string |

**Structured Output (Symptom Analysis):**

```json
{
  "possibleConditions": [
    { "name": "Migraine", "probability": "High" }
  ],
  "severity": "Moderate",
  "urgency": "Schedule appointment within 48 hours",
  "reasoning": "Recurring severe headache with nausea...",
  "recommendedSpecialist": "Neurologist",
  "homeRemedies": ["Rest in dark room", "Stay hydrated"]
}
```

**Safety Guardrails:**
- System instruction: "You are Niraksh AI. You provide health guidance only, not diagnosis. Always recommend professional consultation for serious symptoms."
- Bounded output schemas using Gemini JSON mode
- All responses include medical disclaimer framing

### 6.2 FastAPI Local AI Microservice

**Base URL:** `http://localhost:8000` (internal network only)

**Endpoints:**

```
GET  /health           → { ok: true, model: "medgemma1.5", ready: true }
POST /generate         → { response: string }
POST /generate/stream  → SSE: { type: "chunk", delta: string }
POST /vision/analyze   → Structured JSON (OCR + entities)
```

**Model Configuration:**
- Model: `medgemma1.5` via Ollama (`http://localhost:11434/api/generate`)
- Max tokens: 1000
- Temperature: 0.7
- Top-P: 0.9
- Context window: last 3 messages

**Security:**
- Internal network access only (not exposed to public internet)
- Mutual TLS or internal network isolation in production

### 6.3 SSE Streaming Protocol

**Event Types:**

| Event | Payload | Description |
|---|---|---|
| `ack` | `{ requestId }` | Request acknowledged |
| `chunk` | `{ requestId, text }` | Incremental text chunk |
| `meta` | `{ requestId, tokensUsed }` | Metadata |
| `done` | `{ requestId, durationMs }` | Stream complete |
| `error` | `{ requestId, message, code }` | Terminal error |

**Backpressure:**
- Server emits heartbeat `: keep-alive` comments every 20s to prevent proxy timeouts
- Payload size bounded; emit `error` if message exceeds configured max

**Client Reconnection:**
- Exponential backoff with jitter: 1s → 2s → 4s → 8s
- Max 5 reconnection attempts
- Resume using `requestId` if available
- Log partial transcripts to IndexedDB on navigation away

---

## 7. Database Design

### 7.1 Database

- **Engine:** PostgreSQL
- **ORM:** Prisma 7.6.0
- **Connection Pooling:** Prisma Accelerate (serverless-compatible)
- **Migration Tool:** `prisma migrate deploy` (CI/CD pipeline)

### 7.2 Schema Overview (16 Models)

```
users (1)
  ├── oauth_accounts (N)       ← Google OAuth links
  ├── refresh_tokens (N)       ← Hashed session tokens
  ├── password_reset_tokens (N)← Secure reset tokens
  ├── chats (N)
  │     └── messages (N)
  ├── medicine_history (N)
  ├── prescription_history (N)
  ├── drug_interaction_history (N)
  ├── symptom_analysis_history (N)
  ├── lab_reports (N)
  │     ├── lab_report_components (N)
  │     │     └── lab_report_notes (N)
  │     └── lab_report_shares (N)
  ├── health_reports (N)
  └── patient_health_profiles (1:1)

doctors (standalone)
disease_info_cache (standalone)
```

### 7.3 Key Model Definitions

#### `users`

```sql
id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4()
email               VARCHAR UNIQUE NOT NULL
password_hash       VARCHAR NULLABLE
is_email_verified   BOOLEAN DEFAULT false
is_active           BOOLEAN DEFAULT true
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP (auto-updated)
last_login          TIMESTAMP NULLABLE
gender              VARCHAR NULLABLE
name                VARCHAR NULLABLE
language_preference VARCHAR NULLABLE DEFAULT 'en'
```

#### `chats` & `messages`

```sql
-- chats
id        UUID PK
user_id   UUID FK → users.id (CASCADE)
title     VARCHAR
created_at TIMESTAMP
updated_at TIMESTAMP (auto)

-- Index: (user_id, updated_at) for sidebar list

-- messages
id        UUID PK
chat_id   UUID FK → chats.id (CASCADE)
role      VARCHAR  -- 'user' | 'model' | 'system'
content   TEXT
created_at TIMESTAMP

-- Indexes: (chat_id, created_at), (chat_id), (created_at)
```

#### `patient_health_profiles`

```sql
id                     UUID PK
user_id                UUID UNIQUE FK → users.id (CASCADE)
health_risk_score      INTEGER DEFAULT 0
blood_group            VARCHAR NULLABLE
allergies              TEXT[]
chronic_conditions     TEXT[]
emergency_contact_name VARCHAR NULLABLE
emergency_contact_phone VARCHAR NULLABLE
emergency_contact_email VARCHAR NULLABLE
city                   VARCHAR NULLABLE
state                  VARCHAR NULLABLE
created_at             TIMESTAMP
updated_at             TIMESTAMP (auto)
```

#### `symptom_analysis_history`

```sql
id                    UUID PK
user_id               UUID FK → users.id (CASCADE)
symptoms              TEXT[]
image_url             VARCHAR NULLABLE
duration              VARCHAR NULLABLE
need_more_info        BOOLEAN DEFAULT false
suggested_symptoms    TEXT[] DEFAULT []
follow_up_message     VARCHAR NULLABLE
relationship          JSON NULLABLE
insight               JSON NULLABLE
predicted_conditions  JSON NOT NULL
urgency_level         VARCHAR NOT NULL
recommended_specialist VARCHAR NOT NULL
severity              VARCHAR NULLABLE
reasoning             TEXT NULLABLE
home_remedies         TEXT[] DEFAULT []
created_at            TIMESTAMP

-- Indexes: (user_id, created_at), (user_id), (created_at)
```

#### `lab_report_components`

```sql
id                  UUID PK
report_id           UUID FK → lab_reports.id (CASCADE)
component_name      VARCHAR
observed_value      FLOAT NULLABLE
observed_raw        VARCHAR NULLABLE
unit                VARCHAR NULLABLE
reference_min       FLOAT NULLABLE
reference_max       FLOAT NULLABLE
status              VARCHAR    -- Normal | High | Low
effect_summary      TEXT NULLABLE
risk_tag            VARCHAR NULLABLE
confidence          FLOAT NULLABLE
source_snippet      TEXT NULLABLE
category            VARCHAR NULLABLE
ai_insight          TEXT NULLABLE
urgency             VARCHAR NULLABLE
symptom_connections TEXT[] DEFAULT []
related_conditions  JSON NULLABLE
trend               FLOAT[] DEFAULT []
what_to_do_next     TEXT NULLABLE
created_at          TIMESTAMP

-- Indexes: (report_id), (status), (category)
```

#### `disease_info_cache`

```sql
id         UUID PK
topic      VARCHAR    -- normalized: lowercase, trimmed
language   VARCHAR DEFAULT 'en'
response   JSON       -- full Gemini structured response
created_at TIMESTAMP
expires_at TIMESTAMP  -- created_at + 30 days

-- Unique: (topic, language)
-- Index: (expires_at) for cleanup queries
```

#### `doctors`

```sql
id               UUID PK
name             VARCHAR
specialization   VARCHAR  -- indexed
qualification    VARCHAR NULLABLE
experience_years INTEGER
consultation_fee INTEGER
rating           FLOAT DEFAULT 0
city             VARCHAR  -- indexed
state            VARCHAR  -- indexed
bio              TEXT
contact_info     VARCHAR
phone            VARCHAR NULLABLE
image_url        VARCHAR NULLABLE
tags             TEXT[] DEFAULT []
is_available     BOOLEAN DEFAULT true
created_at       TIMESTAMP
updated_at       TIMESTAMP (auto)

-- Indexes: specialization, city, state, rating, consultation_fee
```

### 7.4 Indexing Strategy

| Table | Index | Purpose |
|---|---|---|
| `users` | `email` (unique) | Lookup by email on auth |
| `chats` | `(user_id, updated_at)` | Sidebar list sorted by recent |
| `messages` | `(chat_id, created_at)` | Chronological message fetch |
| `medicine_history` | `(user_id, created_at)` | History page, sorted desc |
| `prescription_history` | `(user_id, created_at)` | History page, sorted desc |
| `drug_interaction_history` | `(user_id, created_at)` | History page, sorted desc |
| `symptom_analysis_history` | `(user_id, created_at)` | History page, sorted desc |
| `lab_reports` | `(user_id)`, `(created_at)` | User report listing |
| `lab_report_components` | `(report_id)`, `(status)`, `(category)` | Component filtering |
| `health_reports` | `(user_id)`, `(created_at)` | Report listing, oldest-first cleanup |
| `doctors` | `specialization`, `city`, `state`, `rating`, `consultation_fee` | Filtered doctor search |
| `disease_info_cache` | `(topic, language)` unique, `expires_at` | Cache lookup + TTL cleanup |

### 7.5 Data Retention Policies

| Data | Retention | Enforcement |
|---|---|---|
| Health Reports | Max 10 per user | Application logic on new generation |
| Lab Reports | 1 year (recommended) | Archive or configurable cleanup job |
| Token Blacklist | Until token expiry | Redis TTL (automatic) |
| Disease Cache | 30 days | `expires_at` field + application check |
| Chat Messages | Indefinite (user-controlled) | User-initiated deletion only |

---

## 8. API Design & Contracts

### 8.1 Conventions

- **Base URL:** `https://api.niraksh.bhemu.in` (production)
- **Protocol:** HTTPS only
- **Format:** JSON (`Content-Type: application/json`)
- **Auth:** `Authorization: Bearer <accessToken>`
- **Versioning:** Not versioned currently; breaking changes via new endpoints
- **Pagination:** `?page=<n>&limit=<n>` query params; response includes `meta.total`, `meta.pages`
- **IDs:** UUIDs everywhere

### 8.2 Standard Error Response

```json
{
  "error": "Human-readable message or Zod issue array",
  "code": "ERROR_CODE",
  "details": null
}
```

**HTTP Status Codes:**

| Code | Condition |
|---|---|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation error (Zod) |
| 401 | Unauthenticated |
| 403 | Forbidden (wrong owner) |
| 404 | Resource not found |
| 429 | Rate limited |
| 500 | Unhandled server error |
| 502 | Third-party (Gemini/Cloudinary) error |
| 503 | AI service unavailable |

**Error Code Enum:**

```
VALIDATION_ERROR
UNAUTHORIZED
FORBIDDEN
NOT_FOUND
RATE_LIMITED
BAD_GATEWAY
AI_SERVICE_UNAVAILABLE
INTERNAL_ERROR
```

### 8.3 Key Endpoint Contracts

#### Auth Endpoints

```
POST /api/auth/signup
Body: { email, password, name?, gender? }
Response 201: { message, user: { id, email, name, gender }, tokens: { accessToken, refreshToken } }

POST /api/auth/login
Body: { email, password }
Response 200: { message, user: { id, email, name, gender }, tokens: { accessToken, refreshToken } }

POST /api/auth/google
Body: { idToken }
Response 200: { message, user: {...}, tokens: {...} }

POST /api/auth/refresh-token
Body: { refreshToken }
Response 200: { accessToken, refreshToken }  ← flat, NOT wrapped in "tokens"

POST /api/auth/logout
Header: Bearer <accessToken>
Body: { refreshToken }
Response 200: { message: "Logged out successfully" }

POST /api/auth/forgot-password
Body: { email }
Response 200: { message: "If an account exists, a reset link has been sent" }

POST /api/auth/reset-password
Body: { token, password }
Response 200: { message: "Password reset successfully" }
```

#### Chat Endpoints

```
GET  /api/chats              → [{ id, title, createdAt, updatedAt, messages: [last1] }]
POST /api/chats              → { id, userId, title, createdAt, updatedAt }
GET  /api/chats/:id          → [{ id, chatId, role, content, createdAt }]  ← flat array
PUT  /api/chats/:id          → { id, userId, title, createdAt, updatedAt }
DELETE /api/chats/:id        → { message: "Chat deleted successfully" }

POST /api/chats/:chatId/messages
Body: FormData { content, language?, image? }
Response 200: { userMessage: Message, aiMessage: Message }
```

#### AI Analysis Endpoints

```
POST /api/ai/analyze
Body: FormData { symptoms[], language?, image? }
Response 200: {
  possibleConditions: [...],
  severity, urgency, reasoning,
  recommendedSpecialist,
  homeRemedies,
  savedToHistory: boolean
}

POST /api/ai/summarize-symptoms
Body: { chatId }
Response 200: { summary: string, status: "success" | "non_medical" }

POST /api/ai/prescription
Body: FormData { files: File[] }
Response 200: { description: string, medicines: string[] }

POST /api/ai/medicine
Body: FormData { name?: string, image?: File }
Response 200: { description: string }

POST /api/ai/drug-interaction
Body: { medicines: string[] }
Response 200: { description: string }
```

#### Doctor Endpoint

```
GET /api/doctors?specialization=&city=&state=&sortBy=&order=&page=&limit=
    &matchTags=cond1,cond2&userCity=&userState=

Response 200: {
  data: Doctor[],
  meta: { total, page, limit, pages }
}
```

#### Disease Endpoint

```
GET /api/disease/info?topic=&language=&refresh?=true

Response 200: {
  name, description,
  symptoms: string[],
  causes: string[],
  prevention: string[],
  treatment: string[],
  whenToSeeDoctor: string
}
```

#### History Endpoints

```
GET  /api/history/medicine      → MedicineHistory[]
GET  /api/history/prescription  → PrescriptionHistory[]
GET  /api/history/interaction   → DrugInteractionHistory[]
GET  /api/history/symptom       → SymptomAnalysisHistory[]

DELETE /api/history/:type/:id   → { message: "Record deleted successfully" }
```

#### Reports Endpoints

```
GET /api/reports                → HealthReport[]
GET /api/reports/health-summary → { message, reportUrl }
```

#### Profile Endpoints

```
GET /api/profile                → { user: {...}, healthProfile: {...} | null }
PUT /api/profile
Body: { name, gender, city, state, languagePreference,
        bloodGroup, allergies[], chronicConditions[],
        emergencyContactName, emergencyContactPhone, emergencyContactEmail }
Response 200: { user: {...}, healthProfile: {...} }
```

---

## 9. Authentication & Security

### 9.1 JWT Implementation

| Token | Algorithm | Expiry | Storage |
|---|---|---|---|
| Access Token | HS256 | 15 minutes | `localStorage` |
| Refresh Token | HS256 | 7 days | `localStorage` + DB (hashed) |

**Access Token Payload:**
```json
{ "userId": "uuid", "iat": 1234567890, "exp": 1234568790 }
```

**Token Rotation:**
- Every refresh request issues a new access + refresh token pair
- Old refresh token is immediately revoked in the database
- This prevents refresh token reuse attacks

**Token Blacklisting (Access Tokens):**
- On logout: `SET blacklist:<token> "" EX <remaining_ttl>` in Redis
- On each authenticated request: check Redis blacklist before proceeding

### 9.2 Password Security

- **Algorithm:** bcrypt with salt rounds = 12
- **Minimum length:** 8 characters (enforced via Zod on both frontend and backend)
- **Storage:** Only `password_hash` stored; plaintext never persisted

### 9.3 Google OAuth Flow

```
Frontend                     Backend                    Google
────────                     ───────                    ──────
User clicks Google button
  └─ Google popup opens
  └─ User approves
  └─ idToken received ──────► POST /api/auth/google
                               ├─ verifyIdToken(idToken)──► Google OAuth2 API
                               │◄─ { email, name, sub }────┤
                               ├─ Find or create user
                               ├─ Link oauth_account record
                               └─ Issue JWT tokens
```

### 9.4 HTTP Security Headers (Helmet)

| Header | Value |
|---|---|
| `Content-Security-Policy` | Enabled in production |
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` |
| `X-XSS-Protection` | `0` (deprecated, rely on CSP) |
| `X-Powered-By` | Disabled |

### 9.5 CORS Configuration

```typescript
allowedOrigins: [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://niraksh.bhemu.in",
  "https://niraksh.vercel.app"
]
methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
allowedHeaders: ["Content-Type", "Authorization"]
credentials: true
maxAge: 86400  // 24h preflight cache
```

### 9.6 Input Validation

- All request bodies validated with **Zod schemas** before controller execution
- Zod `parse()` (strict) used — unrecognized fields rejected
- Validation errors returned as structured `{ error: ZodIssue[] }` response

### 9.7 AWS SES Integration

- **Purpose:** Password reset emails, emergency contact alerts
- **Bounce handling:** SNS webhook to `/webhooks/ses`
- **Bounce action:** Mark email as inactive in DB; block future sends
- **SNS signature verified** using `sns-validator` library

---

## 10. File Storage & Media Management

### 10.1 Upload Pipeline

```
Client → react-dropzone (validate: type, size) →
FormData POST → Multer (memory storage, buffer) →
Cloudinary SDK (uploadFile(buffer, folder)) →
{ url, publicId } → Save to DB
```

### 10.2 Cloudinary Folder Structure

| Folder | Content | Max Per User |
|---|---|---|
| `niraksh_symptoms/` | Symptom condition images | Unlimited |
| `niraksh_medicines/` | Medicine box images | Unlimited |
| `niraksh_prescriptions/` | Prescription images | Unlimited |
| `niraksh_reports/` | AI-generated PDF health reports | 10 |
| `niraksh_labs/` | Lab report documents | Retention policy |

### 10.3 File Constraints

| Constraint | Value |
|---|---|
| Max file size (per file) | 5 MB |
| Supported image types | `image/jpeg`, `image/png`, `image/webp` |
| Max images per prescription | 5 |
| Max reports per user | 10 (oldest auto-deleted) |
| Chat images | NOT uploaded to Cloudinary (buffer passed directly to Gemini) |

### 10.4 Report Cleanup Logic

```typescript
// On new report generation:
const count = await prisma.healthReport.count({ where: { userId } });
if (count >= 10) {
  const oldest = await prisma.healthReport.findFirst({
    where: { userId }, orderBy: { createdAt: 'asc' }
  });
  await cloudinary.destroy(oldest.publicId);       // Delete from CDN
  await prisma.healthReport.delete({ where: { id: oldest.id } }); // Delete from DB
}
```

---

## 11. Caching Strategy

### 11.1 SWR Cache (Client-Side)

| Cache Key | Populated By | Invalidated When |
|---|---|---|
| `/api/chats` | Chat sidebar | Create/delete chat, send message |
| `/api/chats/${chatId}` | Chat window | Send message (append) |
| `/api/doctors?${queryString}` | Doctor search | Filter/sort/page change |
| `/api/profile` | Profile page | Profile PUT success |
| `/api/history/medicine` | History tab | New analysis, delete record |
| `/api/history/prescription` | History tab | New analysis, delete record |
| `/api/history/interaction` | History tab | New check, delete record |
| `/api/history/symptom` | History tab | New analysis, delete record |
| `/api/reports` | Reports page | New report generated |
| `/api/disease/info?topic=X` | Disease page | Never (immutable per topic, 30-day backend TTL) |

### 11.2 Database-Level Cache (Disease Info)

```
Request: GET /api/disease/info?topic=Diabetes&language=en
  │
  ├─ Normalize: topic = "diabetes", language = "en"
  ├─ DB lookup: DiseaseInfoCache.findUnique({ topic, language })
  │
  ├─ FOUND + expiresAt > now()
  │   └─ Return cached JSON instantly (~5ms, no Gemini cost)
  │
  ├─ FOUND + expired
  │   └─ Call Gemini → UPDATE cache + new expiresAt
  │
  └─ NOT FOUND
      └─ Call Gemini → CREATE cache entry, expiresAt = +30 days
```

### 11.3 Redis Cache (Server-Side)

| Key Pattern | Content | TTL |
|---|---|---|
| `rate:api:<userId>` | Request counter | 15 minutes |
| `rate:login:<ip>` | Failed login counter | 15 minutes |
| `rate:reset:<ip>` | Reset request counter | 1 hour |
| `blacklist:<accessToken>` | Token revocation flag | Remaining JWT TTL |
| `emergency:<userId>` | Emergency alert flag | 24 hours |

---

## 12. Streaming Architecture

### 12.1 SSE Stream Lifecycle

```
Client                           Server
──────                           ──────
POST /api/ai/analyze (request)
                                 ├─ Validate + authenticate
                                 ├─ Call Gemini streaming API
                                 │
GET /api/ai/stream?requestId=X   │
  (SSE connection)                ├─ event: ack     { requestId }
                                 ├─ event: chunk    { text: "Fever..." }
                                 ├─ event: chunk    { text: " is often..." }
                                 ├─ event: meta     { tokensUsed: 247 }
                                 ├─ event: done     { durationMs: 1823 }
                                 │
  Render progressive UI ◄────────┘
  Finalize + save to DB
```

### 12.2 Local AI Streaming (FastAPI)

```
POST /generate/stream
  └─ Ollama streaming API (chunked HTTP)
      └─ Yield SSE events: { type: "chunk", delta: "..." }
      └─ Terminal: { type: "done" }
```

---

## 13. Error Handling Standards

### 13.1 Backend Error Handler

```typescript
// Global error handler middleware
errorHandler(err, req, res, next) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues, code: "VALIDATION_ERROR" });
  }
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }
  // Unhandled: log with Pino, return generic 500
  logger.error({ err }, "Unhandled error");
  return res.status(500).json({
    error: "Internal Server Error",
    ...(isDev && { message: err.message })
  });
}
```

### 13.2 Frontend Error Pipeline

```
apiClient catches HTTP error
  ├─ 400 → Map Zod issues to field-level form errors via setError()
  ├─ 401 → Attempt silent refresh → retry or redirect to /login
  ├─ 403 → Show "Access Denied" toast
  ├─ 404 → Show "Not Found" inline error
  ├─ 429 → Show "Rate Limited" toast with retry countdown
  ├─ 500/502 → Show "Something went wrong" toast + retry button
  └─ Network error → Show "No internet connection" toast
```

### 13.3 Retry Strategy

| Scenario | Strategy |
|---|---|
| 401 (expired token) | Auto-refresh once, then redirect |
| 502/503 (AI service) | Exponential backoff: 2s → 4s → 8s (max 3 attempts) |
| Network timeout | Exponential backoff with jitter |
| 429 (rate limited) | Wait for `Retry-After` header value |
| File upload failure | Surface to user; offer manual retry |

---

## 14. Performance Requirements

### 14.1 API Latency Targets

| Endpoint | Target (p95) |
|---|---|
| `GET /api/profile` | < 300 ms |
| `GET /api/chats` | < 300 ms |
| `GET /api/doctors` | < 500 ms |
| `GET /api/history/*` | < 400 ms |
| Disease info (cached) | < 100 ms |
| Disease info (miss) | < 5 s (Gemini latency) |
| Symptom analysis | < 8 s |
| Report generation | < 15 s |
| File upload + analysis | < 10 s |

### 14.2 Database Query Optimization

- All high-frequency queries use indexed columns
- `select` projections limit returned columns (never `SELECT *`)
- Doctor search uses in-memory relevance scoring after DB fetch (when `matchTags` present)
- Disease cache avoids Gemini call for 99%+ of production requests (30-day TTL)
- Prisma Accelerate handles connection pooling for serverless cold starts

### 14.3 Frontend Performance

- Bundle splitting per route via Next.js dynamic imports
- Heavy components (PDF viewer, report chart) loaded lazily
- `next/image` with WebP/AVIF conversion and size optimization
- SWR `staleWhileRevalidate` prevents loading spinners on return visits
- Disease info: `staleWhileRevalidate: true` (TTL = 30 days)

---

## 15. Observability & Monitoring

### 15.1 Logging

**Library:** Pino (JSON structured logging)

**Log Levels:**
- `error` — 5xx responses, unhandled exceptions
- `warn` — 4xx responses, CORS blocks, auth failures
- `info` — Normal request/response, auth events
- `debug` — Development only

**Excluded from logs:** `GET /health` (to reduce noise)

**Log Fields:**

```json
{
  "level": "info",
  "time": 1716700000000,
  "method": "POST",
  "url": "/api/ai/analyze",
  "status": 200,
  "requestId": "uuid",
  "userId": "uuid",
  "durationMs": 1823
}
```

### 15.2 Alerting Thresholds

| Metric | Alert Threshold |
|---|---|
| API p95 latency | > 1 s sustained for 5 min |
| 5xx error rate | > 1% sustained for 5 min |
| Login failure rate | > 5× baseline |
| Gemini errors | > 10/min |
| FastAPI queue depth | > 5 requests queued for > 1 min |
| AI fallback rate | > 10% of total AI calls |

### 15.3 Health Endpoint

```
GET /health
Response 200: { status: "ok", timestamp: "ISO8601", uptime: 12345 }
```

### 15.4 Distributed Tracing

- OpenTelemetry across Express ↔ FastAPI ↔ Gemini
- `requestId` propagated in all logs and SSE events
- Tools: DataDog / Prometheus + Grafana; Sentry for frontend errors
- Vercel Analytics for Web Vitals monitoring

---

## 16. Deployment Architecture

### 16.1 Environments

| Environment | Frontend | Backend | Database |
|---|---|---|---|
| Development | `localhost:3000` | `localhost:4000` | Local PostgreSQL |
| Staging | Vercel preview URL | Staging Cloud Run | Staging DB |
| Production | `niraksh.bhemu.in` | API subdomain | Prisma Accelerate |

### 16.2 Frontend Deployment (Vercel)

```yaml
# Deployment: push to main branch → Vercel auto-deploy
Build Command: pnpm build
Output Directory: .next
Environment Variables:
  NEXT_PUBLIC_API_BASE: <backend URL>
  NEXT_PUBLIC_GOOGLE_CLIENT_ID: <Google OAuth client ID>
```

**Pre-deploy Checklist:**
1. Validate all `NEXT_PUBLIC_*` env vars are set
2. Run `pnpm build` locally (no TypeScript errors)
3. Smoke test main flows on preview deployment

### 16.3 Backend Deployment

```yaml
# Runtime: Node.js LTS
# Entry: node dist/server.js
# Port: 4000 (configurable via PORT env)
Build: tsc && rm -rf dist/generated && cp -R src/generated dist/generated
Start: node dist/server.js
```

**Pre-deploy Checklist:**
1. Run `prisma migrate deploy` on migration window
2. Validate all environment variables (see Section 16.4)
3. Warm FastAPI model container before traffic cut-over

### 16.4 Environment Variables

**Backend Required Variables:**

```env
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_SECRET=<256-bit secret>
JWT_REFRESH_SECRET=<256-bit secret>
GOOGLE_CLIENT_ID=<OAuth client ID>
GOOGLE_AI_API_KEY=<Gemini API key>
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
AWS_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_SES_FROM_EMAIL=noreply@niraksh.bhemu.in
CORS_ORIGINS=https://niraksh.bhemu.in,https://niraksh.vercel.app
NODE_ENV=production
```

**Frontend Required Variables:**

```env
NEXT_PUBLIC_API_BASE=https://api.niraksh.bhemu.in
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<OAuth client ID>
```

### 16.5 CI/CD Pipeline

```
Push to PR branch
  ├─ pnpm lint (ESLint)
  ├─ pnpm tsc --noEmit (type check)
  ├─ Run tests (Jest, Playwright)
  └─ Vercel preview deployment

Merge to main
  ├─ Run migrations (prisma migrate deploy)
  ├─ Deploy backend (Cloud Run / ECS)
  └─ Deploy frontend (Vercel production)
```

---

## 17. Security Requirements

### 17.1 Transport Security

- **TLS 1.2+** enforced on all endpoints
- **HSTS** header with 1-year max-age
- **HTTP → HTTPS** redirect enforced at CDN/proxy level

### 17.2 Data Security

- Passwords hashed with bcrypt (cost factor 12) — never stored as plaintext
- Refresh tokens hashed with SHA-256 before DB storage
- Password reset tokens hashed before DB storage
- All PII scoped by `userId` with FK + Cascade Delete
- Cloudinary resources in private folders (no public listing)

### 17.3 API Security

- Rate limiting prevents brute-force and DoS
- CORS whitelist prevents cross-origin abuse
- Helmet security headers prevent clickjacking, MIME sniffing
- `X-Powered-By` header disabled (no fingerprinting)
- Body size limit (1 MB JSON) prevents payload-based DoS
- File uploads validated for MIME type + size before processing

### 17.4 AI Safety

- All Gemini requests include safety system instruction
- Responses bounded by JSON schema (structured output mode)
- No user PII included in Gemini prompts beyond what is strictly necessary
- Medical disclaimer displayed on all AI output surfaces

### 17.5 Secret Management

- All secrets stored in platform environment variables (Vercel env, AWS Secrets Manager)
- Secrets never committed to the repository (`.gitignore` enforces `.env` exclusion)
- Secret rotation policy: rotate all API keys quarterly

---

## 18. Testing Strategy

### 18.1 Frontend Testing

| Level | Framework | Target |
|---|---|---|
| Unit | Jest + React Testing Library | Components, custom hooks, utilities |
| Integration | Jest + MSW (Mock Service Worker) | SWR hooks + mocked API, auth flows |
| E2E | Playwright | Critical paths: login, symptom analysis, report generation |

**E2E Critical Paths:**
1. Register → complete profile → analyze symptoms → view doctor list
2. Login → send chat message with image → view history
3. Login → upload prescription → check drug interactions
4. Login → generate PDF report → download

### 18.2 Backend Testing

| Level | Framework | Target |
|---|---|---|
| Unit | Jest + ts-jest | Services, validators, utilities |
| Integration | Supertest | API endpoints with test DB |
| Contract | Manual / Postman | API shape validation |

**Test DB Strategy:**
- Separate PostgreSQL test database
- Run migrations before test suite
- Truncate tables between test cases (not drop/recreate)
- Mock Gemini API responses to avoid cost

### 18.3 Coverage Targets

| Layer | Target Coverage |
|---|---|
| Frontend components | ≥ 80% |
| Backend services | ≥ 80% |
| API controllers | ≥ 90% |
| Auth flows (E2E) | 100% (all paths) |

### 18.4 CI Integration

```yaml
# On every PR:
- Lint (ESLint for both frontend and backend)
- TypeScript type check (tsc --noEmit)
- Unit + integration tests
- Build validation (pnpm build)
- E2E tests on Vercel preview URL (Playwright)
```

---

## 19. Scalability & Future Architecture

### 19.1 Current Scalability Characteristics

| Aspect | Current State |
|---|---|
| API | Stateless (JWT) — horizontal scaling supported |
| Rate Limiting | Redis-based — distributed across instances |
| DB Connections | Prisma Accelerate — connection pooling for serverless |
| File Storage | Cloudinary CDN — globally distributed |
| AI | Gemini API — externally managed scaling |

### 19.2 Known Scaling Bottlenecks

| Bottleneck | Mitigation |
|---|---|
| Gemini API rate limits | Implement request queuing + fallback to FastAPI |
| Lab report parsing (heavy compute) | Offload to background job queue (BullMQ + Redis) |
| PDF generation (blocking) | Move to async job with webhook/SSE notification |
| History endpoint (no pagination) | Add cursor-based pagination for high-volume users |

### 19.3 Future Architecture Roadmap

#### Phase 1 — Short Term (0–3 months)
- Add typed OpenAPI client generation (keep types in sync with backend)
- Add cursor-based pagination to all history endpoints
- Implement background job queue for PDF generation (BullMQ)
- Add automated accessibility checks in CI (axe-core)

#### Phase 2 — Medium Term (3–6 months)
- WebSocket support for real-time emergency alerts
- Push notifications (service worker + web push)
- Mobile app (React Native) sharing the same backend API
- Advanced analytics dashboard (usage trends, health metrics)

#### Phase 3 — Long Term (6–12 months)
- Microservices decomposition (AI service, notification service, report service)
- Kubernetes orchestration for backend services
- FHIR (Fast Healthcare Interoperability Resources) compliance
- Multi-tenant architecture for healthcare provider integrations
- On-premise deployment option for healthcare enterprises

### 19.4 Database Scaling Path

```
Current:    Single PostgreSQL instance (Prisma Accelerate for pooling)
Near-term:  Read replicas for history + doctor queries
Long-term:  Partitioning by user_id for large tables
            (symptom_analysis_history, messages, lab_report_components)
```

---

## Appendix A — Port Reference

| Service | Port | Environment |
|---|---|---|
| Frontend (Next.js) | 3000 | Development |
| Backend (Express) | 4000 | Development |
| AI Services (FastAPI) | 8000 | Development |
| Ollama (local LLM) | 11434 | Development |
| Redis | 6379 | Development |
| PostgreSQL | 5432 | Development |

## Appendix B — Supported Languages

| Code | Language |
|---|---|
| `en` | English |
| `hi` | Hindi |
| `bn` | Bengali |
| `te` | Telugu |
| `mr` | Marathi |
| `ta` | Tamil |
| `ur` | Urdu |
| `gu` | Gujarati |
| `kn` | Kannada |
| `ml` | Malayalam |
| `pa` | Punjabi |

## Appendix C — Doctor Relevance Scoring Algorithm

```typescript
function computeRelevanceScore(doctor: Doctor, params: {
  matchTags: string[],
  userCity?: string,
  userState?: string
}): number {
  let score = 0;

  // Tag matching
  const docTags = doctor.tags.map(t => t.toLowerCase());
  for (const condition of params.matchTags) {
    if (docTags.some(tag => tag.includes(condition.toLowerCase()))) {
      score += 10;
    }
  }

  // Location matching
  if (params.userCity && doctor.city.toLowerCase() === params.userCity.toLowerCase()) {
    score += 50;  // City match → "Near You" badge
  } else if (params.userState && doctor.state.toLowerCase() === params.userState.toLowerCase()) {
    score += 20;  // State match
  }

  // Quality signals
  score += doctor.rating * 3;
  score += Math.min(doctor.experienceYears, 20) / 2;
  score += (10000 - doctor.consultationFee) / 1000;  // Lower fee = higher score

  return score;
}
```

---

*End of Technical Requirements Document*
