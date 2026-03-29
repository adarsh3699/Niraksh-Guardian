-- Persist Symptom Relationship Intelligence data for history rehydration
ALTER TABLE "symptom_analysis_history"
ADD COLUMN "duration" TEXT,
ADD COLUMN "need_more_info" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "suggested_symptoms" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "follow_up_message" TEXT,
ADD COLUMN "relationship" JSONB,
ADD COLUMN "insight" JSONB;
