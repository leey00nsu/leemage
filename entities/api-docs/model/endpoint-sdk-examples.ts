/**
 * 엔드포인트별 SDK 예시 매핑 (i18n 지원)
 */

type Locale = "ko" | "en";

interface SdkExampleData {
  code: string;
  language: string;
}

// 엔드포인트 경로 + 메서드 → SDK 예시 코드 매핑
const endpointSdkExamplesKo: Record<string, SdkExampleData> = {
  "GET:/api/v1/projects": {
    language: "typescript",
    code: `// 프로젝트 목록 조회
const projects = await client.projects.list();`,
  },
  "POST:/api/v1/projects": {
    language: "typescript",
    code: `// 프로젝트 생성
const project = await client.projects.create({
  name: "My Project",
  description: "프로젝트 설명",
  storageProvider: "OCI",
});`,
  },
  "GET:/api/v1/projects/{projectId}": {
    language: "typescript",
    code: `// 프로젝트 상세 조회 (파일 목록 포함)
const project = await client.projects.get("projectId");
console.log(project.files);`,
  },
  "DELETE:/api/v1/projects/{projectId}": {
    language: "typescript",
    code: `// 프로젝트 삭제
await client.projects.delete("projectId");`,
  },
  "POST:/api/v1/projects/{projectId}/files/presign": {
    language: "typescript",
    code: `// Presigned URL 생성 (Low-level API)
// 일반적으로 client.files.upload()를 사용하는 것이 좋습니다.
const presign = await client.files.presign("projectId", {
  fileName: "image.jpg",
  contentType: "image/jpeg",
  fileSize: 102400,
});`,
  },
  "POST:/api/v1/projects/{projectId}/files/confirm": {
    language: "typescript",
    code: `// 업로드 완료 확인 (Low-level API)
// 일반적으로 client.files.upload()를 사용하는 것이 좋습니다.
const result = await client.files.confirm("projectId", {
  fileId: presign.fileId,
  objectName: presign.objectName,
  fileName: "image.jpg",
  contentType: "image/jpeg",
  fileSize: 102400,
  variants: [{ sizeLabel: "max800", format: "webp" }],
});`,
  },
  "DELETE:/api/v1/projects/{projectId}/files/{fileId}": {
    language: "typescript",
    code: `// 파일 삭제
await client.files.delete("projectId", "fileId");`,
  },
};

const endpointSdkExamplesEn: Record<string, SdkExampleData> = {
  "GET:/api/v1/projects": {
    language: "typescript",
    code: `// List all projects
const projects = await client.projects.list();`,
  },
  "POST:/api/v1/projects": {
    language: "typescript",
    code: `// Create a new project
const project = await client.projects.create({
  name: "My Project",
  description: "Project description",
  storageProvider: "OCI",
});`,
  },
  "GET:/api/v1/projects/{projectId}": {
    language: "typescript",
    code: `// Get project details (includes file list)
const project = await client.projects.get("projectId");
console.log(project.files);`,
  },
  "DELETE:/api/v1/projects/{projectId}": {
    language: "typescript",
    code: `// Delete a project
await client.projects.delete("projectId");`,
  },
  "POST:/api/v1/projects/{projectId}/files/presign": {
    language: "typescript",
    code: `// Generate presigned URL (Low-level API)
// Consider using client.files.upload() for simplicity.
const presign = await client.files.presign("projectId", {
  fileName: "image.jpg",
  contentType: "image/jpeg",
  fileSize: 102400,
});`,
  },
  "POST:/api/v1/projects/{projectId}/files/confirm": {
    language: "typescript",
    code: `// Confirm upload (Low-level API)
// Consider using client.files.upload() for simplicity.
const result = await client.files.confirm("projectId", {
  fileId: presign.fileId,
  objectName: presign.objectName,
  fileName: "image.jpg",
  contentType: "image/jpeg",
  fileSize: 102400,
  variants: [{ sizeLabel: "max800", format: "webp" }],
});`,
  },
  "DELETE:/api/v1/projects/{projectId}/files/{fileId}": {
    language: "typescript",
    code: `// Delete a file
await client.files.delete("projectId", "fileId");`,
  },
};

/**
 * 엔드포인트에 해당하는 SDK 예시를 반환합니다.
 */
export function getEndpointSdkExample(
  method: string,
  path: string,
  locale: Locale
): SdkExampleData | null {
  const key = `${method}:${path}`;
  const examples =
    locale === "ko" ? endpointSdkExamplesKo : endpointSdkExamplesEn;
  return examples[key] || null;
}
