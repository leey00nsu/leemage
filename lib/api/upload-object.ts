import { createHash, timingSafeEqual } from "node:crypto";
import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StorageFactory } from "@/lib/storage";
import { fromPrismaStorageProvider } from "@/lib/storage/utils";
import { apiLogger, getSafeErrorMetadata } from "@/lib/logging/secure-logger";

function tokenMatches(token: string, expectedHash: string) {
  const actual = Buffer.from(
    createHash("sha256").update(token).digest("hex"),
    "hex",
  );
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function boundedBody(body: ReadableStream<Uint8Array>, expectedBytes: number) {
  return Readable.from(
    (async function* () {
      let receivedBytes = 0;
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          receivedBytes += value.byteLength;
          if (receivedBytes > expectedBytes) {
            throw new Error("UPLOAD_BODY_TOO_LARGE");
          }
          yield Buffer.from(value);
        }
        if (receivedBytes !== expectedBytes) {
          throw new Error("UPLOAD_BODY_SIZE_MISMATCH");
        }
      } finally {
        reader.releaseLock();
      }
    })(),
  );
}

export async function uploadObjectHandler(
  request: NextRequest,
  fileId: string,
) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ message: "Upload not found." }, { status: 404 });
  }

  const file = await prisma.file.findUnique({
    where: { id: fileId },
    select: {
      status: true,
      size: true,
      mimeType: true,
      uploadObjectName: true,
      uploadTokenHash: true,
      uploadExpiresAt: true,
      project: { select: { storageProvider: true } },
    },
  });

  if (
    !file ||
    file.status !== "PENDING" ||
    !file.uploadObjectName ||
    !file.uploadTokenHash ||
    !file.uploadExpiresAt ||
    file.uploadExpiresAt <= new Date() ||
    !tokenMatches(token, file.uploadTokenHash)
  ) {
    return NextResponse.json({ message: "Upload not found." }, { status: 404 });
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(contentLength) || contentLength !== file.size) {
    return NextResponse.json(
      { message: "Upload size does not match the reservation." },
      { status: 413 },
    );
  }
  if (request.headers.get("content-type") !== file.mimeType) {
    return NextResponse.json(
      { message: "Upload content type does not match the reservation." },
      { status: 400 },
    );
  }
  if (!request.body) {
    return NextResponse.json(
      { message: "Upload body is required." },
      { status: 400 },
    );
  }

  try {
    const adapter = await StorageFactory.getAdapter(
      fromPrismaStorageProvider(file.project.storageProvider),
    );
    await adapter.uploadObjectStream(
      file.uploadObjectName,
      boundedBody(request.body, file.size),
      file.mimeType,
      file.size,
    );
    const uploaded = await adapter.getObjectMetadata(file.uploadObjectName);
    if (uploaded.size !== file.size) {
      throw new Error("UPLOADED_OBJECT_SIZE_MISMATCH");
    }
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    apiLogger.warn("file.upload.failed", {
      fileId,
      ...getSafeErrorMetadata(error),
    });
    return NextResponse.json(
      { message: "File upload failed." },
      { status: 502 },
    );
  }
}
