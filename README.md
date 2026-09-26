# 🛡️ Niraksh-Guardian

**AI-Assisted Healthcare Understanding & Guidance Platform**

Niraksh-Guardian is an intelligent digital health companion designed to help individuals understand symptoms early, interpret medical information clearly, and navigate toward appropriate healthcare decisions with confidence.

It bridges the gap between personal health concern and professional medical care through guided understanding, explainable AI insights, and contextual doctor recommendations.

# ✅ At a Glance

- Understand symptoms with explainable, structured guidance (not a diagnosis)
- Get contextual doctor/specialist direction with clear reasoning
- Analyze prescriptions, medicines, and lab reports (image + text)
- Keep a personal health timeline, reports, and profile context in one place
- Explore disease/medicine information and research-backed references

---

# 🌍 Problem Statement

Millions of people experience symptoms daily but struggle to interpret them correctly.
Before reaching a healthcare professional, individuals often face:

- Uncertainty about symptom meaning
- Confusion about which specialist to consult
- Misinterpretation of prescriptions
- Anxiety driven by internet self-diagnosis
- Lack of accessible health literacy

Current behavior typically follows:

**Symptoms → Internet Search → Fear/Misinformation → Delayed or Wrong Care**

This gap between symptom awareness and professional consultation contributes to:

- Late diagnosis
- Incorrect self-treatment
- Healthcare system overload
- Patient anxiety
- Poor health literacy

---

# 🔎 Existing Solutions & Limitations

## Search Engines & Health Articles

Provide information but not personalized interpretation.
Users must self-translate symptoms into medical meaning.

## Symptom Checker Apps

Often rigid, questionnaire-based, and clinical.
They lack conversational flexibility and explainability.

## Telemedicine Platforms

Require prior decision about which doctor to consult.
They do not help users decide _which_ specialist is appropriate.

## AI Chatbots

Offer generic responses without structured health reasoning or safety framing.

**Gap:**
There is no guided system that converts natural symptom expression into understandable health direction and specialist guidance.

---

# 🎯 Target Users & Gap Analysis

## Target Users

- Individuals experiencing new or unclear symptoms
- People unsure which doctor to consult
- Patients trying to understand prescriptions
- Health-aware users seeking early insight
- Students and young professionals with limited health literacy

## What Users Need

Users need a system that:

- Accepts natural symptom description
- Interprets health context safely
- Explains possible meaning clearly
- Suggests appropriate specialists
- Encourages timely professional care

Niraksh-Guardian addresses this missing layer between concern and consultation.

---

# 💡 Proposed Solution

Niraksh-Guardian is an AI-assisted health understanding platform that turns personal health signals into guided medical direction.

It acts as an **early health interpreter** (not a diagnosis tool) by combining symptom understanding, medical clarity tools, and specialist direction into one guided experience.

---

# ✨ Unique Value Proposition

## 🧠 Guided Symptom Interpretation

Users describe symptoms in everyday language and receive structured insights about likely meaning, urgency, and what to do next.

## 👨‍⚕️ Contextual Doctor Guidance

Instead of guessing a specialty, users receive ranked specialist suggestions linked to their symptoms with clear reasoning.

## 💬 Conversational Health Understanding

Health concerns are explored through natural, streaming chat with support for image attachments and language-aware context.

## 💊 Medical Clarity Layer

Prescriptions, medicines, and lab reports are translated into clearer explanations, improving safety and awareness.

## 🔎 Multi-Entry Health Exploration

Users can begin from symptoms, chat, medicine, disease exploration, prescription analysis, or lab reports — reflecting real-world health journeys.

---

# 🧭 Expected Outcomes

If widely adopted, Niraksh-Guardian can:

- Improve early symptom awareness
- Reduce health misinformation
- Increase appropriate specialist consultation
- Reduce anxiety from self-diagnosis
- Improve medication understanding
- Support preventive healthcare behavior

It encourages earlier and more informed healthcare decisions.

---

# 🏗️ Technical Architecture (High Level)

```
User Interface (Web App)
        ↓
AI-Assisted Health Interpretation Layer
        ↓
Medical Knowledge & Specialist Mapping
        ↓
Secure Backend Services
        ↓
Health Data & User Context
```

The architecture separates:

- User interaction
- Health reasoning
- Specialist mapping
- Secure services

to ensure scalability and safety.

---

# 💻 Technology Stack (Overview)

**Frontend**
Modern web interface with responsive, guided health flows.

**Backend**
Secure service architecture with authentication and data management.

**AI Layer**
Large language models for symptom interpretation and conversational guidance.

**Data Layer**
Structured medical and user context storage.

**Cloud Services**
Secure hosting, storage, and communication services.

---

# 🧩 Product Capabilities

Niraksh-Guardian now covers a broader set of health workflows across analysis, education, and follow-up care:

- Multi-modal analysis for symptoms, chat, prescriptions, images, and lab reports
- Streaming AI chat with image attachments and multi-language support
- Symptom analysis with contextual doctor recommendations and location-based filtering
- Personalized drug interaction checks using current medication and recent history
- Lab report analysis with risk insights and downloadable health summaries (PDF)
- Disease and medicine exploration for faster health understanding
- Centralized health history, reports, and profile context in one place
- Research-backed medical guidance with supporting references and citations
- Appointment booking with doctor availability, consultation mode, and request status
- Consent-based pre-consultation intake with red-flag triage and appointment-scoped sharing
- Doctor workspace with patient records, reviewed clinical summaries, availability windows, and prescription safety checks

---

# 🧰 Developer Quick Start

If you want to run the project locally, use the setup guides in the service-specific READMEs:

- [Backend setup](./backend/README.md)
- [Frontend setup](./frontend/README.md)

Typical local ports are `4000` for the backend API and `3000` for the frontend app.

## 🩺 Current Care Journey

The implemented patient-to-doctor flow is:

```text
Symptoms / condition
        ↓
Doctor discovery and relevance ranking
        ↓
Availability-based appointment request
        ↓
Optional appointment-linked clinical intake
        ↓ consent + 7-day shared access
Doctor reviews the AI-assisted summary
        ↓
Pre-prescription interaction check → doctor-issued prescription
```

Important safeguards:

- A doctor is bookable only when the directory record is available and the professional profile is approved.
- Availability is configured as weekly windows and slots are generated in India Standard Time (IST, UTC+05:30).
- Intake drafts expire after 30 minutes; submitted intake sharing expires after 7 days.
- The patient can revoke intake consent. Doctors can only view an active, appointment-scoped access grant.
- Triage flags are advisory safety signals; emergency or worsening symptoms require local emergency care.

## 📚 Documentation Map

- [Functional requirements](./FRD.md) — user-facing behavior and acceptance criteria
- [Technical requirements](./TRD.md) — architecture, APIs, security, and deployment
- [Backend README](./backend/README.md) — API setup and backend workflows
- [Backend system design](./backend/docs/SYSTEM_DESIGN.md)
- [Database schema](./backend/docs/DATABASE_SCHEMA.md)
- [Frontend README](./frontend/README.md) — web app setup and route groups
- [Frontend web flow](./frontend/doc/WEB_FLOW.md)
- [Frontend data flow](./frontend/doc/DATA_FLOW.md)
- [Frontend system design](./frontend/doc/SYSTEM_DESIGN.md)
- [AI service README](./ai-services/README.md) — local FastAPI/Ollama fallback

---

# 🚀 Implementation Strategy

The project follows an iterative build approach:

- **Phase 1 — Core Health Understanding:** Symptom input and interpretation flows
- **Phase 2 — Specialist Guidance:** Doctor mapping and recommendation
- **Phase 3 — Conversational Assistance:** Interactive health dialogue
- **Phase 4 — Medication & Prescription Clarity:** Drug, prescription, and lab report understanding
- **Phase 5 — Personal Health Context:** User history and reports

This staged approach supports progressive validation and usability testing.

---

# ⚠️ Risk Assessment

## Medical Misinterpretation Risk

Mitigation: Structured outputs and safety framing.

## User Over-Reliance

Mitigation: Clear medical disclaimers and professional consultation prompts.

## AI Hallucination Risk

Mitigation: Controlled health prompts and bounded responses.

## Privacy Concerns

Mitigation: Secure authentication and protected data handling.

## Adoption Barrier

Mitigation: Conversational, accessible UX.

---

# 📈 Problem Relevance

Early symptom interpretation is a universal need across demographics and geographies.

Healthcare access often begins with personal interpretation before professional care.

Improving this stage can influence:

- Preventive care behavior
- Timely diagnosis
- Health literacy
- System efficiency

The problem is globally relevant and persistent.

---

# 🌟 Innovation

Niraksh-Guardian introduces a new layer in digital health:

**Symptom → Understanding → Specialist Direction**

instead of:

**Symptom → Information Search → Confusion**

Key innovation aspects:

- Structured, explainable health guidance instead of generic search results
- Specialist direction with reasoning (not just information)
- A unified workflow across symptoms, chat, medicines, prescriptions, and lab reports

It reframes health exploration from search into guided understanding.

---

# 🧪 Feasibility

The system is feasible because:

- AI models can interpret symptom narratives and medical documents with guardrails
- Specialist mapping, caching, and modular services are structured and scalable

The project is technically implementable and incrementally expandable.

---

# 🩺 Ethical Position

Niraksh-Guardian does not diagnose or replace medical professionals.

It supports informed healthcare navigation and encourages professional consultation.

---

# 🛡️ Medical Disclaimer

Niraksh-Guardian provides informational health guidance only and does not replace professional medical diagnosis or treatment.

Users should always consult qualified healthcare professionals for medical decisions.

---

# 🌱 Vision

Niraksh-Guardian aims to become a trusted digital health companion that helps individuals understand symptoms early and move confidently toward appropriate medical care.

It represents a shift from reactive healthcare search to proactive health understanding.
