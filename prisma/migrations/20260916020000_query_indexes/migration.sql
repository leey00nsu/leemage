-- Prisma applies PostgreSQL migrations in a transaction, so these indexes
-- cannot use CREATE INDEX CONCURRENTLY here.
CREATE INDEX IF NOT EXISTS "Project_userId_createdAt_idx"
  ON "Project"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "File_projectId_status_createdAt_idx"
  ON "File"("projectId", "status", "createdAt");

CREATE INDEX IF NOT EXISTS "File_projectId_status_uploadedAt_idx"
  ON "File"("projectId", "status", "uploadedAt");

CREATE INDEX IF NOT EXISTS "ApiLog_userId_createdAt_idx"
  ON "ApiLog"("userId", "createdAt");

CREATE INDEX IF NOT EXISTS "ApiLog_userId_projectId_createdAt_idx"
  ON "ApiLog"("userId", "projectId", "createdAt");
