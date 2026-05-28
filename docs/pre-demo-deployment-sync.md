# Pre-demo Deployment Sync

Use this guide when preparing either a local-only demo or a deployed stakeholder review of the Digaf Shareholder Governance Platform.

## When to Push to GitHub

Push to GitHub when the intended code and documentation changes are committed, backend and frontend builds pass locally, and the branch is ready for Vercel CI/CD to build from source.

Do not push when local `.env` files are staged, builds are failing, migrations or package changes are accidental, or demo data refresh steps are still undecided.

## When to Deploy to Vercel

Deploy to Vercel after the relevant branch has been pushed and the Vercel projects are expected to build from that branch. GitHub is connected to Vercel, so a push to the connected branch is normally enough to create a deployment.

Redeploy after changing Vercel environment variables, changing frontend API base URLs, rotating `CERTIFICATE_HMAC_SECRET`, or changing API code that affects deployed behavior.

## When to Sync Local Data to Neon

Sync, reseed, or replay setup data to Neon only when the deployed demo needs updated demo data and the team has confirmed the target Neon project, branch, database, and backup state.

Prefer replaying committed migrations and seed files over copying a full local developer database. Never sync ad hoc local records, personal data, local passwords, or unreviewed test data to Neon.

## Why Local and Deployed Data Can Differ

Local PostgreSQL and Neon are separate databases. Vercel deployments update code, not database contents. Records can differ because developers create local test data, reviewers create deployed demo records, seeds have been run at different times, or Neon has been intentionally preserved between demo sessions.

Known differences are acceptable when they are documented and do not block the planned demo flow.

## Pre-demo Checklist

- Backend build: run `npm run build` from `apps/api`.
- Frontend build: run `npm run build` from `apps/web`.
- API smoke tests: run the local or deployed checks in [api-smoke-tests.md](api-smoke-tests.md).
- Vercel deployment status: confirm the API and web deployments succeeded for the intended commit.
- Neon data check: confirm `/health/db` passes and the expected demo records exist.
- Role/demo data check: confirm maker, checker, governance admin, compliance, and viewer paths have the expected demo state.
- QR verification check: confirm certificate render data and QR verification work with the current `CERTIFICATE_HMAC_SECRET`.
- Key pages check: open dashboard, shareholders, shareholder profile, cap table, certificates, QR verification, transfers, approvals, audit log, SLA monitor, legal holds, communications, documents, integrations, and reporting prep pages.

## Decision Tree

### Local-only Demo

Choose this path when the audience is internal, the network is unreliable, Vercel or Neon access is unavailable, or the demo needs rapid iteration.

1. Use local PostgreSQL.
2. Run backend and frontend builds.
3. Start the API and web app locally.
4. Run local API smoke tests.
5. Verify key pages against local data.
6. Do not push or deploy unless the local changes are ready for review.

### Deployed Demo

Choose this path when stakeholders need a shared URL or the review should reflect the Vercel and Neon setup.

1. Confirm the branch is ready.
2. Commit the intended changes.
3. Push to the Vercel-connected branch.
4. Confirm API and web deployments succeeded.
5. Confirm Vercel environment variables are correct.
6. Confirm Neon has the intended demo data.
7. Run deployed API smoke tests and key page checks.

### Stakeholder Review

Choose this path when reviewers will interact with the deployed demo and their activity should be preserved.

1. Avoid Neon resets during the review window.
2. Confirm demo roles and expected records before the session.
3. Record the deployed commit and deployment URLs.
4. Run non-destructive smoke checks immediately before the review.
5. Capture feedback and issues separately from secret-bearing logs.

### Reset or Reseed Neon

Choose this path only when deployed demo data is stale, broken, or intentionally being refreshed.

1. Confirm the target Neon project, branch, and database.
2. Take a Neon branch snapshot or logical backup.
3. Confirm no reviewer session is active.
4. Replay committed migrations if needed.
5. Replay committed seed files for the approved demo data set.
6. Run deployed `/health/db` and API smoke checks.
7. Verify key frontend pages and QR verification.
8. Record the refresh date, operator, source commit, and validation result.
