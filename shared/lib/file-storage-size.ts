export function getStoredFileBytes(file: {
  size: number;
  url?: string | null;
  objectName?: string | null;
  variants: unknown;
}): number {
  let bytes = file.size;
  const seen = new Set<string>();
  if (file.url) seen.add(file.url);
  for (const variant of Array.isArray(file.variants) ? file.variants : []) {
    if (!variant || typeof variant.url !== "string" || seen.has(variant.url))
      continue;
    seen.add(variant.url);
    if (file.objectName && variant.url.endsWith(`/${file.objectName}`))
      continue;
    bytes += Number(variant.size) || 0;
  }
  return bytes;
}
