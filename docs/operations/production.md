# 프로덕션 운영 런북

## 권장 토폴로지

현재 규모에서는 리버스 프록시/LB 뒤에 Leemage 컨테이너 1개, 관리형 PostgreSQL 1개, OCI 또는 R2 버킷을 두는 구성이 충분합니다. 컨테이너의 supervisor가 Next.js 웹 프로세스와 미디어 워커를 함께 시작하며, 둘 중 하나가 비정상 종료하면 컨테이너 전체가 재시작됩니다.

앱의 3000 포트는 인터넷에 직접 공개하지 않습니다. TLS 종료, 요청 크기 제한, 연결 제한은 리버스 프록시에서 처리합니다. `TRUST_PROXY_HOPS`는 공개 클라이언트와 앱 사이의 신뢰 가능한 프록시 수와 정확히 같아야 합니다. 값이 틀리면 rate limit의 클라이언트 IP 판별이 잘못됩니다.

## 이미지 빌드와 실행

```bash
docker build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://leemage.example.com \
  -t leemage:release .

docker run -d --name leemage \
  --env-file /secure/leemage.env \
  -p 127.0.0.1:3000:3000 \
  --restart unless-stopped \
  leemage:release
```

이미지에는 `.env`와 private key를 넣지 않습니다. OCI key는 읽기 전용 secret mount로 제공하거나 `OCI_PRIVATE_KEY_CONTENT`를 secret manager에서 주입합니다. 최소 필수 설정은 DB URL, 세션 cookie 이름과 32자 이상의 password, root 사용자 정보, 스토리지 자격 증명, `NEXT_PUBLIC_SITE_URL`입니다.

프로덕션 이미지는 ffmpeg/ffprobe, PostgreSQL client, Prisma migration CLI를 포함합니다. 현재 단일 인스턴스 배포에서는 `npm run start`가 `npm run release`를 먼저 실행하며, migration이 성공한 경우에만 웹과 미디어 워커를 시작합니다. 여러 인스턴스로 확장하기 전에는 migration을 단일 CI/CD release job으로 분리하고 각 인스턴스의 시작 경로에서는 제거합니다.

## 배포 순서

1. 로컬 pre-commit의 OpenAPI/SDK 생성 및 테스트와 pre-push의 production build 검사를 통과한 commit을 `main`에 push합니다.
2. 파괴적 migration이면 [백업 런북](database-backup.md)에 따라 즉시 백업합니다.
3. Coolify 자동 배포가 새 이미지를 빌드하고 컨테이너를 시작합니다. 시작 명령이 pending migration을 적용하며, 실패하면 애플리케이션을 시작하지 않습니다.
4. `/api/health/live`와 `/api/health/ready`가 모두 200인지 확인합니다.
5. 리버스 프록시가 readiness 통과 인스턴스에만 트래픽을 보내도록 전환합니다.
6. 최소 5분 동안 5xx, p95 latency, DB/storage 오류를 확인한 뒤 이전 컨테이너를 제거합니다.

배포 실패 시 이전 이미지를 재기동합니다. 적용된 migration은 되돌리지 않고 호환 가능한 fix-forward migration을 추가합니다. `SHUTDOWN_GRACE_MS`보다 컨테이너 종료 유예 시간이 길어야 하며 35초를 권장합니다.

## Health와 의존성 장애

- `/api/health/live`: 프로세스가 이벤트 루프에 응답하는지만 확인합니다. 컨테이너 재시작 판단에 사용합니다.
- `/api/health/ready`: 짧은 timeout으로 DB를 확인합니다. LB 등록과 배포 완료 판단에 사용합니다.
- 스토리지 장애: 웹 서버는 살아 있고 해당 작업만 제한된 timeout 후 실패합니다. 미디어 job과 삭제 job은 lease/backoff로 재시도합니다.
- DB 장애: readiness가 실패하고 API는 오류를 반환합니다. liveness는 유지해 무한 재시작으로 DB를 더 압박하지 않습니다.

## 연결 예산과 확장

기본 설정은 컨테이너 하나당 웹 5개와 worker 2개, 합계 최대 7개의 DB 연결입니다. DB 최대 연결 수에서 운영/마이그레이션용 20%를 남기고 다음 식으로 인스턴스 수를 정합니다.

```text
instances × (WEB_DB_CONNECTION_LIMIT + WORKER_DB_CONNECTION_LIMIT) <= DB max connections × 0.8
```

단일 인스턴스에서 먼저 시작하고 CPU가 지속적으로 70%를 넘거나 API p95가 목표치를 넘을 때 웹 확장을 검토합니다. 현재 rate limiter는 프로세스 메모리 기반이므로 여러 웹 인스턴스로 확장하기 전에는 Redis 또는 프록시/게이트웨이 기반 distributed rate limit으로 교체해야 합니다. 미디어 queue는 DB lease와 fencing을 사용하므로 worker 자체는 여러 개 실행할 수 있지만 DB와 ffmpeg CPU 예산을 먼저 확인합니다.

## 관측과 알림

`METRICS_TOKEN`을 긴 랜덤 값으로 설정하고 Prometheus가 `Authorization: Bearer <token>`으로 `/api/metrics`를 수집하게 합니다. metrics endpoint는 외부 인터넷에 공개하지 않습니다. 모든 API 응답의 `X-Request-Id`와 JSON 로그의 `requestId`로 한 요청을 추적할 수 있습니다.

초기 알림 기준은 다음 정도면 충분합니다.

- readiness 2분 연속 실패
- 5분간 HTTP 5xx 비율 5% 초과
- 5분간 API p95 1초 초과
- DB 또는 storage dependency 오류가 5분간 5건 초과
- 최근 백업 성공 시각이 26시간 이전
- `QUEUED`/`RETRY` 미디어 job의 가장 오래된 `availableAt`이 10분 이전

트래픽과 정상 지연 분포를 일주일 수집한 뒤 임계값을 조정합니다. 이 규모에서는 분산 tracing과 별도 로그 파이프라인은 필수가 아니며, JSON 로그 수집과 Prometheus 지표부터 운영합니다.
