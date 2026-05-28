# Security Secrets Checklist

Use this checklist before pushing changes, preparing a demo deployment, or refreshing deployed demo data. The repository must contain code, documentation, migrations, and seed data only. It must not contain real environment files, credentials, tokens, database passwords, webhook URLs, or production identifiers.

## Secret Handling Rules

- Store secrets only in local environment files, the local shell, Vercel environment variables, or the approved secret manager for the target environment.
- Treat database URLs, HMAC secrets, Microsoft 365 URLs, Power Automate webhook URLs, API tokens, and exported database backups as sensitive.
- Never place secrets in source files, Markdown docs, screenshots, tickets, comments, seed files, migration files, build output, or commit messages.
- Use placeholder examples such as `<local-password>`, `<neon-host>`, `<hmac-secret>`, and `<webhook-url>` when documentation needs an example.
- Keep local, preview, demo, and future production secrets separate. Do not reuse local secrets in Vercel.
- Do not expose secrets through `NEXT_PUBLIC_` variables. Values with that prefix are visible to browser users.

## Local .env Rules

- Backend local secrets belong in `apps/api/.env` or in the local shell.
- Frontend local overrides belong in `apps/web/.env.local`.
- Local `.env` files must remain untracked. The root `.gitignore` excludes `.env`, `.env.local`, `.env.*.local`, `apps/api/.env`, and `apps/web/.env.local`.
- Local files may use placeholders in committed examples only. Do not commit a real `.env.example` value unless it is non-sensitive and intentionally public.
- Before sharing terminal output, redact connection strings, passwords, HMAC secrets, and webhook URLs.

## Vercel Environment Variable Rules

- Configure deployed API secrets on the Vercel API project, not in repository files.
- Configure deployed web public variables on the Vercel web project.
- Scope variables to the intended Vercel environment: Production, Preview, or Development.
- Confirm preview deployments do not point to a production database unless explicitly approved.
- After changing Vercel variables, redeploy the affected project so the runtime receives the new values.
- Use sensitive/encrypted variable handling in Vercel for secrets when available.

## Neon Connection String Handling

- Treat every Neon connection string as a secret because it includes host, user, password, database, and branch context.
- Store Neon connection strings only in Vercel environment variables, a local ignored `.env` file, or the current shell for a one-time operation.
- Never paste a Neon connection string into docs, source, screenshots, logs, or chat.
- Confirm the Neon project, branch, database, and environment before running migrations, seeds, backups, restores, or destructive commands.
- Prefer branch snapshots or logical backups before refreshing demo data.

## HMAC Secret Rotation Guidance

- `CERTIFICATE_HMAC_SECRET` protects certificate QR verification hashes.
- Changing the HMAC secret can invalidate previously generated certificate hashes unless those certificates are regenerated with the new secret.
- Rotate the secret immediately if it is exposed in Git, chat, logs, screenshots, or a shared terminal transcript.
- Before planned rotation, decide whether old demo certificates should remain valid or be regenerated.
- After rotation, redeploy the API and verify certificate render data and QR verification against the intended demo records.

## What Must Never Be Committed

- `.env`, `.env.local`, `.env.*.local`, `apps/api/.env`, or `apps/web/.env.local`.
- Real `DATABASE_URL` values for local PostgreSQL, Neon, or any future production database.
- Real `CERTIFICATE_HMAC_SECRET` values.
- Real database passwords, access tokens, webhook URLs, tenant secrets, API keys, or service principal credentials.
- Full Neon connection strings.
- Database backup files or exported records containing sensitive or shareholder-like data.
- Screenshots or logs that show secrets.

## Pre-push Secret Scan Checklist

Run these checks before pushing:

```powershell
git status --short
git diff --name-only --cached
git ls-files | Select-String -Pattern '(^|/|\\)\.env($|\.)'
git grep -Il "DATABASE_URL"
git grep -Il "CERTIFICATE_HMAC_SECRET"
git grep -Il -E "neon\.tech|postgres(ql)?://"
git grep -Il "<legacy-governance-email>"
git grep -Il "<legacy-brand-token>"
```

Replace the legacy placeholders with any known old demo email or brand token before running those two checks.

Review the matching files without printing secret values into shared channels. Expected matches should be code that reads environment variables or documentation that uses placeholders only.

Before pushing, confirm:

- No `.env` file is tracked or staged.
- No real database URL is present in tracked files.
- No real HMAC secret is present in tracked files.
- No Neon connection string is present in tracked files.
- No local PostgreSQL password is present in tracked files.
- No obsolete legacy-brand user-facing copy remains in app UI or reviewer docs.
- Any example value is clearly a placeholder.

## If a Secret Is Accidentally Committed

1. Stop and do not push the commit if it is still local.
2. Remove the secret from the file and replace it with a placeholder.
3. Rotate the exposed secret anyway if the commit, diff, logs, or screenshots were shared.
4. If the commit was pushed, treat the secret as compromised immediately.
5. Rotate the affected credential in its source system, such as Neon, Vercel, Microsoft 365, or Power Automate.
6. Purge the secret from Git history only with coordinated approval, because history rewrites affect every collaborator.
7. Redeploy affected Vercel projects after updating environment variables.
8. Re-run API health checks, certificate QR checks, and key page checks.
9. Record what was exposed, when it was rotated, and which deployments were verified.
