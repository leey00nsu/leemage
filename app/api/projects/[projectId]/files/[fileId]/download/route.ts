import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withSessionAuth } from "@/lib/auth/session-auth";
import { StorageFactory } from "@/lib/storage";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";

type ImageVariantData = {
  url: string;
  width: number;
  height: number;
  size: number;
  format: string;
  label: string;
};

function variantObjectName(
  projectId: string,
  fileObjectName: string,
  variants: ImageVariantData[],
  selectedVariant: ImageVariantData,
) {
  // The first stored variant is the source object.
  if (selectedVariant === variants[0]) return fileObjectName;

  try {
    const parts = decodeURIComponent(new URL(selectedVariant.url).pathname)
      .split("/")
      .filter(Boolean);
    const objectName = parts.slice(-2).join("/");
    return objectName.startsWith(`${projectId}/`) ? objectName : null;
  } catch {
    return null;
  }
}

export const GET = withSessionAuth(
  async (
    request,
    { params }: { params: Promise<{ projectId: string; fileId: string }> },
  ) => {
    const { projectId, fileId } = await params;
    const variantLabel = request.nextUrl.searchParams.get("variant");

    const file = await prisma.file.findFirst({
      where: {
        id: fileId,
        projectId,
        status: "COMPLETED",
        project: { userId: request.session.username! },
      },
      include: { project: { select: { storageProvider: true } } },
    });

    if (!file?.objectName) {
      return NextResponse.json(
        { message: "File not found." },
        { status: 404 },
      );
    }

    let objectName = file.objectName;
    if (file.isImage) {
      const variants = Array.isArray(file.variants)
        ? (file.variants as ImageVariantData[])
        : [];
      const selectedVariant = variantLabel
        ? variants.find((variant) => variant.label === variantLabel)
        : variants[0];

      if (!selectedVariant) {
        return NextResponse.json(
          {
            message: variantLabel
              ? `Variant '${variantLabel}' not found.`
              : "No downloadable image variant available.",
          },
          { status: 404 },
        );
      }

      const selectedObjectName = variantObjectName(
        projectId,
        file.objectName,
        variants,
        selectedVariant,
      );
      if (!selectedObjectName) {
        return NextResponse.json(
          { message: "Invalid image variant." },
          { status: 422 },
        );
      }
      objectName = selectedObjectName;
    }

    try {
      const adapter = await StorageFactory.getAdapter(
        fromPrismaStorageProvider(file.project.storageProvider),
      );
      const access = await adapter.createReadAccess(objectName);
      const response = NextResponse.redirect(access.url, 307);
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    } catch {
      return NextResponse.json(
        { message: "Download is temporarily unavailable." },
        { status: 503 },
      );
    }
  },
);
