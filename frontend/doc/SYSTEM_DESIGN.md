# Niraksh-Guardian Frontend System Design

## 1. Purpose

This document describes the frontend architecture and engineering standards for Niraksh-Guardian. It complements backend design and data-flow docs by defining component structure, state management, data contracts, caching, streaming, testing, performance, accessibility, i18n, and deployment guidance.

---

## 2. High-level Architecture

- Framework: Next.js (App Router) + React + TypeScript
- Rendering: Mix of Server Components (page-level data) and Client Components (interactive UI)
- Styling: Tailwind CSS v4 (design tokens and component utility classes)
- State layers:
  - Persistent client state: `localStorage` (tokens, user details)
  - Application state: React Contexts (AuthContext, ToastContext, ModalContext)
  - Server state: SWR hooks (`useSWR`) for remote resources
- API client: centralized `apiClient<T>(endpoint, opts)` responsible for injecting bearer tokens, silent refresh, JSON parsing, and unified error mapping.

---

## 3. Component Organization & Conventions

- Top-level folders:
  - `app/` — Route entry points (Next App Router pages)
  - `components/` — Reusable components (ui primitives and composed widgets)
  - `hooks/` — Reusable React hooks (SWR wrappers, form helpers)
  - `contexts/` — AuthContext, ToastContext, FeatureFlagContext
  - `lib/` — `apiClient`, serializers, client utilities
  - `styles/` — Tailwind config and design tokens
  - `types/` — Shared TypeScript types for API shapes

- Naming:
  - Component files: `PascalCase.tsx` for components, `camelCase.ts` for helpers
  - Tests: colocated `Component.test.tsx` next to component

- UI primitives:
  - `Button`, `Card`, `Modal`, `FormField` — foundational components used across features

---

## 4. Data Fetching & SWR Patterns

- Use SWR for all server state. Centralize hooks:
  - `useProfile()` → `/api/profile`
  - `useChats()` → `/api/chats`
  - `useDoctorSearch(query)` → `/api/doctors?${queryString}`

- Key conventions:
  - Full query strings for list endpoints
  - Resource-id keys for single resources
  - Namespaced keys for multi-tenant contexts when needed

- Invalidation rules (summary):
  - Mutate related keys immediately after successful mutations.
  - Use optimistic UI for messages and revert on error.

- SSG/SSR: Use server rendering for landing pages and disease pages when SEO matters; use client rendering for interactive tools.

---

## 5. `apiClient` Contract

Responsibilities:

- Include `Authorization: Bearer <accessToken>` header when available
- Detect 401 and attempt silent refresh via `POST /api/auth/refresh-token` using stored refresh token
- Provide typed responses and map backend error shape (`{ error, code, details }`) to frontend exceptions
- Support streaming (SSE) helper for AI endpoints with `onChunk`, `onMeta`, `onDone`, `onError` callbacks

Usage example:

```
const { data } = await apiClient('/api/profile')
```

---

## 6. Authentication Flow (Frontend)

- On app load: AuthContext attempts to rehydrate from `localStorage` and validate tokens.
- Token refresh: `apiClient` performs silent rotation; on failure clear storage and redirect to `/login`.
- Protected routes: `AuthGuard` checks `isAuthenticated` before rendering page components.

---

## 7. Forms & Validation

- Use React Hook Form + Zod resolver for all forms.
- Map Zod errors to field-level messages via `setError`.
- For file uploads, use a controlled upload component exposing the upload `state` (idle/validating/uploading/processing/success/error).

---

## 8. Streaming & SSE Consumption

- Use a thin SSE client wrapper that exposes an async iterator or callbacks.
- Reconnection strategy: exponential backoff with jitter, resume using `requestId` if available.
- UI: render incremental chunks, support cancellation and copy of partial transcript, and persist partials to IndexedDB for recovery.

---

## 9. Offline & Resilience

- Basic offline support: detect offline and queue non-critical mutations (toasts, analytics) and disable heavy network actions (AI analysis) with a user message.
- Use optimistic updates carefully with reconciler logic to deduplicate server vs client temporary ids.

---

## 10. Performance & Budgets

- Aim for Lighthouse: Performance >= 90, Accessibility >= 90, Best Practices >= 90.
- Code splitting: split per route using Next.js dynamic imports for heavy components (report viewer, PDF renderer).
- Image optimization: use `next/image` with proper sizes and Cloudinary transformations.
- Monitor Web Vitals and client-side errors using an RUM tool (Vercel Analytics, Sentry, or equivalent).

---

## 11. Accessibility (A11y)

- Follow WCAG 2.1 AA standards.
- Ensure keyboard navigation, focus management in modals, and ARIA labels for dynamic components (toasts, alerts, role="status").
- Maintain color contrast ratios and provide text alternatives for non-text content.

---

## 12. Internationalization (i18n)

- Source of truth for language preference: `user.languagePreference` in `/api/profile`.
- Use a translation library (recommended: `next-intl` or `react-intl`) with message extraction and fallback.
- Load locale-specific prompts for AI calls.

---

## 13. Testing Strategy

- Unit tests: Jest + React Testing Library for components and hooks.
- Integration tests: test major flows (profile update, chat send, analysis) with mocked SWR and mocked API client.
- E2E tests: Playwright for critical user journeys (login, report generation, prescription analysis).
- CI: run tests, lint, and build in pull requests.

---

## 14. Security & Privacy

- Never store PII beyond necessary retention; follow backend data lifecycle policies.
- Sanitize user-generated content before rendering (markdown renderer with allowlist).
- Use HTTPS and secure cookies where applicable; favor tokens in `localStorage` but treat with extra caution.

---

## 15. Deployment & Environments

- Frontend deploys on Vercel. Use preview deployments for PRs and staging branch for integration testing.
- Environment variables: prefix `NEXT_PUBLIC_` for variables that must be exposed to client; keep secret keys server-side.

Deployment checklist:

1. Validate env variables for `NEXT_PUBLIC_API_BASE`, `CLOUDINARY_KEY`, `NEXT_PUBLIC_SENTRY_DSN`.
2. Ensure backend `OPENAI/GEMINI` keys are present in target environment.
3. Run `pnpm build` and smoke test main flows.

---

## 16. Docs & Onboarding

- Keep component docs in `components/README.md` for design tokens and patterns.
- Maintain a lightweight architecture ADR for major decisions (AI fallback, streaming protocol).

---

## 17. Where to extend next (research backlog)

- Add typed OpenAPI client generation to keep `types/` in sync with backend.
- Implement background sync for large uploads and resume support.
- Add automated accessibility checks in CI.

---

## 18. Current Care-Coordination UI Architecture (September 2026)

### 18.1 Shared journey component

`components/care/CareJourney.tsx` renders the patient progress indicator for symptom analysis, doctor selection, booking, and visit preparation. It is used by symptom analysis, booking, appointments, and clinical intake so the next action stays visible across the flow.

### 18.2 Appointment and intake state

- `useDoctorSlots(doctorId, date)` reads server-generated slots; the client does not calculate or trust availability locally.
- Booking stores only a transient prefill object in `sessionStorage` under `ng:appointment-context`, then uses the appointment ID returned by `POST /api/appointments` for the intake route.
- `useClinicalIntake(appointmentId)` hydrates the appointment-specific draft/submitted intake.
- Intake has three visible stages: patient/visit context, guided HPI/ROS fields, and review/consent. Draft save and submit are separate mutations.
- Consent is represented by server timestamps; a checked client control alone never grants doctor access.
- `useClinicalTimeline()` is shown as a compact preview while preparing a visit.

### 18.3 Doctor portal boundaries

Doctor pages use `useDoctorMe()` to gate approved-only operations. Patient record UI renders only data returned by the access-controlled backend, shows the consent-active intake when present, exposes original lab files through `fileUrl`, and requires a completed pre-prescription check before enabling prescription issuance.

### 18.4 Route and API naming

The current frontend paths are `/niraksh-ai`, `/symptom-analysis`, `/appointments`, `/appointments/book`, and `/clinical-intake`. The canonical client route map is `frontend/src/lib/api-routes.ts`; it includes appointment, intake, doctor portal, and admin application endpoints.

Last updated: 2026-09-26
