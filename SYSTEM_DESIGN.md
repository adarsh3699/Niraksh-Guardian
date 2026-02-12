# Niraksh-Guardian Backend System Design

## 1. Overview

This document describes the complete backend architecture for Niraksh-Guardian.  
The backend is built using Node.js with TypeScript and follows a modular, scalable, and secure design.

The system focuses on:

- Secure authentication (Google OAuth + JWT)
- Password reset via AWS SES
- Redis-based rate limiting and session management
- Bounce and complaint monitoring
- Logging and monitoring (free stack)

The entire system is designed using free and open-source technologies.

---

## 2. High-Level Architecture

Client (React / Frontend)
↓
Node.js + TypeScript API (Express)
↓

---

| PostgreSQL | Redis |
| User Data | Sessions + Rate Limit |

---

        ↓

AWS SES (Email Sending)
↓
AWS SNS (Bounce/Complaint)
↓
Webhook Endpoint (/ses/events)

---

## 3. Core Components

### 3.1 API Server

- Framework: Express.js
- Language: TypeScript
- Validation: Zod
- Security: Helmet, CORS
- Logging: Pino

Responsibilities:

- Authentication
- Token generation & validation
- Password reset handling
- Email sending
- SNS event handling
- Rate limiting

---

### 3.2 Database (PostgreSQL)

Used for:

- User records
- OAuth identities
- Hashed refresh tokens
- Password reset tokens

Main Tables:

- users
- oauth_accounts
- refresh_tokens
- password_reset_tokens

---

### 3.3 Redis

Used for:

- Rate limiting counters
- Token blacklist
- Session tracking
- Temporary lockouts

TTL-based storage ensures automatic cleanup.

---

### 3.4 Authentication Flow

#### Email/Password Login

1. User submits credentials
2. Password verified using bcrypt
3. Access token (short-lived) generated
4. Refresh token generated and stored (hashed)
5. Tokens returned to client

#### Google OAuth

1. User authenticates via Google
2. Backend validates Google ID token
3. User created (if new)
4. JWT tokens issued

#### Token Refresh

1. Client sends refresh token
2. Server validates and rotates token
3. New access token issued

---

### 3.5 Password Reset Flow

1. User requests password reset
2. Reset token generated (secure random)
3. Token stored hashed in DB
4. Email sent via AWS SES
5. User clicks link
6. Token verified
7. Password updated

Rate limited to prevent abuse.

---

### 3.6 AWS SES Integration

- Send reset emails
- Use SES suppression list
- Monitor bounce/complaint via SNS
- Webhook endpoint processes events

If bounce detected:

- Email marked inactive
- Future emails blocked

---

### 3.7 Logging Strategy

Logger: Pino (JSON structured logs)

Logs:

- Auth events
- Failed login attempts
- Token refresh
- Email sends
- SES events
- Security alerts

Logs stored:

- Console (development)
- CloudWatch (production free tier)

---

### 3.8 Monitoring Strategy

Monitor:

- Login failure rate
- Password reset attempts
- SES bounce rate
- Server health

Basic Setup:

- CloudWatch metrics
- /health endpoint
- Manual alert thresholds

---

### 3.9 Security Measures

- HTTPS only
- bcrypt password hashing
- JWT rotation
- Rate limiting via Redis
- Helmet middleware
- Input validation via Zod
- Secure environment variable storage

---

## 4. Folder Structure

src/
├── config/
├── controllers/
├── services/
│ ├── auth/
│ ├── email/
│ ├── redis/
│ └── jwt/
├── middlewares/
├── routes/
├── db/
├── utils/
├── validators/
├── app.ts
└── server.ts

---

## 5. Scalability Considerations

- Stateless API (JWT-based)
- Redis for distributed rate limiting
- Database indexed properly
- Modular service architecture

Future upgrade path:

- Microservices
- Docker
- CI/CD pipeline

---

## 9. Chat System Design

### 9.1 Overview

The chat system enables users to interact with AI models.

- **Storage**: PostgreSQL (Chats and Messages tables)
- **API**: RESTful endpoints for creating chats, sending messages, and retrieving history.
- **Model Integration**: (To be defined - likely calls to external AI APIs)

### 9.2 Data Flow

1. User sends message -> API
2. API saves user message to DB
3. API calls AI Model
4. API saves AI response to DB
5. API returns response to User

### 9.3 Optimization

- **Streaming**: Responses should be streamed to client (future enhancement).
- **History Context**: Limited recent messages sent to model to maintain context window.
