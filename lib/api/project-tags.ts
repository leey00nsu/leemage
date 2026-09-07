import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyProjectOwnership } from "@/lib/auth/ownership";
import { fileTagsSchema, tagNameSchema } from "@/shared/lib/project-tags";

export const tagSelect = { id: true, projectId: true, name: true } as const;
const missing = () =>
  NextResponse.json({ message: "Resource not found." }, { status: 404 });

export async function projectTagsHandler(
  request: Request,
  projectId: string,
  userId: string,
  action: "list" | "create" | "rename" | "delete" | "apply",
  tagId?: string,
) {
  if (!(await verifyProjectOwnership(userId, projectId)).authorized)
    return missing();
  try {
    if (action === "list")
      return NextResponse.json(
        await prisma.projectTag.findMany({
          where: { projectId },
          select: tagSelect,
          orderBy: { name: "asc" },
        }),
      );
    if (action === "create") {
      const { name } = tagNameSchema.parse(await request.json());
      return NextResponse.json(
        await prisma.projectTag.create({
          data: { projectId, name, normalizedName: name.toLowerCase() },
          select: tagSelect,
        }),
        { status: 201 },
      );
    }
    if (action === "rename" || action === "delete") {
      if (
        !tagId ||
        !(await prisma.projectTag.findFirst({
          where: { id: tagId, projectId },
          select: { id: true },
        }))
      )
        return missing();
      if (action === "delete") {
        await prisma.projectTag.delete({ where: { id: tagId, projectId } });
        return NextResponse.json({
          message: "Tag deleted. Files are preserved.",
        });
      }
      const { name } = tagNameSchema.parse(await request.json());
      return NextResponse.json(
        await prisma.projectTag.update({
          where: { id: tagId, projectId },
          data: { name, normalizedName: name.toLowerCase() },
          select: tagSelect,
        }),
      );
    }
    const { fileIds, tagIds, operation } = fileTagsSchema.parse(
      await request.json(),
    );
    // Validate the whole batch before writing; foreign-project IDs never connect.
    const result = await prisma.$transaction(
      async (tx) => {
        const [files, tags] = await Promise.all([
          tx.file.count({
            where: { id: { in: fileIds }, projectId, status: "COMPLETED" },
          }),
          tx.projectTag.count({ where: { id: { in: tagIds }, projectId } }),
        ]);
        if (files !== fileIds.length || tags !== tagIds.length) return false;
        for (const id of fileIds)
          await tx.file.update({
            where: { id, projectId, status: "COMPLETED" },
            data: {
              tags: {
                [operation === "add" ? "connect" : "disconnect"]: tagIds.map(
                  (id) => ({ id, projectId }),
                ),
              },
            },
          });
        return true;
      },
      { timeout: 15000 },
    );
    return result
      ? NextResponse.json({ message: "File tags updated." })
      : missing();
  } catch (error) {
    if (error instanceof ZodError || error instanceof SyntaxError)
      return NextResponse.json(
        { message: "Invalid tag request." },
        { status: 400 },
      );
    const code =
      error && typeof error === "object" && "code" in error ? error.code : null;
    if (code === "P2002")
      return NextResponse.json(
        { message: "A tag with this name already exists." },
        { status: 409 },
      );
    if (code === "P2025" || code === "P2003") return missing();
    console.error("Project tags request failed", error);
    return NextResponse.json(
      { message: "Unable to update tags." },
      { status: 500 },
    );
  }
}
