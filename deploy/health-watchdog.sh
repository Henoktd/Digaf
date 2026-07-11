#!/usr/bin/env bash
# Health watchdog: restarts containers that respond incorrectly.
# Docker's restart policy handles crashes; this catches hung processes.
# Installed at /home/digaf/health-watchdog.sh, run by cron every 5 minutes.
set -u

LOG="/home/digaf/health-watchdog.log"

check() {
  local name="$1" url="$2" container="$3"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$url" || echo "000")
  if [ "$code" != "200" ]; then
    echo "$(date -Is) $name unhealthy (HTTP $code) — restarting $container" >> "$LOG"
    docker restart "$container" >> "$LOG" 2>&1
  fi
}

check "api" "http://127.0.0.1:4000/health" "app-api-1"
check "web" "http://127.0.0.1:3000/login" "app-web-1"
