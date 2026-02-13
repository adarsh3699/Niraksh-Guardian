# Niraksh-Guardian Backend Implementation Plan

Notes: we will check for build and lint error after each phase.
and we are using pnpm as package manager.

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

- [x] Enable log shipping
- [x] Create basic alarms

Milestone: Monitoring operational

---

## Phase 7 – Security Hardening (Week 6)

### Task 7.1 – Middleware Security

- [ ] Helmet
- [ ] CORS configuration
- [ ] Input validation

---

### Task 7.2 – Rate Limit Testing

- [ ] Stress test endpoints
- [ ] Verify lockouts

---

### Task 7.3 – Security Audit

- [ ] Test token misuse
- [ ] Test expired tokens
- [ ] Test brute force

Milestone: Production-ready security

---

## Phase 8 – Chat System Implementation (Week 7)

### Task 8.1 – Chat API

Priority: High

- [ ] Create chat endpoint
- [ ] Get chat history endpoint
- [ ] Delete chat endpoint

Dependency: Authentication System, Database

---

### Task 8.2 – Message Handling

Priority: High

- [ ] Send message endpoint
- [ ] Integrate AI Model (Placeholder/Mock for start)
- [ ] Store messages in DB

---

## Phase 9 – Doctor Recommendation System (Week 8)

### Task 9.1 – Doctors Table & Data

Priority: High

- [ ] Create Doctors table migration
- [ ] Create seed script to migrate JSON data to DB
- [ ] Execute migration

### Task 9.2 – Doctor API

Priority: High

- [ ] Create /doctors endpoint
- [ ] Implement filtering by specialization
- [ ] Implement search by name/location

### Task 9.3 – AI Symptom Integration (Enhanced)

Priority: High

- [ ] Implement Gemini JSON mode for structured output
- [ ] Add confidence scoring and validation logic
- [ ] Implement fallback to 'General Physician'
- [ ] Update /ai/analyze-symptoms endpoint

### Task 9.4 – Frontend Cleanup

Priority: Medium

- [ ] Remove `symptoms_to_category.json`
- [ ] Remove client-side mapping logic from `DoctorSuggest.jsx`
- [ ] Connect frontend to new `/doctors` and `/ai/analyze-symptoms` endpoints

---

## Phase 10 – Health Tools & History (New Phase) (Week 9)

### Task 10.1 – Cloudinary Setup

Priority: High

- [ ] Configure Cloudinary credentials
- [ ] Create upload middleware (Multer)

### Task 10.2 – Database Updates

Priority: High

- [ ] Create migration for History tables
- [ ] Run migration

### Task 10.3 – History Endpoints

Priority: High

- [ ] Medicine Analysis & History API
- [ ] Prescription Analysis & History API
- [ ] Drug Interaction & History API

Milestone: Full Health Tools Suite

---

## Phase 11 – Final Testing & Deployment (Week 10)

### Task 11.1 – Unit Tests

Priority: High

- [ ] Auth tests
- [ ] Token tests
- [ ] Reset tests
- [ ] Chat tests
- [ ] Doctor API tests
- [ ] Health Tools tests

---

### Task 11.2 – Integration Tests

Priority: Medium

- [ ] Full login flow
- [ ] Full reset flow
- [ ] SES event simulation
- [ ] Chat flow
- [ ] Doctor recommendation flow
- [ ] Image upload flow

---

### Task 11.3 – Deployment

Priority: High

- [ ] Setup production environment variables
- [ ] Configure database
- [ ] Deploy backend
- [ ] Verify logs

Milestone: Production launch

---

## Final Deliverables

- [ ] Fully working backend
- [ ] Secure authentication
- [ ] Google OAuth
- [ ] JWT rotation
- [ ] Redis rate limiting
- [ ] AWS SES password reset
- [ ] Bounce monitoring
- [ ] Structured logging
- [ ] Health monitoring
- [ ] Chat System
- [ ] Doctor Recommendation System
- [ ] Health Tools History (Cloudinary)
- [ ] Production-ready configuration
