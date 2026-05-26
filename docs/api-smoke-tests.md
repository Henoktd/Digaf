# API Smoke Tests

Use these commands to verify that the Digaf API is reachable and returning expected JSON responses. Run the local set before release, then run the deployed set after deployment.

## Base URLs

- Local: `http://localhost:4000`
- Deployed demo: `https://digaf-api.vercel.app`

## Local API Smoke Tests

```bash
curl -i http://localhost:4000/health
curl -i http://localhost:4000/health/db
curl -i http://localhost:4000/api/version
curl -i http://localhost:4000/api/entities
curl -i http://localhost:4000/api/shareholders
curl -i http://localhost:4000/api/cap-table
curl -i http://localhost:4000/api/certificates
curl -i http://localhost:4000/api/certificates/verify/DIGAF-CERT-2026-000001
curl -i http://localhost:4000/api/transfers
curl -i http://localhost:4000/api/approvals
curl -i http://localhost:4000/api/audit-logs
curl -i http://localhost:4000/api/sla-monitor
curl -i http://localhost:4000/api/legal-holds
curl -i http://localhost:4000/api/communications
curl -i http://localhost:4000/api/documents
```

## Deployed Demo API Smoke Tests

```bash
curl -i https://digaf-api.vercel.app/health
curl -i https://digaf-api.vercel.app/health/db
curl -i https://digaf-api.vercel.app/api/version
curl -i https://digaf-api.vercel.app/api/entities
curl -i https://digaf-api.vercel.app/api/shareholders
curl -i https://digaf-api.vercel.app/api/cap-table
curl -i https://digaf-api.vercel.app/api/certificates
curl -i https://digaf-api.vercel.app/api/certificates/verify/DIGAF-CERT-2026-000001
curl -i https://digaf-api.vercel.app/api/transfers
curl -i https://digaf-api.vercel.app/api/approvals
curl -i https://digaf-api.vercel.app/api/audit-logs
curl -i https://digaf-api.vercel.app/api/sla-monitor
curl -i https://digaf-api.vercel.app/api/legal-holds
curl -i https://digaf-api.vercel.app/api/communications
curl -i https://digaf-api.vercel.app/api/documents
```

## Expected Smoke Result

Each command should return an HTTP success response and a readable JSON body. `/health/db` should confirm database connectivity for the target environment. If a command fails, record the status code, response body, environment, timestamp, and whether the failure also occurs in the other environment.
