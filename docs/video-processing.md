# 프로젝트 업로드 정책과 미디어 워커

프로젝트의 `maxUploadBytes`는 파일 하나당 업로드 한도입니다. 기존 프로젝트의 기본값은 50 MiB로 유지됩니다. 프로젝트 생성/수정 화면 또는 API/SDK로 변경할 수 있습니다. 80 MiB 영상을 받으려면 해당 프로젝트를 예를 들어 100 MiB로 설정합니다. 스토리지 전체 쿼터와는 별개이며, 두 조건을 모두 만족해야 합니다.

서버의 `UPLOAD_MAX_FILE_SIZE_MB`는 모든 프로젝트에 적용하는 상한입니다. 기본 500 MiB, 정수 1–1024를 지원합니다(환경 변수 이름의 MB는 MiB 단위). 이미지는 디코딩 메모리를 제한하기 위해 `IMAGE_MAX_FILE_SIZE_MB`(기본 및 최대 50 MiB)를 추가로 적용합니다. 실제 적용 한도는 프로젝트 한도와 서버 상한 중 작은 값입니다. 설정 변경은 이후 presign/confirm부터 적용됩니다. 업로드 확인 시 저장소 HEAD로 실제 크기를 재검증합니다.

presign은 PostgreSQL advisory lock 아래에서 PENDING 원본 용량까지 포함해 쿼터를 예약합니다. 이미지 variant의 실제 생성 용량도 같은 lock 아래에서 다시 검사하며, 초과한 결과물은 게시하지 않고 삭제합니다.

## 이미지 업로드 흐름

이미지 confirm은 원본을 요청 프로세스로 다운로드하지 않습니다. 파일 완료 처리와 PostgreSQL `ImageJob` 생성을 한 트랜잭션으로 저장하고 HTTP 202를 반환합니다. 미디어 워커가 원본을 받아 magic byte와 디코딩 가능 여부를 검사한 뒤 최대 4천만 픽셀, 요청 variant 최대 5개를 순차 처리합니다. 작업 상태와 재시도·임대 복구 방식은 아래 영상 작업과 같습니다.

- 파일 제한 초과: HTTP 413, `code: FILE_SIZE_EXCEEDED`, `limitBytes`
- 스토리지 쿼터 초과: HTTP 413, `code: QUOTA_EXCEEDED`, `remaining`
- SDK: `LeemageError.code`, `.limitBytes`, `.remaining`으로 구분합니다. 기존 `FileTooLargeError` 클래스는 호환성을 위해 유지합니다.

## 영상 업로드 흐름

1. presign → 클라이언트가 R2/OCI에 직접 원본 업로드 → confirm.
2. confirm은 원본 정보와 실제 크기를 확인하고, 파일 완료 처리와 PostgreSQL `VideoJob` 생성을 한 트랜잭션으로 저장합니다. 영상 다운로드나 FFmpeg 실행은 하지 않습니다.
3. 응답 시 원본 URL은 바로 사용할 수 있습니다. `processingStatus`는 `QUEUED`이고 썸네일은 아직 없습니다.
4. 별도 워커가 `FOR UPDATE SKIP LOCKED`로 작업을 가져옵니다. FFprobe/FFmpeg가 짧은 유효기간의 저장소 읽기 URL을 직접 읽어 영상 정보와 JPEG 한 장을 생성합니다. 원본 전체 Buffer나 임시 영상 파일을 만들지 않습니다.
5. 결과가 저장되면 `READY`로 바뀝니다. 카드/상세는 대기 중 3초 간격으로 자동 갱신합니다. SDK에서는 `files.get(projectId, fileId)`로 상태와 새 variants를 조회합니다.

상태: `NONE`(기존 파일/다른 유형), `QUEUED`, `RUNNING`, `READY`, `FAILED`, `SKIPPED`.

`videoThumbnailEnabled: false`인 프로젝트의 새 영상은 `SKIPPED`로 완료되며 작업을 만들지 않습니다. 설정을 끄면 아직 실행하지 않은 작업도 건너뜁니다. 이미 실행 중이거나 완료된 썸네일은 유지됩니다. 이미 올린 영상의 일괄 재처리는 자동으로 하지 않습니다.

## 배포

`npm run dev`와 `npm run start`는 웹 서버와 이미지·영상 통합 미디어 워커를 별도 자식 프로세스로 함께 실행합니다. 웹 요청에서 워커를 시작하거나 서버리스 응답 뒤 실행에 의존하지 않습니다. 한쪽이 종료되면 다른 쪽도 정리하고 전체 명령을 종료하므로 프로세스 관리자가 함께 재시작할 수 있습니다. Ctrl+C/SIGTERM 시 워커는 진행 중인 작업을 마무리하며, 2분이 지나면 남은 프로세스를 강제 종료합니다.

```sh
npm ci
npm run db:deploy
npm run build
# 웹 서버와 워커 함께 시작 (FFmpeg/FFprobe 설치 필요)
npm run start
# 개발 서버와 워커 함께 시작
npm run dev -- --port 3002
```

워커 런타임에는 Node, `tsx`, FFmpeg와 FFprobe, Prisma 생성 클라이언트 및 앱 의존성이 필요합니다. `tsx`는 운영 실행에 필요한 dependency에 포함됩니다. 빌드와 DB 마이그레이션에 필요한 도구도 배포 환경에 설치되어 있어야 합니다. systemd/컨테이너 등의 프로세스 관리자로 자동 재시작하도록 구성합니다. `npm run start`는 시작 전에 마이그레이션과 Prisma 생성을 수행합니다. 개발 환경의 최초 DB 설정은 `npm run db:deploy`로 적용하세요. `npm run worker:media`는 워커만 실행하는 명령이며, 기존 `worker:video`는 호환 alias입니다.

```dotenv
UPLOAD_MAX_FILE_SIZE_MB=500
IMAGE_MAX_FILE_SIZE_MB=50
MEDIA_WORKER_CONCURRENCY=2
```

기존 `DATABASE_URL`과 해당 저장소 인증 환경 변수를 사용합니다. R2는 Object Read & Write가 필요합니다. OCI는 객체 HEAD/읽기와 ObjectRead PAR 생성/삭제 권한이 필요합니다. OCI 읽기 PAR는 작업 종료 후 회수하고, 회수 실패 시에도 5분 후 만료됩니다. 비공개 저장소에서도 워커는 처리할 수 있지만, 사용자가 원본/썸네일 URL을 직접 보는 기능에는 기존과 동일하게 접근 가능한 배포 URL이 필요합니다.

워커당 동시 처리 기본 2개(1–8), 작업 최대 3회 시도, 재시도 간격 5초/10초, 임대 2분, 30초마다 임대 갱신입니다. 워커 장애 시 임대 만료 후 재배정합니다. 결과 게시에는 임대 토큰을 확인하여 늦게 종료한 이전 워커가 새 결과를 덮지 못하도록 합니다. 삭제 시 대기 작업을 제거하고 실행 중인 작업의 결과 게시도 차단합니다. 실패해도 원본은 유지됩니다. 최종 실패 원인은 일반화한 코드로 저장하며 서명 URL을 로그/DB에 기록하지 않습니다.

FFprobe와 FFmpeg 실행은 각각 최대 45초이며, 썸네일 출력은 최대 8 MiB, 메타데이터 출력은 최대 64 KiB입니다. HTTP Range를 활용하지만 영상 인덱스/코덱/저장소 응답에 따라 읽는 양은 달라집니다. 원본 전체를 다시 내려받는 fallback은 없습니다. Range를 무시하는 서버가 전체 데이터를 전송하는 것까지 막는 기능은 아닙니다. FFmpeg 최신 버전에만 있는 `request_size` 옵션은 기본 경로에서 사용하지 않습니다.

썸네일 처리나 태그 수정 시에도 대시보드 마지막 업로드 날짜가 변하지 않도록 `uploadedAt`을 따로 저장합니다. 기존 완료 파일은 마이그레이션 시 기존 `updatedAt` 값으로 채웁니다.

## SDK

```ts
await leemage.projects.update(projectId, {
  maxUploadBytes: 100 * 1024 * 1024,
  videoThumbnailEnabled: true,
});
const uploaded = await leemage.files.upload(projectId, video);
// 영상 썸네일이 필요하면 이후 files.get으로 상태 확인:
const current = await leemage.files.get(projectId, uploaded.id);
if (current.processingStatus === "READY") {
  console.log(current.thumbnail?.url);
}
```

SDK 업로드 메서드의 인자는 바뀌지 않습니다. 영상 업로드 응답에서 썸네일이 즉시 존재한다고 가정한 코드는 `READY`까지 기다리도록 변경해야 합니다. 이번 변경만으로 npm 패키지가 배포되지는 않습니다.

## 검증

`npm test`, `npx tsc --noEmit`, `npm --prefix packages/sdk run build`.

로컬 PostgreSQL 통합 검증: `npx tsx scripts/check-video-queue.ts`. 별도 임시 스키마에서 동시 배정, 장애 복구, 오래된 임대 토큰 차단과 최종 실패 처리를 확인하고 스키마를 정리합니다. 테스트 DB 계정에는 스키마 생성 권한이 필요합니다.
