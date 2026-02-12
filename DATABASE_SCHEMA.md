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
- is_email_verified (BOOLEAN, default false)
- is_active (BOOLEAN, default true)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- last_login (TIMESTAMP, nullable)
- gender (VARCHAR, nullable)

Indexes:

- Unique index on email
- Index on created_at

Notes:

- password_hash is NULL for Google OAuth users.
- is_active becomes false if SES bounce/complaint detected.

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

Notes:

- One user may have multiple OAuth accounts.

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

Important:

- Store only hashed refresh tokens.
- Rotate refresh tokens on every refresh request.
- Mark revoked = true on logout.

---

# 4. Password Reset Tokens Table

Purpose:
Stores secure password reset tokens.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- token_hash (VARCHAR)
- expires_at (TIMESTAMP)
- used (BOOLEAN, default false)
- created_at (TIMESTAMP)

Indexes:

- Index on user_id
- Index on expires_at

Security Rules:

- Token must expire within 15–30 minutes.
- Mark used = true after successful reset.
- Delete expired tokens periodically.

---

# 5. Email Suppression Table (Optional but Recommended)

Purpose:
Prevents sending email to problematic addresses.

Fields:

- id (UUID, Primary Key)
- email (VARCHAR, unique)
- reason (VARCHAR) // bounce | complaint
- created_at (TIMESTAMP)

Indexes:

- Unique index on email

Triggered by:

- AWS SES SNS webhook events.

---

# 6. Redis Data Structure

Redis will store:

Rate Limits:

- key: rate:login:<ip>
- key: rate:reset:<ip>
- key: rate:reset:<email>

TTL-based expiration.

Token Blacklist:

- key: blacklist:<access_token_id>
- TTL matches token expiry

Temporary Lockouts:

- key: lock:user:<id>
- TTL-based block

---

# 7. Relationships Summary

users (1) → (many) refresh_tokens  
users (1) → (many) oauth_accounts  
users (1) → (many) password_reset_tokens

All foreign keys must use ON DELETE CASCADE.

---

# 8. Security Constraints

- UUID for all primary keys
- Hash all tokens before storage
- Never store raw reset tokens
- Add DB-level unique constraints
- Add proper indexing

---

# 9. Chat System (Ported from Legacy)

## 9.1 Chats Table

Purpose:
Stores conversation history.

Fields:

- id (UUID, Primary Key)
- user_id (UUID, Foreign Key → users.id)
- title (VARCHAR)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Indexes:

- Index on user_id
- Index on created_at

## 9.2 Messages Table

Purpose:
Stores individual messages within a chat.

Fields:

- id (UUID, Primary Key)
- chat_id (UUID, Foreign Key → chats.id)
- role (VARCHAR) // 'user' | 'model' | 'system'
- content (TEXT)
- created_at (TIMESTAMP)

Indexes:

- Index on chat_id
- Index on created_at

---

# 10. Users Table Updates (Legacy Support)

Add to Users Table:

- gender (VARCHAR, nullable)
- last_login (TIMESTAMP, nullable)
