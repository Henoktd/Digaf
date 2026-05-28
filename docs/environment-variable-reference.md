# Environment Variable Reference

All values below are placeholders. Do not copy real secrets, passwords, Neon connection strings, webhook URLs, tenant IDs, or production values into this document.

## Backend Local Variables

Set these for the backend API in `apps/api/.env` or in the local shell.

| Variable | Required | Placeholder value | Notes |
| --- | --- | --- | --- |
| `PORT` | Optional | `4000` | Local API port. The API defaults to `4000` when unset. |
| `DATABASE_URL` | Required | `postgresql://postgres:<local-password>@localhost:5432/digaf_governance` | Local PostgreSQL connection string. Keep the real value out of Git. |
| `CERTIFICATE_HMAC_SECRET` | Required | `<local-certificate-hmac-secret>` | Local-only HMAC secret used for certificate QR hash generation and verification. |

## Backend Vercel Variables

Set these on the Vercel API project for the appropriate Production, Preview, or Development environment.

| Variable | Required | Placeholder value | Notes |
| --- | --- | --- | --- |
| `DATABASE_URL` | Required | `postgresql://<user>:<password>@<neon-host>/<database>?sslmode=require` | Neon PostgreSQL connection string. Treat as a secret. |
| `CERTIFICATE_HMAC_SECRET` | Required | `<vercel-certificate-hmac-secret>` | Secret used by the deployed API for certificate QR hashes. Keep stable unless intentionally rotating. |
| `NODE_ENV` | Recommended | `production` | Runtime environment label for deployed API behavior and diagnostics. |
| `ALLOWED_ORIGINS` | Required for restricted CORS | `https://<web-project>.vercel.app` | Comma-separated frontend origins allowed to call the API. |
| `SHAREPOINT_SITE_URL` | Future optional | `https://<tenant>.sharepoint.com/sites/<site-name>` | Placeholder for future SharePoint integration. Do not include private tenant values in docs. |
| `SHAREPOINT_DOCUMENT_LIBRARY` | Future optional | `<document-library-name>` | Placeholder for future SharePoint document library name. |
| `POWER_AUTOMATE_NOTIFICATION_WEBHOOK_URL` | Future optional | `https://<power-automate-webhook-url>` | Placeholder for future notification webhook. Treat real values as secrets. |
| `POWER_BI_WORKSPACE_ID` | Future optional | `<power-bi-workspace-id>` | Placeholder for future Power BI workspace reference. |
| `POWER_BI_REPORT_ID` | Future optional | `<power-bi-report-id>` | Placeholder for future Power BI report reference. |

## Frontend Local Variables

Set these for the Next.js app in `apps/web/.env.local` when overriding the default local API URL.

| Variable | Required | Placeholder value | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Optional locally | `http://localhost:4000` | Public browser-visible API base URL. Never place secrets in `NEXT_PUBLIC_` variables. |

## Frontend Vercel Variables

Set these on the Vercel web project for the appropriate Production, Preview, or Development environment.

| Variable | Required | Placeholder value | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | Required | `https://<api-project>.vercel.app` | Public browser-visible API base URL for the deployed backend. |
| `NEXT_PUBLIC_ENTRA_CLIENT_ID` | Future optional | `<future-entra-client-id>` | Future Microsoft Entra frontend client ID. Public identifier, not a client secret. |
| `NEXT_PUBLIC_ENTRA_TENANT_ID` | Future optional | `<future-entra-tenant-id>` | Future Microsoft Entra tenant ID. Public identifier, not a client secret. |

## Reference Rules

- Backend secrets belong only in API-side environment variables.
- Frontend variables prefixed with `NEXT_PUBLIC_` are embedded into the browser bundle and must not contain secrets.
- Vercel API and web projects have separate environment variable sets.
- Local `.env` files are ignored and should not be staged.
- After changing Vercel variables, redeploy the affected project and rerun smoke checks.
