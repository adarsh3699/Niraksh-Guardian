-- Clear existing doctors first (we'll re-seed with new schema)
DELETE FROM "doctors";

-- Drop old column and indexes
DROP INDEX IF EXISTS "doctors_location_idx";
ALTER TABLE "doctors" DROP COLUMN IF EXISTS "location";

-- Add new columns
ALTER TABLE "doctors" ADD COLUMN "city" TEXT NOT NULL;
ALTER TABLE "doctors" ADD COLUMN "state" TEXT NOT NULL;
ALTER TABLE "doctors" ADD COLUMN "rating" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "doctors" ADD COLUMN "qualification" TEXT;
ALTER TABLE "doctors" ADD COLUMN "phone" TEXT;

-- Create indexes
CREATE INDEX "doctors_city_idx" ON "doctors"("city");
CREATE INDEX "doctors_state_idx" ON "doctors"("state");
CREATE INDEX "doctors_rating_idx" ON "doctors"("rating");
CREATE INDEX "doctors_consultation_fee_idx" ON "doctors"("consultation_fee");
