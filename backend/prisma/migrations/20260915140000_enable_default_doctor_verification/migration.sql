-- Temporary development mode: doctor profiles are verified by default.
UPDATE "doctor_profiles"
SET "verification_status" = 'APPROVED'
WHERE "verification_status" = 'PENDING';

ALTER TABLE "doctor_profiles"
    ALTER COLUMN "verification_status" SET DEFAULT 'APPROVED';
