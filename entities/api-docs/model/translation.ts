import type { TranslationGetter } from "./openapi-transformer";

/** next-intl reports missing messages before returning a fallback, without throwing. */
export function createApiDocsTranslator(
  t: TranslationGetter & { has: (key: string) => boolean },
): TranslationGetter {
  return (key) => (t.has(key) ? t(key) : key);
}
