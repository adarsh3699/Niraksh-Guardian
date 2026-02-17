-- CreateTable
CREATE TABLE "health_reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "report_url" TEXT NOT NULL,
    "public_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "health_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "health_reports_user_id_idx" ON "health_reports"("user_id");

-- CreateIndex
CREATE INDEX "health_reports_created_at_idx" ON "health_reports"("created_at");

-- AddForeignKey
ALTER TABLE "health_reports" ADD CONSTRAINT "health_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
