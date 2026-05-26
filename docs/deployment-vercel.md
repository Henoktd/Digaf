# Vercel Deployment

## Architecture

The Digaf Shareholder Governance Platform uses three production services:

- Frontend: Vercel project `digaf-web`, deployed from `apps/web`.
- Backend API: Vercel project `digaf-api`, deployed from `apps/api`.
- Database: Neon PostgreSQL, accessed by the API through `DATABASE_URL`.

## GitHub CI/CD Flow

Vercel is connected to the GitHub repository. The normal deployment flow is:

1. Make and test changes locally.
2. Commit locally with `git commit`.
3. Push with `git push`.
4. Vercel detects the GitHub push and redeploys the affected project.
5. Verify the live API and frontend health URLs after the deployment is ready.

## Vercel API Project Settings

- Project: `digaf-api`
- Root Directory: `apps/api`
- Framework Preset: `Other`

Required environment variables:

- `DATABASE_URL`
- `CERTIFICATE_HMAC_SECRET`
- `NODE_ENV`
- `ALLOWED_ORIGINS`

Set `ALLOWED_ORIGINS` to the comma-separated web origins that may call the API, for example:

```text
https://digaf-web.vercel.app
```

Leave `ALLOWED_ORIGINS` unset for local development if permissive CORS is needed.

## Vercel Web Project Settings

- Project: `digaf-web`
- Root Directory: `apps/web`
- Framework Preset: `Next.js`

Required environment variables:

- `NEXT_PUBLIC_API_BASE_URL`

For production, `NEXT_PUBLIC_API_BASE_URL` should point to the deployed API:

```text
https://digaf-api.vercel.app
```

## Neon Migration and Seed Checklist

Before deploying or validating a new environment:

1. Confirm `DATABASE_URL` points to the intended Neon branch/database.
2. Apply the current database migrations from the repository.
3. Run the required seed process for reference data and demo/admin records.
4. Confirm the API can connect by checking `/health/db`.
5. Confirm the application has the expected entities, shareholders, share classes, certificates, and audit data.

## Live Health Checklist

After each production deployment, verify:

- `https://digaf-api.vercel.app/api/version`
- `https://digaf-api.vercel.app/health/db`
- `https://digaf-web.vercel.app`

The API version response should include `name`, `architecture`, `environment`, `status`, and `timestampUtc`.

## Troubleshooting

### Missing env var

Symptoms include failed builds, API 500 responses, failed database connections, or certificate verification failures. Check the Vercel project environment variables for the correct environment, then redeploy.

### Wrong Root Directory

If Vercel cannot find the build command, API entrypoint, or Next.js app, confirm the project root directory:

- API: `apps/api`
- Web: `apps/web`

### CORS issue

If the browser blocks API calls, confirm `ALLOWED_ORIGINS` in `digaf-api` includes the exact deployed frontend origin. Origins must include the scheme and host, such as `https://digaf-web.vercel.app`.

For local development, leave `ALLOWED_ORIGINS` unset or include the local frontend origin.

### Empty database

If the app loads but records are missing, confirm the API is using the intended Neon database and run the migration/seed checklist. Also verify that local, preview, and production environments are not pointing to different Neon branches unexpectedly.

### QR hash tamper detected after HMAC secret change

Certificate QR hashes are tied to `CERTIFICATE_HMAC_SECRET`. Changing that secret invalidates previously generated certificate hashes. Restore the previous secret if existing certificates must continue to validate, or regenerate certificates intentionally with the new secret.
