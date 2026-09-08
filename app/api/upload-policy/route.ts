import { NextResponse } from "next/server";
import { withSessionAuth } from "@/lib/auth/session-auth";
import { prisma } from "@/lib/prisma";
import {
  effectiveUploadLimit,
  serverUploadLimit,
} from "@/lib/api/upload-policy";

export const GET = withSessionAuth(async (request) => {
  const projectId = new URL(request.url).searchParams.get("projectId");
  const project = projectId
    ? await prisma.project.findFirst({
        where: { id: projectId, userId: request.session.username! },
        select: { maxUploadBytes: true, videoThumbnailEnabled: true },
      })
    : null;
  if (projectId && !project)
    return NextResponse.json({ message: "Project not found" }, { status: 404 });
  return NextResponse.json({
    maxUploadBytes: effectiveUploadLimit(project?.maxUploadBytes),
    serverMaxUploadBytes: serverUploadLimit(),
    videoThumbnailEnabled: project?.videoThumbnailEnabled ?? true,
  });
});
