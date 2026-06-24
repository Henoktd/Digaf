#!/usr/bin/env bash
# Redeploy the Digaf governance platform on the self-hosted Ubuntu VM (Docker path).
# Run from the repo root: ./infra/deploy.sh
set -euo pipefail

cd "$(dirname "$0")/.."

git pull origin main
docker compose up -d --build
docker image prune -f
