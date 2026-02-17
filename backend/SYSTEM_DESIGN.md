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
- AI-powered Health Tools (Image Analysis & Interaction checks)
- **Advanced AI Reasoning** (Smart Symptom Intelligence, Disease Prediction)
- **Personal Health Dashboard**
- **Emergency Response System**
- **Multi-Language Support**

The entire system is designed using free and open-source technologies, plus Cloudinary for media.

---

## 2. High-Level Architecture

Client (React / Frontend)
↓
Node.js + TypeScript API (Express)
↓

---

| PostgreSQL | Redis | Cloudinary |
| User Data | Rate Limit | Images |

---

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
- **Image Upload & Processing**
- **AI Health Analysis**

---

### 3.2 Database (PostgreSQL)

Used for:

- User records
- OAuth identities
- Hashed refresh tokens
- Password reset tokens
- **Health Tool History** (Medicine, Prescription, Interactions)
- **Symptom & Disease History**
- **Health Risk Scores**
- **Emergency Contacts**

Main Tables:

- users
- oauth_accounts
- refresh_tokens
- password_reset_tokens
- medicine_history
- prescription_history
- drug_interaction_history
- symptom_analysis_history
- patient_health_profiles

---

### 3.3 Redis

Used for:

- Rate limiting counters
- Token blacklist
- Session tracking
- Temporary lockouts
- **Real-time Emergency Alerts (Pub/Sub)**

TTL-based storage ensures automatic cleanup.

---

### 3.4 Media Storage (Cloudinary)

Used for:

- Uploaded Medicine images
- Uploaded Prescription images
- Doctor profile images
- **Skin Issue Images (Symptom Detection)**

Strategy:

- Secure uploads via API
- Transformations (optimization, resizing)
- Delivery via CDN URL

---

### 3.5 Authentication Flow

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

### 3.6 Password Reset Flow

1. User requests password reset
2. Reset token generated (secure random)
3. Token stored hashed in DB
4. Email sent via AWS SES
5. User clicks link
6. Token verified
7. Password updated

Rate limited to prevent abuse.

---

### 3.7 AWS SES Integration

- Send reset emails
- Use SES suppression list
- Monitor bounce/complaint via SNS
- Webhook endpoint processes events
- **Send Emergency Alerts**

If bounce detected:

- Email marked inactive
- Future emails blocked

---

### 3.8 Logging Strategy

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
- Hosting Platform Logs (production)

---

### 3.9 Monitoring Strategy

Monitor:

- Login failure rate
- Password reset attempts
- SES bounce rate
- Server health

Basic Setup:

- /health endpoint
- Manual alert thresholds

---

### 3.10 Security Measures

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
│ ├── jwt/
│ ├── cloudinary/
│ └── ai/ <-- New (Gemini Integration)
├── middlewares/
│ └── upload.ts <-- Multer config
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
- CDN for static assets (Cloudinary)

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
- **Model Integration**: Gemini API

### 9.2 Data Flow

1. User sends message -> API
2. API saves user message to DB
3. API calls AI Model (Gemini)
4. API saves AI response to DB
5. API returns response to User

### 9.3 Optimization

- **Streaming**: Responses should be streamed to client (future enhancement).
- **History Context**: Limited recent messages sent to model to maintain context window.

---

## 10. Doctor Recommendation System (Enhanced)

### 10.1 Overview

Dynamically recommends doctors based on **Smart Symptom Intelligence**.

- **Storage**: Doctors table.
- **AI Engine**: Gemini (Advanced reasoning).

### 10.2 Workflow

1.  **Symptom Input**: Frontend collects symptoms (text or image).
2.  **Smart AI Analysis**: Backend sends data to Gemini with **JSON Mode**.
    - **Multi-symptom reasoning**
    - **Severity prediction** (Mild/Moderate/Emergency)
    - **Urgency Level**: 🟢 Mild, 🟡 Moderate, 🔴 Emergency
3.  **Classification**: AI returns valid specializations and reasoning.
4.  **Doctor Lookup**: Backend queries `Doctors` table filtering by specialization.
5.  **Ranking**: Doctors ranked by experience, availability, and user feedback.
6.  **Response**: List of doctors + AI Analysis returned.

### 10.3 Data Migration & Cleanup

1.  **Migrate Data**: Move `frontend/jsonData` (doctor profiles) to PostgreSQL `Doctors` table.
2.  **Remove Legacy**: Delete `symptoms_to_category.json` and client-side mapping logic.

---

## 11. Health Tools & History

### 11.1 Medicine & Prescription Analysis

- **Input**: Image (uploaded via Frontend)
- **Process**:
    1. Image uploaded to Cloudinary
    2. URL sent to AI (Gemini)
    3. AI analyzes image (OCR + Context)
    4. Result stored in `medicine_history` or `prescription_history`
- **Output**: Analysis result + Explainer returned.

### 11.2 Drug Interaction Check

- **Input**: List of medicine names
- **Process**:
    1. Backend sends list to AI
    2. AI determines interactions/contraindications
    3. Result stored in `drug_interaction_history`
- **Output**: Safety report returned.

### 11.3 Personal Health Dashboard

- **Purpose**: Centralized view of user's health data.
- **Data Sources**:
    - Chat history / Search history
    - Symptom analysis history
    - Medicine/Prescription history
- **Features**:
    - **Health Risk Score** (0-100) based on cumulative data.
    - **Trends**: "Most Frequent Issue", "Last Checked Symptoms".
    - **Emergency Mode**: One-click alert to contacts + First Aid info.

---

## 12. Advanced AI Features

### 12.1 Smart Symptom Intelligence

- **Input**: Symptoms, Duration, Severity
- **Output**: Possible conditions, Triage level (Home/Doctor/ER), Recommended Specialist.

### 12.2 Image-Based Symptom Detection

- **Input**: Photo of skin issue/visible symptom.
- **Process**: Cloudinary Upload -> Gemini Vision Analysis.
- **Output**: Preliminary analysis + Disclaimer.

### 12.3 AI Health Report Generator

- **Input**: User's recent history (symptoms, chats).
- **Output**: PDF Report with summary, possible causes, risk level, and suggested actions.

### 12.4 Multi-Language Support

- **Implementation**: AI translation layer for content + Frontend localization.
- **Languages**: English, Hindi, Regional (optional).

### 12.5 Preventive Health & Education

- **Disease Education Mode**: Detailed info on predicted diseases (Causes, Prevention, Diet).
- **Home Remedies**: AI-suggested safe home care advice for mild issues.
