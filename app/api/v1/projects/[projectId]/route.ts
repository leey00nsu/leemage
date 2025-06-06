import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import {
  getProjectDetailsHandler,
  deleteProjectHandler,
} from "@/lib/api/project-details";

// --- 핸들러 export (withApiKeyAuth 적용) ---
export const GET = withApiKeyAuth(async (req, context) => {
  const params = (await context.params) as { projectId: string };
  return getProjectDetailsHandler(params.projectId);
});

export const DELETE = withApiKeyAuth(async (req, context) => {
  const params = (await context.params) as { projectId: string };
  return deleteProjectHandler(params.projectId);
});
