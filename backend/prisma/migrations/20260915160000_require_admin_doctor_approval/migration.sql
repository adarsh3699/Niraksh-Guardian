-- Switch doctor publishing back to an explicit admin verification workflow.
ALTER TABLE "doctor_profiles"
    ALTER COLUMN "verification_status" SET DEFAULT 'PENDING';

-- Existing portal doctor profiles must be reviewed before they are public.
UPDATE "doctor_profiles" AS p
SET "verification_status" = 'PENDING',
    "updated_at" = CURRENT_TIMESTAMP
FROM "users" AS u
WHERE p."user_id" = u."id"
  AND u."role" = 'DOCTOR';

-- Keep pending/rejected/suspended portal doctors out of the public directory.
UPDATE "doctors" AS d
SET "is_available" = false,
    "updated_at" = CURRENT_TIMESTAMP
WHERE EXISTS (
    SELECT 1
    FROM "doctor_profiles" AS p
    WHERE p."directory_doctor_id" = d."id"
      AND p."verification_status" <> 'APPROVED'
);

-- Do not leave historical patient access active for unapproved doctors.
UPDATE "patient_doctor_access" AS a
SET "status" = 'REVOKED',
    "revoked_at" = CURRENT_TIMESTAMP
WHERE a."status" = 'ACTIVE'
  AND EXISTS (
    SELECT 1
    FROM "doctor_profiles" AS p
    WHERE p."id" = a."doctor_profile_id"
      AND p."verification_status" <> 'APPROVED'
  );

-- A cancelled slot should become bookable again. Replace the old full unique
-- constraint with uniqueness only for active appointment states.
DROP INDEX IF EXISTS "appointments_doctor_id_scheduled_at_key";
CREATE UNIQUE INDEX "appointments_active_doctor_id_scheduled_at_key"
ON "appointments" ("doctor_id", "scheduled_at")
WHERE "status" IN ('REQUESTED'::"AppointmentStatus", 'CONFIRMED'::"AppointmentStatus", 'RESCHEDULED'::"AppointmentStatus");
