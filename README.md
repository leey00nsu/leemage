![Leemage Logo](public/logo.webp)

<h1 align="center">
  <strong>Leemage</strong>
</h1>

<p align="center">
  <strong>다양한 클라우드 스토리지(OCI Object Storage, Cloudflare R2)를 활용하여 구축된 파일 관리 플랫폼</strong>
</p>

<p align="center">
  <a href="#시작하기">시작하기</a> •
  <a href="#주요-기능">주요 기능</a> •
  <a href="#api-문서">API 문서</a> •
  <a href="#기여하기">기여하기</a>
</p>

<p align="center">
  <a href="https://leemage.leey00nsu.com">데모</a>
</p>

<p align="center">
  <img src="public/sample_1.png" alt="Leemage Screenshot 1" width="800" />
</p>

<p align="center">
  <img src="public/sample_2.png" alt="Leemage Screenshot 2" width="800" />
</p>

<p align="center">
  <img src="public/sample_3.png" alt="Leemage Screenshot 3" width="800" />
</p>

---

## 목차

- [목차](#목차)
- [프로젝트 개요](#프로젝트-개요)
- [주요 기능](#주요-기능)
  - [🔐 사용자 관리](#-사용자-관리)
  - [📁 프로젝트 관리](#-프로젝트-관리)
  - [🖼️ 이미지 관리](#️-이미지-관리)
  - [🔗 API 통합](#-api-통합)
  - [🌐 국제화 (i18n)](#-국제화-i18n)
- [기술 스택](#기술-스택)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [DevOps](#devops)
- [프로젝트 구조](#프로젝트-구조)
  - [주요 레이어](#주요-레이어)
  - [의존성 규칙](#의존성-규칙)
- [시작하기](#시작하기)
  - [사전 요구사항](#사전-요구사항)
  - [설치](#설치)
  - [환경 설정](#환경-설정)
  - [실행](#실행)
- [API 문서](#api-문서)
  - [인증](#인증)
  - [TypeScript SDK](#typescript-sdk)
- [폴더 구조](#폴더-구조)
- [개발 가이드](#개발-가이드)
  - [코딩 규칙](#코딩-규칙)
- [문제 해결](#문제-해결)
  - [일반적인 문제](#일반적인-문제)
- [기여하기](#기여하기)
  - [기여 방법](#기여-방법)
  - [개발 환경 설정](#개발-환경-설정)
  - [커밋 규칙](#커밋-규칙)
- [향후 계획](#향후-계획)
- [라이선스](#라이선스)

## 프로젝트 개요

**Leemage**는 다양한 클라우드 스토리지(OCI Object Storage, Cloudflare R2)를 활용하여 구축된 파일 관리 플랫폼입니다. Cloudinary와 유사한 기능을 제공하며, 프로젝트 단위로 이미지를 효율적으로 관리할 수 있습니다. 프로젝트 생성 시 원하는 스토리지 프로바이더를 선택할 수 있습니다.

Next.js와 최신 웹 기술을 사용하여 직관적이고 반응형 사용자 인터페이스를 제공하며, 개발자 친화적인 API를 통해 외부 서비스와 쉽게 통합할 수 있습니다.

## 주요 기능

### 🔐 사용자 관리

- **안전한 인증**: iron-session 기반 세션 관리
- **환경변수 기반 인증**: 간편한 루트 계정 설정

### 📁 프로젝트 관리

- **프로젝트 단위 관리**: 이미지를 프로젝트별로 체계적으로 구성
- **권한 관리**: 프로젝트별 접근 권한 제어

### 🖼️ 파일 관리

- **Presigned URL 업로드**: 클라이언트가 OCI에 직접 업로드하여 서버 부하 감소
- **업로드**: 모든 파일 타입 업로드 지원
- **이미지 자동 변환**: 이미지 업로드 시 리사이징, 포맷 변경 등 자동 처리
- **메타데이터 관리**: 파일 정보, 크기, 타입 등 상세 정보 관리

### 🔗 API 통합

- **RESTful API**: 외부 서비스 연동을 위한 완전한 API 제공
- **API 키 관리**: 안전한 API 키 기반 인증
- **TypeScript SDK**: `leemage-sdk` npm 패키지로 쉬운 API 연동

### 🌐 국제화 (i18n)

- **다국어 지원**: next-intl을 활용한 다국어 지원
- **지원 언어**: 한국어 (ko), 영어 (en)

## 기술 스택

### Frontend

- **Framework**: Next.js 16 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **상태 관리**: React Query (TanStack Query)

### Backend

- **Runtime**: Next.js 16 (App Router) API routes
- **Database**: PostgreSQL
- **ORM**: Prisma
- **인증**: iron-session
- **이미지 처리**: sharp
- **스토리지**: Oracle Cloud Infrastructure (OCI) Object Storage, Cloudflare R2

### DevOps

- **컨테이너화**: Docker & Docker Compose

## 프로젝트 구조

이 프로젝트는 **Feature-Sliced Design (FSD)** 아키텍처 패턴을 따릅니다. FSD는 확장 가능하고 유지보수하기 쉬운 프론트엔드 애플리케이션을 구축하기 위한 구조적 방법론입니다.

### 주요 레이어

| 레이어          | 설명                             | 예시                                    |
| --------------- | -------------------------------- | --------------------------------------- |
| **`/app`**      | Next.js App Router 핵심 디렉토리 | 페이지 라우팅, 레이아웃, 로딩 UI        |
| **`/widgets`**  | 독립적인 UI 블록 조합            | 헤더, 푸터, 사이드바, 카드 목록         |
| **`/features`** | 특정 사용자 시나리오 기능        | 사용자 인증, 파일 업로드, 프로젝트 생성 |
| **`/entities`** | 핵심 비즈니스 도메인 객체        | User 카드, Project 정보, File 컴포넌트  |
| **`/shared`**   | 재사용 가능한 공통 코드          | UI 컴포넌트, 유틸리티, 설정, 타입       |

### 의존성 규칙

- ✅ 상위 레이어는 하위 레이어에 의존 가능
- ❌ 하위 레이어는 상위 레이어에 의존 불가
- 🚫 배럴 파일 사용 금지 (트리쉐이킹 최적화)

## 시작하기

### 사전 요구사항

- **Node.js**: v22.0.0 이상
- **npm** 또는 **yarn**: 최신 버전
- **Docker**: v20.0.0 이상 (로컬 데이터베이스용)
- **스토리지 계정**: OCI Object Storage 또는 Cloudflare R2 (프로젝트별 선택 가능)

### 설치

```bash
# 저장소 복제
git clone <repository_url>
cd leemage

# 의존성 설치
npm install
# 또는
yarn install
```

### 환경 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# 루트 사용자 인증 정보
ROOT_USER_EMAIL=admin@example.com
ROOT_USER_PASSWORD=your-secure-password

# PostgreSQL 데이터베이스 (Docker Compose용)
POSTGRES_USER=leemage_user
POSTGRES_PASSWORD=your-db-password
POSTGRES_DB=leemage_db
POSTGRES_PORT=5432

# Prisma 데이터베이스 연결
DATABASE_URL=postgresql://leemage_user:your-db-password@localhost:5432/leemage_db

# OCI Object Storage 설정 (기본 스토리지)
OCI_TENANCY_OCID=ocid1.tenancy.oc1..your-tenancy-id
OCI_USER_OCID=ocid1.user.oc1..your-user-id
OCI_FINGERPRINT=your-key-fingerprint
OCI_PRIVATE_KEY_PATH=./path/to/your/private-key.pem
OCI_REGION=us-phoenix-1
OCI_NAMESPACE=your-namespace
OCI_BUCKET_NAME=your-bucket-name
OCI_OBJECT_STORAGE_HOST=https://objectstorage.us-phoenix-1.oraclecloud.com

# Cloudflare R2 설정
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=your-r2-bucket-name
R2_PUBLIC_URL=your-public-url

# 세션 관리
IRON_SESSION_COOKIE_NAME=leemage-session
IRON_SESSION_PASSWORD=your-32-character-session-password
```

### 실행

```bash
# PostgreSQL 데이터베이스 시작 (Docker)
docker compose up -d

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 개발 서버 시작
npm run dev
# 또는
yarn dev
```

애플리케이션이 [http://localhost:3000](http://localhost:3000)에서 실행됩니다.

## API 문서

### 인증

모든 API 요청에는 HTTP 헤더에 API 키가 필요합니다:

```http
Authorization: Bearer <YOUR_API_KEY>
```

API 키는 애플리케이션의 계정 설정 페이지에서 생성할 수 있습니다.

### 파일 업로드 (Presigned URL 방식)

파일 업로드는 3단계로 진행됩니다:

1. **Presign 요청**: 서버에서 OCI PAR(Pre-Authenticated Request) URL 발급
2. **직접 업로드**: 클라이언트가 PAR URL을 사용하여 OCI에 직접 업로드
3. **Confirm 요청**: 업로드 완료 후 서버에 확인 요청 (DB 레코드 생성)

### TypeScript SDK

`leemage-sdk` npm 패키지를 사용하면 위의 복잡한 업로드 과정을 간단하게 처리할 수 있습니다.

**설치**

```bash
npm install leemage-sdk
```

**사용 예시**

```typescript
import { LeemageClient } from "leemage-sdk";

const client = new LeemageClient({
  apiKey: "your-api-key",
});

// 프로젝트 목록 조회
const projects = await client.projects.list();

// 파일 업로드 (presign → upload → confirm 자동 처리)
const file = await client.files.upload(projectId, fileInput, {
  variants: [
    { sizeLabel: "max800", format: "webp" },
    { sizeLabel: "1200x800", format: "avif" },
  ],
});
```

자세한 사용법은 [packages/sdk/README.md](packages/sdk/README.md)를 참조하세요.

## 폴더 구조

```
leemage/
├── app/                 # Next.js App Router
│   ├── [locale]/         # 국제화 라우팅
├── widgets/             # 독립적인 UI 블록 (FSD)
├── features/            # 기능별 모듈 (FSD)
├── entities/            # 비즈니스 엔티티 (FSD)
├── shared/              # 공통 코드 (FSD)
├── lib/                 # 서버사이드 라이브러리
├── providers/           # 전역 프로바이더
├── i18n/                # 국제화 설정
├── messages/            # 다국어 메시지 파일
├── prisma/              # 데이터베이스
├── public/              # 정적 자산
```

## 개발 가이드

### 코딩 규칙

- FSD 아키텍처 패턴 준수
- 컴포넌트는 단일 책임 원칙 적용
- 타입 안정성을 위한 strict TypeScript 설정
- 재사용 가능한 컴포넌트는 shared 레이어에 배치

## 문제 해결

### 일반적인 문제

**Q: 데이터베이스 연결 오류**

```bash
# PostgreSQL 컨테이너 상태 확인
docker compose ps

# 데이터베이스 재시작
docker compose restart postgres
```

**Q: OCI Object Storage 연결 실패**

- OCI 인증 정보가 올바른지 확인
- 버킷 권한 설정 확인
- 네트워크 연결 상태 확인

**Q: 세션 관련 오류**

- `IRON_SESSION_PASSWORD`가 32자 이상인지 확인
- 쿠키 설정이 올바른지 확인

## 기여하기

Leemage 프로젝트에 기여해주셔서 감사합니다!

### 기여 방법

1. **이슈 리포트**: 버그나 기능 요청은 GitHub Issues에 등록
2. **코드 기여**: Fork → 브랜치 생성 → 개발 → Pull Request
3. **문서 개선**: README, API 문서 등 개선 사항 제안

### 개발 환경 설정

```bash
# 프로젝트 포크 후 클론
git clone https://github.com/your-username/leemage.git

# 의존성 설치
npm install

# .env 파일 생성 후 환경 변수 설정
# (위 '환경 설정' 섹션 참고)

# PostgreSQL 데이터베이스 시작
docker compose up -d

# 데이터베이스 마이그레이션
npx prisma migrate dev

# 개발 서버 실행
npm run dev
```

### 커밋 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 설정 등 기타 변경
```

## 향후 계획

- [ ] **팀 협업 기능**: 다중 사용자 지원 및 권한 관리
- [ ] **고급 분석**: 상세한 사용 통계 및 성능 분석

## 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

<p align="center">
  <strong>Leemage</strong>로 이미지 관리의 새로운 경험을 시작하세요! 🚀
</p>

<p align="center">
  문의사항이 있으시면 <a href="mailto:dbstndla1212@naver.com">dbstndla1212@naver.com</a>로 연락주세요.
</p>
