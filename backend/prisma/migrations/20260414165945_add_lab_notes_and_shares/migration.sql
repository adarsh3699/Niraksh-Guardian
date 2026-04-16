-- CreateTable
CREATE TABLE "lab_report_notes" (
    "id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_report_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_report_shares" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lab_report_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lab_report_notes_component_id_idx" ON "lab_report_notes"("component_id");

-- CreateIndex
CREATE UNIQUE INDEX "lab_report_shares_token_key" ON "lab_report_shares"("token");

-- CreateIndex
CREATE INDEX "lab_report_shares_report_id_idx" ON "lab_report_shares"("report_id");

-- CreateIndex
CREATE INDEX "lab_report_shares_expires_at_idx" ON "lab_report_shares"("expires_at");

-- CreateIndex
CREATE INDEX "chats_user_id_updated_at_idx" ON "chats"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "drug_interaction_history_user_id_created_at_idx" ON "drug_interaction_history"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "medicine_history_user_id_created_at_idx" ON "medicine_history"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "messages_chat_id_created_at_idx" ON "messages"("chat_id", "created_at");

-- CreateIndex
CREATE INDEX "prescription_history_user_id_created_at_idx" ON "prescription_history"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "symptom_analysis_history_user_id_created_at_idx" ON "symptom_analysis_history"("user_id", "created_at");

-- AddForeignKey
ALTER TABLE "lab_report_notes" ADD CONSTRAINT "lab_report_notes_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "lab_report_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_report_shares" ADD CONSTRAINT "lab_report_shares_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "lab_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
