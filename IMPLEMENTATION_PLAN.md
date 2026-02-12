# Niraksh-Guardian Backend Implementation Plan

Notes: we will check for build and lint error after each phase.
and we are using pnpm as package manager.

## Phase 0 – Planning & Setup (Week 1)

### Task 0.1 – Finalize Tech Stack

Priority: High

- [ ] Confirm Node.js + TypeScript
- [ ] Confirm PostgreSQL
- [ ] Confirm Redis
- [ ] Confirm AWS SES
- [ ] Confirm SNS for bounce tracking

Dependency: None

---

### Task 0.2 – Project Initialization

Priority: High

- [ ] Initialize Node project
- [ ] Configure TypeScript
- [ ] Setup ESLint & Prettier
- [ ] Setup folder structure
- [ ] Setup environment configuration

Milestone: Project builds successfully

---

## Phase 1 – Database Setup (Week 1)

### Task 1.1 – Setup PostgreSQL

Priority: High

- [ ] Install PostgreSQL
- [ ] Configure Prisma ORM
- [ ] Setup initial schema

Dependency: Project initialization

---

### Task 1.2 – Create Core Tables

Priority: High

- [ ] Users table
- [ ] OAuth accounts
- [ ] Refresh tokens
- [ ] Password reset tokens
- [ ] Chats table (New)
- [ ] Messages table (New)

Milestone: Database migrations successful

---

## Phase 2 – Authentication System (Week 2)

### Task 2.1 – Password Hashing

Priority: High

- [ ] Implement bcrypt hashing
- [ ] Implement password verification

---

### Task 2.2 – JWT Implementation

Priority: High

- [ ] Access token logic
- [ ] Refresh token logic
- [ ] Token rotation
- [ ] Token validation middleware

Dependency: Database ready

---

### Task 2.3 – Email/Password Signup

Priority: High

- [ ] Validation layer
- [ ] Create user endpoint
- [ ] Store hashed password

---

### Task 2.4 – Login Endpoint

Priority: High

- [ ] Verify password
- [ ] Generate tokens
- [ ] Store refresh token hashed
- [ ] Update last_login timestamp

Milestone: Authentication fully functional

---

### Task 2.5 – Google OAuth Integration

Priority: Medium

- [ ] Setup Google Cloud project
- [ ] Implement OAuth callback
- [ ] Validate Google ID token
- [ ] Create or link user
- [ ] Issue JWT tokens

Dependency: JWT system complete

---

## Phase 3 – Redis Integration (Week 3)

### Task 3.1 – Redis Setup

Priority: High

- [ ] Connect Redis client
- [ ] Configure environment variables

---

### Task 3.2 – Rate Limiting Middleware

Priority: High

- [ ] Implement IP-based rate limiting
- [ ] Implement login attempt limiter
- [ ] Implement reset email limiter

Dependency: Redis connected

---

### Task 3.3 – Token Blacklist

Priority: Medium

- [ ] Store revoked tokens
- [ ] Validate against blacklist

Milestone: Security layer active

---

## Phase 4 – Password Reset System (Week 4)

### Task 4.1 – AWS SES Setup

Priority: High

- [ ] Verify domain/email
- [ ] Move out of sandbox (if possible)
- [ ] Setup credentials

---

### Task 4.2 – HTML Email Template

Priority: Medium

- [ ] Create responsive HTML template
- [ ] Add reset link
- [ ] Test locally

---

### Task 4.3 – Reset Token Generation

Priority: High

- [ ] Secure random token
- [ ] Store hashed token
- [ ] Add expiration logic

---

### Task 4.4 – Reset Verification Endpoint

Priority: High

- [ ] Validate token
- [ ] Update password
- [ ] Invalidate token

Milestone: Password reset fully operational

---

## Phase 5 – SES Bounce & Complaint Monitoring (Week 5)

### Task 5.1 – SNS Configuration

Priority: High

- [ ] Create SNS topic
- [ ] Subscribe webhook endpoint

---

### Task 5.2 – Webhook Endpoint

Priority: High

- [ ] Verify SNS signature
- [ ] Process bounce events
- [ ] Process complaint events
- [ ] Mark emails inactive

Milestone: Email reputation protection active

---

## Phase 6 – Logging & Monitoring (Week 5)

### Task 6.1 – Logging Setup

Priority: High

- [ ] Integrate Pino
- [ ] Structured logs
- [ ] Error handling middleware

---

### Task 6.2 – Health Endpoint

Priority: Medium

- [ ] Create /health route
- [ ] Check DB connection
- [ ] Check Redis connection

---

### Task 6.3 – CloudWatch Integration

Priority: Medium

- [ ] Enable log shipping
- [ ] Create basic alarms

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

## Phase 9 – Final Testing & Deployment (Week 8)

### Task 9.1 – Unit Tests

Priority: High

- [ ] Auth tests
- [ ] Token tests
- [ ] Reset tests
- [ ] Chat tests

---

### Task 9.2 – Integration Tests

Priority: Medium

- [ ] Full login flow
- [ ] Full reset flow
- [ ] SES event simulation
- [ ] Chat flow

---

### Task 9.3 – Deployment

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
- [ ] Production-ready configuration
