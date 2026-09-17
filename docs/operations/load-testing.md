# API 부하 테스트 런북

이 테스트는 프로젝트 목록과, `PROJECT_ID`가 있을 때 프로젝트 상세 조회를 1:1로 호출합니다. 데이터 생성·삭제와 객체 업로드는 수행하지 않지만 API 감사 로그는 정상적으로 기록되므로 운영이 아닌 staging에서 실행합니다.

## 준비

staging DB에 최소 100개 프로젝트와 대상 프로젝트당 1,000개 정도의 파일을 준비하면 pagination과 집계 query를 함께 검증할 수 있습니다. 테스트 머신과 서버는 분리합니다.

API read limit은 key 하나당 100 requests/minute입니다. rate limiter가 아니라 서버 용량을 보려면 예상 요청 수를 key별 100회 이하로 분산해야 합니다. 30초 기본 실행 기준 권장 key 수는 10 RPS 3개, 50 RPS 15개, 100 RPS 30개, burst 500은 5개입니다. 부족하면 429 threshold가 의도적으로 실패합니다.

```bash
export BASE_URL=https://staging-leemage.example.com
export API_KEYS='lmk_key1,lmk_key2,lmk_key3'
export PROJECT_ID='existing-project-id'

PROFILE=10rps npm run load:k6
PROFILE=50rps npm run load:k6
PROFILE=100rps npm run load:k6
PROFILE=burst500 npm run load:k6
```

기본 duration은 30초이고 `DURATION=2m`으로 바꿀 수 있습니다. duration을 늘릴 때 key 수도 비례해 늘립니다. 기본 합격 기준은 성공/체크 99% 이상, 5xx 1% 미만, 429 0%, p95 1초 미만입니다. 환경 목표가 다르면 `LATENCY_P95_MS`만 조정합니다.

## 현재 구조에서 예상되는 결과

| Profile | 예상 동작과 첫 병목 |
| --- | --- |
| 10 RPS | 기본 DB pool 5개로 여유가 있어야 합니다. 인증 key 조회, 프로젝트 query, batch API log 쓰기 순으로 비용이 발생합니다. |
| 50 RPS | DB query가 100ms에 가까우면 5개 connection이 포화되기 시작합니다. p95와 Prisma pool wait가 먼저 증가할 가능성이 큽니다. |
| 100 RPS | 단일 컨테이너에서는 DB pool이 첫 병목일 가능성이 높습니다. pool wait 10초를 넘으면 오류율이 증가합니다. CPU보다 DB 대기와 API log write latency를 먼저 봅니다. |
| Burst 500 | 명시적인 application request queue가 없으므로 LB/socket 대기 뒤 DB pool에 backpressure가 집중됩니다. timeout이 없으면 cascade가 되지만 현재 pool wait와 HTTP/storage timeout이 상한을 둡니다. |

이미지와 영상 처리는 이 read profile에 포함하지 않습니다. 업로드 본문은 object storage로 직접 전송되며 confirm 이후 DB queue로 넘어갑니다. 별도 media 테스트는 작은 표본으로 `MEDIA_WORKER_CONCURRENCY=2`에서 queue의 oldest age가 회복되는지 확인하고, CPU와 memory를 함께 관찰합니다.

## 실행 중 확인할 항목

- k6의 `http_req_duration`, `http_req_waiting`, dropped iterations, 429/5xx
- `/api/metrics`의 endpoint별 요청 수, 오류율, latency와 DB/storage dependency latency
- PostgreSQL active connection, query latency, lock wait, CPU와 IOPS
- 컨테이너 CPU/memory, event-loop 지연 징후, restart 여부
- `ApiLog`, `ImageJob`, `VideoJob`, `ObjectCleanupJob`의 backlog와 oldest age

단계 사이에는 rate-limit window와 부하가 정상화될 시간을 두고, 한 번에 하나의 profile만 실행합니다. 50 RPS에서 목표를 못 맞추면 인스턴스를 늘리기 전에 slow query와 DB pool wait를 먼저 확인합니다.
