#!/usr/bin/env bash
# Nightly PostgreSQL backup with 14-day rotation.
# Installed on the server at /home/digaf/backup-db.sh, run by cron at 02:00.
set -euo pipefail

BACKUP_DIR="/home/digaf/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=14

mkdir -p "$BACKUP_DIR"

docker exec app-postgres-1 pg_dump -U digaf_app digaf_governance \
  | gzip > "$BACKUP_DIR/digaf_governance_${STAMP}.sql.gz"

# Verify the dump is non-trivial (an empty/failed dump gzips to <1KB)
SIZE=$(stat -c%s "$BACKUP_DIR/digaf_governance_${STAMP}.sql.gz")
if [ "$SIZE" -lt 1024 ]; then
  echo "WARNING: backup file suspiciously small (${SIZE} bytes)" >&2
  exit 1
fi

# Rotate old backups
find "$BACKUP_DIR" -name "digaf_governance_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete

echo "Backup OK: digaf_governance_${STAMP}.sql.gz (${SIZE} bytes)"
