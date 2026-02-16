-- CreateTable
CREATE TABLE "symptom_analysis_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "symptoms" TEXT[],
    "image_url" TEXT,
    "predicted_conditions" JSONB NOT NULL,
    "urgency_level" TEXT NOT NULL,
    "recommended_specialist" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "symptom_analysis_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patient_health_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "health_risk_score" INTEGER NOT NULL DEFAULT 0,
    "blood_group" TEXT,
    "allergies" TEXT[],
    "chronic_conditions" TEXT[],
    "emergency_contact_name" TEXT,
    "emergency_contact_phone" TEXT,
    "emergency_contact_email" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_health_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "symptom_analysis_history_user_id_idx" ON "symptom_analysis_history"("user_id");

-- CreateIndex
CREATE INDEX "symptom_analysis_history_created_at_idx" ON "symptom_analysis_history"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "patient_health_profiles_user_id_key" ON "patient_health_profiles"("user_id");

-- AddForeignKey
ALTER TABLE "symptom_analysis_history" ADD CONSTRAINT "symptom_analysis_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_health_profiles" ADD CONSTRAINT "patient_health_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
