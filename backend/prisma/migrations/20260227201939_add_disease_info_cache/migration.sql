-- CreateTable
CREATE TABLE "disease_info_cache" (
    "id" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "response" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "disease_info_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "disease_info_cache_expires_at_idx" ON "disease_info_cache"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "disease_info_cache_topic_language_key" ON "disease_info_cache"("topic", "language");
