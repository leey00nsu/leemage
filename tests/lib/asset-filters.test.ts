import { expect, it } from "vitest";
import { getFileType, getFormatKey } from "@/shared/lib/asset-filters";
it.each([
  ["image/svg+xml", "IMAGE"],
  ["video/mp4", "VIDEO"],
  ["audio/mpeg", "AUDIO"],
  ["application/pdf", "DOCUMENT"],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "DOCUMENT",
  ],
  ["application/zip", "ARCHIVE"],
  ["text/plain; charset=utf-8", "DOCUMENT"],
  ["application/octet-stream", "OTHER"],
])("classifies %s", (mimeType, expected) =>
  expect(getFileType({ mimeType })).toBe(expected),
);
it("keeps MIME namespaces separate", () => {
  expect(getFormatKey("Audio/WebM; codecs=opus")).toBe("audio/webm");
  expect(getFormatKey("video/webm")).not.toBe(getFormatKey("audio/webm"));
});
