# Release Checklist

Use this checklist before and after releasing changes to the Digaf Shareholder Governance Platform. The current MVP is suitable for local and deployed demo validation, not live regulated production use.

## Pre-release Checklist

- [ ] Confirm release scope and changed files.
- [ ] Confirm no unintended application business logic changes are included.
- [ ] Confirm no unintended database migration changes are included.
- [ ] Confirm no unintended npm package changes are included.
- [ ] Confirm test data and seed expectations are documented.
- [ ] Confirm reviewer-facing known issues are current.

## Git Status Clean

- [ ] Run `git status --short`.
- [ ] Confirm only intended files are changed before commit.
- [ ] Confirm generated files, local logs, and environment files are not staged accidentally.
- [ ] Confirm working tree is clean after the release commit is created.

## Backend Build Passes

- [ ] Run `npm run build` from `apps/api`.
- [ ] Confirm TypeScript compilation succeeds.
- [ ] Capture build output or terminal screenshot for release evidence.

## Frontend Build Passes

- [ ] Run `npm run build` from `apps/web`.
- [ ] Confirm the Next.js production build succeeds.
- [ ] Capture build output or terminal screenshot for release evidence.

## API Smoke Tests Pass

- [ ] Start the local API.
- [ ] Run the local commands in [api-smoke-tests.md](api-smoke-tests.md).
- [ ] Confirm `/health`, `/health/db`, and `/api/version` pass before checking module endpoints.
- [ ] Record any endpoint failures with status code and response body.
- [ ] After deployment, run the deployed demo commands in [api-smoke-tests.md](api-smoke-tests.md).

## Key UI Pages Load Locally

- [ ] Dashboard loads.
- [ ] Shareholder list loads.
- [ ] Shareholder profile loads.
- [ ] Create shareholder page loads.
- [ ] KYC update flow is reachable for the expected role.
- [ ] Cap table loads.
- [ ] Transfers and approvals load.
- [ ] Audit log loads.
- [ ] SLA monitor loads.
- [ ] Certificates and QR verification load.
- [ ] Legal holds load.
- [ ] Documents load.
- [ ] Communications load.

## Neon Migration/Seed Status Checked When Deploying

- [ ] Confirm the deployed API points to the intended Neon database or branch.
- [ ] Confirm required migrations have been applied.
- [ ] Confirm seed data exists for shareholders, cap table, certificates, transfers, approvals, legal holds, documents, communications, audit logs, and SLA monitor checks.
- [ ] Confirm `/health/db` passes against the deployed API.
- [ ] Confirm demo data contains no live regulated records.

## Vercel Deployment Successful

- [ ] Confirm API deployment for `digaf-api` succeeds.
- [ ] Confirm web deployment for `digaf-web` succeeds.
- [ ] Confirm Vercel build logs do not contain unresolved warnings or errors.
- [ ] Confirm deployed frontend is configured to call the deployed API.
- [ ] Confirm deployed API CORS allows the deployed frontend origin.

## Production Environment Variables Verified

- [ ] `DATABASE_URL` is set for the API deployment.
- [ ] `CERTIFICATE_HMAC_SECRET` is set for the API deployment.
- [ ] `NODE_ENV` is set appropriately.
- [ ] `ALLOWED_ORIGINS` includes the deployed frontend origin.
- [ ] `NEXT_PUBLIC_API_BASE_URL` is set for the web deployment.
- [ ] Secrets are not stored in repository files or screenshots.

## Reviewer Guide Updated

- [ ] [reviewer-guide.md](reviewer-guide.md) reflects current reviewer instructions.
- [ ] [demo-script.md](demo-script.md) reflects current demo flow.
- [ ] [testing-strategy.md](testing-strategy.md) reflects current test expectations.
- [ ] [e2e-test-plan.md](e2e-test-plan.md) includes current workflow cases.
- [ ] Known current limitations are visible to reviewers.

## Known Issues Reviewed

- [ ] Review current known gaps in [production-readiness-checklist.md](production-readiness-checklist.md).
- [ ] Review current feedback and MVP backlog items.
- [ ] Decide whether any known issue blocks release.
- [ ] Document accepted release risks.

## Rollback Plan

- [ ] Identify the previous stable Git commit.
- [ ] Identify the previous stable Vercel deployments for web and API.
- [ ] Confirm Vercel rollback access is available to the release owner.
- [ ] Confirm Neon restore or branch rollback approach is understood if database changes are included in a future release.
- [ ] Confirm communication path for notifying reviewers if rollback is needed.

## Post-release Validation

- [ ] Confirm deployed frontend loads.
- [ ] Confirm deployed API `/health` passes.
- [ ] Confirm deployed API `/health/db` passes.
- [ ] Confirm deployed API `/api/version` passes.
- [ ] Run deployed API smoke tests.
- [ ] Load key UI pages in the deployed demo.
- [ ] Execute at least one non-destructive reviewer journey.
- [ ] Confirm audit log and SLA monitor are visible.
- [ ] Record validation evidence and release notes.
