-- AlterTable
ALTER TABLE "doctors" ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
