-- CreateEnum
CREATE TYPE "StorageProvider" AS ENUM ('OCI', 'R2');

-- CreateEnum
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');

-- AlterTable
ALTER TABLE "Image" ADD COLUMN     "isImage" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "mimeType" TEXT NOT NULL DEFAULT 'application/octet-stream',
ADD COLUMN     "objectName" TEXT,
ADD COLUMN     "size" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "url" TEXT;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "storageProvider" "StorageProvider" NOT NULL DEFAULT 'OCI';

-- CreateIndex
CREATE INDEX "Image_status_createdAt_idx" ON "Image"("status", "createdAt");
