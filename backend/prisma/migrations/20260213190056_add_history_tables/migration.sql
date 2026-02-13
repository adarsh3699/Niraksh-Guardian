-- CreateTable
CREATE TABLE "medicine_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "medicine_name" TEXT,
    "analysis_result" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicine_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prescription_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "extracted_text" TEXT NOT NULL,
    "analysis_result" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "prescription_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drug_interaction_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "drugs" TEXT[],
    "interaction_result" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drug_interaction_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medicine_history_user_id_idx" ON "medicine_history"("user_id");

-- CreateIndex
CREATE INDEX "medicine_history_created_at_idx" ON "medicine_history"("created_at");

-- CreateIndex
CREATE INDEX "prescription_history_user_id_idx" ON "prescription_history"("user_id");

-- CreateIndex
CREATE INDEX "prescription_history_created_at_idx" ON "prescription_history"("created_at");

-- CreateIndex
CREATE INDEX "drug_interaction_history_user_id_idx" ON "drug_interaction_history"("user_id");

-- CreateIndex
CREATE INDEX "drug_interaction_history_created_at_idx" ON "drug_interaction_history"("created_at");

-- CreateIndex
CREATE INDEX "messages_chat_id_idx" ON "messages"("chat_id");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- AddForeignKey
ALTER TABLE "medicine_history" ADD CONSTRAINT "medicine_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prescription_history" ADD CONSTRAINT "prescription_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drug_interaction_history" ADD CONSTRAINT "drug_interaction_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
