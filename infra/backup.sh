#!/usr/bin/env bash
# Daily Postgres backup for the self-hosted Digaf governance platform (Docker path).
# Intended to run from cron, e.g.:
#   0 2 * * * /opt/digaf-governance/app/infra/backup.sh
set -euo pipefail

cd "$(dirname "$0")/.."

BACKUP_DIR="${BACKUP_DIR:-/opt/digaf-governance/backups}"
mkdir -p "$BACKUP_DIR"

TS=$(date +%Y%m%d_%H%M%S)
docker compose exec -T postgres pg_dump -U digaf_app digaf_governance -F c \
  > "${BACKUP_DIR}/digaf_governance_${TS}.dump"

# Keep 14 days of local backups — copy these off the VM separately (see
# docs/deployment-self-hosted-ubuntu.md Section 11 for the off-VM storage plan).
find "$BACKUP_DIR" -name "*.dump" -mtime +14 -delete
