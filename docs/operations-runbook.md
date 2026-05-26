# Operations Runbook

This runbook captures routine local development and deployed demo checks for the Digaf Shareholder Governance Platform.

## Daily Development Startup Commands

Open separate terminals for the API and web app.

API terminal:

```powershell
cd C:\svh-governance-platform\apps\api
npm.cmd run dev
```

Web terminal:

```powershell
cd C:\svh-governance-platform\apps\web
npm.cmd run dev
```

If using plain `npm` works in the local shell, `npm run dev` is equivalent. On this Windows environment, `npm.cmd` avoids PowerShell shim issues.

## Backend Startup

The backend API is in `apps/api`.

```powershell
cd C:\svh-governance-platform\apps\api
npm.cmd run dev
```

Expected local API base URL:

```text
http://localhost:4000
```

Required local environment variables:

- `DATABASE_URL`
- `CERTIFICATE_HMAC_SECRET`
- `ALLOWED_ORIGINS` if CORS needs to be restricted locally

## Frontend Startup

The frontend Next.js app is in `apps/web`.

```powershell
cd C:\svh-governance-platform\apps\web
npm.cmd run dev
```

Expected local frontend URL is the URL printed by Next.js, usually:

```text
http://localhost:3000
```

Required frontend environment variable when overriding the default API URL:

- `NEXT_PUBLIC_API_BASE_URL`

If unset, the frontend API helper defaults to `http://localhost:4000`.

## Database Health Checks

Local API health:

```powershell
curl -i http://localhost:4000/health
curl -i http://localhost:4000/health/db
```

Deployed API health:

```powershell
curl -i https://digaf-api.vercel.app/health
curl -i https://digaf-api.vercel.app/health/db
```

If `/health` passes but `/health/db` fails, focus on `DATABASE_URL`, database availability, SSL settings, and network access.

## API Smoke Checks

Use the full smoke checklist in [api-smoke-tests.md](api-smoke-tests.md).

Minimal local smoke:

```powershell
curl -i http://localhost:4000/api/version
curl -i http://localhost:4000/api/entities
curl -i http://localhost:4000/api/shareholders
curl -i http://localhost:4000/api/cap-table
curl -i http://localhost:4000/api/certificates
```

Minimal deployed smoke:

```powershell
curl -i https://digaf-api.vercel.app/api/version
curl -i https://digaf-api.vercel.app/api/entities
curl -i https://digaf-api.vercel.app/api/shareholders
curl -i https://digaf-api.vercel.app/api/cap-table
curl -i https://digaf-api.vercel.app/api/certificates
```

## Git Commit Workflow

Recommended local workflow:

```powershell
cd C:\svh-governance-platform
git status --short
git diff --stat
git diff
git add <intended-files>
git commit -m "Short descriptive message"
```

Before committing:

- Confirm no `.env` files or backups are staged.
- Confirm generated build output is not staged accidentally.
- Confirm database migrations are included only when intentionally changed.
- Run backend and frontend builds when the release checklist requires it.

## Vercel Deployment Check

GitHub is connected to Vercel for CI/CD. After pushing a branch that Vercel deploys:

- Confirm the `digaf-api` deployment succeeded.
- Confirm the `digaf-web` deployment succeeded.
- Confirm the API project root directory is `apps/api`.
- Confirm the web project root directory is `apps/web`.
- Confirm Vercel environment variables are set for the intended environment.
- Check deployed API health:

```powershell
curl -i https://digaf-api.vercel.app/health
curl -i https://digaf-api.vercel.app/health/db
curl -i https://digaf-api.vercel.app/api/version
```

## Neon Database Check

Before deploying or refreshing data:

- Confirm the target Neon project.
- Confirm the target Neon branch.
- Confirm the target database name.
- Confirm `DATABASE_URL` points to the intended Neon target.
- Confirm whether migrations or seeds are required.
- Take a backup or branch snapshot before destructive changes.

After changes:

```powershell
curl -i https://digaf-api.vercel.app/health/db
curl -i https://digaf-api.vercel.app/api/shareholders
curl -i https://digaf-api.vercel.app/api/cap-table
```

## Common Errors and Fixes

### DATABASE_URL Missing

Symptoms:

- API fails on startup.
- `/health/db` fails.
- Error includes `DATABASE_URL is not defined`.

Fix:

- Set `DATABASE_URL` in the local shell or `.env` file used by the API.
- In Vercel, set `DATABASE_URL` on the `digaf-api` project.
- Confirm the URL points to local PostgreSQL for local work and Neon for deployed demo work.

### CORS Blocked

Symptoms:

- Browser blocks frontend API calls.
- API may work with `curl` but fail from the web app.

Fix:

- Confirm `ALLOWED_ORIGINS` includes the exact frontend origin.
- Include scheme and host, for example `https://digaf-web.vercel.app`.
- For local development, either leave `ALLOWED_ORIGINS` unset or include the local frontend origin.

### Vercel Old Deployment

Symptoms:

- Deployed app does not reflect latest committed changes.
- API version or UI still looks stale.

Fix:

- Confirm the commit was pushed to the branch connected to Vercel.
- Confirm the Vercel deployment completed successfully.
- Check whether the browser is loading a cached page.
- Redeploy from Vercel if the expected commit did not deploy.

### Localhost Differs From Deployed Data

Symptoms:

- Local shareholder, transfer, certificate, or audit records differ from the deployed demo.

Fix:

- Confirm local PostgreSQL and Neon are separate data stores.
- Check whether seeds were run in both environments.
- Check whether reviewers created records in the deployed demo.
- Use [environment-sync-plan.md](environment-sync-plan.md) before refreshing Neon data.

### QR Hash Tamper Detected After HMAC Secret Change

Symptoms:

- Certificate verification reports tamper or hash mismatch after a secret change.

Fix:

- Certificate hashes depend on `CERTIFICATE_HMAC_SECRET`.
- Restore the previous secret if existing certificates must continue to validate.
- If the secret change is intentional, regenerate affected demo certificates and document the change.

### PostgreSQL Connection Failure

Symptoms:

- API cannot start or `/health/db` fails.
- Connection refused, timeout, SSL, or authentication errors appear.

Fix:

- Confirm PostgreSQL is running locally.
- Confirm `DATABASE_URL` host, port, database, user, and password.
- For Neon, confirm `sslmode=require` is present when needed.
- Confirm the database has not been paused or deleted.
- Confirm network access is available.

### Port Already in Use

Symptoms:

- API or frontend startup fails because the requested port is occupied.

Fix:

- Find the process using the port:

```powershell
netstat -ano | findstr :4000
netstat -ano | findstr :3000
```

- Stop the existing process if it is stale, or start the app on another port if supported.
- Confirm the frontend `NEXT_PUBLIC_API_BASE_URL` still points to the actual API port.
