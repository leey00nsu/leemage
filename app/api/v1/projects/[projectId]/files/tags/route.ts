import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import { projectTagsHandler } from "@/lib/api/project-tags";

export const PUT = withApiKeyAuth(async (req, context: { params: Promise<{ projectId: string }> }, userId) => {
  const params = await context.params;
  return projectTagsHandler(req, params.projectId, userId, "apply");
});
