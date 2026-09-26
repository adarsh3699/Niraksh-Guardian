# Functional Requirements Document (FRD)

## Niraksh-Guardian — AI-Assisted Healthcare Understanding & Guidance Platform

**Version:** 1.1
**Date:** September 2026
**Status:** Baseline plus implemented care-coordination addendum
**Authors:** Engineering Team

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Project Overview](#2-project-overview)
3. [Stakeholders & Target Users](#3-stakeholders--target-users)
4. [Functional Scope](#4-functional-scope)
5. [User Authentication & Account Management](#5-user-authentication--account-management)
6. [AI Health Chat Assistant](#6-ai-health-chat-assistant)
7. [Symptom Analysis & Doctor Recommendation](#7-symptom-analysis--doctor-recommendation)
8. [Prescription Analysis](#8-prescription-analysis)
9. [Medicine Information](#9-medicine-information)
10. [Drug Interaction Checker](#10-drug-interaction-checker)
11. [Disease Information & Education](#11-disease-information--education)
12. [Lab Report Analysis](#12-lab-report-analysis)
13. [User Health Profile](#13-user-health-profile)
14. [Health History](#14-health-history)
15. [Health Reports (PDF)](#15-health-reports-pdf)
16. [Dashboard](#16-dashboard)
17. [Non-Functional Requirements](#17-non-functional-requirements)
18. [Constraints & Assumptions](#18-constraints--assumptions)
19. [Acceptance Criteria Summary](#19-acceptance-criteria-summary)

---

## 1. Introduction

### 1.1 Purpose

This Functional Requirements Document (FRD) describes the complete set of functional behaviors, user interactions, and business rules for **Niraksh-Guardian** — an AI-assisted digital health understanding and guidance platform.

This document is intended for product managers, developers, QA engineers, and stakeholders who need to understand what the system does and how it should behave from a user-facing perspective.

### Current implementation note

The care-coordination requirements below are implemented in the current repository and supersede older baseline statements that described doctor booking as out of scope.

Current frontend route names are `/niraksh-ai` (AI chat) and `/symptom-analysis` (symptom analysis and doctor discovery). Older baseline references to `/assistance` and `/doctor-suggest` mean those current routes.

## Current Implementation: Care Coordination and Pre-Consultation Intake

**FR-CARE-001:** Patients shall be able to open doctor discovery from symptom analysis, carry symptom/condition context into booking, and view only approved doctors whose directory record is available.

**FR-CARE-002:** Patients shall be able to choose an available future slot, consultation mode (`IN_PERSON`, `VIDEO`, or `PHONE` when supported), and an optional visit reason. New requests start with `REQUESTED` status.

**FR-CARE-003:** Doctors shall configure recurring weekly availability windows with weekday, start time, end time, slot duration, and active state. Slot generation and validation use India Standard Time (UTC+05:30).

**FR-CARE-004:** Patients shall be able to prepare an appointment-linked clinical intake containing a chief complaint, history of present illness (HPI), review of systems (ROS), current medicines, and allergies.

**FR-CARE-005:** Intake drafts shall expire after 30 minutes. Submitted intake sharing shall require explicit patient consent, be limited to the selected appointment/doctor access grant, and expire after 7 days.

**FR-CARE-006:** The intake service shall evaluate configured red-flag phrases as `ROUTINE`, `URGENT`, or `EMERGENCY`, explain the signal, and advise emergency care when appropriate. Triage is an advisory safety layer, not a diagnosis.

**FR-CARE-007:** Patients shall be able to revoke consent. Revoked, expired, cancelled, or inactive grants shall not expose intake data to doctors.

**FR-CARE-008:** Approved doctors shall be able to view an authorized patient record, review the AI-assisted intake draft, save an edited clinical summary, and see a merged timeline of relevant health events.

**FR-CARE-009:** Before issuing an appointment-linked prescription, doctors shall run a pre-prescription interaction check against proposed medicines and recorded/current medicines. Issued prescriptions shall include medicine name and optional dosage, frequency, duration, and instructions.

**FR-CARE-010:** Patient appointment responses shall include associated clinical-intake status where the migration is available; the appointment list remains usable during a rolling deployment before that migration is applied.

### 1.2 Scope

This document covers all end-user-facing features delivered through the web application, including:

- User authentication flows (email/password and Google OAuth)
- AI-driven health tools (symptom analysis, medicine, prescription, drug interaction, lab reports)
- Conversational AI health chat
- Doctor discovery and recommendation
- Disease education
- Personal health profiling, history, and PDF report generation

### 1.3 Definitions & Abbreviations

| Term | Definition |
|------|-----------|
| AI | Artificial Intelligence |
| LLM | Large Language Model (Google Gemini 2.5 Flash / medgemma1.5) |
| SSE | Server-Sent Events (streaming protocol) |
| SWR | Stale-While-Revalidate (client-side data-fetching strategy) |
| PDF | Portable Document Format |
| JWT | JSON Web Token |
| OAuth | Open Authorization protocol |
| OCR | Optical Character Recognition |
| FRD | Functional Requirements Document |

---

## 2. Project Overview

### 2.1 Problem Statement

Millions of people experience symptoms daily but lack the tools to understand them clearly before reaching a healthcare professional. The typical journey is:

> **Symptoms → Internet Search → Fear/Misinformation → Delayed or Wrong Care**

This results in late diagnosis, incorrect self-treatment, healthcare system overload, patient anxiety, and poor health literacy.

### 2.2 Solution

Niraksh-Guardian is an **AI-assisted health understanding platform** that converts personal health signals into guided medical direction. It acts as an **early health interpreter** — not a diagnosis tool — by combining:

- Symptom understanding with urgency triage
- Contextual specialist recommendation
- Prescription and medicine clarity
- Lab report interpretation
- Conversational health guidance
- Personal health profiling and tracking

### 2.3 Medical Disclaimer

> ⚠️ Niraksh-Guardian provides **informational health guidance only**. It does not replace professional medical diagnosis or treatment. Users must always consult qualified healthcare professionals for medical decisions.

---

## 3. Stakeholders & Target Users

### 3.1 Primary Users

| User Type | Description |
|-----------|-------------|
| Symptom Seekers | Individuals experiencing new or unclear symptoms |
| Confused Patients | People unsure which doctor/specialist to consult |
| Prescription Holders | Patients trying to understand prescriptions/medicines |
| Health-Aware Users | People seeking early health insight and tracking |
| Students / Young Professionals | Users with limited health literacy |

### 3.2 System Stakeholders

- **Product Team** — defines features and user journeys
- **Engineering Team** — builds and maintains the platform
- **Healthcare Domain Experts** — validate AI prompt framing and safety guardrails
- **End Users** — primary consumers of the product

---

## 4. Functional Scope

### 4.1 In-Scope Features

| Feature Area | Summary |
|---|---|
| Authentication | Email/password signup+login, Google OAuth, password reset, JWT token management |
| AI Chat Assistant | Conversational health guidance with image support and multi-language |
| Symptom Analysis | Multi-symptom input, AI triage, urgency scoring, specialist recommendation |
| Doctor Recommendation | Filterable doctor search with location-aware relevance ranking |
| Prescription Analysis | Upload prescription images → AI extraction and explanation |
| Medicine Information | Text or image-based medicine lookup with AI explanation |
| Drug Interaction Checker | Multi-drug safety check with AI-generated interaction report |
| Disease Education | AI-generated disease information with 30-day caching |
| Lab Report Analysis | Upload lab reports → parsed components, risk tags, AI insights |
| Health Profile | Blood group, allergies, chronic conditions, emergency contact |
| Health History | Tabbed timeline of all AI analyses with delete capability |
| Health Report Generation | AI-powered PDF health summary with Cloudinary storage |
| Dashboard | Aggregated health overview, risk score, quick actions, recent activity |

### 4.2 Out-of-Scope

- Real-time medical device integration (wearables, IoT)
- Insurance claim processing
- Pharmacy order management
- Clinical trial matching

---

## 5. User Authentication & Account Management

### 5.1 User Registration

**FR-AUTH-001:** The system shall allow users to register using an email address and password.

**Registration Form Fields:**
- Name (optional)
- Email address (required, unique)
- Password (required, minimum 8 characters)
- Gender (optional: Male / Female / Other)

**Validation Rules:**
- Email must follow standard format (RFC 5321)
- Password minimum 8 characters
- If email already exists, show error: "User already exists"

**Post-Registration Behavior:**
- System generates JWT access token (15-minute expiry) and refresh token (7-day expiry)
- Tokens stored in `localStorage`
- User redirected to `/dashboard` (or the `returnUrl` if set)

---

**FR-AUTH-002:** The system shall allow users to register via Google OAuth.

- User clicks Google OAuth button
- Google sign-in popup opens
- On success, a Google ID token is verified by the backend
- New user account created if not existing; otherwise existing account linked
- Tokens issued and user redirected to `/dashboard`

---

### 5.2 User Login

**FR-AUTH-003:** The system shall allow registered users to log in with email and password.

- On success: tokens stored, user redirected to `returnUrl` or `/dashboard`
- On failure: "Invalid credentials" error displayed

**FR-AUTH-004:** The system shall allow login via Google OAuth (same flow as registration)

---

### 5.3 Token Management & Session Security

**FR-AUTH-005:** The system shall automatically refresh expired access tokens without requiring the user to log in again.

- When a request returns 401, the `apiClient` silently sends the stored refresh token to `POST /api/auth/refresh-token`
- A new access + refresh token pair is issued (token rotation)
- The original failed request is retried transparently
- If refresh fails, all tokens are cleared and user is redirected to `/login?returnUrl=current`

**FR-AUTH-006:** The system shall invalidate the refresh token on logout.

- `POST /api/auth/logout` revokes the refresh token in the database
- The access token is blacklisted in Redis for its remaining TTL
- All localStorage entries are cleared
- User is redirected to `/login`

---

### 5.4 Password Reset

**FR-AUTH-007:** The system shall allow users to reset their password via email.

**Flow:**
1. User navigates to `/forgot-password` and submits their email
2. System always responds: "If an account exists, a reset link has been sent" (prevents email enumeration)
3. If account exists, a secure reset token is generated, hashed, stored in DB, and emailed via AWS SES
4. User clicks the link → `/reset-password?token=<token>`
5. User enters and confirms new password → submitted to `POST /api/auth/reset-password`
6. On success: "Password reset successfully" → redirect to `/login`
7. On failure (expired/invalid token): Error message + "Request new link" option

**Security Rules:**
- Rate limited per IP and email to prevent abuse
- Token is single-use and expires (configurable TTL)

---

### 5.5 Route Protection

**FR-AUTH-008:** The system shall protect all authenticated routes using `AuthGuard`.

- Unauthenticated users attempting to access protected routes are redirected to `/login?returnUrl=<path>`
- After successful login, user is returned to the original requested URL

---

## 6. AI Health Chat Assistant

**Feature Page:** `/assistance`

### 6.1 Chat Management

**FR-CHAT-001:** Authenticated users shall be able to create unlimited chat sessions.

- Each session has a title (editable)
- A sidebar lists all user's chat sessions sorted by `updatedAt` descending

**FR-CHAT-002:** Users shall be able to rename chat sessions inline.

**FR-CHAT-003:** Users shall be able to delete chat sessions.

- Confirmation dialog shown before deletion
- All messages within the chat are deleted (cascading)

### 6.2 Messaging

**FR-CHAT-004:** Users shall be able to send text messages in a chat session.

- User message appears immediately (optimistic UI)
- AI response is generated by Google Gemini
- AI response rendered with full Markdown support

**FR-CHAT-005:** Users shall be able to attach an image to any message.

- Image preview shown before sending
- Supported formats: JPEG, PNG, WebP
- Max file size: 5 MB
- Image buffer passed directly to Gemini (not uploaded to Cloudinary)
- Message content prefixed with `[Image Uploaded]`

**FR-CHAT-006:** The system shall maintain conversation context by sending the last 20 messages to the AI model on each request.

**FR-CHAT-007:** Users shall be able to select a language for the chat session from a dropdown.

Supported languages: English, Hindi, Bengali, Telugu, Marathi, Tamil, Urdu, Gujarati, Kannada, Malayalam, Punjabi

### 6.3 Quick Symptom Chips

**FR-CHAT-008:** The chat interface shall display quick symptom chips (e.g., "Fever", "Headache", "Cough") that pre-fill the input field when clicked.

### 6.4 Chat Summary for Doctor Referral

**FR-CHAT-009:** When navigating from chat to `/doctor-suggest`, users shall be able to generate a doctor-ready symptom summary from chat history.

- Triggered via `POST /api/ai/summarize-symptoms { chatId }`
- Only user messages are included in the summarization prompt
- If no medical content found, system returns: "This conversation has no medical content"

---

## 7. Symptom Analysis & Doctor Recommendation

**Feature Page:** `/doctor-suggest`

### 7.1 Symptom Input

**FR-SYMP-001:** Users shall be able to enter multiple symptoms as text input.

**FR-SYMP-002:** Users shall be able to optionally attach an image (e.g., skin condition photo) with symptom analysis.

**FR-SYMP-003:** Users shall be able to select a language for the analysis response.

### 7.2 AI Analysis

**FR-SYMP-004:** The system shall analyze submitted symptoms using Google Gemini and return a structured result.

**Analysis Output:**

| Field | Description |
|---|---|
| Possible Conditions | List of likely conditions with probability |
| Severity Badge | Mild 🟢 / Moderate 🟡 / Severe 🔴 / Emergency 🚨 |
| Urgency Level | Text description of urgency |
| Recommended Specialist | Primary specialist to consult |
| Home Remedies | Safe self-care suggestions for mild cases |
| Reasoning | AI's reasoning for the analysis |

**FR-SYMP-005:** The system shall automatically save every symptom analysis result to the user's history (`SymptomAnalysisHistory`).

**FR-SYMP-006:** The system shall optionally upload the symptom image to Cloudinary (`niraksh_symptoms/` folder) if provided.

### 7.3 Doctor Discovery

**FR-DOC-001:** After symptom analysis, the system shall automatically populate the specialist filter and fetch matching doctors.

**FR-DOC-002:** Users shall be able to filter the doctor list using the following parameters:

| Filter | Type |
|---|---|
| Specialization | Dropdown |
| City | Text input |
| State | Text input |
| Consultation Fee (min/max) | Number range |
| Sort By | name / experience / fee / rating |
| Sort Order | asc / desc |

**FR-DOC-003:** The system shall display doctor cards with:
- Profile image (if available)
- Name, specialization, rating
- Experience years and consultation fee
- City and state
- "📍 Near You" badge when doctor is in the user's city

**FR-DOC-004:** The doctor list shall be paginated (12 doctors per page).

### 7.4 Location-Based Relevance Ranking

**FR-DOC-005:** When `userCity` and `userState` are provided, the system shall apply a relevance ranking algorithm:

| Signal | Points |
|---|---|
| Tag match (per condition keyword) | +10 pts |
| City match | +50 pts |
| State match (city miss) | +20 pts |
| Rating | rating × 3 pts |
| Experience | min(years, 20) / 2 pts |
| Lower fee | (10000 − fee) / 1000 pts |

Results are sorted by `_relevanceScore` descending.

---

## 8. Prescription Analysis

**Feature Page:** `/prescription`

**FR-RX-001:** Users shall be able to upload up to 5 prescription images (drag-and-drop or file picker).

- Supported formats: JPEG, PNG, WebP
- Max file size per image: 5 MB
- Image preview thumbnails displayed before analysis

**FR-RX-002:** The system shall analyze uploaded prescriptions using Google Gemini Vision.

**Analysis Output:**
- Extracted medicine list (names, dosages, instructions)
- Full prescription explanation in natural language (Markdown)

**FR-RX-003:** The first uploaded image shall be stored in Cloudinary (`niraksh_prescriptions/` folder).

**FR-RX-004:** The analysis result shall be automatically saved to `PrescriptionHistory`.

**FR-RX-005:** Users shall be able to navigate directly from prescription results to the Drug Interaction Checker with the extracted medicines pre-filled.

- Navigation URL format: `/drug-interaction?medicines=Med1,Med2`

---

## 9. Medicine Information

**Feature Page:** `/medicine`

**FR-MED-001:** Users shall be able to look up medicine information by entering the medicine name as text.

**FR-MED-002:** Users shall be able to look up medicine information by uploading an image of the medicine packaging.

**FR-MED-003:** The system shall analyze the medicine using Google Gemini and return a Markdown-formatted result covering:

- Medicine name and composition
- Uses and indications
- Side effects
- Dosage information
- Alternative medicines

**FR-MED-004:** If an image is provided, it shall be uploaded to Cloudinary (`niraksh_medicines/` folder).

**FR-MED-005:** Every medicine analysis shall be saved to `MedicineHistory`.

---

## 10. Drug Interaction Checker

**Feature Page:** `/drug-interaction`

**FR-DRUG-001:** Users shall be able to input a dynamic list of medicine names (minimum 2).

- Medicines can be added or removed individually
- Pre-filled from URL parameter `?medicines=Med1,Med2` (e.g., from Prescription page)

**FR-DRUG-002:** The system shall check drug-drug interactions using Google Gemini and return a Markdown-formatted report including:

- Interaction severity
- Mechanism of interaction
- Clinical significance
- Recommendations and alternatives

**FR-DRUG-003:** Every drug interaction check shall be saved to `DrugInteractionHistory`.

---

## 11. Disease Information & Education

**Feature Page:** `/disease`

**FR-DIS-001:** Users shall be able to search for a disease or health condition by name.

**FR-DIS-002:** Users shall be able to select a language for the disease information.

**FR-DIS-003:** The system shall fetch AI-generated disease information and display:

| Section | Content |
|---|---|
| Disease Name | Full official name |
| Description | Plain-language overview |
| Symptoms | Bulleted list of common symptoms |
| Causes | Common causes and risk factors |
| Prevention | Preventive measures |
| Treatment | Standard treatment approaches |
| When to See a Doctor | Urgency guidance |

**FR-DIS-004:** The system shall cache disease information per topic + language for 30 days.

- On first request: Gemini is called and result stored in `DiseaseInfoCache`
- On subsequent requests within 30 days: cached result is served instantly
- After 30 days: cache is invalidated and Gemini is called again
- Force refresh available via `?refresh=true` query parameter

**FR-DIS-005:** Users shall be able to navigate from a disease result to doctor recommendations via a "Find Related Doctors" button.

- Navigation URL format: `/doctor-suggest?condition=<DiseaseName>`

**FR-DIS-006:** The home page shall display disease category cards that link to `/disease?topic=<name>`.

---

## 12. Lab Report Analysis

**Feature Page:** (Integrated with health tools)

**FR-LAB-001:** Users shall be able to upload a lab report document (PDF or image) for AI analysis.

**FR-LAB-002:** The system shall extract individual test components from the lab report and return:

| Field | Description |
|---|---|
| Component Name | Test name (e.g., Hemoglobin, Glucose) |
| Observed Value | Numerical result |
| Reference Range | Min–Max normal range |
| Status | Normal / High / Low |
| Risk Tag | Flagged risk level |
| AI Insight | Natural language explanation |
| Urgency | Low / Medium / High |
| What to Do Next | Actionable recommendation |
| Related Conditions | Linked disease associations |
| Symptom Connections | Related symptoms |

**FR-LAB-003:** The system shall compute:
- `overallRisk` for the report (low / medium / high)
- `abnormalCount` — number of out-of-range components

**FR-LAB-004:** Lab report files shall be stored in Cloudinary.

**FR-LAB-005:** Users shall be able to add notes to individual lab report components.

**FR-LAB-006:** Users shall be able to generate a shareable link for a lab report.

- Share token is unique and has a configurable expiry
- Shared view is read-only and does not require authentication

---

## 13. User Health Profile

**Feature Page:** `/profile`

### 13.1 User Information

**FR-PROF-001:** Users shall be able to view and edit their profile.

| Field | Editable | Notes |
|---|---|---|
| Name | ✅ Yes | Free text |
| Email | ❌ No | Display only |
| Gender | ✅ Yes | Male / Female / Other |
| Language Preference | ✅ Yes | 11 supported languages |
| City | ✅ Yes | Used for doctor proximity |
| State | ✅ Yes | Used for doctor proximity |

### 13.2 Health Profile

**FR-PROF-002:** Users shall be able to manage their health profile fields.

| Field | Type |
|---|---|
| Blood Group | Dropdown: A+, A-, B+, B-, AB+, AB-, O+, O- |
| Allergies | Tag input (multi-value) |
| Chronic Conditions | Tag input (multi-value) |
| Emergency Contact Name | Text |
| Emergency Contact Phone | Text |
| Emergency Contact Email | Text |

**FR-PROF-003:** The system shall automatically calculate a Health Risk Score (0–100).

- Formula: `number_of_chronic_conditions × 10` (capped at 100)
- Score is displayed as a read-only gauge on the profile and dashboard

**FR-PROF-004:** Profile updates shall use an upsert operation on `PatientHealthProfile` (create if first time, update if existing).

---

## 14. Health History

**Feature Page:** `/history`

**FR-HIST-001:** The history page shall display a tabbed interface with the following tabs:

| Tab | Content |
|---|---|
| All | Merged timeline of all history types |
| Medicine 💊 | Medicine analysis records |
| Prescription 📋 | Prescription analysis records |
| Interaction ⚠️ | Drug interaction check records |
| Symptom 🔬 | Symptom analysis records |

**FR-HIST-002:** Each history entry card shall display:
- Date and time created
- Type badge (color-coded)
- Key info (medicine name / symptom list / drug names)
- Expandable full analysis (Markdown rendered)

**FR-HIST-003:** Users shall be able to delete any individual history record.

- Confirmation dialog shown before deletion
- SWR cache invalidated immediately after deletion

**FR-HIST-004:** The history page shall support direct linking to a specific tab via URL parameter: `/history?type=medicine`

---

## 15. Health Reports (PDF)

**Feature Page:** `/reports`

**FR-RPT-001:** Users shall be able to generate a comprehensive AI-powered PDF health summary report.

**Report Content:**
- User profile overview (name, blood group, allergies, chronic conditions)
- Last 5 symptom analyses
- Last 5 medicine lookups
- AI-generated narrative summary and trend analysis
- Recommendations
- Executive summary

**FR-RPT-002:** Generated PDFs shall be uploaded to Cloudinary (`niraksh_reports/` folder).

**FR-RPT-003:** The system shall enforce a maximum of 10 reports per user.

- When the limit is exceeded, the oldest report is automatically deleted from both the database and Cloudinary

**FR-RPT-004:** Users shall be able to view and download existing reports by clicking on the Cloudinary report URL.

**FR-RPT-005:** Report generation may take 5–10 seconds; a loading state indicator shall be displayed during this time.

---

## 16. Dashboard

**Feature Page:** `/dashboard`

**FR-DASH-001:** The dashboard shall aggregate data from 6 parallel API calls on page load:

1. `GET /api/profile` — user info + health profile
2. `GET /api/history/medicine` — medicine history
3. `GET /api/history/prescription` — prescription history
4. `GET /api/history/interaction` — drug interaction history
5. `GET /api/history/symptom` — symptom analysis history
6. `GET /api/reports` — health reports list

**FR-DASH-002:** The dashboard shall display:

| Section | Content |
|---|---|
| Risk Score Card | Gauge (0–100), color-coded (green/yellow/red) |
| Health Summary | Blood group, allergies, chronic conditions, emergency contact |
| Quick Actions | Links to: Medicine, Prescription, Drug Interaction, AI Chat, Doctor Suggest, Reports |
| Recent Activity | Merged + sorted timeline, last 10 entries, type-badged |
| Past Reports | Report cards with date and PDF download link |

**FR-DASH-003:** For first-time users with no health profile, a "Complete your health profile" prompt shall be displayed.

**FR-DASH-004:** For first-time users with no history, each section shall display an appropriate empty state with a "Get started" CTA.

**FR-DASH-005:** Clicking a recent activity item shall navigate to `/history?type=<type>`.

---

## 17. Non-Functional Requirements

### 17.1 Performance

| Metric | Target |
|---|---|
| Lighthouse Performance Score | ≥ 90 |
| Lighthouse Accessibility Score | ≥ 90 |
| Lighthouse Best Practices Score | ≥ 90 |
| API Latency (p50) | < 200 ms |
| API Latency (p95) | < 500 ms |
| API Latency (p99) | < 2 s |
| Disease info cache (cached hit) | < 100 ms |
| Report generation | 5–10 s (acceptable, with loading state) |

### 17.2 Usability

- All interactive elements shall have touch targets ≥ 44px
- Responsive design supporting mobile (< 768px) and desktop (≥ 768px)
- Accessible navigation via keyboard
- WCAG 2.1 AA compliance (color contrast, ARIA labels, focus management)

### 17.3 Localization

- UI and AI responses shall support 11 Indian languages
- Language preference stored in user profile and applied automatically

### 17.4 Error Handling

| Scenario | User-Facing Behavior |
|---|---|
| Network offline | Toast: "No internet connection" + retry option |
| API 500 | Toast: "Something went wrong" + retry option |
| API 429 (rate limited) | Toast: "Too many requests, please wait" |
| File too large (> 5 MB) | Client-side toast before upload |
| Unsupported file type | Client-side toast before upload |
| AI analysis failure | Toast: "AI Health Analysis Failed" |
| Invalid reset token | Error message + "Request new link" link |

### 17.5 Security & Privacy

- Users can only access their own data
- All health data stored in user-scoped database records
- No PII transmitted to third-party services beyond what is required for AI processing
- All images uploaded to Cloudinary in private/secure folders
- HTTPS enforced on all endpoints

---

## 18. Constraints & Assumptions

### 18.1 Constraints

- The system does not provide medical diagnosis
- AI responses are bounded by prompt guardrails to prevent harmful outputs
- Maximum 5 images per prescription analysis
- Maximum 5 MB per uploaded file
- Maximum 10 stored health reports per user
- Access tokens expire after 15 minutes; refresh tokens after 7 days

### 18.2 Assumptions

- Users have access to a modern web browser (Chrome, Firefox, Safari, Edge)
- Users have an internet connection for all features
- Google Gemini API is available and within rate limits
- Cloudinary storage is provisioned and accessible
- AWS SES is configured for email delivery in the target region

---

## 19. Acceptance Criteria Summary

| Feature | Key Acceptance Criteria |
|---|---|
| Registration | User can sign up with email/password or Google; JWT tokens issued; redirected to dashboard |
| Login | Returning user authenticated; token refreshed silently on expiry |
| Password Reset | User receives email; reset link works; new password accepted; invalid tokens rejected |
| AI Chat | User can create chat, send messages with optional images; AI responds with health guidance; history persisted |
| Symptom Analysis | System returns severity, conditions, urgency, specialist, home remedies; saved to history |
| Doctor Search | Filterable paginated doctor list; location-aware sorting; "Near You" badge for city matches |
| Appointment Booking | Approved and available doctor exposes IST-generated slots; patient can request, view, and cancel an appointment |
| Clinical Intake | Patient can save a 30-minute draft, submit with consent, see triage, and revoke sharing; submitted access expires after 7 days |
| Doctor Portal | Approved doctor can manage availability, update appointment status, review authorized patient records, and edit intake summaries |
| Prescription Safety | Doctor must complete a pre-prescription interaction check before issuing an appointment-linked prescription |
| Prescription | Up to 5 images analyzed; medicine list extracted; result saved to history; can link to drug checker |
| Medicine | Text or image lookup; Markdown result returned; saved to history |
| Drug Interaction | Minimum 2 medicines; interaction report generated; saved to history |
| Disease Info | AI info returned; 30-day cache works; "Find Doctors" CTA links correctly |
| Lab Report | Report components parsed; risk tags assigned; notes and sharing work |
| Profile | All fields editable; risk score auto-calculated; city/state improves doctor ranking |
| History | All 4 types visible; expandable; deletable; tab filter works |
| PDF Report | Generated and uploaded to Cloudinary; accessible via URL; 10-report limit enforced |
| Dashboard | All 6 data sources aggregated; risk score gauge correct; empty states shown for new users |

---

*End of Functional Requirements Document*
