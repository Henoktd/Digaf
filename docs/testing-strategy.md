# Testing Strategy

## Purpose

This document defines the Stage 37 testing strategy for the Digaf Shareholder Governance Platform. It covers local development, the deployed demo, and future controlled environments without changing application logic, package dependencies, or database migrations.

The objective is to give reviewers and maintainers a repeatable way to validate the MVP governance workflows, API health, UI pages, database state, audit evidence, and role-based controls before and after release.

## Testing Environments

### Local Development

Local development is the primary environment for implementation checks and workflow debugging.

- Frontend: `apps/web`
- Backend API: `apps/api`
- Database: local PostgreSQL
- API base URL: `http://localhost:4000`
- Recommended use: development verification, manual workflow testing, API smoke testing, database validation, and regression checks before commit.

Local data may differ from the deployed demo if seed data is not aligned.

### Deployed Demo

The deployed demo is used for stakeholder review and public MVP demonstration.

- Frontend: Vercel project `digaf-web`
- Backend API: Vercel project `digaf-api`
- Database: Neon PostgreSQL
- API base URL: `https://digaf-api.vercel.app`
- Recommended use: reviewer validation, demo readiness checks, smoke testing after deployment, and environment comparison against local behavior.

The deployed demo should use non-production demo data only.

### Future Staging

A future staging environment should mirror production architecture while remaining isolated from live records.

- Frontend: Vercel staging or preview deployment
- Backend API: Vercel staging or preview deployment
- Database: dedicated Neon staging branch or database
- Recommended use: release candidate testing, migration verification, automated regression testing, UAT, and integration testing with Microsoft Entra ID, SharePoint, Power Automate, and reporting services.

Staging should be the first environment where production-like identity, secrets, and database migration procedures are rehearsed end to end.

### Future Production

Future production should be validated with controlled smoke tests only. Testers must not use production for destructive workflow experimentation.

- Frontend: production Vercel deployment
- Backend API: production Vercel deployment
- Database: production Neon database
- Recommended use: post-release validation, health checks, non-destructive read checks, audit monitoring, and rollback readiness confirmation.

Production testing must use approved test accounts and approved test records only.

## Test Data Strategy

- Use demo seed data for repeatable local and deployed demo validation.
- Keep shareholder, certificate, transfer, legal hold, and communication data non-production until the platform is formally approved for regulated records.
- Maintain at least one shareholder eligible for transfer and one shareholder blocked by legal hold or freeze.
- Maintain at least one valid certificate and one revoked certificate for QR verification checks.
- Maintain sample records for cap table, audit logs, SLA monitor, legal holds, documents, and communications.
- Record the seed version or data refresh date before formal demo or release testing.
- Avoid manual database edits during release validation unless the change is documented as part of setup.

## Manual Testing Strategy

Manual testing should validate the full reviewer journey and the regulated workflow controls that are visible in the current MVP.

- Start from a clean or known seeded database.
- Validate navigation from the dashboard into each major module.
- Execute the shareholder creation, KYC update, transfer eligibility, transfer request, Checker 1, and Checker 2 paths.
- Confirm blocked paths fail with clear and expected behavior.
- Capture screenshots or screen recordings for key workflow milestones.
- Log the environment, data set, browser, tester, date, and result for each run.

The detailed manual cases are maintained in [e2e-test-plan.md](e2e-test-plan.md).

## API Testing Strategy

API testing confirms that the backend is reachable, connected to the database, and returning expected resources.

- Run API smoke tests locally before release.
- Run the same API smoke tests against the deployed demo after deployment.
- Confirm `/health`, `/health/db`, and `/api/version` before deeper endpoint checks.
- Confirm list endpoints return HTTP success and JSON responses.
- Confirm certificate verification returns the expected valid or revoked state for known demo certificate IDs.
- Capture command output or screenshots for release evidence.

The smoke command set is maintained in [api-smoke-tests.md](api-smoke-tests.md).

## Frontend Testing Strategy

Frontend testing validates that the Next.js app builds and that key pages load and interact with the configured API.

- Run the frontend build before release.
- Start the local frontend against the local API for manual testing.
- Confirm dashboard, shareholder list, shareholder profile, cap table, certificates, transfer workflow, approvals, audit log, SLA monitor, legal holds, documents, and communications pages load.
- Confirm the frontend environment variable points to the intended API base URL.
- Confirm local and deployed demo behavior is comparable for the same seeded data.

## Database Validation Strategy

Database validation confirms that workflow actions persist expected records and do not leave incomplete state.

- Confirm the API connects to the intended database with `/health/db`.
- Confirm expected seed data exists before testing.
- Confirm shareholder creation writes a shareholder record.
- Confirm KYC update writes the new KYC state and supporting audit record.
- Confirm transfer creation writes a transfer request and approval workflow state.
- Confirm Checker 2 completion updates ownership/cap table state.
- Confirm legal holds and freezes block transfer eligibility.
- Confirm audit logs record key workflow events.
- Confirm deployed demo database checks are run against the intended Neon branch.

## Security/RBAC Testing Strategy

The current MVP uses local prototype role simulation. Security/RBAC testing should verify intended behavior while clearly separating prototype controls from future production controls.

- Validate `maker` can create shareholders and transfer requests.
- Validate `compliance_officer` can update KYC.
- Validate `maker` cannot perform compliance-only KYC update actions.
- Validate `checker_1` can complete Checker 1 approval.
- Validate non-Checker 1 roles cannot complete Checker 1 approval.
- Validate `checker_2` can complete Checker 2 approval.
- Validate no-single-user workflow assumptions remain visible in reviewer testing where applicable.
- Document that production must replace client-controlled `actorRole` with Microsoft Entra ID authentication and backend JWT validation.

## Regression Testing Strategy

Regression testing should be run before release and after deployment.

- Build the backend.
- Build the frontend.
- Run local API smoke tests.
- Run deployed API smoke tests after deployment.
- Execute the core end-to-end workflow from dashboard through Checker 2 completion.
- Recheck cap table, audit log, SLA monitor, certificates, legal holds, documents, and communications.
- Compare local and deployed demo behavior for the same key workflows.
- Record known failures or skipped cases in the release evidence.

## Smoke Testing Checklist

- [ ] Backend API `/health` returns success locally.
- [ ] Backend API `/health/db` confirms database connectivity locally.
- [ ] Backend API `/api/version` returns version metadata locally.
- [ ] Deployed API `/health` returns success.
- [ ] Deployed API `/health/db` confirms Neon connectivity.
- [ ] Deployed API `/api/version` returns version metadata.
- [ ] Dashboard loads.
- [ ] Shareholder list loads.
- [ ] Cap table loads.
- [ ] Certificates list loads.
- [ ] Transfer list and approval queue load.
- [ ] Audit log loads.
- [ ] SLA monitor loads.
- [ ] Legal holds load.
- [ ] Documents and communications load.

## Release Testing Checklist

- [ ] Git status reviewed.
- [ ] Backend build passes with `npm run build` from `apps/api`.
- [ ] Frontend build passes with `npm run build` from `apps/web`.
- [ ] Local API smoke tests pass.
- [ ] Local key UI pages load.
- [ ] Deployment target and environment variables reviewed.
- [ ] Neon migration and seed status checked when deploying.
- [ ] Vercel deployment completes successfully.
- [ ] Deployed API smoke tests pass.
- [ ] Reviewer guide and known issues are current.
- [ ] Rollback plan is understood.
- [ ] Post-release validation is complete.

## Known Current Testing Gaps

- No automated backend API test suite is currently documented as required for Stage 37.
- No automated frontend browser test suite is currently documented as required for Stage 37.
- Local role simulation still relies on prototype `actorRole` behavior.
- Microsoft Entra ID sign-in and backend JWT validation are planned but not implemented.
- SharePoint, Power Automate, and Power BI integrations are not fully connected.
- No production-scale load, performance, or concurrency testing has been completed.
- No formal security penetration test has been completed.
- No automated migration rollback validation is documented.
- Local and deployed demo data can drift if seed procedures are not aligned.

## Recommended Future Automated Testing Tools

No new packages are added in Stage 37. The following tools are recommended for future implementation:

- Backend unit and integration tests: Node.js test runner, Vitest, or Jest.
- API contract and smoke tests: Supertest, Postman/Newman, or REST Client collections.
- Frontend component and page tests: React Testing Library.
- End-to-end browser tests: Playwright.
- Accessibility checks: axe-core with Playwright.
- Database test isolation: dedicated test database or disposable Neon branches.
- CI orchestration: GitHub Actions or Vercel checks.
- Security checks: npm audit, dependency review, SAST, and targeted penetration testing.
