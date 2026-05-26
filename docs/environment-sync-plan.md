# Environment Sync Plan

This plan explains how local development, GitHub, Vercel, and Neon relate to each other for the Digaf Shareholder Governance Platform. It also defines when data should and should not be synchronized.

## Difference Between Local, GitHub, Vercel, and Neon

Local development:

- Runs on the developer machine.
- Uses `apps/api` for the backend API.
- Uses `apps/web` for the Next.js frontend.
- Uses local PostgreSQL.
- Best for implementation, debugging, and workflow testing.

GitHub:

- Stores source code, documentation, migrations, seeds, and deployment configuration.
- Triggers Vercel CI/CD when connected branches are pushed.
- Does not store live database state.

Vercel:

- Hosts the deployed API project `digaf-api`.
- Hosts the deployed web project `digaf-web`.
- Reads environment variables configured in Vercel.
- Deploys code from GitHub.
- Does not automatically copy local database contents.

Neon:

- Hosts PostgreSQL for the deployed demo.
- Stores deployed demo data independently from local PostgreSQL.
- Requires explicit migration and seed execution when schema or demo data changes are needed.

## Why Local and Deployed Demo Data May Differ

Local PostgreSQL and Neon are separate databases. They may differ because:

- Local developers create test records during manual testing.
- Neon demo data may be refreshed less often than local data.
- Seeds may have been run in one environment but not the other.
- Reviewer demo sessions may create workflow records in Neon.
- Local database resets do not affect Neon.
- Vercel deployments update code, not database contents.

Differences are acceptable when they are known and documented.

## When to Sync Local to Neon

Sync or replay data setup to Neon when:

- A demo needs the latest approved seed data.
- A new migration is required for deployed API compatibility.
- Deployed demo data drift blocks reviewer validation.
- The team has agreed to reset or refresh the demo data set.
- A release checklist explicitly requires Neon migration or seed updates.

Prefer replaying committed migrations and seed files over copying a developer's full local database.

## When Not to Sync

Do not sync local data to Neon when:

- Local data contains ad hoc testing records that reviewers should not see.
- Local data includes sensitive or accidental personal data.
- Reviewers are actively using the deployed demo.
- The desired change is a code issue rather than a data issue.
- The target Neon branch or database is uncertain.
- The team has not backed up or branched the current Neon demo state.

Never sync to a future production database using demo seed data without formal approval.

## How to Run Migrations on Neon

From the repository root, set `DATABASE_URL` to the intended Neon connection string. Confirm the Neon branch and database before running commands.

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
psql "$env:DATABASE_URL" -f database\migrations\001_initial_governance_schema.sql
psql "$env:DATABASE_URL" -f database\migrations\002_regulated_governance_tables.sql
```

Run migrations in numeric order. Do not skip files. Do not run against an unknown connection string.

## How to Run Seeds on Neon

Run seeds only for the deployed demo or another non-production environment approved for demo data.

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
psql "$env:DATABASE_URL" -f database\seeds\001_seed_digaf.sql
psql "$env:DATABASE_URL" -f database\seeds\002_seed_shareholders.sql
psql "$env:DATABASE_URL" -f database\seeds\003_seed_share_ownership.sql
psql "$env:DATABASE_URL" -f database\seeds\004_seed_certificates.sql
psql "$env:DATABASE_URL" -f database\seeds\005_seed_share_transfers.sql
psql "$env:DATABASE_URL" -f database\seeds\006_seed_legal_holds.sql
psql "$env:DATABASE_URL" -f database\seeds\007_seed_communication_logs.sql
psql "$env:DATABASE_URL" -f database\seeds\008_seed_document_references.sql
psql "$env:DATABASE_URL" -f database\seeds\009_rebrand_demo_shareholder.sql
```

Before seeding Neon:

- Take a Neon branch snapshot or logical backup.
- Confirm the current reviewer demo data can be overwritten or supplemented.
- Confirm the seed files are intended for the current release.

## How to Verify Deployed Data

After migrations or seeds are applied to Neon:

```powershell
curl -i https://digaf-api.vercel.app/health/db
curl -i https://digaf-api.vercel.app/api/entities
curl -i https://digaf-api.vercel.app/api/shareholders
curl -i https://digaf-api.vercel.app/api/cap-table
curl -i https://digaf-api.vercel.app/api/certificates
curl -i https://digaf-api.vercel.app/api/transfers
curl -i https://digaf-api.vercel.app/api/audit-logs
```

Then open the deployed frontend and verify:

- Dashboard loads.
- Shareholder list contains expected demo records.
- Cap table reflects seeded ownership.
- Certificates and QR verification are available.
- Transfer and approval records are visible where expected.
- Legal holds, documents, and communications load.

## How to Avoid Overwriting Reviewer Demo Data

- Treat the Neon demo database as shared reviewer state.
- Announce planned resets before running destructive commands.
- Take a Neon branch snapshot or `pg_dump` export first.
- Prefer additive seed scripts when possible.
- Avoid running local experimental SQL against Neon.
- Record the date, reason, and operator for every Neon data refresh.
- Do not point local development scripts at Neon unless the task explicitly requires it.
- Keep reviewer data refresh windows outside scheduled review sessions.

## Recommended Environment Flow

The recommended flow is:

```text
local development -> Git commit -> optional push -> Vercel deploy -> optional Neon data sync
```

Detailed flow:

1. Develop and test locally against local PostgreSQL.
2. Update migrations or seeds only when a schema or demo data change is intentionally required.
3. Build backend and frontend locally.
4. Commit the intended code and documentation changes.
5. Optionally push to GitHub when ready for CI/CD.
6. Let Vercel deploy the connected API and web projects.
7. Verify deployed API health and frontend pages.
8. Optionally run Neon migrations or seeds when the release requires data changes.
9. Re-run deployed smoke tests and record validation evidence.
