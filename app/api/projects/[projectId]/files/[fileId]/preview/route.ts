import { NextResponse } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/prisma";
import { withSessionAuth } from "@/lib/auth/session-auth";
import { StorageFactory } from "@/lib/storage";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";

// Fallback for legacy images saved without browser-compatible variants.
export const GET = withSessionAuth(
  async (
    request,
    { params }: { params: Promise<{ projectId: string; fileId: string }> },
  ) => {
    const { projectId, fileId } = await params;
    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        projectId,
        status: "COMPLETED",
        project: { userId: request.session.username! },
      },
      include: { project: { select: { storageProvider: true } } },
    });
    if (!file?.objectName || !file.mimeType.startsWith("image/"))
      return NextResponse.json(
        { message: "Preview not found." },
        { status: 404 },
      );
    try {
      const adapter = await StorageFactory.getAdapter(
        fromPrismaStorageProvider(file.project.storageProvider),
      );
      const original = await adapter.downloadObject(file.objectName);
      const preview = await sharp(original)
        .rotate()
        .resize({
          width: 480,
          height: 480,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 80 })
        .toBuffer();
      return new NextResponse(new Uint8Array(preview), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": "private, max-age=3600",
        },
      });
    } catch {
      return NextResponse.json(
        { message: "Preview unavailable for this image." },
        { status: 422 },
      );
    }
  },
);
