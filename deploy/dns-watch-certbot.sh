#!/usr/bin/env bash
# Watches for the equity.digaf.et A record; when it points at this server,
# issues the Let's Encrypt certificate automatically and disables itself.
# Cert is installed WITHOUT a forced redirect so http://196.190.220.15
# keeps working for the team until the full switchover is done.
set -u

DOMAIN="equity.digaf.et"
WWW="www.equity.digaf.et"
EXPECTED_IP="196.190.220.15"
MARKER="/home/digaf/.certbot-done"
LOG="/home/digaf/dns-watch.log"
SUDO_PASS_FILE="/home/digaf/.watch-secret"

[ -f "$MARKER" ] && exit 0

resolves() {
  getent hosts "$1" | awk '{print $1}' | grep -q "^${EXPECTED_IP}$"
}

if ! resolves "$DOMAIN"; then
  echo "$(date -Is) ${DOMAIN} not resolving yet" >> "$LOG"
  exit 0
fi

DOMAINS="-d ${DOMAIN}"
if resolves "$WWW"; then
  DOMAINS="${DOMAINS} -d ${WWW}"
fi

echo "$(date -Is) DNS live — running certbot ${DOMAINS}" >> "$LOG"

if sudo -S certbot --nginx ${DOMAINS} \
  --no-redirect --non-interactive --agree-tos \
  -m info@sol-ventures.com < "$SUDO_PASS_FILE" >> "$LOG" 2>&1; then
  touch "$MARKER"
  echo "$(date -Is) SUCCESS — certificate issued for ${DOMAIN}" >> "$LOG"
else
  echo "$(date -Is) certbot failed — will retry next run" >> "$LOG"
fi
