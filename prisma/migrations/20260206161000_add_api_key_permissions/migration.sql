-- AlterTable
ALTER TABLE "ApiKey"
ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY['read', 'write', 'delete']::TEXT[];

-- Backfill existing API keys with full access
UPDATE "ApiKey"
SET "permissions" = ARRAY['read', 'write', 'delete']::TEXT[]
WHERE "permissions" IS NULL
   OR array_length("permissions", 1) IS NULL;
