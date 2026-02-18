# Niraksh-Guardian Backend Implementation Plan

### Notes:

- We will check for build and lint error after each phase.
- Using pnpm as package manager.
- **Updated with 10 New Advanced AI Features.**

## Phase 0 – Planning & Setup (Week 1)

### Task 0.1 – Finalize Tech Stack

Priority: High

- [x] Confirm Node.js + TypeScript
- [x] Confirm PostgreSQL
- [x] Confirm Redis
- [x] Confirm AWS SES
- [x] Confirm SNS for bounce tracking
- [x] Confirm Cloudinary for Image Storage (New)

Dependency: None

---

### Task 0.2 – Project Initialization

Priority: High

- [x] Initialize Node project
- [x] Configure TypeScript
- [x] Setup ESLint & Prettier
- [x] Setup folder structure
- [x] Setup environment configuration

Milestone: Project builds successfully

---

## Phase 1 – Database Setup (Week 1)

### Task 1.1 – Setup PostgreSQL

Priority: High

- [x] Install PostgreSQL
- [x] Configure Prisma ORM
- [x] Setup initial schema

Dependency: Project initialization

---

### Task 1.2 – Create Core Tables

Priority: High

- [x] Users table
- [x] OAuth accounts
- [x] Refresh tokens
- [x] Password reset tokens
- [x] Chats table (New)
- [x] Messages table (New)
- [x] History Tables (Medicine, Prescription, Interactions) (Update)

Milestone: Database migrations successful

---

## Phase 2 – Authentication System (Week 2)

### Task 2.1 – Password Hashing

Priority: High

- [x] Implement bcrypt hashing
- [x] Implement password verification

---

### Task 2.2 – JWT Implementation

Priority: High

- [x] Access token logic
- [x] Refresh token logic
- [x] Token rotation
- [x] Token validation middleware

Dependency: Database ready

---

### Task 2.3 – Email/Password Signup

Priority: High

- [x] Validation layer
- [x] Create user endpoint
- [x] Store hashed password

---

### Task 2.4 – Login Endpoint

Priority: High

- [x] Verify password
- [x] Generate tokens
- [x] Store refresh token hashed
- [x] Update last_login timestamp

Milestone: Authentication fully functional

---

### Task 2.5 – Google OAuth Integration

Priority: Medium

- [x] Setup Google Cloud project
- [x] Implement OAuth callback
- [x] Validate Google ID token
- [x] Create or link user
- [x] Issue JWT tokens

Dependency: JWT system complete

---

## Phase 3 – Redis Integration (Week 3)

### Task 3.1 – Redis Setup

Priority: High

- [x] Connect Redis client
- [x] Configure environment variables

---

### Task 3.2 – Rate Limiting Middleware

Priority: High

- [x] Implement IP-based rate limiting
- [x] Implement login attempt limiter
- [x] Implement reset email limiter

Dependency: Redis connected

---

### Task 3.3 – Token Blacklist

Priority: Medium

- [x] Store revoked tokens
- [x] Validate against blacklist

Milestone: Security layer active

---

## Phase 4 – Password Reset System (Week 4)

### Task 4.1 – AWS SES Setup

Priority: High

- [x] Verify domain/email
- [x] Move out of sandbox (if possible)
- [x] Setup credentials

---

### Task 4.2 – HTML Email Template

Priority: Medium

- [x] Create responsive HTML template
- [x] Add reset link
- [x] Test locally

---

### Task 4.3 – Reset Token Generation

Priority: High

- [x] Secure random token
- [x] Store hashed token
- [x] Add expiration logic

---

### Task 4.4 – Reset Verification Endpoint

Priority: High

- [x] Validate token
- [x] Update password
- [x] Invalidate token

Milestone: Password reset fully operational

---

## Phase 5 – SES Bounce & Complaint Monitoring (Week 5)

### Task 5.1 – SNS Configuration

Priority: High

- [x] Create SNS topic
- [x] Subscribe webhook endpoint

---

### Task 5.2 – Webhook Endpoint

Priority: High

- [x] Verify SNS signature
- [x] Process bounce events
- [x] Process complaint events
- [x] Mark emails inactive

Milestone: Email reputation protection active

---

## Phase 6 – Logging & Monitoring (Week 5)

### Task 6.1 – Logging Setup

Priority: High

- [x] Integrate Pino
- [x] Structured logs
- [x] Error handling middleware

---

### Task 6.2 – Health Endpoint

Priority: Medium

- [x] Create /health route
- [x] Check DB connection
- [x] Check Redis connection

---

### Task 6.3 – CloudWatch Integration

Priority: Medium

- [x] Enable log shipping (Skipped - using Pino structured logs)
- [x] Create basic alarms (Skipped - relying on /health endpoint)

Milestone: Monitoring operational

---

## Phase 7 – Security Hardening (Week 6)

### Task 7.1 – Middleware Security

- [x] Helmet
- [x] CORS configuration
- [x] Input validation

---

### Task 7.2 – Rate Limit Testing

- [x] Stress test endpoints
- [x] Verify lockouts

---

### Task 7.3 – Security Audit

- [x] Test token misuse
- [x] Test expired tokens
- [x] Test brute force

Milestone: Production-ready security

---

## Phase 8 – Chat System Implementation (Week 7)

### Task 8.1 – Chat API

Priority: High

- [x] Create chat endpoint
- [x] Get chat history endpoint
- [x] Delete chat endpoint
- [x] **Implement Multi-Language Support (Input translation)**

Dependency: Authentication System, Database

---

### Task 8.2 – Message Handling

Priority: High

- [x] Send message endpoint
- [x] Integrate **Gemini AI Model**
- [x] Store messages in DB

---

## Phase 9 – Advanced Doctor Recommendation & Symptom Intelligence (Week 8)

### Task 9.1 – Doctor Database

Priority: High

- [x] Create Doctors table migration
- [x] Create seed script to migrate JSON data to DB
- [x] Execute migration

### Task 9.2 – Doctor API

Priority: High

- [x] Create /doctors endpoint
- [x] Implement filtering by specialization
- [x] Implement search by name/location

### Task 9.3 – Smart Symptom Intelligence (New)

Priority: High

- [x] Implement Gemini JSON mode for structured output
- [x] **Implement Multi-Symptom Reasoning logic**
- [x] **Implement Severity Prediction & Urgency Detection (Mild/Moderate/Emergency)**
- [x] **Implement Image-Based Symptom Detection (Gemini Vision)**
- [x] Update /ai/analyze-symptoms endpoint to return enhanced data

### Task 9.4 – Disease Education & Prevention (New)

Priority: Medium

- [x] Implement Disease Info API (Causes, Symptoms, Prevention)
- [x] Implement Home Remedies Suggestion logic
- [x] Frontend Cleanup: Connect new endpoints
- [x] **Remove legacy `symptoms_to_category.json` & client-side logic**

---

## Phase 10 – Health Tools, History & Dashboard (Week 9)

### Task 10.1 – Cloudinary & Uploads

Priority: High

- [x] Configure Cloudinary credentials
- [x] Create upload middleware (Multer)

### Task 10.2 – Database Updates for History & Profiles

Priority: High

- [x] Create migration for History tables (Medicine, Prescription, Interactions)
- [x] **Create migration for SymptomAnalysisHistory & PatientHealthProfile**
- [x] Run migration

### Task 10.3 – History Endpoints

Priority: High

- [x] Medicine Analysis & History API
- [x] Prescription Analysis & History API
- [x] Drug Interaction & History API

### Task 10.4 – Personal Health Dashboard (New)

Priority: High

- [x] **Implement Health Risk Score Calculation Logic**
- [x] Create Dashboard API (Recent activity, frequent issues, risk score)
- [x] Implement Emergency Mode Endpoint (Notify contacts + First Aid info)

---

## Phase 11 – AI Health Reports & Final Polish (Week 10)

### Task 11.1 – AI Health Report Generator (New)

Priority: High

- [x] create /reports/generate endpoint
- [x] Implement PDF generation (using `pdfkit` or similar)
- [x] Upload generated report to Cloudinary
- [x] Return report URL to user
- [x] **Implement Report Storage Limit** (Max 10 per user, FIFO queue for DB & Cloudinary)

### Task 11.2 – Final Testing

Priority: High

- [x] Unit Tests (Auth, Chat, Doctor, Health Tools, Dashboard)
- [x] Integration Tests (Full flows)

### Task 11.3 – Deployment in vercel

Priority: High

- [x] Setup production environment variables
- [x] Configure database
- [x] Deploy backend
- [x] Verify logs

---

## Final Deliverables

- [ ] Fully working backend
- [ ] Secure authentication & Rate Limiting
- [ ] **Smart Symptom Intelligence (Text + Image)**
- [ ] **Enhanced Doctor Recommendation**
- [ ] **Personal Health Dashboard with Risk Score**
- [ ] **Emergency Mode**
- [ ] **AI Health Report Generator (PDF)**
- [ ] **Multi-Language Support**
- [ ] Chat System
- [ ] Health Tools History
- [ ] Production-ready configuration
