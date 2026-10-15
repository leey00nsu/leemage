import { deleteFilesRequestHandler } from "@/lib/api/file-delete";
import { withApiKeyAuth } from "@/lib/auth/api-key-auth";

export const POST = withApiKeyAuth(
  async (request, context, userId) => {
    const { projectId } = (await context.params) as { projectId: string };
    return deleteFilesRequestHandler(request, projectId, userId);
  },
  { permissionMethod: "DELETE" },
);
