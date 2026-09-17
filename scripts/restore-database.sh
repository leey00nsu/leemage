#!/usr/bin/env bash
set -euo pipefail

database_url="${RESTORE_DATABASE_URL:-${DATABASE_URL:-}}"
backup_file="${1:-${BACKUP_FILE:-}}"

if [[ -z "${database_url}" ]]; then
  echo "DATABASE_URL or RESTORE_DATABASE_URL is required" >&2
  exit 1
fi
if [[ -z "${backup_file}" || ! -f "${backup_file}" ]]; then
  echo "Usage: BACKUP_FILE=/path/to/file.dump npm run db:restore" >&2
  exit 1
fi
if [[ "${ALLOW_DATABASE_RESTORE:-}" != "I_UNDERSTAND_DATA_WILL_BE_REPLACED" ]]; then
  echo "Restore refused. Set ALLOW_DATABASE_RESTORE=I_UNDERSTAND_DATA_WILL_BE_REPLACED." >&2
  exit 1
fi

for command in pg_restore openssl; do
  if ! command -v "${command}" >/dev/null 2>&1; then
    echo "${command} is required" >&2
    exit 1
  fi
done

checksum_file="${backup_file}.sha256"
if [[ -f "${checksum_file}" ]]; then
  expected_checksum="$(awk 'NR == 1 {print $1}' "${checksum_file}")"
  actual_checksum="$(openssl dgst -sha256 "${backup_file}" | awk '{print $2}')"
  if [[ -z "${expected_checksum}" || "${expected_checksum}" != "${actual_checksum}" ]]; then
    echo "Backup checksum verification failed" >&2
    exit 1
  fi
else
  echo "Warning: checksum file not found; archive integrity is not independently verified" >&2
fi

restore_file="${backup_file}"
decrypted_file=""
cleanup() {
  if [[ -n "${decrypted_file}" ]]; then rm -f "${decrypted_file}"; fi
}
trap cleanup EXIT

if [[ "${backup_file}" == *.gpg ]]; then
  if ! command -v gpg >/dev/null 2>&1; then
    echo "gpg is required to decrypt this backup" >&2
    exit 1
  fi
  decrypted_file="$(mktemp "${TMPDIR:-/tmp}/leemage-restore.XXXXXX.dump")"
  chmod 600 "${decrypted_file}"
  gpg --batch --yes --decrypt --output "${decrypted_file}" "${backup_file}"
  restore_file="${decrypted_file}"
fi

pg_restore --list "${restore_file}" >/dev/null
pg_restore \
  --dbname="${database_url}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  --exit-on-error \
  --single-transaction \
  "${restore_file}"

echo "Database restore completed"
