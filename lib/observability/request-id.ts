const VALID_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

export function getOrCreateRequestId(headers: Headers): string {
  const incoming = headers.get("x-request-id");
  return incoming && VALID_REQUEST_ID.test(incoming)
    ? incoming
    : crypto.randomUUID();
}

export function normalizeApiRoute(pathname: string): string {
  return pathname
    .replace(/(\/api(?:\/v1)?\/projects)\/[^/]+/, "$1/:projectId")
    .replace(/(\/files)\/(?!confirm(?:\/|$)|presign(?:\/|$)|tags(?:\/|$))[^/]+/, "$1/:fileId")
    .replace(/(\/tags)\/[^/]+/, "$1/:tagId");
}
