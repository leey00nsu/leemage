import { NextRequest } from "next/server";
import { withApiKeyAuth } from "@/lib/auth/api-key-auth";
import { getProjectsHandler, createProjectHandler } from "@/lib/api/projects";

async function handleGetProjects() {
  return getProjectsHandler();
}

async function handleCreateProject(req: NextRequest) {
  return createProjectHandler(req);
}

export const GET = withApiKeyAuth(handleGetProjects);
export const POST = withApiKeyAuth(handleCreateProject);
