import { withSessionAuth } from "@/lib/auth/session-auth";
import { projectTagsHandler } from "@/lib/api/project-tags";

export const PUT = withSessionAuth(async (req, context: { params: Promise<{ projectId: string; tagId: string }> }) => {
  const params = await context.params;
  return projectTagsHandler(req, params.projectId, req.session.username!, "rename", params.tagId);
});

export const DELETE = withSessionAuth(async (req, context: { params: Promise<{ projectId: string; tagId: string }> }) => {
  const params = await context.params;
  return projectTagsHandler(req, params.projectId, req.session.username!, "delete", params.tagId);
});
