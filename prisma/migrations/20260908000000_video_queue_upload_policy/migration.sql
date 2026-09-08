-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "maxUploadBytes" INTEGER NOT NULL DEFAULT 52428800,
ADD COLUMN     "videoThumbnailEnabled" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "processingStatus" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "uploadedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "VideoJob" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leaseUntil" TIMESTAMP(3),
    "leaseToken" TEXT,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoJob_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoJob_status_availableAt_idx" ON "VideoJob"("status", "availableAt");

-- AddForeignKey
ALTER TABLE "VideoJob" ADD CONSTRAINT "VideoJob_id_fkey" FOREIGN KEY ("id") REFERENCES "File"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Preserve the previously displayed completion time for existing uploads.
UPDATE "File" SET "uploadedAt" = "updatedAt" WHERE status = 'COMPLETED';
