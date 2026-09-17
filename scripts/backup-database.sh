#!/usr/bin/env bash
set -euo pipefail

database_url="${BACKUP_DATABASE_URL:-${DATABASE_URL:-}}"
if [[ -z "${database_url}" ]]; then
  echo "DATABASE_URL or BACKUP_DATABASE_URL is required" >&2
  exit 1
fi

for command in pg_dump pg_restore openssl; do
  if ! command -v "${command}" >/dev/null 2>&1; then
    echo "${command} is required" >&2
    exit 1
  fi
done

backup_dir="${BACKUP_DIR:-./backups}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
work_file="${backup_dir}/.leemage-${timestamp}-$$.dump"
output_file="${backup_dir}/leemage-${timestamp}.dump"

umask 077
mkdir -p "${backup_dir}"

cleanup() {
  rm -f "${work_file}" "${output_file}.tmp"
}
trap cleanup EXIT

if [[ -e "${output_file}" || -e "${output_file}.gpg" ]]; then
  echo "A backup for ${timestamp} already exists" >&2
  exit 1
fi

pg_dump \
  --dbname="${database_url}" \
  --format=custom \
  --compress=9 \
  --no-owner \
  --no-acl \
  --file="${work_file}"

# A successful dump process alone is insufficient; make sure the archive table
# of contents can be parsed before publishing the file.
pg_restore --list "${work_file}" >/dev/null

if [[ -n "${BACKUP_GPG_RECIPIENT:-}" ]]; then
  output_file="${output_file}.gpg"
  gpg --batch --yes --encrypt \
    --recipient "${BACKUP_GPG_RECIPIENT}" \
    --output "${output_file}.tmp" \
    "${work_file}"
  mv "${output_file}.tmp" "${output_file}"
  rm -f "${work_file}"
else
  mv "${work_file}" "${output_file}"
  echo "Warning: backup is not GPG-encrypted; store it only on encrypted media" >&2
fi

chmod 600 "${output_file}"
checksum="$(openssl dgst -sha256 "${output_file}" | awk '{print $2}')"
printf '%s  %s\n' "${checksum}" "$(basename "${output_file}")" >"${output_file}.sha256"
chmod 600 "${output_file}.sha256"

trap - EXIT
echo "Backup created: ${output_file}"
echo "Checksum created: ${output_file}.sha256"
