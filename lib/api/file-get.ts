import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { tagSelect } from "@/lib/api/project-tags";
import type { ImageVariantData } from "@/entities/files/model/types";

export async function getFileHandler(
  fileId: string,
  projectId: string,
  userId: string,
) {
  const file = await prisma.file.findFirst({
    where: { id: fileId, projectId, status: "COMPLETED", project: { userId } },
    include: { tags: { select: tagSelect, orderBy: { name: "asc" } } },
  });
  if (!file)
    return NextResponse.json({ message: "File not found" }, { status: 404 });
  return NextResponse.json({
    ...file,
    thumbnail:
      (file.variants as ImageVariantData[]).find(
        (variant) => variant.label === "thumbnail",
      ) ?? null,
  });
}
