import { NextResponse } from "next/server";

const LOG_METADATA_HEADER = "x-leemage-log-metadata";

export type RequestLogMetadata = Record<string, unknown>;

export function attachResponseLogMetadata(
  response: NextResponse,
  metadata: RequestLogMetadata,
): NextResponse {
  if (Object.keys(metadata).length === 0) {
    return response;
  }

  response.headers.set(LOG_METADATA_HEADER, JSON.stringify(metadata));
  return response;
}

export function consumeResponseLogMetadata(
  response: NextResponse,
): RequestLogMetadata | undefined {
  const raw = response.headers.get(LOG_METADATA_HEADER);
  if (!raw) return undefined;

  response.headers.delete(LOG_METADATA_HEADER);

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as RequestLogMetadata;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
