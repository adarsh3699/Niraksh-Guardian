# Niraksh-Guardian Frontend — Implementation Plan

## Overview

Phased plan to build the Niraksh-Guardian Next.js frontend from scratch. Each phase is self-contained and deployable. Backend API is live at `https://niraksh-guardian-api.vercel.app/`.

### Design Approach

> **Uniform & professional.** All colors come from the single `@theme` palette in `globals.css`. No hardcoded hex values in components. The website should look cohesive and polished across every page — consistent spacing, typography, border-radii, and shadows.

---

## Phase 0: Project Scaffolding & Configuration

**Duration:** 1 session | **Priority:** P0

### 0.1 Initialize Project

- [x] Create Next.js 15 project with TypeScript (`create-next-app`)
- [x] Configure `pnpm` as package manager, add `pnpm-workspace.yaml` if needed
- [x] Set up `tsconfig.json` with strict mode, path aliases (`@/` → `src/`)
- [x] Configure `next.config.ts` (images domains, env vars, experimental features)

### 0.2 Install Dependencies

```
# Core
pnpm add swr react-hook-form @hookform/resolvers zod
pnpm add react-markdown remark-gfm react-dropzone
pnpm add @react-oauth/google lucide-react

# Dev
pnpm add -D eslint prettier eslint-config-next
pnpm add -D @types/node @types/react @types/react-dom
```

### 0.3 Tailwind CSS v4 Setup

- [x] Install Tailwind CSS v4 (`@tailwindcss/postcss`, `tailwindcss`)
- [x] Create `globals.css` with `@import "tailwindcss"` and full `@theme` token block
- [x] Define color tokens (primary/teal, accent/orange, highlight/red, info/blue)
- [x] Define radius, shadow, and spacing tokens
- [x] Add dark mode custom variant (`@custom-variant dark`)

### 0.4 Font Configuration

- [x] Set up `next/font` for Poppins (600, 700) and Inter (400, 500, 600)
- [x] Apply `font-poppins` to headings, `font-inter` to body in root layout
- [x] Verify zero-CLS font loading

### 0.5 Environment & Tooling

- [x] Create `.env.local` with `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- [x] Configure ESLint flat config with Next.js rules
- [x] Set up Prettier config
- [x] Add `.gitignore` entries for `.next/`, `node_modules/`, `.env*.local`

### 0.6 Base File Structure

- [x] Create directory skeleton: `src/app/`, `src/components/`, `src/lib/`, `src/hooks/`, `src/contexts/`, `src/types/`
- [x] Create root `layout.tsx` with HTML lang, fonts, viewport meta
- [x] Create root `page.tsx` with placeholder content
- [x] Verify `pnpm dev` works and shows the page

**Deliverable:** Empty Next.js app running with Tailwind v4, custom theme tokens, and fonts loaded.

---

## Phase 1: Shared Infrastructure

**Duration:** 1 session | **Priority:** P0

### 1.1 Type Definitions (`src/types/`)

- [x] `api.ts` — `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>` (`{ data: T[], meta: { total, page, limit, pages } }`)
- [x] `auth.ts` — `User` (id, email, name, gender), `Tokens`, `LoginRequest`, `SignupRequest`, `GoogleAuthRequest`
- [x] `chat.ts` — `Chat` (id, userId, title, createdAt, updatedAt), `Message` (id, chatId, role, content, createdAt), `CreateChatRequest`, `UpdateChatRequest`, `SendMessageRequest`. Note: `GET /api/chats` includes `messages: Message[]` (1-element array for last msg), `GET /api/chats/:chatId` returns flat `Message[]`, `POST /api/chats` returns `Chat`, `DELETE /api/chats/:id` returns `{ message }`
- [x] `doctor.ts` — `Doctor` (id, name, email, phone?, imageUrl?, specialization, qualification?, experienceYears, rating, consultationFee, city, state, bio?, createdAt), `DoctorSearchParams` (search, specialization, city, state, minFee, maxFee, sortBy, order, page, limit), `SymptomAnalysis`, `SymptomSummaryRequest` ({ chatId: string }), `SymptomSummaryResponse` ({ summary: string, status: "success" | "non_medical" })
- [x] `health.ts` — `ProfileResponse` (user + healthProfile), `HealthProfile` (bloodGroup, allergies, chronicConditions, emergencyContact\*, healthRiskScore), `MedicineHistory` (id, userId, imageUrl, medicineName, analysisResult, createdAt), `PrescriptionHistory` (id, userId, imageUrl, extractedText, analysisResult, createdAt), `DrugInteractionHistory` (id, userId, drugs[], interactionResult, createdAt), `SymptomAnalysisHistory` (id, userId, symptoms[], imageUrl, predictedConditions, urgencyLevel, recommendedSpecialist, createdAt). Note: `analysisResult`/`interactionResult`/`predictedConditions` are JSON types.
- [x] `report.ts` — `HealthReport` (id, reportUrl, createdAt)

### 1.2 API Client (`src/lib/api.ts`)

- [x] Create `apiClient<T>(endpoint, options)` function
- [x] Implement auto-inject `Authorization: Bearer <token>` header
- [x] Implement pre-flight token expiry check (decode JWT, check `exp`)
- [x] Implement auto-refresh flow: refresh token → retry original request
- [x] Implement FormData mode for file uploads (no Content-Type header)
- [x] Implement error handling: parse API error response, throw typed `ApiError`
- [x] Handle 401 globally: clear tokens, redirect to `/login`

### 1.3 Auth Utilities (`src/lib/auth.ts`)

- [x] `getAccessToken()` / `setAccessToken(token)` / `clearTokens()`
- [x] `getRefreshToken()` / `setRefreshToken(token)`
- [x] `getUserDetails()` / `setUserDetails(user)` / `clearUserDetails()`
- [x] `isTokenExpired(token)` — decode JWT and check `exp` claim
- [x] `getTokenExpiryTime(token)` — return ms until expiry

### 1.4 Validation Schemas (`src/lib/validations.ts`)

- [x] `loginSchema` — email (required, valid email), password (required, min 1) _(Note: backend has no min length on login — only signup enforces min 8)_", "oldString": "- [ ] `loginSchema` — email (required, valid email), password (required, min 8)
- [x] `signupSchema` — name, email, password (min 8), confirmPassword (match), gender (optional: Male/Female/Other)
- [x] `forgotPasswordSchema` — email only
- [x] `resetPasswordSchema` — token (required), password (required, min 8), confirmPassword (match)
- [x] `chatMessageSchema` — content (required, max 5000)
- [x] `symptomSearchSchema` — symptoms (array of strings, min 1), language (optional string, default "en")
- [x] `summarizeSymptomsSchema` — chatId (required, string)
- [x] `profileSchema` — name (optional), gender (optional: Male/Female/Other), languagePreference (optional), bloodGroup, allergies[], chronicConditions[], emergencyContact fields
- [x] `drugInteractionSchema` — medicines (array of strings, min 2)

### 1.5 Utility Functions (`src/lib/utils.ts`)

- [x] `cn(...classes)` — class name merger (clsx + tailwind-merge)
- [x] `formatDate(date)` — locale-aware date formatting
- [x] `truncateText(text, maxLength)`
- [x] `debounce(fn, delay)`

### 1.6 Constants (`src/lib/constants.ts`)

- [x] API endpoints map (`API_ROUTES`)
- [x] Disease categories list with icons
- [x] Quick symptoms list
- [x] Navigation items (path, label, icon, requiresAuth)

**Deliverable:** Complete utility layer — API client, auth helpers, types, validations.

---

## Phase 2: Layout & Navigation

**Duration:** 1 session | **Priority:** P0

### 2.1 Root Layout (`src/app/layout.tsx`)

- [x] HTML structure with lang, viewport, theme-color meta
- [x] Font providers (Poppins + Inter)
- [x] Wrap children in `AuthProvider` → `ToastProvider` → `GoogleOAuthProvider`
- [x] Include `<Navbar />` and `<Footer />` around `{children}`
- [x] Generate root metadata: title template, description, OG tags

### 2.2 Navbar (`src/components/layout/Navbar.tsx`)

- [x] `'use client'` — needs `usePathname()` for active state
- [x] Desktop: Logo on left, nav links center, auth buttons right
- [x] Mobile: Logo + hamburger icon → slide-in `MobileMenu`
- [x] Auth state: Show "Login/Signup" when unauthenticated, "Profile/Logout" when authenticated
- [x] Active link highlighting with teal underline
- [x] Sticky header with box-shadow
- [x] White background, consistent with overall design

### 2.3 Mobile Menu (`src/components/layout/MobileMenu.tsx`)

- [x] Slide-in drawer from left with overlay
- [x] Close on overlay click, Escape key, or navigation
- [x] Focus trap while open
- [x] Navigation items with icons
- [x] Auth section at bottom

### 2.4 Footer (`src/components/layout/Footer.tsx`)

- [x] Server component (static content)
- [x] Brand name + description
- [x] Quick links: Home, About, Doctor Suggest, AI Assistant
- [x] Social links (GitHub, etc.)
- [x] Copyright notice

### 2.5 Providers

- [x] `AuthProvider` (`src/contexts/AuthProvider.tsx`)
  - Wrap entire app
  - On mount: check localStorage for existing tokens, validate, hydrate user state
  - Provide `login()`, `logout()`, `refreshAuth()`, `isAuthenticated`, `user`, `isLoading`
- [x] `ToastProvider` (`src/contexts/ToastProvider.tsx`)
  - Stack up to 3 toasts, auto-dismiss after 5s
  - Types: `success`, `error`, `warning`, `info`
  - Position: bottom-right

### 2.6 UI Primitives (Batch 1)

- [x] `Button` — variants: primary, accent, outline, ghost, destructive; sizes: sm, md, lg; loading state
- [x] `Input` — label, error message, icon prefix; extends native input props
- [x] `Spinner` — animated SVG, sizes: sm (16px), md (24px), lg (40px)
- [x] `Toast` — slide-in from bottom-right, auto-dismiss, close button (rendered inline in ToastProvider)

**Deliverable:** Fully functional layout with navbar, footer, auth state, and base UI components.

---

## Phase 3: Authentication Pages

**Duration:** 1 session | **Priority:** P0

### 3.1 Auth Route Group (`src/app/(auth)/`)

- [x] Shared layout: centered card on gradient background, redirect if already authenticated

### 3.2 Login Page (`/login`)

- [x] `LoginForm` (client component)
- [x] Email + Password fields with Zod validation
- [x] "Forgot Password?" link
- [x] Submit → `POST /api/auth/login`
- [x] On success: store tokens (`tokens.accessToken`, `tokens.refreshToken`), store user (`user.id`, `user.email`, `user.name`, `user.gender`), redirect to returnUrl or `/dashboard`
- [x] Error states: invalid credentials, server error
- [x] Google OAuth button below separator ("— OR —")
- [x] "Don't have an account? Sign up" link

### 3.3 Signup Page (`/register`)

- [x] `SignupForm` (client component)
- [x] Name + Email + Password + Confirm Password + Gender (optional dropdown: Male/Female/Other)
- [x] Real-time validation (password match, email format)
- [x] Submit → `POST /api/auth/signup`
- [x] On success: auto-login (store tokens + user details), redirect to returnUrl or `/dashboard`
- [x] "Already have an account? Login" link

### 3.4 Forgot Password Page (`/forgot-password`)

- [x] Email input + Submit button
- [x] Submit → `POST /api/auth/forgot-password`
- [x] Always show: "If an account exists, a reset link has been sent" (prevents email enumeration)
- [x] Backend returns 200 for all emails (existing or not) — no error to handle

### 3.5 Google OAuth Flow

- [x] `GoogleAuthButton` component using `@react-oauth/google`
- [x] On credential response → `POST /api/auth/google` with `idToken`
- [x] On success: store tokens + user details, redirect to returnUrl or `/dashboard`

### 3.6 Reset Password Page (`/reset-password`)

- [x] `ResetPasswordForm` (client component)
- [x] Extract `token` from URL search params (`?token=...`)
- [x] New Password + Confirm Password fields
- [x] Submit → `POST /api/auth/reset-password` with `{ token, password }`
- [x] On success: show message + redirect to `/login`
- [x] Handle invalid/expired token error

**Deliverable:** Complete authentication flow — login, signup, forgot password, reset password, Google OAuth.

---

## Phase 4: Home Page

**Duration:** 1 session | **Priority:** P1

### 4.1 Hero Section

- [x] Headline: "Find the best doctor based on your symptoms"
- [x] Description text
- [x] Symptom search input (text input with search icon)
- [x] Search button → navigates to `/doctor-suggest?symptoms=<query>`
- [x] Responsive: Full-width on mobile, constrained on desktop

### 4.2 Disease Cards Section

- [x] Grid of disease cards (6 cols desktop, responsive)
- [x] Each card: SVG icon + disease name
- [x] Click → navigate to `/disease?topic=<disease>`
- [x] Cards: Cancer, Diabetes, Heart Disease, Mental Health, COVID-19, HMPV
- [x] Hover lift effect (translateY(-5px))

### 4.3 Do More Section

- [x] Section heading: "Explore Health Tools" (bento grid layout)
- [x] Large CTA cards (5-col bento, alternating 2/3 span):
  - **Prescription Explainer** → `/prescription`
  - **Drug Interaction Checker** → `/drug-interaction`
  - **Doctor Suggestion** → `/doctor-suggest`
  - **AI Health Assistant** → `/assistance`
- [x] Theme-colored accent borders and hover shadows
- [x] Additional sections: HowItWorks (3-step process), StatsStrip (trust metrics), CTABanner

### 4.4 SEO

- [x] Centralized SEO lib (`src/lib/seo.ts`) — `SITE_CONFIG`, `generatePageMetadata()`, JSON-LD generators
- [x] Page metadata: title template (`%s | Niraksh Guardian`), description, OG tags, Twitter cards
- [x] Structured data: WebSite, MedicalOrganization, FAQPage (JSON-LD)
- [x] `robots.ts` — allow public pages, disallow dashboard/profile/history/reports
- [x] `sitemap.ts` — all public + tool pages with change frequency and priority
- [x] `manifest.ts` — PWA manifest with theme color and app info
- [x] Viewport export (separate from metadata per Next.js best practice)
- [x] `metadataBase` set for canonical URL resolution
- [x] Google bot directives: max-image-preview, max-snippet
- [x] DNS prefetch + preconnect for backend API
- [x] Auth pages marked `noIndex: true` (no crawling login/signup)
- [x] Proper heading hierarchy: single `<h1>` per page, sections use `<h2>`
- [x] Semantic `<section>` tags with `aria-labelledby`
- [x] Search input `aria-label` for accessibility

**Deliverable:** Fully designed home page matching existing visual design.

---

## Phase 5: AI Health Assistant (Chat)

**Duration:** 1–2 sessions | **Priority:** P1

### 5.1 Chat Page Layout (`/assistance`)

- [x] Two-panel layout: Sidebar (chat list) + Main area (messages)
- [x] Mobile: Sidebar as overlay, toggle button
- [x] Dynamic import with `next/dynamic` (heavy client component, SSR disabled, loading spinner)

### 5.2 Chat Sidebar

- [x] "New Chat" button at top
- [x] List of existing chats: `GET /api/chats` via SWR
- [x] Each chat: title (truncated), timestamp, active highlight
- [x] Edit chat title (inline rename → `PUT /api/chats/:id`)
- [x] Delete chat with confirmation dialog → `DELETE /api/chats/:id`
- [x] SWR `mutate` after create/edit/delete
- [x] Language selector (en, hi, bn, te, mr, ta, ur, gu, kn, ml, pa)

### 5.3 Chat Window

- [x] Message list with auto-scroll to bottom
- [x] User messages: right-aligned, teal/primary background
- [x] AI messages: left-aligned, gray background, markdown rendered (`react-markdown`)
- [x] Typing indicator: animated dots during AI response
- [x] Image messages: badge indicator for uploaded images (backend stores `[Image Uploaded]` prefix, no imageUrl on Message model)

### 5.4 Message Input

- [x] Text input + Send button
- [x] Image upload button → file picker (accepts image/\*, 5MB max)
- [x] Attach image preview before send
- [x] Send → `POST /api/chats/:id/messages` (or create new chat first)
- [x] Disable input while AI is responding
- [x] Quick symptom chips above input (clickable to pre-fill)

### 5.5 New Chat Flow

- [x] Click "New Chat" → `POST /api/chats` → navigate to new chat
- [x] Empty state with welcome prompt + quick symptom chips (replaces static welcome message since backend doesn't auto-generate one)
- [x] First message auto-generates chat title (backend behavior, SWR mutateChats refreshes titles)

**Deliverable:** Full chat interface with sidebar, messaging, image upload, and AI responses.

---

## Phase 6: Doctor Suggestion

**Duration:** 1 session | **Priority:** P1

### 6.1 Symptom Analysis

- [ ] Text input for symptoms (paragraph-style) + optional image upload (📷)
- [ ] "Analyze Symptoms" button → `POST /api/ai/analyze` (FormData with symptoms array + optional image + language, default `"en"`)
- [ ] Display AI analysis result:
  - Severity badge (Mild/Moderate/Severe/Emergency with color coding)
  - Possible conditions list
  - Urgency level (Home Care / Doctor Visit / Emergency Room)
  - Recommended specialist type
  - Home remedies
  - Reasoning text

#### 6.1.1 Summarize Chat Symptoms for Doctor Referral

- [ ] Add "Summarize for Doctor" button (shown when user navigates from a chat context)
- [ ] On click → `POST /api/ai/summarize-symptoms` with `{ chatId }` from route/query params
- [ ] Handle response:
  - `status: "success"` → Display summary paragraph in a card, usable for doctor referral
  - `status: "non_medical"` → Show info message: "This conversation has no medical content to summarize"
- [ ] Summary can be used alongside symptom analysis to provide doctor with full patient context

### 6.2 Doctor Search & Filters

- [ ] Specialization dropdown filter
- [ ] City + State text filters
- [ ] Fee range inputs (min/max)
- [ ] Sort by dropdown (name, experience, fee, rating)
- [ ] Sort order toggle (asc/desc)
- [ ] Free-text search input
- [ ] Results: `GET /api/doctors?specialization=...&city=...&state=...&minFee=...&maxFee=...&sortBy=...&order=...&search=...&page=1&limit=12`

### 6.3 Doctor Cards Grid

- [ ] Card: Doctor image, name, specialization, qualification, experience years, rating (stars), consultation fee, city/state, bio (truncated)
- [ ] Phone/contact info on expand or click
- [ ] Responsive grid: 1 col (mobile) → 2 cols (tablet) → 3 cols (desktop)

### 6.4 Pagination

- [ ] Previous/Next buttons + page indicator
- [ ] "Showing X of Y results"
- [ ] Scroll to top on page change

### 6.5 Pre-filled from Home

- [ ] Read `?symptoms=` or `?condition=` from URL search params
- [ ] Auto-trigger analysis if symptoms provided
- [ ] Auto-set specialization filter if condition provided

**Deliverable:** Doctor suggestion page with AI analysis, search, filters, and pagination.

---

## Phase 7: Health Tools

**Duration:** 1–2 sessions | **Priority:** P1

### 7.1 Shared Components

- [ ] `FileUploadZone` — drag-and-drop area, file preview, size validation (5MB max)
- [ ] `AnalysisResult` — renders markdown AI response with styled sections
- [ ] Loading state with skeleton placeholder

### 7.2 Prescription Explainer (`/prescription`)

- [ ] Upload prescription images (up to 5 via drag-and-drop)
- [ ] Submit → `POST /api/ai/prescription` (FormData with files)
- [ ] Display structured result: medicine list, dosage, instructions, warnings
- [ ] Extracted medicines list with option to check interactions
- [ ] "Check Drug Interactions" button → navigates to `/drug-interaction?medicines=...`

### 7.3 Medicine Search (`/medicine`)

- [ ] Text input for medicine name
- [ ] — OR — Image upload of medicine packaging
- [ ] Submit → `POST /api/ai/medicine` (FormData with `name` or `image`)
- [ ] Display: markdown-formatted analysis (name, composition, uses, side effects, dosage, alternatives)

### 7.4 Drug-Drug Interaction (`/drug-interaction`)

- [ ] Dynamic medicine input list (add/remove drugs, min 2)
- [ ] "Check Interaction" button → `POST /api/ai/drug-interaction` with `{ medicines: [...] }`
- [ ] Display: markdown-formatted interaction analysis (severity, mechanism, recommendations)
- [ ] Pre-fill from URL search params if navigated from prescription page

**Deliverable:** Three health tool pages with file upload and AI analysis.

---

## Phase 7.5: Disease Info Page

**Duration:** 0.5 session | **Priority:** P1

### 7.5.1 Disease Info Page (`/disease`)

- [ ] Text input for disease/condition name
- [ ] Language selector dropdown (en, hi, bn, te, mr, ta, ur, gu, kn, ml, pa)
- [ ] "Get Info" button → `GET /api/disease/info?topic=<name>&language=<lang>`
- [ ] Display structured AI response:
  - Disease name + description
  - Symptoms list
  - Causes list
  - Prevention steps
  - Treatment options
  - "When to See a Doctor" section
- [ ] "Find Related Doctors" button → navigates to `/doctor-suggest?condition=<disease>`
- [ ] Pre-fill from URL search params (`?topic=Cold&language=en`) when linked from HomePage disease cards
- [ ] SWR caching with 1-hour stale time (same topic won't re-fetch)

### 7.5.2 HomePage Integration

- [ ] Disease cards on HomePage → link to `/disease?topic=<diseaseName>` instead of `/doctor-suggest`
- [ ] Each disease card click opens info page first, user can then navigate to doctor suggest

**Deliverable:** Disease information page with AI-powered details and doctor navigation.

---

## Phase 8: User Profile & Dashboard

**Duration:** 1 session | **Priority:** P2

### 8.1 Profile Page (`/profile`)

- [ ] Fetch profile: `GET /api/profile` via SWR
- [ ] Response shape: `{ user: { id, email, name, gender, languagePreference }, healthProfile: { ... } | null }`
- [ ] Display user info section: name (editable), email (read-only), gender (editable dropdown)
- [ ] Health profile form:
  - Blood group (dropdown: A+, A-, B+, B-, AB+, AB-, O+, O-)
  - Allergies (tag input, add/remove)
  - Chronic conditions (tag input, add/remove)
  - Emergency contact: name, phone, email
  - Language preference (dropdown: en, hi, bn, te, mr, ta, ur, gu, kn, ml, pa)
- [ ] Display health risk score (auto-calculated by backend, read-only gauge/badge)
- [ ] Save → `PUT /api/profile` (sends both user fields and health fields in single request)
- [ ] Toast on success/error
- [ ] Handle null `healthProfile` (new user, first time) — show empty form

### 8.2 Health History (`/history`)

- [ ] Fetch history from 4 separate endpoints via SWR:
  - `GET /api/history/medicine` → Medicine analyses
  - `GET /api/history/prescription` → Prescription analyses
  - `GET /api/history/interaction` → Drug interaction checks
  - `GET /api/history/symptom` → Symptom analyses
- [ ] Tabbed or filtered view by history type
- [ ] Each entry: date, type badge, key details (medicine name / symptoms / drugs)
- [ ] Click to expand → full analysis result (markdown)
- [ ] Delete button with confirmation → `DELETE /api/history/:type/:id`
- [ ] SWR `mutate` after delete

### 8.3 Health Reports (`/reports`)

- [ ] List past reports: `GET /api/reports` via SWR
- [ ] Each report: creation date, download/view link (Cloudinary PDF URL)
- [ ] Generate new report button → `GET /api/reports/health-summary`
- [ ] Show loading state during generation (can take 5-10s)
- [ ] SWR `mutate` after generation
- [ ] Note: Backend stores max 10 reports per user (FIFO)

**Deliverable:** User profile editing, health history with deletion, and report generation/listing.

---

## Phase 8.5: User Dashboard

**Duration:** 1 session | **Priority:** P1

### 8.5.1 Dashboard Page (`/dashboard`)

- [ ] Main landing page for authenticated users
- [ ] Fetch data in parallel via `Promise.all` + SWR:
  - `GET /api/profile` → Health risk score, profile data, emergency contacts
  - `GET /api/history/medicine` → Recent (take 5)
  - `GET /api/history/prescription` → Recent (take 5)
  - `GET /api/history/interaction` → Recent (take 5)
  - `GET /api/history/symptom` → Recent (take 5)
  - `GET /api/reports` → Past reports list

### 8.5.2 Dashboard Components

- [ ] `RiskScoreCard` — Circular gauge showing health risk score (0-100)
  - Color coding: 0-30 green, 31-60 yellow, 61-100 red
  - Based on `patientHealthProfile.healthRiskScore`
- [ ] `HealthSummary` — Blood group, allergies badges, chronic conditions, emergency contact quick view
- [ ] `QuickActions` — Grid of shortcut cards to health tools (Medicine, Prescription, Drug Interaction, AI Chat, Doctor Suggest, Generate Report)
- [ ] `RecentActivity` — Unified timeline of last 10 activities across all history types, sorted by `createdAt` desc
  - Icon + type badge per entry (💊 Medicine, 📋 Prescription, ⚠️ Interaction, 🔬 Symptom)
  - Clickable → navigates to `/history` with type filter

### 8.5.3 Empty States

- [ ] New user with no history → welcome message + "Get started" CTAs
- [ ] No profile set up → "Complete your health profile" prompt → link to `/profile`

**Deliverable:** Aggregated user dashboard with risk score, activity timeline, and quick actions.

---

## Phase 9: About & Static Pages

**Duration:** 0.5 session | **Priority:** P2

### 9.1 About Page (`/about`)

- [ ] Server component (fully static)
- [ ] Project description, mission statement
- [ ] Team section (if applicable)
- [ ] Tech stack showcase
- [ ] Contact information

### 9.2 404 Page (`not-found.tsx`)

- [ ] Branded design with illustration
- [ ] "Page not found" message
- [ ] "Go Home" button
- [ ] Search suggestion

### 9.3 Error Page (`error.tsx`)

- [ ] "Something went wrong" message
- [ ] "Try Again" button (calls `reset()`)
- [ ] Option to go home

**Deliverable:** About page, custom 404, and error boundary pages.

---

## Phase 10: Polish & Optimization

**Duration:** 1 session | **Priority:** P2

### 10.1 Loading States

- [ ] Add `loading.tsx` files per route group
- [ ] Skeleton components for card grids, chat messages, profile
- [ ] Suspense boundaries around async server components
- [ ] Spinner on button clicks during API calls

### 10.2 Responsive Refinement

- [ ] Test all pages at 320px, 375px, 768px, 1024px, 1440px
- [ ] Fix any overflow, truncation, or spacing issues
- [ ] Verify touch targets ≥ 44px on mobile

### 10.3 Accessibility Audit

- [ ] Run Lighthouse accessibility audit
- [ ] Add `aria-label` to icon-only buttons
- [ ] Verify focus order on all pages
- [ ] Test with keyboard-only navigation
- [ ] Add skip-to-content link

### 10.4 Performance Optimization

- [ ] Analyze bundle with `@next/bundle-analyzer`
- [ ] Verify no barrel file imports (direct imports only)
- [ ] Check for unnecessary `'use client'` directives
- [ ] Optimize images: add `sizes`, use `priority` on above-fold
- [ ] Verify Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

### 10.5 SEO

- [ ] Metadata on every page (title, description, OG tags)
- [ ] Canonical URLs
- [ ] Robots.txt and sitemap.xml (via Next.js conventions)
- [ ] Structured data (JSON-LD) for health organization

**Deliverable:** Polished, accessible, performant, SEO-optimized application.

---

## Phase 11: Testing & Deployment

**Duration:** 1 session | **Priority:** P1

### 11.1 Manual Testing Checklist

- [ ] All auth flows (login, signup, forgot password, Google, logout)
- [ ] Chat create, send message, edit, delete
- [ ] Doctor search, filter, pagination
- [ ] All health tools with image upload
- [ ] Profile edit and save
- [ ] Token refresh (wait for expiry, verify auto-refresh)
- [ ] 404 and error pages
- [ ] Mobile responsiveness on real device

### 11.2 Vercel Deployment

- [ ] Create Vercel project, link to GitHub repo
- [ ] Configure environment variables on Vercel dashboard
- [ ] Set up production domain
- [ ] Configure `vercel.json` (rewrites, headers if needed)
- [ ] Deploy and verify

### 11.3 Post-Deploy Verification

- [ ] Test all API calls against production backend
- [ ] Verify CORS configuration
- [ ] Check meta tags and OG previews (social cards)
- [ ] Test Google OAuth with production redirect URI
- [ ] Performance audit with Lighthouse

**Deliverable:** Production-deployed, fully tested frontend application.

---

## Dependencies & API Endpoints Reference

### Backend API Base URL

```
https://niraksh-guardian-api.vercel.app
```

### Endpoints Used by Frontend

| Feature              | Method | Endpoint                                                                                                                                                    | Auth |
| -------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- |
| Login                | POST   | `/api/auth/login`                                                                                                                                           | No   |
| Signup               | POST   | `/api/auth/signup`                                                                                                                                          | No   |
| Google Auth          | POST   | `/api/auth/google`                                                                                                                                          | No   |
| Forgot Password      | POST   | `/api/auth/forgot-password`                                                                                                                                 | No   |
| Reset Password       | POST   | `/api/auth/reset-password`                                                                                                                                  | No   |
| Refresh Token        | POST   | `/api/auth/refresh-token`                                                                                                                                   | No   |
| Logout               | POST   | `/api/auth/logout`                                                                                                                                          | No\* |
| List Chats           | GET    | `/api/chats`                                                                                                                                                | Yes  |
| Create Chat          | POST   | `/api/chats`                                                                                                                                                | Yes  |
| Update Chat          | PUT    | `/api/chats/:id`                                                                                                                                            | Yes  |
| Delete Chat          | DELETE | `/api/chats/:id`                                                                                                                                            | Yes  |
| Get Chat Messages    | GET    | `/api/chats/:chatId`                                                                                                                                        | Yes  |
| Send Message         | POST   | `/api/chats/:chatId/messages`                                                                                                                               | Yes  |
| Send w/ Image        | POST   | `/api/chats/:chatId/messages` (FormData)                                                                                                                    | Yes  |
| List Doctors         | GET    | `/api/doctors?specialization=&search=&city=&state=&minFee=&maxFee=&sortBy=&order=&page=&limit=` → `{ data: Doctor[], meta: { total, page, limit, pages } }` | Yes  |
| Analyze Symptoms     | POST   | `/api/ai/analyze` (FormData: symptoms[] + optional image + language)                                                                                        | Yes  |
| Analyze Medicine     | POST   | `/api/ai/medicine` (FormData: name or image)                                                                                                                | Yes  |
| Analyze Prescription | POST   | `/api/ai/prescription` (FormData: up to 5 images)                                                                                                           | Yes  |
| Drug Interaction     | POST   | `/api/ai/drug-interaction` (JSON: medicines[])                                                                                                              | Yes  |
| Summarize Symptoms   | POST   | `/api/ai/summarize-symptoms` (JSON: { chatId })                                                                                                             | Yes  |
| Disease Info         | GET    | `/api/disease/info?topic=&language=`                                                                                                                        | Yes  |
| Medicine History     | GET    | `/api/history/medicine`                                                                                                                                     | Yes  |
| Prescription History | GET    | `/api/history/prescription`                                                                                                                                 | Yes  |
| Interaction History  | GET    | `/api/history/interaction`                                                                                                                                  | Yes  |
| Symptom History      | GET    | `/api/history/symptom`                                                                                                                                      | Yes  |
| Delete History       | DELETE | `/api/history/:type/:id`                                                                                                                                    | Yes  |
| Get Profile          | GET    | `/api/profile`                                                                                                                                              | Yes  |
| Update Profile       | PUT    | `/api/profile`                                                                                                                                              | Yes  |
| List Reports         | GET    | `/api/reports`                                                                                                                                              | Yes  |
| Generate Report      | GET    | `/api/reports/health-summary`                                                                                                                               | Yes  |
| Health Check         | GET    | `/health`                                                                                                                                                   | No   |

\* Logout doesn't enforce auth middleware but reads the `Authorization` header to blacklist the access token. Send the header if available.

**Auth response shape** (signup, login, google):

```json
{
	"message": "User created successfully | Login successful | Google login successful",
	"user": { "id": "uuid", "email": "string", "name": "string|null", "gender": "string|null" },
	"tokens": { "accessToken": "JWT", "refreshToken": "JWT" }
}
```

**Refresh token response** (flat): `{ "accessToken": "JWT", "refreshToken": "JWT" }` — NOT wrapped in `tokens`.

---

## Timeline Summary

| Phase     | Name                  | Duration            | Priority |
| --------- | --------------------- | ------------------- | -------- |
| 0         | Project Scaffolding   | 1 session           | P0       |
| 1         | Shared Infrastructure | 1 session           | P0       |
| 2         | Layout & Navigation   | 1 session           | P0       |
| 3         | Authentication Pages  | 1 session           | P0       |
| 4         | Home Page             | 1 session           | P1       |
| 5         | AI Health Assistant   | 1–2 sessions        | P1       |
| 6         | Doctor Suggestion     | 1 session           | P1       |
| 7         | Health Tools          | 1–2 sessions        | P1       |
| 7.5       | Disease Info Page     | 0.5 session         | P1       |
| 8         | Profile & History     | 1 session           | P2       |
| 8.5       | User Dashboard        | 1 session           | P1       |
| 9         | Static Pages          | 0.5 session         | P2       |
| 10        | Polish & Optimization | 1 session           | P2       |
| 11        | Testing & Deployment  | 1 session           | P1       |
| **Total** |                       | **~12–15 sessions** |          |

---

## Success Criteria

1. **Feature parity** with existing frontend (all 12 routes working)
2. **Lighthouse scores** ≥ 90 on Performance, Accessibility, Best Practices, SEO
3. **Core Web Vitals** all green (LCP < 2.5s, FID < 100ms, CLS < 0.1)
4. **Bundle size** — initial JS < 100KB gzipped
5. **Mobile responsive** — fully functional from 320px to 2560px
6. **Accessibility** — WCAG AA compliant, keyboard navigable
7. **Zero TypeScript errors** — strict mode, no `any` types
