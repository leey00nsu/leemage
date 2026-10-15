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
// 파일 1~100개를 한 번에 삭제
await client.files.deleteMany("projectId", ["fileId1", "fileId2"]);

// 한 개도 같은 API로 삭제
await client.files.deleteMany("projectId", ["fileId"]);

// 기존 메서드도 내부적으로 deleteMany를 호출
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

### Shared thumbnail and optional versions

Image uploads keep the original and generate one shared WebP thumbnail (inside
480×480, aspect ratio preserved, no upscaling, quality 80). With no `variants`,
no other versions are generated. Unsupported image formats may return a null
thumbnail. Leemage uses the same thumbnail URL that your website can use:

```ts
const file = await client.files.upload(projectId, image);
const thumbnailUrl = file.thumbnail?.url;
```

Each optional version defines its own size and format; sizes and formats are not
cross-multiplied. `max800` means width 800, not longest side. Custom dimensions
use both bounds with `inside` by default. Use `cover` for an exact center crop;
upscaling crops are rejected. Up to 20 additional requests are accepted.

```ts
const file = await client.files.upload(projectId, image, {
  variants: [
    { sizeLabel: "max800", format: "webp" },
    { sizeLabel: "1200x630", format: "avif", fit: "cover" },
  ],
});
```

Equivalent outputs, including requests matching the thumbnail, are stored once.
`file.thumbnail` references a version already in `file.variants`; it does not
represent another stored file. Existing v1 project detail responses also include
this thumbnail field when a shared thumbnail is available. The thumbnail preset
requires WebP and `inside`; changing card sizes does not change this public preset.

### Project tags

Tags are independent for each project. Names are trimmed, Unicode NFC normalized,
and unique ignoring case within that project (1–40 characters). Deleting a tag
removes its assignments but preserves the files.

```ts
const tag = await client.tags.create(projectId, "홈페이지 배너");
const tags = await client.tags.list(projectId);
await client.tags.rename(projectId, tag.id, "메인 배너");

// Assign tags after uploading, or to existing completed files.
const file = await client.files.upload(projectId, imageFile);
await client.tags.apply(projectId, {
  fileIds: [file.id],
  tagIds: [tag.id],
  operation: "add", // "remove" removes only the specified assignments
});

const project = await client.projects.get(projectId, {
  tagIds: [tag.id],
  tagMode: "all", // "any" matches at least one selected tag
});
console.log(project.files[0]?.tags);

await client.tags.delete(projectId, tag.id);
```

Each batch accepts 1–100 file IDs and 1–50 tag IDs. All must belong to the given
project; invalid batches are rejected without partial changes. Listing requires
`read`, creation/renaming/assignment requires `write`, and deleting a tag requires
`delete` API key permission. Tag filters are optional; existing project queries
continue to return all completed files.

Server deployment requires `npm run db:migrate` and `npm run db:generate` before
using the new tag endpoints. SDK publishing remains a separate release step.

### 프로젝트 업로드 제한과 비동기 영상 썸네일

`projects.create()` 및 `projects.update()`에서 `maxUploadBytes`(파일당 바이트 제한)와
`videoThumbnailEnabled`를 설정할 수 있습니다. 기존 프로젝트 기본값은 50 MiB이며 서버 상한과
스토리지 쿼터도 적용됩니다. 제한 초과 시 `error.code`는 `FILE_SIZE_EXCEEDED` 또는
`QUOTA_EXCEEDED`입니다.

영상 업로드 응답은 원본이 등록되면 반환됩니다. 썸네일은 별도 서버 워커에서 생성되므로
`files.get(projectId, fileId)`로 `processingStatus`를 확인하세요.
`QUEUED`/`RUNNING`이면 잠시 뒤 다시 조회하고, `READY`이면 `thumbnail`을 사용할 수 있습니다.
`FAILED`/`SKIPPED`에서는 기다리지 않아도 됩니다. 원본은 계속 사용할 수 있습니다.
이미지 변환과 썸네일은 기존처럼 업로드 응답 전에 생성됩니다.
