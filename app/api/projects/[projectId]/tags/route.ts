import { withSessionAuth } from "@/lib/auth/session-auth";
import { projectTagsHandler } from "@/lib/api/project-tags";

export const GET = withSessionAuth(async (req, context: { params: Promise<{ projectId: string }> }) => {
  const params = await context.params;
  return projectTagsHandler(req, params.projectId, req.session.username!, "list");
});

export const POST = withSessionAuth(async (req, context: { params: Promise<{ projectId: string }> }) => {
  const params = await context.params;
  return projectTagsHandler(req, params.projectId, req.session.username!, "create");
});
