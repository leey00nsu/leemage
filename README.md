# Leemage

## 프로젝트 개요

Oracle Cloud Infrastructure (OCI) Object Storage를 활용하여 Cloudinary와 유사한 이미지 관리 및 제공 서비스를 구축합니다. Next.js, Tailwind CSS, Shadcn/ui를 사용하여 사용자 친화적인 인터페이스를 제공하고, 프로젝트별로 이미지를 효율적으로 관리하는 것을 목표로 합니다.

## 기술 스택

- **프레임워크:** Next.js
- **UI:** Tailwind CSS, Shadcn/ui
- **스토리지:** Oracle Cloud Infrastructure (OCI) Object Storage
- **인증:** iron-session(환경변수 기반 인증방식)
- **데이터베이스:** PostgreSQL

## 주요 기능

- **사용자 인증:** 안전한 로그인 기능 제공
- **프로젝트 관리:** 프로젝트 단위로 이미지 그룹화 및 관리
- **이미지 관리:**
  - 이미지 업로드 (OCI Object Storage 연동)
  - 이미지 삭제 (OCI Object Storage 연동)
  - 이미지 정보 수정 (예: 태그, 설명 등)
- **이미지 변환:** 업로드 시 리사이징, 포맷 변경 등 자동 변환 기능 제공
- **이미지 제공:** OCI Object Storage에 저장된 이미지를 효율적으로 제공
- **API 엔드포인트:** 외부 서비스 연동을 위한 API 제공

## 프로젝트 구조 (Feature-Sliced Design 기반)

이 프로젝트는 Feature-Sliced Design (FSD) 아키텍처 패턴을 따릅니다. FSD는 확장 가능하고 유지보수하기 쉬운 프론트엔드 애플리케이션을 구축하기 위한 구조적 방법론입니다.

주요 레이어는 다음과 같습니다:

- **`/app`**: Next.js App Router의 핵심 디렉토리입니다. 페이지 라우팅, 레이아웃, 로딩 UI 등 애플리케이션 레벨의 설정과 진입점을 관리합니다.
- **`/widgets`**: 여러 기능(features)이나 엔티티(entities)를 조합하여 구성된 독립적인 UI 블록입니다. 예: 헤더, 푸터, 사이드바, 카드 목록 등.
- **`/features`**: 특정 사용자 시나리오나 유스케이스를 나타내는 기능 단위입니다. 여러 엔티티와 UI 컴포넌트를 포함할 수 있습니다. 예: 사용자 인증, 이미지 업로드, 프로젝트 생성 등.
- **`/entities`**: 핵심 비즈니스 도메인 객체를 나타냅니다. 재사용 가능한 데이터 모델과 관련 UI 컴포넌트(예: User 카드, Project 정보 표시)를 포함합니다.
- **`/shared`**: 모든 레이어에서 사용될 수 있는 재사용 가능한 코드(UI 컴포넌트, 유틸리티 함수, 설정 등)를 포함합니다. 다른 레이어에 대한 의존성이 없습니다. 예: 버튼, 입력 필드, 로고, 타입 정의, 공통 훅 등.

FSD는 계층 간 의존성 규칙(상위 레이어는 하위 레이어에 의존 가능, 하위 레이어는 상위 레이어에 의존 불가)을 통해 코드의 결합도를 낮추고 재사용성을 높입니다.
트리쉐이킹 문제로 인해 배럴 파일을 사용하지 않습니다.

## 환경변수

```
# Local Environment Variables

# Root User Credentials
ROOT_USER_EMAIL= #루트 계정 이메일
ROOT_USER_PASSWORD= #루트 계정 비밀번호

# PostgreSQL Database Credentials (for Docker Compose and Prisma)
POSTGRES_PASSWORD= # Docker Compose에서 사용할 비밀번호
DATABASE_URL=# 데이터베이스 URL

# OCI Object Storage Credentials (Placeholder - Add your actual credentials)
OCI_TENANCY_OCID=
OCI_USER_OCID=
OCI_FINGERPRINT=
OCI_PRIVATE_KEY_PATH=
OCI_REGION=
OCI_NAMESPACE=
OCI_BUCKET_NAME=
OCI_OBJECT_STORAGE_HOST=

IRON_SESSION_COOKIE_NAME=
IRON_SESSION_PASSWORD=
```

## 설치 및 실행

```bash
# 저장소 복제
git clone <repository_url>
cd leemage

# 의존성 설치
npm install
# 또는
yarn install

# 환경 변수 설정 (.env.local 파일 생성)
# OCI 관련 자격 증명 및 설정 추가
# 데이터베이스 및 인증 관련 설정 추가

# 도커 컴포즈로 데이터베이스 실행
docker compose up -d
# 개발 서버 실행
npm run dev
# 또는
yarn dev
```

## 향후 계획

- 팀/협업 기능 구현
- 상세한 사용 통계 및 분석 기능

## 외부 API (v1) 명세

이 API는 외부 서비스와의 연동을 위해 제공되며, 모든 요청에는 API 키를 사용한 인증이 필요합니다.

**인증 방식:**

- 모든 요청의 HTTP 헤더에 `Authorization: Bearer <YOUR_API_KEY>` 를 포함해야 합니다.
- API 키는 애플리케이션의 계정 설정 페이지에서 발급받을 수 있습니다.
