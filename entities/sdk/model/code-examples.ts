/**
 * SDK 코드 예시 데이터 (i18n 지원)
 */

export interface SdkCodeExample {
  id: string;
  language: string;
  filename: string;
  code: string;
  highlightLines?: number[];
}

type Locale = "ko" | "en";

const codeExamplesKo = {
  upload: `// client.files.upload(projectId, file, options?)
// - projectId: 프로젝트 ID
// - file: File 객체 (브라우저) 또는 { name, type, size, arrayBuffer } (Node.js)
// - options?: { variants?, onProgress? }

const file = await client.files.upload(projectId, fileInput, {
  // 이미지 변환 옵션 (이미지 파일에만 적용)
  variants: [
    { sizeLabel: "source", format: "webp" },     // 원본 크기
    { sizeLabel: "max800", format: "webp" },     // 최대 800px
    { sizeLabel: "1200x800", format: "avif" },   // 커스텀 크기
  ],
  // 진행 상태 콜백
  onProgress: (progress) => {
    console.log(\`\${progress.stage}: \${progress.percent}%\`);
    // stage: "presign" | "upload" | "confirm"
  },
});

// 결과: FileResponse
console.log(file.id);       // 파일 ID
console.log(file.variants); // 변환된 이미지 URL 배열`,
  projects: `// 프로젝트 목록 조회
const projects = await client.projects.list();

// 프로젝트 생성
const project = await client.projects.create({
  name: "My Project",
  description: "프로젝트 설명",
  storageProvider: "OCI", // "OCI" | "R2"
});

// 프로젝트 상세 조회 (파일 목록 포함)
const details = await client.projects.get(project.id);
console.log(details.files);

// 프로젝트 삭제
await client.projects.delete(project.id);`,
};

const codeExamplesEn = {
  upload: `// client.files.upload(projectId, file, options?)
// - projectId: Project ID
// - file: File object (browser) or { name, type, size, arrayBuffer } (Node.js)
// - options?: { variants?, onProgress? }

const file = await client.files.upload(projectId, fileInput, {
  // Image transformation options (only for image files)
  variants: [
    { sizeLabel: "source", format: "webp" },     // Original size
    { sizeLabel: "max800", format: "webp" },     // Max 800px
    { sizeLabel: "1200x800", format: "avif" },   // Custom size
  ],
  // Progress callback
  onProgress: (progress) => {
    console.log(\`\${progress.stage}: \${progress.percent}%\`);
    // stage: "presign" | "upload" | "confirm"
  },
});

// Result: FileResponse
console.log(file.id);       // File ID
console.log(file.variants); // Converted image URLs array`,
  projects: `// List projects
const projects = await client.projects.list();

// Create project
const project = await client.projects.create({
  name: "My Project",
  description: "Project description",
  storageProvider: "OCI", // "OCI" | "R2"
});

// Get project details (includes file list)
const details = await client.projects.get(project.id);
console.log(details.files);

// Delete project
await client.projects.delete(project.id);`,
};

export function getSdkCodeExamples(locale: Locale): SdkCodeExample[] {
  const localizedCode = locale === "ko" ? codeExamplesKo : codeExamplesEn;

  return [
    {
      id: "install",
      language: "bash",
      filename: "terminal",
      code: `npm install leemage-sdk`,
    },
    {
      id: "init",
      language: "typescript",
      filename: "app.ts",
      code: `import { LeemageClient } from "leemage-sdk";

const client = new LeemageClient({
  apiKey: "your-api-key",
  baseUrl: "https://leemage.example.com", // optional
});`,
      highlightLines: [3, 4, 5],
    },
    {
      id: "upload",
      language: "typescript",
      filename: "upload.ts",
      code: localizedCode.upload,
      highlightLines: [5, 6, 7, 8, 9, 10, 11],
    },
    {
      id: "projects",
      language: "typescript",
      filename: "projects.ts",
      code: localizedCode.projects,
    },
  ];
}
