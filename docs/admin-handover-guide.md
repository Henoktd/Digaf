# Admin Handover Guide

This guide gives a new administrator or technical owner enough context to operate, review, and continue the Digaf Shareholder Governance Platform MVP.

## Platform Overview

The Digaf Shareholder Governance Platform is a shareholder governance MVP for regulated workflow demonstration. It supports shareholder registry management, KYC updates, share ownership visibility, transfer eligibility checks, maker-checker approvals, certificates, QR verification, audit evidence, SLA monitoring, legal holds, communications, and document references.

The current MVP is suitable for local development and deployed demo review. It is not yet approved for live regulated production data.

## Architecture Overview

- Backend API: `apps/api`
- Frontend Next.js app: `apps/web`
- Local database: PostgreSQL
- Deployed demo frontend: Vercel project `digaf-web`
- Deployed demo API: Vercel project `digaf-api`
- Deployed demo database: Neon PostgreSQL
- Source control and CI/CD trigger: GitHub connected to Vercel
- Database migrations: `database\migrations`
- Demo/reference seeds: `database\seeds`
- Documentation: `docs`

Application code is deployed through GitHub and Vercel. Database state is managed separately through PostgreSQL migrations, seeds, backups, and Neon branch/export practices.

## Core Modules

- Dashboard overview
- Shareholder registry
- Shareholder profile
- Shareholder creation
- KYC update workflow
- Cap table
- Certificate registry
- Certificate QR verification
- Transfer eligibility guard
- Transfer request creation
- Approval queue
- Checker 1 and Checker 2 approvals
- Audit log
- SLA monitor
- Legal holds
- Communications
- Documents
- Deployment documentation
- Local RBAC foundation
- Microsoft Entra ID planning
- Testing and release documentation

## Local Development Setup

Prerequisites:

- Node.js and npm
- Local PostgreSQL
- `psql` and `pg_dump` available on PATH
- Repository cloned at `C:\svh-governance-platform`

Backend startup:

```powershell
cd C:\svh-governance-platform\apps\api
npm.cmd run dev
```

Frontend startup:

```powershell
cd C:\svh-governance-platform\apps\web
npm.cmd run dev
```

Local API base URL:

```text
http://localhost:4000
```

The frontend defaults to this local API URL if `NEXT_PUBLIC_API_BASE_URL` is not set.

## Deployment Setup

Deployment is handled by Vercel projects connected to GitHub.

API deployment:

- Vercel project: `digaf-api`
- Root directory: `apps/api`
- Framework preset: `Other`

Web deployment:

- Vercel project: `digaf-web`
- Root directory: `apps/web`
- Framework preset: `Next.js`

Normal deployment flow:

```text
local development -> Git commit -> optional push -> Vercel deploy -> optional Neon data sync
```

After deployment, validate:

```powershell
curl -i https://digaf-api.vercel.app/health
curl -i https://digaf-api.vercel.app/health/db
curl -i https://digaf-api.vercel.app/api/version
```

## Environment Variables

Backend API variables:

- `DATABASE_URL`: PostgreSQL connection string.
- `CERTIFICATE_HMAC_SECRET`: HMAC secret used for certificate verification hashes.
- `NODE_ENV`: runtime environment label.
- `ALLOWED_ORIGINS`: comma-separated allowed frontend origins for CORS.

Frontend variables:

- `NEXT_PUBLIC_API_BASE_URL`: API base URL used by the web app.

Secret handling rules:

- Do not commit `.env` files.
- Do not paste secrets into screenshots or tickets.
- Rotate secrets if exposed.
- Keep local, demo, staging, and future production secrets separate.

## Database Migration/Seed Process

Migrations define structure. Seeds define demo/reference records.

Apply migrations in order:

```powershell
cd C:\svh-governance-platform
psql "$env:DATABASE_URL" -f database\migrations\001_initial_governance_schema.sql
psql "$env:DATABASE_URL" -f database\migrations\002_regulated_governance_tables.sql
```

Apply seeds in order only when the target environment should receive demo data:

```powershell
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

Before running migrations or seeds against Neon, confirm the exact project, branch, database, and backup state.

## User Role Model

The local prototype uses simulated roles:

| Role | Current MVP purpose |
| --- | --- |
| `maker` | Creates shareholder records and transfer requests. |
| `checker_1` | Performs first checker approval. |
| `checker_2` | Performs second checker approval and completes transfer workflow. |
| `governance_admin` | Represents administrator-level governance capability in the prototype. |
| `compliance_officer` | Updates KYC and compliance-related shareholder state. |
| `viewer` | Reviews records without mutation expectations. |

Production identity should use Microsoft Entra ID with backend JWT validation and group-to-role mapping.

## Known Prototype Limitations

- Microsoft Entra ID sign-in is planned but not implemented.
- Backend JWT validation is planned but not implemented.
- Local role simulation still relies on prototype role values.
- Production-grade authorization must not trust client-controlled role values.
- SharePoint document storage is represented by document references, not full live integration.
- Power Automate notifications are planned but not connected.
- Power BI reporting is planned but not connected.
- Demo data is not production data.
- Formal production backup, monitoring, alerting, and incident response are not complete.

## Next Implementation Priorities

1. Implement Microsoft Entra ID frontend sign-in.
2. Implement backend JWT validation.
3. Map Entra groups to application roles.
4. Remove trust in client-controlled role values for protected workflows.
5. Add automated API and end-to-end browser tests.
6. Harden database migration, backup, restore, and rollback procedures.
7. Connect SharePoint document storage and metadata.
8. Connect Power Automate notifications.
9. Define Power BI reporting architecture.
10. Complete production readiness security and compliance review.

## Support Handover Checklist

- [ ] Confirm repository access.
- [ ] Confirm Vercel project access for `digaf-api` and `digaf-web`.
- [ ] Confirm Neon project and branch access.
- [ ] Confirm local development startup works.
- [ ] Confirm local PostgreSQL connection works.
- [ ] Confirm deployed API health endpoints pass.
- [ ] Confirm deployed frontend loads.
- [ ] Confirm environment variables are documented and understood.
- [ ] Confirm backup and restore plan is understood.
- [ ] Confirm environment sync plan is understood.
- [ ] Confirm release checklist is understood.
- [ ] Confirm reviewer guide and demo script are current.
- [ ] Confirm known prototype limitations are accepted by stakeholders.
- [ ] Confirm next implementation priorities have an owner.
