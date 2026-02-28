# Niraksh-Guardian

<div align="center">
  <h3>AI-powered healthcare guidance for better health decisions</h3>
</div>

## 🌟 About the Project

Niraksh-Guardian is a pioneering, open-source healthcare platform designed to democratize access to instant medical insights. Bridging the gap between initial health uncertainty and professional medical care, it provides users with a safe, intelligent, and highly interactive environment to understand their health better.

Niraksh-Guardian acts as your personal health advocate—analyzing symptoms, decoding complex medical jargon, checking for dangerous drug interactions, and ultimately routing you to the most relevant healthcare professionals in your vicinity so you can easily take the right next steps.

## 🎯 Our Goal

The healthcare journey is often overwhelming, filled with medical jargon, generalized internet search results, and uncertainty about who to consult. Our goal is to solve the anxiety of the "unknown" by providing immediate, personalized, and actionable health clarity. We want to empower users to make informed decisions confidently, reduce the risk of accidental medication interactions, and ensure they reach the precise specialist they need without delay.

## 🚀 Innovative Features

- **🧠 Smart Symptom Intelligence:** Instead of matching broad keywords, our platform acts like a triage nurse. Tell it what you're experiencing, and it will analyze the combination of your symptoms to help identify possible conditions, assess how urgently you need care (Home Care vs. ER), and suggest the right specialist to see.
- **📸 Vision-Based Medical Analysis:** Medical documents are notoriously hard to read. You can seamlessly snap a photo of a confusing prescription, a medicine box, or even a visible skin concern, and the platform will instantly break down the contents into clear, easy-to-understand explanations.
- **⚠️ Drug-Drug Safety Checker:** Mixing medications can be dangerous. Our lifesaver tool allows you to input multiple medications and instantly receives easy-to-understand warnings about potential side effects or dangerous interactions before you take them.
- **🗺️ Intelligent Doctor Routing:** We don't just show you a list of doctors. Our system intelligently understands your unique medical symptoms, looks at your location, and finds the highest-rated specialists best equipped to handle your specific condition, ensuring you get the right care, faster.
- **📊 Comprehensive Health Dashboard:** Keeping track of health history is tedious. Your dashboard acts as a central hub that calculates a real-time Health Risk Score based on your ongoing conditions, maintains a visual timeline of your interactions, and can generate clean, summarized PDF reports to hand directly to your real-world doctor.

## 🏗️ Project Structure

This repository is organized as a monorepo containing both the frontend and backend applications.

```
Niraksh-Guardian/
├── frontend/               # Next.js 15 App Router application
├── backend/                # Node.js + Express API server
└── README.md               # Project overview (this file)
```

## 💻 Technology Stack

### Frontend

- Next.js 15 (App Router with RSC support)
- TypeScript
- Tailwind CSS v4 (CSS-first Design System)
- SWR (Client-side Data Fetching & Caching)
- React Hook Form + Zod (Rigorous Validation)

### Backend

- Node.js + Express
- TypeScript
- PostgreSQL (via Prisma ORM) + Redis
- Google Gemini API (AI Analysis & Vision)
- AWS SES/SNS (Bounced Email Handling) & Cloudinary (Assets)

## 🏁 Getting Started

To run the complete platform locally, you will need to start both the backend and frontend servers. Ensure you have `pnpm` installed.

### 1. Backend Setup

Follow the detailed instructions in the [Backend README](./backend/README.md) to install dependencies, configure environment variables, run migrations, and start the API server.

```bash
cd backend
pnpm install
pnpm prisma generate
pnpm prisma migrate dev
pnpm dev
```

### 2. Frontend Setup

Follow the instructions in the [Frontend README](./frontend/README.md) to configure the API URL and start the web application.

```bash
cd frontend
pnpm install
pnpm dev
```

## 📚 Documentation & Architecture

For a deeper dive into the architecture, design decisions, and data flows, please refer to our detailed core system documents:

- [Frontend System Design](./frontend/SYSTEM_DESIGN.md)
- [Frontend Web Flow](./frontend/WEB_FLOW.md)
- [Frontend Data Flow](./frontend/DATA_FLOW.md)
- [Backend System Design](./backend/SYSTEM_DESIGN.md)
- [Backend Database Schema](./backend/DATABASE_SCHEMA.md)

## 🤝 Contributing

Contributions are welcome! Please make sure to follow the established code conventions, include tests for new features, and update relevant documentation. We aim to keep the codebase innovative and highly performant.

## 📄 License

This project is licensed under the MIT License.
