-- AlterTable: Add new fields to lab_report_components
ALTER TABLE "lab_report_components"
ADD COLUMN "category" TEXT,
ADD COLUMN "ai_insight" TEXT,
ADD COLUMN "urgency" TEXT,
ADD COLUMN "symptom_connections" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "related_conditions" JSONB,
ADD COLUMN "trend" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
ADD COLUMN "what_to_do_next" TEXT;

-- CreateIndex: Add index on category column
CREATE INDEX "lab_report_components_category_idx" ON "lab_report_components"("category");
