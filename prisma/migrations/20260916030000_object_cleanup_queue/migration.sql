CREATE TABLE "ObjectCleanupJob" (
    "provider" "StorageProvider" NOT NULL,
    "objectName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "leaseToken" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObjectCleanupJob_pkey" PRIMARY KEY ("provider", "objectName")
);

CREATE INDEX "ObjectCleanupJob_status_availableAt_idx"
  ON "ObjectCleanupJob"("status", "availableAt");
