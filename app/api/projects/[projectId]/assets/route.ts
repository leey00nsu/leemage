import { NextResponse } from "next/server";
import { withSessionAuth } from "@/lib/auth/session-auth";
import { verifyProjectOwnership } from "@/lib/auth/ownership";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import {
  fileTypes,
  getAssetPageSize,
  type FileTypeFilter,
  getFileType,
  getFormatKey,
} from "@/shared/lib/asset-filters";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";

export const GET = withSessionAuth(
  async (request, { params }: { params: Promise<{ projectId: string }> }) => {
    const { projectId } = await params;
    if (
      !(await verifyProjectOwnership(request.session.username!, projectId))
        .authorized
    ) {
      return NextResponse.json(
        { message: "Resource not found." },
        { status: 404 },
      );
    }
    const query = new URL(request.url).searchParams;
    const requestedPage = Math.max(
      1,
      Math.min(1000000, Number(query.get("page")) || 1),
    );
    const pageSize = getAssetPageSize(query.get("pageSize"));
    const base = { projectId, status: "COMPLETED" as const };
    const [project, mimeTypes, totals] = await Promise.all([
      prisma.project.findUniqueOrThrow({
        where: { id: projectId },
        omit: { userId: true },
      }),
      prisma.file.findMany({
        where: base,
        distinct: ["mimeType"],
        select: { mimeType: true },
      }),
      prisma.$queryRaw<{ count: bigint; bytes: bigint }[]>(Prisma.sql`
      SELECT COUNT(*) AS count, COALESCE(SUM(size::bigint + COALESCE((
        SELECT SUM((v->>'size')::bigint) FROM jsonb_array_elements(variants::jsonb) v
      ), 0)), 0)::bigint AS bytes FROM "File" WHERE "projectId" = ${projectId} AND status = 'COMPLETED'
    `),
    ]);
    const type = fileTypes.includes(query.get("type") as FileTypeFilter)
      ? query.get("type")!
      : "ALL";
    const format = query.get("format") || "ALL";
    const matchingMimes = mimeTypes
      .filter(
        (f) =>
          (type === "ALL" || getFileType(f) === type) &&
          (format === "ALL" || getFormatKey(f.mimeType) === format),
      )
      .map((f) => f.mimeType);
    const where: Prisma.FileWhereInput = {
      ...base,
      mimeType: { in: matchingMimes },
      name: {
        contains: (query.get("search") || "").trim(),
        mode: "insensitive",
      },
    };
    const orders: Record<string, Prisma.FileOrderByWithRelationInput> = {
      NEWEST: { createdAt: "desc" },
      OLDEST: { createdAt: "asc" },
      NAME_ASC: { name: "asc" },
      NAME_DESC: { name: "desc" },
      SIZE_DESC: { size: "desc" },
    };
    const total = await prisma.file.count({ where });
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.floor(requestedPage), pageCount);
    const files = await prisma.file.findMany({
      where,
      orderBy: [
        orders[query.get("sort") || ""] || orders.NEWEST,
        { id: "asc" },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return NextResponse.json({
      ...project,
      storageProvider: fromPrismaStorageProvider(project.storageProvider),
      files,
      total,
      page,
      pageCount,
      pageSize,
      fileCount: Number(totals[0].count),
      totalBytes: Number(totals[0].bytes),
      formats: [
        ...new Set(mimeTypes.map((f) => getFormatKey(f.mimeType))),
      ].sort(),
    });
  },
);
