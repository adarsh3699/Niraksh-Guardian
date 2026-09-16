-- Doctor portal foundation: roles, verified doctor profiles, availability,
-- appointments, patient access grants, safety checks, and prescriptions.

CREATE TYPE "UserRole" AS ENUM ('PATIENT', 'DOCTOR', 'ADMIN');
CREATE TYPE "DoctorVerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
CREATE TYPE "AppointmentStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'RESCHEDULED', 'CANCELLED_BY_PATIENT', 'CANCELLED_BY_DOCTOR', 'COMPLETED', 'NO_SHOW');
CREATE TYPE "ConsultationMode" AS ENUM ('IN_PERSON', 'VIDEO', 'PHONE');
CREATE TYPE "PatientAccessStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');
CREATE TYPE "DoctorPrescriptionStatus" AS ENUM ('DRAFT', 'ISSUED', 'CANCELLED');

ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'PATIENT';

CREATE TABLE "doctor_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "directory_doctor_id" TEXT,
    "license_number" TEXT,
    "verification_status" "DoctorVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "clinic_name" TEXT,
    "clinic_address" TEXT,
    "consultation_modes" "ConsultationMode"[] DEFAULT ARRAY[]::"ConsultationMode"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "doctor_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "doctor_availability" (
    "id" TEXT NOT NULL,
    "doctor_profile_id" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "slot_duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "doctor_availability_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "doctor_profile_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_minutes" INTEGER NOT NULL DEFAULT 30,
    "mode" "ConsultationMode" NOT NULL DEFAULT 'IN_PERSON',
    "status" "AppointmentStatus" NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT,
    "patient_note" TEXT,
    "doctor_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "patient_doctor_access" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_profile_id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "status" "PatientAccessStatus" NOT NULL DEFAULT 'ACTIVE',
    "granted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    CONSTRAINT "patient_doctor_access_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pre_prescription_checks" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT,
    "patient_id" TEXT NOT NULL,
    "doctor_profile_id" TEXT NOT NULL,
    "proposed_medicines" TEXT[],
    "current_medicines" TEXT[],
    "interaction_result" JSONB NOT NULL,
    "acknowledged_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "pre_prescription_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "doctor_prescriptions" (
    "id" TEXT NOT NULL,
    "appointment_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_profile_id" TEXT NOT NULL,
    "diagnosis" TEXT,
    "instructions" TEXT,
    "status" "DoctorPrescriptionStatus" NOT NULL DEFAULT 'DRAFT',
    "issued_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "doctor_prescriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "doctor_prescription_medicines" (
    "id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dosage" TEXT,
    "frequency" TEXT,
    "duration" TEXT,
    "instructions" TEXT,
    CONSTRAINT "doctor_prescription_medicines_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "doctor_profiles_user_id_key" ON "doctor_profiles"("user_id");
CREATE UNIQUE INDEX "doctor_profiles_directory_doctor_id_key" ON "doctor_profiles"("directory_doctor_id");
CREATE UNIQUE INDEX "doctor_profiles_license_number_key" ON "doctor_profiles"("license_number");
CREATE INDEX "doctor_profiles_verification_status_idx" ON "doctor_profiles"("verification_status");
CREATE UNIQUE INDEX "doctor_availability_doctor_profile_id_weekday_start_time_en_key" ON "doctor_availability"("doctor_profile_id", "weekday", "start_time", "end_time");
CREATE INDEX "doctor_availability_doctor_profile_id_weekday_is_active_idx" ON "doctor_availability"("doctor_profile_id", "weekday", "is_active");
CREATE UNIQUE INDEX "appointments_doctor_id_scheduled_at_key" ON "appointments"("doctor_id", "scheduled_at");
CREATE INDEX "appointments_patient_id_scheduled_at_idx" ON "appointments"("patient_id", "scheduled_at");
CREATE INDEX "appointments_doctor_profile_id_scheduled_at_idx" ON "appointments"("doctor_profile_id", "scheduled_at");
CREATE INDEX "appointments_status_scheduled_at_idx" ON "appointments"("status", "scheduled_at");
CREATE UNIQUE INDEX "patient_doctor_access_appointment_id_key" ON "patient_doctor_access"("appointment_id");
CREATE INDEX "patient_doctor_access_patient_id_status_expires_at_idx" ON "patient_doctor_access"("patient_id", "status", "expires_at");
CREATE INDEX "patient_doctor_access_doctor_profile_id_status_expires_at_idx" ON "patient_doctor_access"("doctor_profile_id", "status", "expires_at");
CREATE INDEX "pre_prescription_checks_patient_id_created_at_idx" ON "pre_prescription_checks"("patient_id", "created_at");
CREATE INDEX "pre_prescription_checks_doctor_profile_id_created_at_idx" ON "pre_prescription_checks"("doctor_profile_id", "created_at");
CREATE UNIQUE INDEX "doctor_prescriptions_appointment_id_key" ON "doctor_prescriptions"("appointment_id");
CREATE INDEX "doctor_prescriptions_patient_id_created_at_idx" ON "doctor_prescriptions"("patient_id", "created_at");
CREATE INDEX "doctor_prescriptions_doctor_profile_id_created_at_idx" ON "doctor_prescriptions"("doctor_profile_id", "created_at");
CREATE INDEX "doctor_prescription_medicines_prescription_id_idx" ON "doctor_prescription_medicines"("prescription_id");

ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_profiles" ADD CONSTRAINT "doctor_profiles_directory_doctor_id_fkey" FOREIGN KEY ("directory_doctor_id") REFERENCES "doctors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "doctor_availability" ADD CONSTRAINT "doctor_availability_doctor_profile_id_fkey" FOREIGN KEY ("doctor_profile_id") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_profile_id_fkey" FOREIGN KEY ("doctor_profile_id") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "patient_doctor_access" ADD CONSTRAINT "patient_doctor_access_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_doctor_access" ADD CONSTRAINT "patient_doctor_access_doctor_profile_id_fkey" FOREIGN KEY ("doctor_profile_id") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "patient_doctor_access" ADD CONSTRAINT "patient_doctor_access_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pre_prescription_checks" ADD CONSTRAINT "pre_prescription_checks_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pre_prescription_checks" ADD CONSTRAINT "pre_prescription_checks_doctor_profile_id_fkey" FOREIGN KEY ("doctor_profile_id") REFERENCES "doctor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_prescriptions" ADD CONSTRAINT "doctor_prescriptions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_prescriptions" ADD CONSTRAINT "doctor_prescriptions_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "doctor_prescriptions" ADD CONSTRAINT "doctor_prescriptions_doctor_profile_id_fkey" FOREIGN KEY ("doctor_profile_id") REFERENCES "doctor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "doctor_prescription_medicines" ADD CONSTRAINT "doctor_prescription_medicines_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "doctor_prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
