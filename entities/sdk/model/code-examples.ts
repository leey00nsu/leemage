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
  upload: `const file = await client.files.upload(projectId, fileInput, {
  variants: [
    { sizeLabel: "source", format: "webp" },
    { sizeLabel: "max800", format: "webp" },
    { sizeLabel: "1200x800", format: "avif" },
  ],
  onProgress: (progress) => {
    console.log(\`\${progress.stage}: \${progress.percent}%\`);
  },
});

console.log(file.id);
console.log(file.variants);`,
  projects: `const projects = await client.projects.list();

const project = await client.projects.create({
  name: "My Project",
  description: "프로젝트 설명",
  storageProvider: "OCI",
});

const details = await client.projects.get(project.id);
console.log(details.files);

await client.projects.delete(project.id);`,
};

const codeExamplesEn = {
  upload: `const file = await client.files.upload(projectId, fileInput, {
  variants: [
    { sizeLabel: "source", format: "webp" },
    { sizeLabel: "max800", format: "webp" },
    { sizeLabel: "1200x800", format: "avif" },
  ],
  onProgress: (progress) => {
    console.log(\`\${progress.stage}: \${progress.percent}%\`);
  },
});

console.log(file.id);
console.log(file.variants);`,
  projects: `const projects = await client.projects.list();

const project = await client.projects.create({
  name: "My Project",
  description: "Project description",
  storageProvider: "OCI",
});

const details = await client.projects.get(project.id);
console.log(details.files);

await client.projects.delete(project.id);`,
};

export function getSdkCodeExamples(locale: Locale): SdkCodeExample[] {
  const localizedCode = locale === "ko" ? codeExamplesKo : codeExamplesEn;

  return [
    {
      id: "install",
      language: "bash",
      filename: "terminal",
      code:
        locale === "ko"
          ? `npm install leemage-sdk
pnpm add leemage-sdk
yarn add leemage-sdk`
          : `npm install leemage-sdk
pnpm add leemage-sdk
yarn add leemage-sdk`,
    },
    {
      id: "init",
      language: "typescript",
      filename: "app.ts",
      code: `import { LeemageClient } from "leemage-sdk";

const client = new LeemageClient({
  apiKey: "your-api-key",
  baseUrl: "https://leemage.example.com",
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
