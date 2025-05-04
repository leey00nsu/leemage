# Leemage (가칭)

## 프로젝트 개요

Oracle Cloud Infrastructure (OCI) Object Storage를 활용하여 Cloudinary와 유사한 이미지 관리 및 제공 서비스를 구축합니다. Next.js, Tailwind CSS, Shadcn/ui를 사용하여 사용자 친화적인 인터페이스를 제공하고, 프로젝트별로 이미지를 효율적으로 관리하는 것을 목표로 합니다.

## 기술 스택

- **프레임워크:** Next.js
- **UI:** Tailwind CSS, Shadcn/ui
- **스토리지:** Oracle Cloud Infrastructure (OCI) Object Storage
- **인증:** (추후 결정)
- **데이터베이스:** (추후 결정)

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

## 설치 및 실행 (예상)

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

# 개발 서버 실행
npm run dev
# 또는
yarn dev
```

## 향후 계획

- 팀/협업 기능 구현
- 상세한 사용 통계 및 분석 기능
