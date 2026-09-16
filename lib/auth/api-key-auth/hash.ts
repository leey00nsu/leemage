import { createHash, timingSafeEqual } from "node:crypto";

const SHA256_PREFIX = "sha256:";

export function hashApiKey(apiKey: string) {
  return `${SHA256_PREFIX}${createHash("sha256").update(apiKey).digest("hex")}`;
}

export function isSha256ApiKeyHash(value: string) {
  return value.startsWith(SHA256_PREFIX);
}

export function matchesSha256ApiKey(apiKey: string, storedHash: string) {
  const actual = Buffer.from(hashApiKey(apiKey));
  const expected = Buffer.from(storedHash);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
