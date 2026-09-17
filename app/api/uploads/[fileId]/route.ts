import { uploadObjectHandler } from "@/lib/api/upload-object";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> },
) {
  const { fileId } = await params;
  return uploadObjectHandler(request, fileId);
}
