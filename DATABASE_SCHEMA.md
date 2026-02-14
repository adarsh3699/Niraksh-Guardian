# Niraksh-Guardian Database Schema

## Overview

This document defines the database structure for the Niraksh-Guardian backend.

Database: PostgreSQL  
ORM: Prisma (recommended)  
Cache: Redis (for sessions, rate limiting, temporary storage)

All tokens stored in the database must be hashed before storage.

---

# 1. Users Table

Purpose:
Stores primary user account information.

Fields:

- id (UUID, Primary Key)
- email (VARCHAR, unique, indexed)
- password_hash (VARCHAR, nullable for OAuth users)
- name (VARCHAR)
- is_email_verified (BOOLEAN, default false)
- is_active (BOOLEAN, default true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP, nullable)
- gender (VARCHAR, nullable)
- language_preference (VARCHAR, default 'en') // New for Multi-language

Indexes:

- Unique index on email
- Index on created_at

---

# 2. OAuth Accounts Table

Purpose:
Stores external authentication provider data.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- provider (VARCHAR) // e.g., "google"
- provider_account_id (VARCHAR)
- created_at (TIMESTAMP)

Indexes:

- Unique composite index (provider, provider_account_id)
- Index on user_id

---

# 3. Refresh Tokens Table

Purpose:
Stores hashed refresh tokens for session management.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- token_hash (VARCHAR)
- expires_at (TIMESTAMP)
- revoked (BOOLEAN, default false)
- created_at (TIMESTAMP)

Indexes:

- Index on user_id
- Index on expires_at

---

# 4. Password Reset Tokens Table

Purpose:
Stores secure password reset tokens.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- token_hash (VARCHAR, unique)
- expires_at (TIMESTAMP)
- used (BOOLEAN, default false)
- created_at (TIMESTAMP)

Indexes:

- Index on user_id
- Index on expires_at

---

# 5. Patient Health Profile (New)

Purpose:
Stores calculated health metrics and emergency info.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- health_risk_score (INTEGER, 0-100)
- blood_group (VARCHAR, nullable)
- allergies (TEXT[], nullable)
- chronic_conditions (TEXT[], nullable)
- emergency_contact_name (VARCHAR, nullable)
- emergency_contact_phone (VARCHAR, nullable)
- emergency_contact_email (VARCHAR, nullable)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:

- Unique index on user_id

---

# 6. Redis Data Structure

Redis will store:

Rate Limits:

- key: rate:login:<ip>
- key: rate:reset:<ip>
- key: rate:reset:<email>

Token Blacklist:

- key: blacklist:<access_token>
- TTL matches token expiry

Emergency Alerts:

- key: emergency:<user_id>
- TTL 24h

---

# 7. Use & Chat History (Enhanced)

## 9.1 Chats Table

Purpose: Stores AI conversation sessions.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- title (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

## 9.2 Messages Table

Purpose: Stores individual messages.

Fields:

- id (UUID, Primary Key)
- chat_id (UUID, Foreign Key → chats.id)
- role (VARCHAR) // 'user' | 'model' | 'system'
- content (TEXT)
- created_at (TIMESTAMP)

---

# 10. AI & Health Tools History (Enhanced)

## 10.1 Medicine History Table

Purpose: Stores history of analyzed medicines.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- image_url (VARCHAR) // Cloudinary URL
- medicine_name (VARCHAR, nullable)
- analysis_result (JSON) // Detailed AI analysis
- created_at (TIMESTAMP)

## 10.2 Prescription History Table

Purpose: Stores history of analyzed prescriptions.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- image_url (VARCHAR) // Cloudinary URL
- extracted_text (TEXT)
- analysis_result (JSON) // Summary and details
- created_at (TIMESTAMP)

## 10.3 Drug Interaction History Table

Purpose: Stores history of drug-drug interaction checks.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- drugs (VARCHAR[]) // Array of drug names checked
- interaction_result (JSON) // Analysis result
- created_at (TIMESTAMP)

## 10.4 Symptom Analysis History (New)

Purpose: Stores history of Smart Symptom Intelligence checks.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- symptoms (TEXT[])
- image_url (VARCHAR, nullable) // For skin issues
- predicted_conditions (JSON) // List of diseases + probability
- urgency_level (VARCHAR) // Mild, Moderate, Emergency
- recommended_specialist (VARCHAR)
- created_at (TIMESTAMP)

---

# 11. Doctor Recommendation System

## 11.1 Doctors Table

Purpose: Stores doctor profiles.

Fields:

- id (UUID, Primary Key)
- name (VARCHAR)
- specialization (VARCHAR, indexed)
- experience_years (INTEGER)
- consultation_fee (INTEGER)
- location (VARCHAR)
- bio (TEXT)
- contact_info (VARCHAR)
- image_url (VARCHAR, nullable)
- is_available (BOOLEAN, default true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:

- Index on specialization
- Index on location

---

# 12. Generated Reports (New)

## 12.1 Health Reports Table

Purpose: Stores generated PDF health reports.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- report_url (VARCHAR) // Cloudinary/S3 URL
- summary (JSON)
- created_at (TIMESTAMP)
