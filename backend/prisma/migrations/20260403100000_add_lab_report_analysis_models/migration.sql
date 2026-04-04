CREATE TABLE "lab_reports" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "file_url" TEXT NOT NULL,
  "file_public_id" TEXT,
  "file_name" TEXT NOT NULL,
  "mime_type" TEXT NOT NULL,
  "extracted_text" TEXT,
  "overall_summary" TEXT,
  "overall_risk" TEXT NOT NULL DEFAULT 'low',
  "abnormal_count" INTEGER NOT NULL DEFAULT 0,
  "total_count" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lab_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lab_report_components" (
  "id" TEXT NOT NULL,
  "report_id" TEXT NOT NULL,
  "component_name" TEXT NOT NULL,
  "observed_value" DOUBLE PRECISION,
  "observed_raw" TEXT,
  "unit" TEXT,
  "reference_min" DOUBLE PRECISION,
  "reference_max" DOUBLE PRECISION,
  "status" TEXT NOT NULL,
  "effect_summary" TEXT,
  "risk_tag" TEXT,
  "confidence" DOUBLE PRECISION,
  "source_snippet" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "lab_report_components_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "lab_reports_user_id_idx" ON "lab_reports"("user_id");
CREATE INDEX "lab_reports_created_at_idx" ON "lab_reports"("created_at");
CREATE INDEX "lab_report_components_report_id_idx" ON "lab_report_components"("report_id");
CREATE INDEX "lab_report_components_status_idx" ON "lab_report_components"("status");

ALTER TABLE "lab_reports"
  ADD CONSTRAINT "lab_reports_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lab_report_components"
  ADD CONSTRAINT "lab_report_components_report_id_fkey"
  FOREIGN KEY ("report_id") REFERENCES "lab_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
