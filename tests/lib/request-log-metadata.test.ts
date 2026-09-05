import { describe, expect, it } from "vitest";
import { NextResponse } from "next/server";
import {
  attachResponseLogMetadata,
  consumeResponseLogMetadata,
} from "@/lib/api/request-log-metadata";
import { validateFileName } from "@/lib/validation/file-validator";

describe("upload filenames in response metadata", () => {
  it.each([
    "한글 파일 이름.png",
    "한글 사진.webp",
    "hello world 100%.jpg",
    "사진 😀.png",
  ])("round-trips %s without invalid HTTP headers", (fileName) => {
    expect(validateFileName(fileName).valid).toBe(true);
    const response = attachResponseLogMetadata(
      NextResponse.json({ ok: true }),
      { fileName },
    );
    expect(response.headers.get("x-leemage-log-metadata")).toMatch(
      /^[\x20-\x7e]+$/,
    );
    expect(consumeResponseLogMetadata(response)).toEqual({ fileName });
    expect(response.headers.has("x-leemage-log-metadata")).toBe(false);
  });
});
