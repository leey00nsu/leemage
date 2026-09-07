import { expect, it } from "vitest";
import { getStoredFileBytes } from "@/shared/lib/file-storage-size";
it("counts the source and repeated thumbnail references only once", () => {
  expect(
    getStoredFileBytes({
      size: 1000,
      objectName: "project/source.png",
      url: null,
      variants: [
        { url: "https://cdn.example/project/source.png", size: 1000 },
        { url: "https://cdn.example/thumbnail.webp", size: 100 },
        { url: "https://cdn.example/thumbnail.webp", size: 100 },
        { url: "https://cdn.example/crop.webp", size: 200 },
      ],
    }),
  ).toBe(1300);
});
