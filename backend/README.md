# Niraksh-Guardian Backend

The backend of Niraksh-Guardian serves as the robust intelligence engine of the platform. It handles complex AI orchestrations, secure data persistence, and high-performance caching to seamlessly support real-time medical insights and doctor recommendation routing.

## 🌟 About the Backend

The backend is built as the trustworthy foundation of the Niraksh-Guardian ecosystem. It is responsible for taking user uncertainties—whether it’s a confusing list of symptoms, a photo of a pill bottle, or a complex medical history—and orchestrating the necessary steps to provide clear, actionable guidance. We prioritize data security, rapid response times, and highly accurate analysis above all else.

## 🎯 Our Goal

To solve the challenge of accurately and securely interpreting fragmented personal health data at scale. We aim to build a resilient, highly available data layer that bridges the gap between the user’s immediate health queries and the complex AI processing required to answer them, ensuring every patient receives their insights without delay and without compromising their privacy.

## 🚀 Innovative Features

- **🧠 Multi-Modal Analysis Orchestration:** Users communicate their health issues in many ways. The backend seamlessly interprets paragraphs of text, lists of symptoms, or uploaded images of medical documents, ensuring out API handles any input type and translates it into a unified, understandable health report.
- **⚡ Lightning Fast Medical Insights:** Waiting for medical answers can be stressful. We've implemented advanced caching systems so that insights on common diseases and conditions are delivered to users almost instantaneously, skipping the delay of manual processing.
- **🛡️ Unshakeable Platform Reliability:** A healthcare tool must be available when needed most. Our infrastructure is designed so that even if certain background systems experience disruptions, critical path features remain entirely online and accessible to users.
- **🗺️ Intelligent Matchmaking Engine:** Finding the right doctor is often trial and error. Our dynamic ranking system takes the guesswork out of the process by scoring doctors against your specific, AI-extracted medical needs and your geographic location, ensuring the highest quality, most relevant care pairing.
- **📄 Centralized Patient Portfolios:** Managing disparate medical documents is difficult. The backend automatically organizes all your AI chats, pill safety checks, and symptom analyses into a comprehensive timeline, capable of compiling this entire history into a clean, easy-to-read PDF report you can hand to a physician.
- **📧 Proactive Communication Safety:** Ensuring users receive critical notifications like password resets without fail, utilizing automated monitoring systems to safeguard deliverability across the platform.

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
    PORT=8080
    DATABASE_URL=postgresql://user:password@localhost:5432/niraksh
    REDIS_URL=redis://localhost:6379
    JWT_SECRET=your_jwt_secret
    # Add other required keys for AWS, Cloudinary, and Gemini
    ```

3. Database Setup:

    ```bash
    pnpm prisma generate
    pnpm prisma migrate dev
    ```

4. Start the Server:
    ```bash
    pnpm dev
    ```
    The API will be available at `http://localhost:8080` (or your defined PORT).

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
