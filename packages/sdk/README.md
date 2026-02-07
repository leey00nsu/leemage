# leemage-sdk

Leemage 파일 관리 플랫폼을 위한 TypeScript SDK입니다.

## 설치

```bash
npm install leemage-sdk
# 또는
yarn add leemage-sdk
# 또는
pnpm add leemage-sdk
```

## 사용법

### 클라이언트 생성

```typescript
import { LeemageClient } from "leemage-sdk";

const client = new LeemageClient({
  apiKey: "your-api-key",
  baseUrl: "https://your-leemage-instance.com",
  // allowInsecureHttp: true, // 로컬 개발에서만 사용
});
```

### 프로젝트 관리

```typescript
// 프로젝트 목록 조회
const projects = await client.projects.list();

// 프로젝트 상세 조회 (파일 목록 포함)
const project = await client.projects.get("projectId");
console.log(project.files);

// 프로젝트 생성
const newProject = await client.projects.create({
  name: "My Website Assets",
  description: "웹사이트에서 사용할 이미지 모음",
  storageProvider: "OCI", // 또는 "R2"
});

// 프로젝트 삭제
await client.projects.delete("projectId");
```

### 파일 업로드

SDK는 복잡한 Presigned URL 업로드 플로우를 `upload()` 메서드 하나로 추상화합니다.

```typescript
// 브라우저에서
const input = document.querySelector('input[type="file"]');
const file = input.files[0];

const uploadedFile = await client.files.upload("projectId", file, {
  // 이미지 변환 옵션 (이미지 파일에만 적용)
  variants: [
    { sizeLabel: "max800", format: "webp" },
    { sizeLabel: "1200x800", format: "avif" },
  ],
  // 진행 상태 콜백
  onProgress: (progress) => {
    console.log(`Stage: ${progress.stage}, Percent: ${progress.percent}`);
  },
});

console.log(uploadedFile.variants); // 변환된 이미지 URL들
```

#### Node.js에서

```typescript
import { readFile } from "fs/promises";
import { LeemageClient } from "leemage-sdk";

const client = new LeemageClient({
  apiKey: "your-api-key",
  baseUrl: "https://your-leemage-instance.com",
});

const buffer = await readFile("./image.jpg");
const file = {
  name: "image.jpg",
  type: "image/jpeg",
  size: buffer.byteLength,
  arrayBuffer: async () => buffer,
};

const uploadedFile = await client.files.upload("projectId", file);
```

### 파일 삭제

```typescript
await client.files.delete("projectId", "fileId");
```

## 이미지 변환 옵션

### 크기 프리셋

- `source` - 원본 크기
- `max300` - 최대 300px
- `max800` - 최대 800px
- `max1920` - 최대 1920px
- `WIDTHxHEIGHT` - 커스텀 크기 (예: `1200x800`)

### 포맷

- `png`
- `jpeg`
- `avif`
- `webp`

## 에러 처리

SDK는 타입화된 에러 클래스를 제공합니다:

```typescript
import {
  LeemageClient,
  AuthenticationError,
  PermissionDeniedError,
  RateLimitError,
  NotFoundError,
  ValidationError,
  FileTooLargeError,
} from "leemage-sdk";

try {
  await client.files.upload("projectId", file);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error("API 키를 확인하세요");
  } else if (error instanceof PermissionDeniedError) {
    console.error("권한이 없습니다");
  } else if (error instanceof RateLimitError) {
    console.error(`요청 한도 초과, ${error.retryAfter ?? 0}초 후 재시도`);
  } else if (error instanceof NotFoundError) {
    console.error("프로젝트를 찾을 수 없습니다");
  } else if (error instanceof ValidationError) {
    console.error("잘못된 요청:", error.errors);
  } else if (error instanceof FileTooLargeError) {
    console.error("파일이 너무 큽니다");
  }
}
```

## TypeScript 지원

이 SDK는 TypeScript로 작성되었으며, 모든 타입이 내보내집니다:

```typescript
import type {
  Project,
  ProjectDetails,
  FileResponse,
  VariantOption,
  ImageVariantData,
} from "leemage-sdk";
```

## 개발 (API 변경 시)

API 스펙이 변경되면 SDK 타입을 동기화해야 합니다:

```bash
# 루트 디렉토리에서
npm run sdk:sync

# 또는 packages/sdk에서
npm run sync      # 타입 생성 + 빌드
npm run generate  # 타입 생성만
```

### npm 배포

```bash
cd packages/sdk
npm version patch  # 0.1.0 → 0.1.1
npm publish
```

## 라이선스

MIT
