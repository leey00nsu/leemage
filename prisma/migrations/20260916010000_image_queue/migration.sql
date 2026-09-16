-- CreateTable
CREATE TABLE "ImageJob" (
    "id" TEXT NOT NULL,
    "variants" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "leaseToken" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImageJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImageJob_status_availableAt_idx" ON "ImageJob"("status", "availableAt");

-- AddForeignKey
ALTER TABLE "ImageJob" ADD CONSTRAINT "ImageJob_id_fkey" FOREIGN KEY ("id") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
