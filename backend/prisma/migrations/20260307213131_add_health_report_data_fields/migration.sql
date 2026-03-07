-- AlterTable
ALTER TABLE "health_reports" ADD COLUMN     "chat_summary" TEXT,
ADD COLUMN     "detailed_analysis" TEXT,
ADD COLUMN     "executive_summary" TEXT,
ADD COLUMN     "health_trends" TEXT,
ADD COLUMN     "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "sources" TEXT[] DEFAULT ARRAY[]::TEXT[];
