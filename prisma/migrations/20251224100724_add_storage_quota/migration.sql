-- CreateTable
CREATE TABLE "StorageQuota" (
    "id" TEXT NOT NULL,
    "provider" "StorageProvider" NOT NULL,
    "quotaBytes" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StorageQuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StorageQuota_provider_key" ON "StorageQuota"("provider");
