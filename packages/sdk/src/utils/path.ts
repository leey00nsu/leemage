/**
 * URL path segment를 안전하게 인코딩합니다.
 */
export function encodePathSegment(value: string, fieldName: string): string {
  if (!value) {
    throw new Error(`${fieldName}는 필수입니다.`);
  }

  return encodeURIComponent(value);
}
