-- AlterTable
ALTER TABLE "symptom_analysis_history" ADD COLUMN     "home_remedies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reasoning" TEXT,
ADD COLUMN     "severity" TEXT;
