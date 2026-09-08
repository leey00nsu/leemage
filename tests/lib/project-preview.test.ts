import { expect, it } from "vitest";
import { projectThumbnailUrl } from "@/shared/lib/project-preview";

it("prefers shared thumbnails over original variants", () => {
  expect(
    projectThumbnailUrl([
      {
        label: "source",
        format: "png",
        size: 20,
        url: "https://assets.test/original.png",
      },
      {
        label: "thumbnail",
        format: "webp",
        size: 30,
        url: "https://assets.test/thumb.webp",
      },
    ]),
  ).toBe("https://assets.test/thumb.webp");
});
it("uses video thumbnails but never the original video", () => {
  const video = {
    label: "1920x1080",
    format: "mp4",
    size: 10,
    url: "https://assets.test/video.mp4",
  };
  expect(projectThumbnailUrl([video])).toBeNull();
  expect(
    projectThumbnailUrl([
      video,
      {
        label: "thumbnail",
        format: "jpeg",
        url: "https://assets.test/video.jpg",
      },
    ]),
  ).toBe("https://assets.test/video.jpg");
});
it("uses the smallest legacy image and handles absent or malformed previews", () => {
  expect(
    projectThumbnailUrl([
      { format: "png", size: 50, url: "https://assets.test/big.png" },
      { format: "webp", size: 5, url: "https://assets.test/small.webp" },
    ]),
  ).toBe("https://assets.test/small.webp");
  for (const value of [
    null,
    {},
    [],
    [null],
    [{ format: "png", url: "javascript:alert(1)", label: "thumbnail" }],
  ])
    expect(projectThumbnailUrl(value)).toBeNull();
});
