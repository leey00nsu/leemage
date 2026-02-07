export function formatEndpoint(
  endpoint: string,
  method: string,
  metadata?: Record<string, unknown> | null,
): string {
  const projectMatch = endpoint.match(/\/projects\/([^/]+)/);
  const projectId = projectMatch ? projectMatch[1].slice(0, 8) : null;
  const fileName = metadata?.fileName as string | undefined;

  if (endpoint.includes("/files/presign")) {
    return fileName
      ? `${projectId}에 ${fileName} 업로드 준비`
      : `${projectId} 파일 업로드 준비`;
  }
  if (endpoint.includes("/files/confirm")) {
    return fileName
      ? `${projectId}에 ${fileName} 업로드 완료`
      : `${projectId} 파일 업로드 완료`;
  }
  if (endpoint.match(/\/files\/[^/]+\/download/)) {
    return fileName
      ? `${projectId}에서 ${fileName} 다운로드`
      : `${projectId} 파일 다운로드`;
  }
  if (endpoint.match(/\/files\/[^/]+$/)) {
    if (method === "DELETE") {
      return fileName
        ? `${projectId}에서 ${fileName} 삭제`
        : `${projectId} 파일 삭제`;
    }
    return fileName
      ? `${projectId}에서 ${fileName} 조회`
      : `${projectId} 파일 조회`;
  }
  if (endpoint.match(/\/projects\/[^/]+$/)) {
    if (method === "GET") return `${projectId} 프로젝트 조회`;
    if (method === "PUT" || method === "PATCH") return `${projectId} 프로젝트 수정`;
    if (method === "DELETE") return `${projectId} 프로젝트 삭제`;
  }
  if (
    endpoint.match(/\/api\/projects\/?$/) ||
    endpoint.match(/\/api\/v1\/projects\/?$/)
  ) {
    return method === "POST" ? "새 프로젝트 생성" : "프로젝트 목록 조회";
  }
  if (endpoint.includes("/storage/usage")) {
    return "스토리지 사용량 조회";
  }
  if (endpoint.includes("/storage/quota")) {
    return "스토리지 할당량 조회";
  }
  if (endpoint.includes("/stats")) {
    return "API 통계 조회";
  }

  return (
    endpoint.replace(/\/api\/(v1\/)?/, "").slice(0, 30) +
    (endpoint.length > 30 ? "..." : "")
  );
}
