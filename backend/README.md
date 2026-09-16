# Niraksh-Guardian Backend

The backend of Niraksh-Guardian serves as the robust intelligence engine of the platform. It handles complex AI orchestrations, secure data persistence, and high-performance caching to seamlessly support real-time medical insights and doctor recommendation routing.

## 🌟 About the Backend

The backend is built as the trustworthy foundation of the Niraksh-Guardian ecosystem. It is responsible for taking user uncertainties—whether it’s a confusing list of symptoms, a photo of a pill bottle, or a complex medical history—and orchestrating the necessary steps to provide clear, actionable guidance. We prioritize data security, rapid response times, and highly accurate analysis above all else.

## 🎯 Our Goal

To solve the challenge of accurately and securely interpreting fragmented personal health data at scale. We aim to build a resilient, highly available data layer that bridges the gap between the user’s immediate health queries and the complex AI processing required to answer them, ensuring every patient receives their insights without delay and without compromising their privacy.

## 🚀 Innovative Features

- **🧠 Multi-Modal Analysis Orchestration:** The backend accepts symptoms, free-form chat, prescriptions, medicine images, and lab reports, then turns them into structured health outputs.
- **📡 Real-Time Streaming Workflows:** Chat responses and lab report processing can stream progress updates so users see results as they are generated.
- **💊 Personalized Safety Checks:** Drug interaction analysis considers the user's current medicines and recent medication history, not just a single input list.
- **🗺️ Intelligent Matchmaking Engine:** Doctor recommendations are ranked by symptoms, condition tags, location, rating, experience, and fees for better matching.
- **📚 Medical Knowledge & Research Layer:** Disease information, research paper lookup, and symptom summaries support clearer health education and referral.
- **📄 Centralized Patient Portfolios:** Health summaries, generated reports, and lab report history are stored together so users and doctors can review a complete timeline.
- **📧 Proactive Communication Safety:** SES event handling and delivery monitoring help keep critical email notifications reliable.
- **🌐 Language-Aware Health Context:** User language preference is stored so the platform can keep conversational and UI flows more accessible.

## 💻 Tech Stack

- **Framework:** Express.js + Node.js
- **Language:** TypeScript
- **Database:** PostgreSQL (via Prisma ORM), Redis
- **AI Integration:** Google GenAI / Gemini API (JSON Mode & Vision)
- **Cloud Services:** AWS SES/SNS (Email), Cloudinary (Images & PDFs)
- **Validation:** Zod
- **Security:** Helmet, CORS, bcrypt, jsonwebtoken

## 🏁 Getting Started

### Prerequisites

- Node.js (v20+)
- PostgreSQL
- Redis
- AWS Account (SES setup)
- Cloudinary Account
- Google Gemini API Key
- Google OAuth Client ID/Secret
- pnpm

### Installation

1. Clone the repository and navigate to the backend directory:

    ```bash
    cd backend
    pnpm install
    ```

2. Environment Variables:
   Create a `.env` file based on `.env.example` and fill in your credentials:

    ```env
    PORT=4000
    DATABASE_URL=postgresql://user:password@localhost:5432/niraksh_guardian?schema=public
    # Set this separately when DATABASE_URL is a Prisma Accelerate URL.
    DIRECT_DATABASE_URL=postgresql://user:password@localhost:5432/niraksh_guardian?schema=public
    REDIS_URL=redis://localhost:6379
    JWT_SECRET=your_jwt_secret
    # Add other required keys for AWS, Cloudinary, and Gemini
    ```

3. Database Setup:

    ```bash
    pnpm install
    pnpm prisma generate
    pnpm prisma:migrate
    pnpm seed
    ```

    For a production database, use `pnpm prisma:deploy` instead of
    `pnpm prisma:migrate`. If `DATABASE_URL` uses Prisma Accelerate, set
    `DIRECT_DATABASE_URL` to the direct PostgreSQL connection string first.

4. Start the Server:
    ```bash
    pnpm dev
    ```
    The API will be available at `http://localhost:4000` (or your defined PORT).

## 📚 Architecture Overview

Dive deeper into our backend architecture, database schemas, and AI engineering patterns:

- [Backend System Design](./SYSTEM_DESIGN.md)
- [Database Schema Guide](./DATABASE_SCHEMA.md)

## 🛠️ Scripts

- `pnpm dev`: Starts the development server with nodemon
- `pnpm build`: Compiles TypeScript to JavaScript
- `pnpm start`: Runs the built application
- `pnpm lint`: Runs ESLint
- `pnpm format`: Runs Prettier
- `pnpm prisma:migrate`: Runs Prisma migrations
- `pnpm seed`: Seeds the database with initial data
