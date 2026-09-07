import { parseTagFilter } from "@/shared/lib/project-tags";
import { tagSelect } from "@/lib/api/project-tags";
import { variantBytesSql } from "@/lib/storage/variant-bytes-sql";
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
    let tagFilter;
    try { tagFilter = parseTagFilter(query); }
    catch { return NextResponse.json({ message: "Invalid tag filter." }, { status: 400 }); }
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
      SELECT COUNT(*) AS count, COALESCE(SUM(size::bigint + ${variantBytesSql}), 0)::bigint AS bytes FROM "File" WHERE "projectId" = ${projectId} AND status = 'COMPLETED'
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
      ...tagFilter,
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
      include: { tags: { select: tagSelect, orderBy: { name: "asc" } } },
    });
    return NextResponse.json({
      ...project,
      storageProvider: fromPrismaStorageProvider(project.storageProvider),
      files: files.map(file => ({ ...file, thumbnail: Array.isArray(file.variants) ? file.variants.find(v => v && typeof v === "object" && !Array.isArray(v) && v.label === "thumbnail") ?? null : null })),
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
