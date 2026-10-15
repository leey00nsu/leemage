import { deleteFilesRequestHandler } from "@/lib/api/file-delete";
import { withSessionAuth } from "@/lib/auth/session-auth";

export const POST = withSessionAuth(
  async (request, context: { params: Promise<{ projectId: string }> }) => {
    const { projectId } = await context.params;
    return deleteFilesRequestHandler(request, projectId, request.session.username!);
  },
);
