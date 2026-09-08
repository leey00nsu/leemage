import { afterEach, expect, it, vi } from "vitest";
import {
  effectiveUploadLimit,
  serverUploadLimit,
  uploadLimitError,
} from "@/lib/api/upload-policy";
import { projectUploadFields, MIB } from "@/shared/lib/upload-policy";
import { z } from "zod";
afterEach(() => vi.unstubAllEnvs());
it("keeps the existing 50 MiB default and supports larger per-project limits", () => {
  vi.stubEnv("UPLOAD_MAX_FILE_SIZE_MB", "500");
  expect(effectiveUploadLimit()).toBe(50 * MIB);
  expect(uploadLimitError(80 * MIB, 100 * MIB)).toBeNull();
  expect(uploadLimitError(100 * MIB, 100 * MIB)).toBeNull();
  expect(uploadLimitError(100 * MIB + 1, 100 * MIB)?.status).toBe(413);
});
it("applies the server ceiling even to an older, larger project setting", () => {
  vi.stubEnv("UPLOAD_MAX_FILE_SIZE_MB", "75");
  expect(effectiveUploadLimit(200 * MIB)).toBe(75 * MIB);
});
it("bounds configuration and rejects invalid project limits", () => {
  vi.stubEnv("UPLOAD_MAX_FILE_SIZE_MB", "NaN");
  expect(serverUploadLimit()).toBe(500 * MIB);
  const schema = z.object(projectUploadFields);
  for (const size of [0, -1, 1.5, 1025 * MIB])
    expect(schema.safeParse({ maxUploadBytes: size }).success).toBe(false);
  expect(schema.parse({})).toEqual({});
});
