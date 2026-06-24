#!/usr/bin/env bash
# Apply all database migrations in order against the Dockerized Postgres.
# Run once after first bringing up `docker compose up -d postgres`, and again
# any time new migration files are added.
set -euo pipefail

cd "$(dirname "$0")/.."

for f in database/migrations/*.sql; do
  echo "Applying $f"
  docker compose exec -T postgres psql -U digaf_app -d digaf_governance < "$f"
done
