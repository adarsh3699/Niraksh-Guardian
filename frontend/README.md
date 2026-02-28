# Niraksh-Guardian Frontend

The frontend for Niraksh-Guardian is a cutting-edge, responsive, and accessible web application designed to deliver our medical insights with zero friction. Built from the ground up for speed and usability, it provides users with an empathetic and interactive healthcare companion.

## 🌟 About the Frontend

When it comes to your health, every second of confusion counts. The frontend of Niraksh-Guardian is built to be an incredibly fast, calming, and professional interface that guides you seamlessly from your initial symptom search to securing a doctor recommendation. We focus on providing a frictionless, highly responsive experience across all devices, ensuring that crucial health information is always accessible and easy to digest right when you need it.

## 🎯 Our Goal

To eliminate the friction and anxiety commonly associated with digital healthcare tools. Users facing medical uncertainties shouldn't have to navigate clunky interfaces, endure slow loading screens, or struggle to understand what to do next. Our goal is to provide a seamless, highly intuitive interface that translates complex AI medical insights into clear, instantly understandable, and actionable steps.

## 🚀 Innovative Features

- **🌐 Instant Interface Responsiveness:** During moments of health stress, you need answers immediately. We’ve designed the interface to be blazing fast, ensuring that pages load instantly and there are zero frustrating layout shifts as you read important medical information.
- **🎨 Calming & Professional Design:** The platform utilizes a deeply thought-out, uniform design system. By maintaining strict consistency in colors, spacing, and typography, we provide a trustworthy, premium experience that reassures users they are in a safe environment.
- **⚡ Synchronized Health Timeline:** Your health data shouldn't exist in silos. Our platform ensures that if you upload a prescription or chat about a symptom, your personal health dashboard and timeline update instantaneously in the background, keeping all your information centralized without requiring page reloads.
- **📝 Empathetic AI Chat:** We provide a beautifully rendered, interactive chat interface that feels like talking to a dedicated health advocate. It supports attaching images directly into the chat and maintains conversational context, allowing for a natural flow of questions and answers.
- **🧩 Frictionless Tool Transitions:** Moving between different health tasks should be effortless. We’ve designed intelligent workflows—like seamlessly carrying the medications identified in a prescription scan directly into the Drug Interaction safety checker with a single click—saving you time and effort.

## 💻 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS v4
- **State & Data Fetching:** React Context, SWR
- **Forms & Validation:** React Hook Form + Zod
- **Icons & UI:** Lucide React, react-dropzone, next/font, next/image
- **Markdown Rendering:** react-markdown + remark-gfm

## 🏁 Getting Started

### Prerequisites

- Node.js (v20+)
- Backend API running locally or accessible remotely
- pnpm

### Installation

1. Navigate to the frontend directory:

   ```bash
   cd frontend
   pnpm install
   ```

2. Environment Variables:
   Create a `.env.local` file based on the provided examples:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
   ```

3. Start the Development Server:
   ```bash
   pnpm dev
   ```
   The application will be available at `http://localhost:3000`.

## 📚 Architecture Overview

For a detailed breakdown of our React Server Components boundary strategy, data flow, page architecture, and performance optimizations, please refer to the following documents:

- [Frontend System Design](./SYSTEM_DESIGN.md)
- [Frontend Web Flow](./WEB_FLOW.md)
- [Frontend Data Flow](./DATA_FLOW.md)

## 🛠️ Scripts

- `pnpm dev`: Starts the development server
- `pnpm build`: Builds the application for production
- `pnpm start`: Starts the production server
- `pnpm lint`: Runs ESLint checks
- `pnpm clean`: Cleans generated build files and node_modules
