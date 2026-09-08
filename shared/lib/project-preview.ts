export interface ProjectPreviewFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailUrl: string | null;
}

/** Reuse stored previews; never download an original video for a project card. */
export function projectThumbnailUrl(variants: unknown): string | null {
  if (!Array.isArray(variants)) return null;
  const previews = variants.filter(
    (variant) =>
      variant &&
      typeof variant.url === "string" &&
      /^(jpeg|jpg|png|webp|avif|gif)$/i.test(variant.format ?? "") &&
      /^https?:\/\//i.test(variant.url),
  );
  const thumbnail = previews.find((variant) => variant.label === "thumbnail");
  if (thumbnail) return thumbnail.url;
  // Older uploads may only have image variants; use their smallest preview.
  return (
    previews
      .filter((variant) => Number.isFinite(variant.size) && variant.size >= 0)
      .sort((a, b) => a.size - b.size)[0]?.url ?? null
  );
}
