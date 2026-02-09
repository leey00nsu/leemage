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
    code: `const projects = await client.projects.list();`,
  },
  "POST:/api/v1/projects": {
    language: "typescript",
    code: `const project = await client.projects.create({
  name: "My Project",
  description: "프로젝트 설명",
  storageProvider: "OCI",
});`,
  },
  "GET:/api/v1/projects/{projectId}": {
    language: "typescript",
    code: `const project = await client.projects.get("projectId");
console.log(project.files);`,
  },
  "DELETE:/api/v1/projects/{projectId}": {
    language: "typescript",
    code: `await client.projects.delete("projectId");`,
  },
  "POST:/api/v1/projects/{projectId}/files/presign": {
    language: "typescript",
    code: `// 일반 업로드는 client.files.upload() 사용을 권장합니다.
// await client.files.upload("projectId", fileInput, { variants: [...] });

// 아래는 단계별 제어가 필요할 때 사용하는 수동 업로드 예시입니다.
const presign = await client.files.presign("projectId", {
  fileName: "image.jpg",
  contentType: "image/jpeg",
  fileSize: 102400,
});`,
  },
  "POST:/api/v1/projects/{projectId}/files/confirm": {
    language: "typescript",
    code: `// 일반 업로드는 client.files.upload() 사용을 권장합니다.
// await client.files.upload("projectId", fileInput, { variants: [...] });

// 아래는 presign -> 직접 업로드 -> confirm 순서의 수동 업로드 예시입니다.
const presign = await client.files.presign("projectId", {
  fileName: "image.jpg",
  contentType: "image/jpeg",
  fileSize: 102400,
});

const fileBuffer = await fileInput.arrayBuffer();
await fetch(presign.presignedUrl, {
  method: "PUT",
  headers: { "Content-Type": "image/jpeg" },
  body: fileBuffer,
});

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
    code: `await client.files.delete("projectId", "fileId");`,
  },
};

const endpointSdkExamplesEn: Record<string, SdkExampleData> = {
  "GET:/api/v1/projects": {
    language: "typescript",
    code: `const projects = await client.projects.list();`,
  },
  "POST:/api/v1/projects": {
    language: "typescript",
    code: `const project = await client.projects.create({
  name: "My Project",
  description: "Project description",
  storageProvider: "OCI",
});`,
  },
  "GET:/api/v1/projects/{projectId}": {
    language: "typescript",
    code: `const project = await client.projects.get("projectId");
console.log(project.files);`,
  },
  "DELETE:/api/v1/projects/{projectId}": {
    language: "typescript",
    code: `await client.projects.delete("projectId");`,
  },
  "POST:/api/v1/projects/{projectId}/files/presign": {
    language: "typescript",
    code: `// For typical uploads, prefer client.files.upload().
// await client.files.upload("projectId", fileInput, { variants: [...] });

// Use this manual step-by-step flow when you need custom control.
const presign = await client.files.presign("projectId", {
  fileName: "image.jpg",
  contentType: "image/jpeg",
  fileSize: 102400,
});`,
  },
  "POST:/api/v1/projects/{projectId}/files/confirm": {
    language: "typescript",
    code: `// For typical uploads, prefer client.files.upload().
// await client.files.upload("projectId", fileInput, { variants: [...] });

// Manual step-by-step flow: presign -> direct upload -> confirm.
const presign = await client.files.presign("projectId", {
  fileName: "image.jpg",
  contentType: "image/jpeg",
  fileSize: 102400,
});

const fileBuffer = await fileInput.arrayBuffer();
await fetch(presign.presignedUrl, {
  method: "PUT",
  headers: { "Content-Type": "image/jpeg" },
  body: fileBuffer,
});

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
    code: `await client.files.delete("projectId", "fileId");`,
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
