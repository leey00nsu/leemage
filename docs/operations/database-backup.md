# 데이터베이스 백업·복구 런북

이 프로젝트의 데이터는 PostgreSQL 메타데이터와 OCI/R2 객체로 나뉩니다. DB 덤프만으로 업로드 파일까지 복구되지는 않습니다.

## 운영 기준

- 토이 프로젝트의 기본 목표는 RPO 24시간, RTO 2시간입니다.
- DB는 매일 백업하고 14일 보관합니다. 백업 파일은 DB 서버와 다른 저장소에 복사합니다.
- 운영 백업은 `BACKUP_GPG_RECIPIENT`로 암호화하거나, 동등한 서버 측 암호화와 접근 통제가 적용된 저장소에 보관합니다.
- OCI/R2 버킷은 object versioning을 켜고 최소 14일간 이전 버전을 유지합니다.
- 분기마다 별도 DB에 실제 복구해 파일 수, 프로젝트 수, 최신 업로드 시각을 대조합니다.
- RPO 24시간이 허용되지 않는 규모가 되면 관리형 PostgreSQL의 PITR/WAL 보관으로 전환합니다.

스케줄러에는 저장소의 코드가 아니라 배포된 동일 버전의 스크립트를 사용합니다. 실패 알림과 마지막 성공 시각도 함께 감시해야 합니다.

## 백업

PostgreSQL 클라이언트의 major version은 서버 버전 이상을 사용합니다. 운영에서는 읽기 권한이 있는 전용 백업 계정을 `BACKUP_DATABASE_URL`에 지정하는 것을 권장합니다.

```bash
export BACKUP_DATABASE_URL='postgresql://...'
export BACKUP_DIR=/secure/leemage-backups
export BACKUP_GPG_RECIPIENT='backup@example.com'
npm run db:backup
```

스크립트는 custom-format dump를 생성하고 `pg_restore --list`로 구조를 검사한 뒤 SHA-256 파일을 만듭니다. 생성된 dump와 `.sha256`을 함께 원격 저장소로 복사합니다. 저장소 수명 주기 정책으로 14일이 지난 일일 백업을 삭제합니다.

## 복구 훈련 및 실제 복구

1. 대상이 운영 DB인지 다시 확인합니다.
2. 웹과 미디어 워커를 중지해 쓰기 요청을 차단합니다.
3. 가능하면 현재 DB를 한 번 더 백업합니다.
4. 암호화된 dump와 `.sha256` 파일을 같은 경로에 둡니다.
5. 아래 명령을 실행합니다. 이 작업은 대상 DB의 기존 객체를 교체합니다.

```bash
export RESTORE_DATABASE_URL='postgresql://.../leemage_restore'
export BACKUP_FILE=/secure/leemage-backups/leemage-YYYYMMDDTHHMMSSZ.dump.gpg
export ALLOW_DATABASE_RESTORE=I_UNDERSTAND_DATA_WILL_BE_REPLACED
npm run db:restore
npm run release
```

6. `/api/health/ready`가 200인지 확인합니다.
7. 프로젝트 수, 완료 파일 수, 최신 업로드 시각을 원본 또는 백업 기록과 대조합니다.
8. 객체 저장소의 표본 파일을 다운로드해 DB 메타데이터와 함께 복구됐는지 확인합니다.

복구 스크립트는 체크섬을 검증하고 전체 restore를 단일 트랜잭션으로 실행합니다. 실패하면 PostgreSQL이 해당 restore 변경을 롤백합니다.

## 마이그레이션과 롤백

- 배포 파이프라인에서 `npm run release`를 웹 프로세스 시작 전에 한 번만 실행합니다.
- 스키마 변경은 expand → 애플리케이션 배포 → contract 순서로 나눕니다. 같은 배포에서 컬럼 추가와 기존 컬럼 삭제를 함께 하지 않습니다.
- 배포 실패 시 애플리케이션 이미지를 이전 버전으로 되돌립니다. 이미 적용한 migration은 임의로 down migration하지 않고 fix-forward합니다.
- 데이터 삭제나 타입 축소가 포함된 migration 전에는 즉시 백업을 만들고 별도 DB에서 복구를 검증합니다.
