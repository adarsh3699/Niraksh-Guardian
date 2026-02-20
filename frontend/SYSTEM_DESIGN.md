# Niraksh-Guardian Frontend — System Design

## 1. Overview

This document describes the complete frontend architecture for Niraksh-Guardian, rebuilt from scratch using **Next.js 15 (App Router)** with **TypeScript** and **Tailwind CSS v4**.

The frontend replaces the legacy React + Vite SPA with a modern, **uniform, and professional** design built on a single source-of-truth color palette defined in `globals.css` via Tailwind CSS v4 `@theme` tokens. The goal is a cohesive, polished experience — not a pixel-perfect clone of the old UI.

### Design Principles

- **Single color palette** — All colors come from `globals.css` `@theme` tokens. No hardcoded hex values in components.
- **Uniform & professional** — Consistent spacing, typography, border-radii, and shadows across every page and component
- **Server-first rendering** — RSC (React Server Components) by default, `'use client'` only when needed
- **Performance-obsessed** — No waterfalls, minimal bundle, streaming with Suspense
- **Accessible by default** — Semantic HTML, keyboard navigation, ARIA support
- **Mobile-first responsive** — Breakpoints at `sm` (640px), `md` (768px), `lg` (1024px)
- **Type-safe end-to-end** — TypeScript everywhere, Zod validation on forms

---

## 2. Tech Stack

| Layer                  | Technology                      | Why                                                        |
| ---------------------- | ------------------------------- | ---------------------------------------------------------- |
| Framework              | Next.js 15 (App Router)         | RSC, streaming, file-based routing, built-in optimizations |
| Language               | TypeScript 5.x                  | Type safety, better DX, catch bugs at compile time         |
| Styling                | Tailwind CSS v4                 | CSS-first config, design tokens via `@theme`, zero runtime |
| State (Server)         | React Server Components         | Data fetching at the component level, zero client JS       |
| State (Client)         | React Context + `useState`      | Lightweight, no external deps for auth/toast state         |
| Data Fetching (Client) | SWR                             | Request deduplication, caching, revalidation               |
| Forms                  | React Hook Form + Zod           | Performant forms with schema validation                    |
| Markdown               | `react-markdown` + `remark-gfm` | Render AI chat responses                                   |
| File Upload            | `react-dropzone`                | Drag-and-drop prescription/medicine image uploads          |
| Auth (Google)          | `@react-oauth/google`           | Official Google OAuth React SDK                            |
| Icons                  | `lucide-react`                  | Tree-shakable, consistent icon set                         |
| Fonts                  | `next/font`                     | Zero-CLS font loading, self-hosted Google Fonts            |
| Images                 | `next/image`                    | Automatic optimization, lazy loading, blur placeholders    |
| Animations             | CSS transitions + Tailwind      | No runtime animation library overhead                      |
| Linting                | ESLint + Prettier               | Code quality and formatting consistency                    |

---

## 3. High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Server Components (RSC)                 │ │
│  │  - Layout shells, page wrappers, metadata           │ │
│  │  - Static content (About, Home hero, Footer)        │ │
│  │  - SEO metadata generation                          │ │
│  └──────────────────┬──────────────────────────────────┘ │
│                     │                                    │
│  ┌──────────────────▼──────────────────────────────────┐ │
│  │            Client Components ('use client')          │ │
│  │  - Auth forms, Chat UI, File uploads                │ │
│  │  - Interactive search, Doctor filters               │ │
│  │  - Toast notifications, Dialogs                     │ │
│  └──────────────────┬──────────────────────────────────┘ │
│                     │                                    │
│  ┌──────────────────▼──────────────────────────────────┐ │
│  │              API Integration Layer                   │ │
│  │  - Centralized fetch with auth headers              │ │
│  │  - Automatic token refresh                          │ │
│  │  - SWR for client-side caching                      │ │
│  └──────────────────┬──────────────────────────────────┘ │
│                     │                                    │
└─────────────────────┼────────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │   Backend API (Express) │
        │   Vercel Serverless     │
        │   /api/auth, /api/chats │
        │   /api/doctors, /api/ai │
        └─────────────────────────┘
```

---

## 4. Project Structure

```
frontend_new/
├── public/
│   ├── images/                    # Static images (brand logos, illustrations)
│   │   ├── diseases/              # Disease card SVG icons
│   │   └── icons/                 # UI icons (search, menu, etc.)
│   └── favicon.ico
│
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx             # Root layout (fonts, providers, navbar, footer)
│   │   ├── page.tsx               # HomePage (RSC — hero, disease cards, CTAs)
│   │   ├── not-found.tsx          # Custom 404 page
│   │   ├── error.tsx              # Global error boundary
│   │   ├── loading.tsx            # Root loading fallback
│   │   ├── globals.css            # Tailwind v4 imports + @theme tokens
│   │   │
│   │   ├── (auth)/                # Auth route group (no layout nesting)
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   │
│   │   ├── (protected)/           # Auth-guarded route group
│   │   │   ├── layout.tsx         # AuthGuard wrapper
│   │   │   ├── assistance/page.tsx
│   │   │   ├── prescription/page.tsx
│   │   │   ├── medicine/page.tsx
│   │   │   ├── drug-interaction/page.tsx
│   │   │   ├── doctor-suggest/page.tsx
│   │   │   ├── disease/page.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   └── reports/page.tsx
│   │   │
│   │   └── about/page.tsx         # About page (RSC — static)
│   │
│   ├── components/
│   │   ├── layout/                # Layout components
│   │   │   ├── Navbar.tsx         # Responsive navbar (desktop/mobile)
│   │   │   ├── MobileMenu.tsx     # Slide-in mobile drawer
│   │   │   └── Footer.tsx         # Site footer
│   │   │
│   │   ├── home/                  # HomePage sections
│   │   │   ├── HeroSection.tsx    # Hero banner + symptom search
│   │   │   ├── DiseaseCards.tsx   # Disease grid cards
│   │   │   └── DoMoreCards.tsx    # CTA cards (Prescription, Drug Interaction)
│   │   │
│   │   ├── auth/                  # Auth form components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── SignupForm.tsx
│   │   │   ├── ForgotPasswordForm.tsx
│   │   │   ├── ResetPasswordForm.tsx
│   │   │   └── GoogleAuthButton.tsx
│   │   │
│   │   ├── chat/                  # Chat/Assistance components
│   │   │   ├── ChatSidebar.tsx    # Chat history sidebar
│   │   │   ├── ChatWindow.tsx     # Message list + input
│   │   │   ├── ChatMessage.tsx    # Individual message bubble
│   │   │   └── QuickSymptoms.tsx  # Quick symptom chips
│   │   │
│   │   ├── doctor/                # Doctor suggestion components
│   │   │   ├── DoctorSearch.tsx   # Search form + symptom input
│   │   │   ├── DoctorCard.tsx     # Individual doctor card
│   │   │   └── DoctorFilters.tsx  # Specialization/location filters
│   │   │
│   │   ├── dashboard/             # User Dashboard components
│   │   │   ├── RiskScoreCard.tsx   # Health risk score gauge
│   │   │   ├── RecentActivity.tsx  # Recent symptom/medicine analyses
│   │   │   ├── QuickActions.tsx    # Quick links to health tools
│   │   │   └── HealthSummary.tsx   # Health profile summary
│   │   │
│   │   ├── health-tools/          # Medicine, Prescription, Drug Interaction
│   │   │   ├── FileUploadZone.tsx # Reusable dropzone component
│   │   │   ├── AnalysisResult.tsx # AI analysis result renderer
│   │   │   └── MedicineCard.tsx   # Medicine info card
│   │   │
│   │   └── ui/                    # Shared UI primitives
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Card.tsx
│   │       ├── Dialog.tsx         # Modal dialog
│   │       ├── Toast.tsx          # Toast notification
│   │       ├── Spinner.tsx        # Loading spinner
│   │       ├── Badge.tsx
│   │       └── Skeleton.tsx       # Loading skeleton
│   │
│   ├── lib/                       # Utilities & configuration
│   │   ├── api.ts                 # Centralized API client (fetch + auth + refresh)
│   │   ├── auth.ts                # Auth token management (localStorage)
│   │   ├── constants.ts           # App-wide constants
│   │   ├── utils.ts               # General utility functions
│   │   └── validations.ts         # Zod schemas (shared with forms)
│   │
│   ├── hooks/                     # Custom React hooks
│   │   ├── useAuth.ts             # Auth state + token refresh
│   │   ├── useToast.ts            # Toast notification state
│   │   ├── useMediaQuery.ts       # Responsive breakpoint detection
│   │   └── useDebounce.ts         # Debounced value hook
│   │
│   ├── contexts/                  # React Context providers
│   │   ├── AuthProvider.tsx       # Auth context (wraps app)
│   │   └── ToastProvider.tsx      # Toast context (wraps app)
│   │
│   └── types/                     # TypeScript type definitions
│       ├── api.ts                 # API response types
│       ├── chat.ts                # Chat & Message types
│       ├── doctor.ts              # Doctor types
│       ├── auth.ts                # Auth types (User, Tokens)
│       ├── health.ts              # Health profile, history types
│       └── report.ts              # Health report types
│
├── next.config.ts                 # Next.js configuration
├── tailwind.config.ts             # Tailwind v4 config (minimal, CSS-first)
├── tsconfig.json                  # TypeScript configuration
├── eslint.config.mjs              # ESLint flat config
├── package.json
└── .env.local                     # Environment variables
```

---

## 5. Design System & Theme

### 5.1 Color Palette

Preserving the existing brand identity with Tailwind CSS v4 `@theme` tokens:

```css
@import "tailwindcss";

@theme {
	/* Primary — Teal (brand color) */
	--color-primary: oklch(60.21% 0.0739 202.5); /* #448e94 */
	--color-primary-light: oklch(70.91% 0.0864 183.9); /* #5cb3a7 */
	--color-primary-foreground: oklch(100% 0 0); /* #ffffff */

	/* Accent — Orange (CTAs, buttons) */
	--color-accent: oklch(70.49% 0.1867 47.6); /* #f97316 */
	--color-accent-light: oklch(75.77% 0.159 55.9); /* #fb923c */
	--color-accent-foreground: oklch(100% 0 0); /* #ffffff */

	/* Highlight — Red (emergency, hero emphasis) */
	--color-highlight: oklch(68.36% 0.2051 24); /* #ff5657 */

	/* Info — Blue/Indigo (chat, recommendations) */
	--color-info: oklch(62.31% 0.1881 259.8); /* #3b82f6 */
	--color-info-dark: oklch(51.06% 0.2301 277); /* #4f46e5 */

	/* Semantic */
	--color-success: oklch(67.31% 0.1624 144.2); /* #4caf50 */
	--color-warning: oklch(76.86% 0.1646 70.1); /* #f59e0b */
	--color-destructive: oklch(64.27% 0.2153 28.8); /* #f44336 */

	/* Neutrals */
	--color-background: oklch(98.46% 0.0018 248.6); /* #f9fafb */
	--color-surface: oklch(100% 0 0); /* #ffffff */
	--color-foreground: oklch(24.78% 0 0); /* #212121 */
	--color-muted: oklch(56.24% 0 0); /* #757575 */
	--color-border: oklch(92.76% 0.0059 264.5); /* #e5e7eb */

	/* Radius */
	--radius-sm: 0.375rem; /* 6px */
	--radius-md: 0.5rem; /* 8px */
	--radius-lg: 0.75rem; /* 12px */
	--radius-xl: 1rem; /* 16px */
	--radius-full: 9999px; /* pill */

	/* Shadows */
	--shadow-card: 0 4px 12px oklch(0% 0 0 / 0.05);
	--shadow-card-hover: 0 10px 25px oklch(0% 0 0 / 0.08);
	--shadow-dropdown: 0 10px 30px oklch(0% 0 0 / 0.12);
}

/* Dark mode variant */
@custom-variant dark (&:where(.dark, .dark *));
```

### 5.2 Typography

Using `next/font` for zero-CLS font loading:

| Role               | Font                  | Usage                            |
| ------------------ | --------------------- | -------------------------------- |
| Display & Headings | Poppins (600, 700)    | Page titles, section headings    |
| Body               | Inter (400, 500, 600) | Paragraphs, form labels, UI text |
| Monospace          | JetBrains Mono (400)  | Code blocks, AI responses        |

### 5.3 Component Patterns

#### Card Pattern

- White background, `border` subtle, `rounded-lg`, `shadow-card`
- Hover: `translateY(-2px)`, `shadow-card-hover`, smooth 200ms transition
- Consistent `p-6` padding

#### Button Variants

| Variant     | Style                                                          |
| ----------- | -------------------------------------------------------------- |
| Primary     | Solid teal background, white text                              |
| Accent      | Gradient orange `linear-gradient(90deg, accent, accent-light)` |
| Outline     | Border only, transparent background                            |
| Ghost       | No border, hover background                                    |
| Destructive | Red background for delete actions                              |

#### Form Inputs

- Rounded-md border, `focus:ring-2 ring-primary`, 200ms transition
- Error state: `border-destructive`, error message below
- Consistent `h-11` height

### 5.4 Design Consistency Rules

> All visual styling derives from the `@theme` tokens in `globals.css`. No hardcoded hex, rgb, or oklch values in component files.

| Rule          | Convention                                                                                |
| ------------- | ----------------------------------------------------------------------------------------- |
| Colors        | Use only Tailwind token classes (`text-primary`, `bg-accent`, `border-destructive`, etc.) |
| Spacing       | Tailwind spacing scale (`p-4`, `gap-6`, `mt-8`) — consistent across all pages             |
| Border radius | `rounded-md` (inputs) → `rounded-lg` (cards) → `rounded-full` (buttons, pills)            |
| Shadows       | `shadow-card` (resting) → `shadow-card-hover` (hover) → `shadow-dropdown` (overlays)      |
| Transitions   | `transition-all duration-200` default; `duration-300` for overlays/menus                  |
| Hover lift    | `hover:-translate-y-0.5` (subtle) on cards and interactive elements                       |
| Max width     | `max-w-7xl` (1280px) centered with `mx-auto px-4 sm:px-6 lg:px-8`                         |

---

## 6. RSC Boundary Strategy

### Server Components (default — no directive)

- Root layout, page layouts
- HomePage sections (HeroSection, DiseaseCards, DoMore — static content)
- About page (fully static)
- Footer (static links)
- Metadata generation

### Client Components (`'use client'`)

- **Auth forms** — Login, Signup, ForgotPassword (form state, API calls)
- **Navbar** — Active link detection (`usePathname`), mobile menu toggle
- **Chat/Assistance** — Real-time messaging, sidebar interaction
- **File uploads** — Dropzone, preview, progress state
- **Doctor search** — Filter controls, search input, pagination
- **Health tools** — Medicine search, prescription explainer, drug interaction
- **Providers** — AuthProvider, ToastProvider
- **UI primitives** — Dialog, Toast (portal-based)

### Boundary Guidelines

1. Push `'use client'` as deep as possible — wrap only the interactive leaf
2. Pass server-fetched data as props to client components (serializable only)
3. Use Suspense boundaries around async server components for streaming
4. Never import server-only modules in client components

---

## 7. Data Flow & API Integration

### 7.1 API Client (`lib/api.ts`)

Centralized fetch wrapper with:

```typescript
// Simplified API client pattern
async function apiClient<T>(
	endpoint: string,
	options?: { method?: string; body?: unknown; isFile?: boolean },
): Promise<ApiResponse<T>>;
```

**Features:**

- Base URL from `NEXT_PUBLIC_API_URL` environment variable
- Automatic `Authorization: Bearer <token>` header injection
- Pre-flight token expiry check → auto-refresh if expired
- File upload mode (FormData, no Content-Type header)
- Typed responses with generics
- 401 handling → clear tokens, redirect to login

### 7.2 Client-Side Data Fetching

Use **SWR** for data that needs client-side caching and revalidation:

```typescript
// Example: Chat list with SWR
const { data: chats, mutate } = useSWR("/api/chats", fetcher, {
	revalidateOnFocus: false,
	dedupingInterval: 5000,
});
```

**SWR usage:**

- Chat list (auto-refresh after create/delete)
- Doctor search results (cache by query params)
- Health history lists
- Profile data

### 7.3 Cross-Page Data Flow

Replace `sessionStorage` with URL search params + Next.js navigation:

| Old Pattern                                         | New Pattern                                      |
| --------------------------------------------------- | ------------------------------------------------ |
| `sessionStorage.setItem('homeSearchSymptoms', ...)` | `router.push('/doctor-suggest?symptoms=...')`    |
| `sessionStorage.setItem('selectedMedicines', ...)`  | `router.push('/drug-interaction?medicines=...')` |
| `sessionStorage.setItem('symptomSummary', ...)`     | URL search params                                |

---

## 8. Authentication Architecture

### 8.1 Token Storage

- **Access token** → `localStorage` (`JWT_token`)
- **Refresh token** → `localStorage` (`refresh_token`)
- **User details** → `localStorage` (`user_details`)

### 8.2 Auth Context

```typescript
interface AuthContextType {
	isAuthenticated: boolean;
	user: UserProfile | null;
	isLoading: boolean;
	login: (tokens: Tokens, user: UserProfile) => void;
	logout: () => Promise<void>;
	refreshAuth: () => Promise<boolean>;
}
```

### 8.3 Route Protection

Protected routes use a **route group layout** `(protected)/layout.tsx`:

```typescript
// app/(protected)/layout.tsx
"use client";
export default function ProtectedLayout({ children }) {
	const { isAuthenticated, isLoading } = useAuth();
	// Show loading → redirect to /login with returnUrl if not authenticated
}
```

### 8.4 Google OAuth

Use `@react-oauth/google` with the `GoogleOAuthProvider`:

- Wrap app in `<GoogleOAuthProvider clientId={...}>`
- Use `<GoogleLogin>` component on login page
- Send `idToken` to `POST /api/auth/google`

### 8.5 Auth Response Shape (all auth endpoints)

All successful auth responses (signup, login, google) return:

```json
{
	"message": "string",
	"user": { "id": "uuid", "email": "string", "name": "string|null", "gender": "string|null" },
	"tokens": { "accessToken": "JWT", "refreshToken": "JWT" }
}
```

**Note:** `refreshToken` response (token refresh) is flat: `{ accessToken, refreshToken }` — NOT wrapped in `tokens`.

### 8.6 Profile Response Shape

`GET /api/profile` returns **both** user data and health profile:

```json
{
	"user": {
		"id": "uuid",
		"email": "string",
		"name": "string|null",
		"gender": "string|null",
		"languagePreference": "string|null"
	},
	"healthProfile": {
		"id": "uuid",
		"bloodGroup": "string|null",
		"allergies": ["string"],
		"chronicConditions": ["string"],
		"emergencyContactName": "string|null",
		"emergencyContactPhone": "string|null",
		"emergencyContactEmail": "string|null",
		"healthRiskScore": 0,
		"createdAt": "ISO datetime",
		"updatedAt": "ISO datetime"
	}
}
```

`PUT /api/profile` accepts user-level fields (`name`, `gender`, `languagePreference`) + health fields in a single request.

### 8.7 Doctor Search Response Shape

`GET /api/doctors?...` returns a **paginated wrapper** (not a flat array):

```json
{
	"data": [
		{
			"id": "uuid",
			"name": "string",
			"email": "string",
			"phone": "string|null",
			"imageUrl": "string|null",
			"specialization": "string",
			"qualification": "string|null",
			"experienceYears": 10,
			"rating": 4.5,
			"consultationFee": 500,
			"city": "string",
			"state": "string",
			"bio": "string|null",
			"createdAt": "ISO datetime"
		}
	],
	"meta": {
		"total": 42,
		"page": 1,
		"limit": 12,
		"pages": 4
	}
}
```

**Important:** Access doctors via `response.data`, pagination via `response.meta`.

### 8.8 History Response Shapes

All history GETs return arrays sorted by `createdAt` DESC, no pagination:

| Endpoint                        | Response Fields                                                                                                      |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `GET /api/history/medicine`     | `[{ id, userId, imageUrl, medicineName, analysisResult (JSON), createdAt }]`                                         |
| `GET /api/history/prescription` | `[{ id, userId, imageUrl, extractedText, analysisResult (JSON), createdAt }]`                                        |
| `GET /api/history/interaction`  | `[{ id, userId, drugs[], interactionResult (JSON), createdAt }]`                                                     |
| `GET /api/history/symptom`      | `[{ id, userId, symptoms[], imageUrl, predictedConditions (JSON), urgencyLevel, recommendedSpecialist, createdAt }]` |
| `DELETE /api/history/:type/:id` | `{ message: "Record deleted successfully" }`                                                                         |

> **Symptom field name mapping:** Fresh `POST /api/ai/analyze` returns `possibleConditions` and `urgency` from AI. The history record stores them as `predictedConditions` and `urgencyLevel`. Fields `severity`, `reasoning`, and `homeRemedies` are NOT persisted in history.

### 8.9 Summarize Symptoms Response Shape

| Endpoint                          | Response Shape                                            |
| --------------------------------- | --------------------------------------------------------- |
| `POST /api/ai/summarize-symptoms` | `{ summary: string, status: "success" \| "non_medical" }` |

- **Request:** `{ chatId: string }` (JSON body, auth required)
- **Flow:** Fetches all messages from the given chat, extracts user messages, sends to Gemini AI for medical symptom summarization.
- **`status: "success"`** — AI produced a valid medical symptom summary for doctor referral.
- **`status: "non_medical"`** — The conversation contains no medical symptoms or health concerns.
- **Error cases:** `404` if chat not found or not owned by user, `400` if chat has no messages.

---

## 9. Page Architecture

### 9.1 HomePage (`/`)

**Type:** Server Component (static content)

```
┌─────────────────────────────────────────┐
│  Navbar (Client — active link state)    │
├─────────────────────────────────────────┤
│  HeroSection (Client — search input)    │
│  ┌─────────────────────────────────┐    │
│  │ "Find the best doctor based on  │    │
│  │  your symptoms"                 │    │
│  │  [Search input] [Search button] │    │
│  └─────────────────────────────────┘    │
├─────────────────────────────────────────┤
│  DiseaseCards (Server — static grid)    │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐  │
│  │ C │ │ D │ │ H │ │ M │ │ C │ │ H │  │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘  │
├─────────────────────────────────────────┤
│  DoMoreCards (Server — static CTAs)     │
│  ┌──────────────┐ ┌──────────────┐     │
│  │ Prescription │ │ Drug-Drug    │     │
│  │ Explainer    │ │ Interaction  │     │
│  └──────────────┘ └──────────────┘     │
├─────────────────────────────────────────┤
│  Footer (Server — static)              │
└─────────────────────────────────────────┘
```

### 9.2 Assistance / Chat (`/assistance`)

**Type:** Client Component (real-time interaction)

```
┌──────────────────────────────────────────────┐
│  Chat Header (gradient blue #3b82f6→#4f46e5) │
├──────────┬───────────────────────────────────┤
│ Sidebar  │  Chat Window                      │
│ ┌──────┐ │  ┌─────────────────────────────┐  │
│ │ New  │ │  │ AI: How can I help?         │  │
│ │ Chat │ │  │ User: I have a headache     │  │
│ ├──────┤ │  │ AI: I understand...         │  │
│ │ Chat1│ │  │                             │  │
│ │ Chat2│ │  │                             │  │
│ │ Chat3│ │  ├─────────────────────────────┤  │
│ └──────┘ │  │ Quick Symptoms chips        │  │
│          │  │ [Input field] [Send] [📷]   │  │
│          │  └─────────────────────────────┘  │
└──────────┴───────────────────────────────────┘
```

### 9.3 Doctor Suggest (`/doctor-suggest`)

**Type:** Client Component (search + filters + API)

```
┌──────────────────────────────────────────┐
│  Symptom input (text + optional image 📷)│
│  [Analyze Symptoms button]               │
├──────────────────────────────────────────┤
│  AI Analysis Result                      │
│  Severity: 🟡 Moderate                   │
│  Conditions: Migraine, Tension Headache  │
│  Specialist: Neurologist                 │
│  Home Remedies: Rest, hydration          │
├──────────────────────────────────────────┤
│  Filters:                                │
│  [Specialization ▾] [City] [State]       │
│  [Min Fee] [Max Fee]                     │
│  [Sort by ▾] [Order ▾]                  │
├──────────────────────────────────────────┤
│  Doctor Cards Grid (sorted by relevance) │
│  ┌────────────┐ ┌────────────┐          │
│  │ 🖼 Dr. A   │ │ 🖼 Dr. B   │          │
│  │ Neurologist│ │ Neurologist│          │
│  │ 📍 Near You│ │            │          │
│  │ MBBS, MD   │ │ MBBS       │          │
│  │ ⭐ 4.5    │ │ ⭐ 4.2    │          │
│  │ ₹500      │ │ ₹700      │          │
│  │ Mumbai, MH │ │ Delhi, DL  │          │
│  └────────────┘ └────────────┘          │
│  [← Page 1 of 5 →]                      │
└──────────────────────────────────────────┘
```

#### Doctor Relevance Sorting

When a user completes symptom analysis, the front end passes two extra query params:

- `matchTags` — comma-separated `possibleConditions` from the AI result, matched against `doctor.tags`
- `userCity` / `userState` — from `GET /api/profile` → `healthProfile.city/state`

The backend performs **in-memory scoring** (tag match + proximity + quality) and returns doctors sorted by `_relevanceScore` descending. Doctors in the user's city receive a **"Near You"** badge in `DoctorCard`.

> **Planned enhancement (Phase 8):** Attempt to extract city from Google profile on OAuth login. See `IMPLEMENTATION_PLAN.md §8` and `WEB_FLOW.md §Post-Login Profile Prompt`.

### 9.4 Health Tools Pages

**Prescription Explainer** (`/prescription`), **Medicine Search** (`/medicine`), **Drug Interaction** (`/drug-interaction`) share a common layout:

```
┌──────────────────────────────────────────┐
│  Page Title                              │
├──────────────────────────────────────────┤
│  Upload Zone (drag & drop)               │
│  ┌────────────────────────────────────┐  │
│  │  📁 Drop image here or click      │  │
│  │     to browse                      │  │
│  └────────────────────────────────────┘  │
│  — OR —                                  │
│  [Text input for medicine name/drugs]    │
│  [Analyze button]                        │
├──────────────────────────────────────────┤
│  AI Analysis Result (Markdown render)    │
│  ┌────────────────────────────────────┐  │
│  │  Medicine Name: Paracetamol        │  │
│  │  Uses: Pain relief, fever          │  │
│  │  Side Effects: ...                 │  │
│  │  Dosage: ...                       │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 9.4.1 Disease Info Page (`/disease`)

**Type:** Client Component (AI-powered disease information)

```
┌──────────────────────────────────────────┐
│  Disease Information                     │
├──────────────────────────────────────────┤
│  [Enter disease/condition name]          │
│  [Language dropdown (en, hi, bn, ...)]   │
│  [Get Info button]                       │
├──────────────────────────────────────────┤
│  Disease Details (fetched via AI)        │
│  ┌────────────────────────────────────┐  │
│  │  Name: Diabetes Mellitus           │  │
│  │  Description: A chronic condition..│  │
│  │  Symptoms: Frequent urination, ... │  │
│  │  Causes: Insulin resistance, ...   │  │
│  │  Prevention: Healthy diet, ...     │  │
│  │  Treatment: Medication, insulin... │  │
│  │  When to See Doctor: If symptoms.. │  │
│  └────────────────────────────────────┘  │
│  [Find Related Doctors →]                │
└──────────────────────────────────────────┘
```

**Data source:** `GET /api/disease/info?topic=<name>&language=<lang>`  
**Response shape:**

```json
{
	"name": "string",
	"description": "string",
	"symptoms": ["string"],
	"causes": ["string"],
	"prevention": ["string"],
	"treatment": ["string"],
	"whenToSeeDoctor": "string"
}
```

**Navigation:** Disease cards on HomePage link to `/disease?topic=<disease>`. Page includes a "Find Related Doctors" button linking to `/doctor-suggest?condition=<disease>`.

### 9.5 User Dashboard (`/dashboard`)

**Type:** Client Component (aggregated data from multiple endpoints)

```
┌──────────────────────────────────────────┐
│  Welcome, {userName}!                    │
├──────────────┬───────────────────────────┤
│ Health Risk  │  Quick Actions            │
│ ┌──────────┐ │  ┌─────────┐ ┌─────────┐ │
│ │  Score:   │ │  │ 💊 Med  │ │ 📋 Rx   │ │
│ │   45/100  │ │  │ Search  │ │ Explainer│ │
│ │  (gauge)  │ │  ├─────────┤ ├─────────┤ │
│ └──────────┘ │  │ 💬 Chat │ │ 🩺 Doctor│ │
│              │  │ AI Asst │ │ Suggest  │ │
│              │  └─────────┘ └─────────┘ │
├──────────────┴───────────────────────────┤
│  Health Profile Summary                  │
│  Blood Group: O+  Allergies: Penicillin  │
│  Chronic: Asthma  Emergency: Dad (📞)   │
├──────────────────────────────────────────┤
│  Recent Activity (Timeline)              │
│  ├─ 🔬 Symptom Analysis - Headache      │
│  ├─ 💊 Medicine Lookup - Paracetamol    │
│  ├─ 📋 Prescription Analyzed            │
│  └─ ⚠️ Drug Interaction Check           │
├──────────────────────────────────────────┤
│  Past Reports                            │
│  ┌────────────────┐ ┌────────────────┐  │
│  │ Report Jan 2026│ │ Report Feb 2026│  │
│  │ [Download PDF] │ │ [Download PDF] │  │
│  └────────────────┘ └────────────────┘  │
│  [Generate New Report]                   │
└──────────────────────────────────────────┘
```

**Data Sources (all fetched in parallel):**

- `GET /api/profile` → Risk score, blood group, allergies, chronic conditions, emergency contacts
- `GET /api/history/medicine` → Recent medicine analyses
- `GET /api/history/prescription` → Recent prescription analyses
- `GET /api/history/interaction` → Recent drug interaction checks
- `GET /api/history/symptom` → Recent symptom analyses
- `GET /api/reports` → List of past health reports

### 9.6 Reset Password (`/reset-password?token=...`)

**Type:** Client Component (form + API call)

- Token extracted from URL search params
- New password + confirm password fields
- Submit → `POST /api/auth/reset-password` with `{ token, password }`
- Success → redirect to `/login` with success message

---

## 10. Performance Strategy

### 10.1 Bundle Optimization

| Strategy           | Implementation                                                |
| ------------------ | ------------------------------------------------------------- |
| RSC by default     | Pages that don't need interactivity ship 0 JS                 |
| Dynamic imports    | `next/dynamic` for heavy client components (Chat, FileUpload) |
| Direct imports     | No barrel files — import from exact paths                     |
| Tree-shaking       | `lucide-react` icons imported individually                    |
| Font subsetting    | `next/font` with `subsets: ['latin']`                         |
| Image optimization | `next/image` for all images with `sizes` attribute            |

### 10.2 Eliminating Waterfalls

| Pattern                 | Usage                                                    |
| ----------------------- | -------------------------------------------------------- |
| `Promise.all()`         | Parallel independent API calls (e.g., profile + history) |
| Suspense streaming      | Wrap async server components in `<Suspense>`             |
| Preload on hover        | `next/link` with prefetching for navigation              |
| Start early, await late | Initiate fetches at top of function, await when needed   |

### 10.3 Caching Strategy

| Data                     | Cache        | Revalidation                     |
| ------------------------ | ------------ | -------------------------------- |
| Doctor list              | SWR (client) | On filter change                 |
| Chat list                | SWR (client) | On create/update/delete (mutate) |
| Chat messages            | SWR (client) | On send message (mutate)         |
| Profile                  | SWR (client) | On update (mutate)               |
| Medicine history         | SWR (client) | On new analysis/delete (mutate)  |
| Prescription history     | SWR (client) | On new analysis/delete (mutate)  |
| Drug interaction history | SWR (client) | On new check/delete (mutate)     |
| Symptom history          | SWR (client) | On new analysis/delete (mutate)  |
| Health reports list      | SWR (client) | On generate (mutate)             |
| Disease info             | SWR (client) | 1 hour stale time                |

---

## 11. Error Handling

### 11.1 Error Boundaries

```
app/
├── error.tsx              # Global error boundary (catch-all)
├── not-found.tsx          # Custom 404 page
├── (protected)/
│   └── error.tsx          # Protected routes error boundary
```

### 11.2 API Error Handling

- Network errors → Toast notification with retry option
- 401 Unauthorized → Auto-redirect to `/login` with return URL
- 400 Validation → Show field-level error messages
- 429 Rate Limited → Toast with "Too many requests, try again later"
- 500 Server Error → Toast with "Something went wrong" + Sentry (future)

### 11.3 Form Validation

- Client-side: Zod schemas with React Hook Form `zodResolver`
- Real-time: Validate on blur, show errors immediately
- Server-side: API returns validation errors → mapped to form fields

---

## 12. Accessibility

| Feature          | Implementation                                           |
| ---------------- | -------------------------------------------------------- |
| Focus management | Auto-focus on modal open, trap focus in dialogs          |
| Keyboard nav     | All interactive elements accessible via Tab/Enter/Escape |
| ARIA labels      | Descriptive labels on icons, buttons, form inputs        |
| Skip links       | "Skip to main content" link on every page                |
| Color contrast   | WCAG AA compliant contrast ratios (4.5:1 minimum)        |
| Screen readers   | Meaningful alt text, `aria-live` for dynamic content     |
| Reduced motion   | `motion-safe:` prefix for animations                     |

---

## 13. Environment Variables

```env
# API
NEXT_PUBLIC_API_URL=https://niraksh-guardian-api.vercel.app

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-client-id>

# App
NEXT_PUBLIC_APP_NAME=Niraksh Guardian
NEXT_PUBLIC_APP_URL=https://niraksh-guardian.vercel.app
```

---

## 14. Deployment

- **Platform:** Vercel
- **Build:** `next build` (automatic on push)
- **Preview:** PR-based preview deployments
- **Production:** Main branch auto-deploy
- **CDN:** Vercel Edge Network (automatic)
- **Analytics:** Vercel Analytics (optional)

---

## 15. Planned / Future Enhancements

### 15.1 Post-Login Profile Completion Prompt

> **Status:** Planned — Phase 8

After signup (email or Google OAuth), if the user's `healthProfile` is `null` **or** `city`/`state` are missing, redirect the user to a lightweight onboarding modal/page asking for:

- City & State (critical for doctor relevance ranking)
- Blood group
- Any known allergies or chronic conditions

This ensures the doctor recommendation engine has location context immediately.

### 15.2 Google OAuth Location Auto-Fill

> **Status:** Planned — Phase 8

When a user signs in via Google OAuth (`POST /api/auth/google`), the backend receives the Google ID token. Google's token doesn't contain location by default, but:

1. If the Google profile contains a `locale` field, it can be used to infer language preference.
2. A future enhancement: request the `profile` scope to retrieve additional account metadata (if available), or prompt the user to confirm/set their city after OAuth login.

**Implementation steps (when ready):**

- Backend: After Google OAuth success, check if `healthProfile.city` is null for the user.
- Return `profileIncomplete: true` in the auth response when city/state are missing.
- Frontend: `AuthProvider.login()` checks `profileIncomplete` → sets a context flag.
- A `ProfilePromptModal` component renders on `/dashboard` first load when flag is set.
- Modal collects city, state (and optionally blood group), calls `PUT /api/profile`, dismisses.

### 15.3 Browser Geolocation API (Optional, User-Prompted)

> **Status:** Future consideration

As an alternative/supplement to stored profile location, the `/doctor-suggest` page could prompt (with user permission) for `navigator.geolocation.getCurrentPosition()`, reverse-geocode to city/state using a geocoding API, and pass to doctor search without storing. This provides real-time location without requiring profile completion.

**Consideration:** Requires HTTPS, user permission, and an external geocoding service (e.g., Google Maps Geocoding API, OpenStreetMap Nominatim).
