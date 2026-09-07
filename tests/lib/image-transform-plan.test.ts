import { expect, it } from "vitest";
import { planImageTransforms } from "@/shared/lib/image-transform-plan";

it("keeps small thumbnails at their original dimensions", () => {
  expect(planImageTransforms(120, 60, "png", [])).toEqual([
    expect.objectContaining({ width: 120, height: 60, thumbnail: true }),
  ]);
});

it("uses integer proportional dimensions for width requests even with cover fit", () => {
  const outputs = planImageTransforms(1500, 1001, "png", [
    { sizeLabel: "max800", format: "jpeg", fit: "cover" },
  ]);
  expect(outputs[1]).toMatchObject({ width: 800, height: 534, fit: "inside" });
});

it("rejects unknown source dimensions before planning outputs", () => {
  expect(() => planImageTransforms(0, 0, "png", [])).toThrow(
    "Invalid original image dimensions",
  );
});
