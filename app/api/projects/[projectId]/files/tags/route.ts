import { withSessionAuth } from "@/lib/auth/session-auth";
import { projectTagsHandler } from "@/lib/api/project-tags";

export const PUT = withSessionAuth(async (req, context: { params: Promise<{ projectId: string }> }) => {
  const params = await context.params;
  return projectTagsHandler(req, params.projectId, req.session.username!, "apply");
});
