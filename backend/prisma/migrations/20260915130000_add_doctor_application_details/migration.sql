-- Store professional details submitted during doctor onboarding.
ALTER TABLE "doctor_profiles"
    ADD COLUMN "verification_note" TEXT,
    ADD COLUMN "display_name" TEXT,
    ADD COLUMN "specialization" TEXT,
    ADD COLUMN "qualification" TEXT,
    ADD COLUMN "experience_years" INTEGER,
    ADD COLUMN "consultation_fee" INTEGER,
    ADD COLUMN "city" TEXT,
    ADD COLUMN "state" TEXT,
    ADD COLUMN "bio" TEXT,
    ADD COLUMN "contact_info" TEXT,
    ADD COLUMN "phone" TEXT;
