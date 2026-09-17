ALTER TABLE "File" ADD COLUMN "uploadObjectName" TEXT;
ALTER TABLE "File" ADD COLUMN "uploadTokenHash" TEXT;
ALTER TABLE "File" ADD COLUMN "uploadExpiresAt" TIMESTAMP(3);

-- Existing pending URLs point at objectName. Preserve that path as the upload
-- source while moving the server-owned final path out of the client's reach.
UPDATE "File"
SET
  "uploadObjectName" = "objectName",
  "objectName" = "objectName" || '.stored'
WHERE status = 'PENDING' AND "objectName" IS NOT NULL;
