-- Structured pre-consultation intake, consent, triage, and patient timeline support.

CREATE TYPE "ClinicalIntakeStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'REVIEWED', 'EXPIRED');
CREATE TYPE "ClinicalTriageLevel" AS ENUM ('ROUTINE', 'URGENT', 'EMERGENCY');

CREATE TABLE "clinical_intake_sessions" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "status" "ClinicalIntakeStatus" NOT NULL DEFAULT 'DRAFT',
    "chief_complaint" TEXT,
    "hpi" JSONB NOT NULL DEFAULT '{}',
    "ros" JSONB NOT NULL DEFAULT '{}',
    "medication_notes" TEXT,
    "allergy_notes" TEXT,
    "summary_draft" TEXT,
    "summary_edited" TEXT,
    "triage_level" "ClinicalTriageLevel" NOT NULL DEFAULT 'ROUTINE',
    "triage_reasons" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "triage_message" TEXT,
    "consent_version" TEXT,
    "consent_granted_at" TIMESTAMP(3),
    "consent_revoked_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_doctor_profile_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clinical_intake_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "clinical_timeline_entries" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "event_date" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "clinical_timeline_entries_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "clinical_intake_sessions_appointment_id_key" ON "clinical_intake_sessions"("appointment_id");
CREATE INDEX "clinical_intake_sessions_patient_id_status_expires_at_idx" ON "clinical_intake_sessions"("patient_id", "status", "expires_at");
CREATE INDEX "clinical_intake_sessions_appointment_id_status_idx" ON "clinical_intake_sessions"("appointment_id", "status");
CREATE INDEX "clinical_timeline_entries_patient_id_event_date_idx" ON "clinical_timeline_entries"("patient_id", "event_date");
CREATE INDEX "clinical_timeline_entries_patient_id_source_type_idx" ON "clinical_timeline_entries"("patient_id", "source_type");

ALTER TABLE "clinical_intake_sessions" ADD CONSTRAINT "clinical_intake_sessions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "clinical_intake_sessions" ADD CONSTRAINT "clinical_intake_sessions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clinical_intake_sessions" ADD CONSTRAINT "clinical_intake_sessions_reviewed_by_doctor_profile_id_fkey" FOREIGN KEY ("reviewed_by_doctor_profile_id") REFERENCES "doctor_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "clinical_timeline_entries" ADD CONSTRAINT "clinical_timeline_entries_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
