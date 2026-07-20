#!/usr/bin/env python3
"""Emails a backup file as an attachment via the platform's existing Office 365
SMTP account, so a copy lives off the VPS. Reads SMTP_* values straight out of
apps/api/.env — no separate secrets file to keep in sync.

Usage: email-backup.py /path/to/backup.sql.gz
"""
import os
import smtplib
import sys
from email.message import EmailMessage
from pathlib import Path

ENV_PATH = "/home/digaf/app/apps/api/.env"
RECIPIENT = "digaf-noreply@sol-ventures.com"
MAX_ATTACHMENT_BYTES = 20 * 1024 * 1024  # 20MB — stay under O365's ~25MB limit


def load_env(path: str) -> dict:
    values = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            values[key.strip()] = value.strip()
    return values


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: email-backup.py /path/to/backup.sql.gz", file=sys.stderr)
        return 1

    backup_path = Path(sys.argv[1])
    if not backup_path.is_file():
        print(f"ERROR: {backup_path} does not exist", file=sys.stderr)
        return 1

    size = backup_path.stat().st_size
    if size > MAX_ATTACHMENT_BYTES:
        print(
            f"ERROR: backup is {size} bytes, over the {MAX_ATTACHMENT_BYTES} email limit — "
            "switch to a non-email offsite method (see deploy/nginx-https-setup.md-style runbook).",
            file=sys.stderr,
        )
        return 1

    env = load_env(ENV_PATH)
    host = env.get("SMTP_HOST", "smtp.office365.com")
    port = int(env.get("SMTP_PORT", "587"))
    user = env["SMTP_USER"]
    password = env["SMTP_PASS"]
    sender = env.get("SMTP_FROM", user)

    msg = EmailMessage()
    msg["Subject"] = f"Digaf Registry Backup — {backup_path.stem}"
    msg["From"] = f"Digaf <{sender}>"
    msg["To"] = RECIPIENT
    msg.set_content(
        f"Automated offsite copy of the nightly database backup.\n\n"
        f"File: {backup_path.name}\n"
        f"Size: {size:,} bytes\n\n"
        f"This is a routine backup — no action needed unless a restore is required."
    )
    with open(backup_path, "rb") as f:
        msg.add_attachment(
            f.read(),
            maintype="application",
            subtype="gzip",
            filename=backup_path.name,
        )

    with smtplib.SMTP(host, port) as smtp:
        smtp.starttls()
        smtp.login(user, password)
        smtp.send_message(msg)

    print(f"Offsite backup emailed to {RECIPIENT}: {backup_path.name} ({size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
