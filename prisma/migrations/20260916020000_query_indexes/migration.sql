-- These indexes are created concurrently so deploys do not block reads/writes
-- while existing production tables are scanned.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "Project_userId_createdAt_idx"
  ON "Project"("userId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "File_projectId_status_createdAt_idx"
  ON "File"("projectId", "status", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "File_projectId_status_uploadedAt_idx"
  ON "File"("projectId", "status", "uploadedAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ApiLog_userId_createdAt_idx"
  ON "ApiLog"("userId", "createdAt");

CREATE INDEX CONCURRENTLY IF NOT EXISTS "ApiLog_userId_projectId_createdAt_idx"
  ON "ApiLog"("userId", "projectId", "createdAt");
