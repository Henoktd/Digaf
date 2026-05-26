# Production Readiness Checklist

## Current MVP Status

The Digaf Shareholder Governance Platform MVP is suitable for local and deployed demo review. It demonstrates the core shareholder governance workflows, maker-checker controls, audit evidence, certificate verification, role planning, and deployment structure.

The MVP is not yet production-ready. It still uses prototype identity assumptions and requires additional security, data protection, operational, and integration hardening before handling live regulated records.

## Working Modules

- Dashboard overview
- Shareholder registry
- Shareholder profile
- Shareholder creation
- KYC update workflow
- Cap table
- Certificate registry
- Certificate hash generation and QR verification
- Transfer eligibility guard
- Transfer request creation
- Approval queue
- Checker 1 approval
- Checker 2 approval and transfer completion
- Audit log
- SLA monitor
- Legal holds
- Communications
- Documents
- Vercel deployment documentation
- Local RBAC foundation
- Role permission matrix
- Microsoft Entra ID authentication planning

## Prototype-Only Assumptions

- Local roles are simulated through `actorRole` values sent from the frontend/request body.
- Local actor identities are hardcoded for workflow demonstration.
- Microsoft Entra ID login is planned but not implemented.
- SharePoint and Microsoft 365 integrations are represented as references/planning artifacts, not full production integrations.
- Power Automate notification flows are not yet connected to live events.
- Power BI reporting is not yet connected to a governed semantic model.
- Demo seed data should be treated as non-production data.

## Security Gaps Before Production

- Implement Microsoft Entra ID sign-in.
- Validate backend JWTs on all protected endpoints.
- Derive roles from authenticated identity claims, not request body input.
- Remove client-controlled `actorRole` from protected production workflows.
- Add route-level and endpoint-level authorization coverage for all protected actions.
- Review CORS settings for production origins only.
- Confirm secure secret handling in Vercel and local development.
- Add production-safe rate limiting and abuse controls where appropriate.
- Add security headers and review frontend deployment headers.

## Data Protection Gaps Before Production

- Confirm data classification for shareholder, KYC, certificate, audit, and communication records.
- Define retention and deletion policies.
- Define backup and restore objectives.
- Confirm encryption expectations for data at rest and in transit.
- Review whether additional field-level protection is needed for sensitive KYC fields.
- Confirm masking/redaction requirements for exports, logs, screenshots, and support workflows.
- Establish production data access approval procedures.

## Identity and Access Gaps Before Production

- Create Microsoft Entra ID app registrations for frontend and backend/API.
- Create Entra groups mapped to local roles.
- Confirm group owners and membership approval process.
- Define break-glass administrative access.
- Add sign-out and session expiry handling.
- Confirm least-privilege access for makers, checkers, compliance officers, admins, and viewers.
- Document production role assignment and removal procedures.

## Database Hardening Needed

- Confirm Neon production branch and connection string separation from local and preview environments.
- Apply migrations through a controlled release process.
- Define seed data strategy for production versus demo environments.
- Review indexes for production data volume.
- Add database backup and restore checks.
- Confirm connection pooling strategy for Vercel serverless execution.
- Review database user privileges and rotate credentials before production.
- Establish a migration rollback plan.

## Audit and Evidence Readiness

- Confirm all regulated workflow actions write audit log records.
- Confirm audit records include actor identity, source IP where available, action, table, record ID, old value, and new value.
- Confirm certificate events are captured for hash generation, verification, revocation, and reissue flows where applicable.
- Review audit log immutability requirements.
- Define evidence export procedures for regulators, auditors, and internal reviewers.
- Confirm timestamps are consistently stored and displayed in UTC where required.

## Deployment Readiness

- Confirm Vercel projects are configured with correct root directories.
- Confirm required environment variables are set for web and API projects.
- Confirm `ALLOWED_ORIGINS` includes production frontend origins.
- Confirm `/api/version`, `/health/db`, and frontend URLs are checked after each deployment.
- Confirm GitHub push-to-deploy flow is understood by the release owner.
- Define preview versus production deployment approval process.
- Add monitoring and alerting for API errors, database connectivity, and failed deployments.

## Microsoft 365 / SharePoint Integration Readiness

- Define target SharePoint site, libraries, folder structure, and metadata fields.
- Confirm document retention labels and legal hold alignment.
- Define service account or delegated access model.
- Confirm document reference records map cleanly to SharePoint URLs and metadata.
- Define upload, replacement, and deletion rules.
- Confirm audit expectations for document actions.

## Power Automate Notification Readiness

- Define notification triggers for transfer creation, approval steps, SLA escalation, certificate events, KYC expiry, and legal holds.
- Define recipients for each notification type.
- Confirm whether notifications should use email, Teams, or both.
- Define retry and failure handling.
- Confirm notification content avoids exposing sensitive data unnecessarily.
- Define environment separation for local, preview, and production flows.

## Power BI Reporting Readiness

- Define core reporting questions for governance, ownership, SLA, audit, KYC, and certificate status.
- Confirm reporting data source and refresh approach.
- Define row-level security expectations.
- Define certified dataset ownership.
- Confirm whether reports should use Neon directly, exports, or a curated reporting model.
- Define audit requirements for report access.

## Known Limitations

- Authentication is not production Entra ID authentication yet.
- Role identity remains simulated in the local prototype.
- SharePoint, Power Automate, and Power BI are not fully integrated.
- The demo environment may contain limited seed data.
- Some production controls, such as alerting, rate limiting, and formal release approvals, are not yet implemented.
- The MVP is designed for demonstration and workflow validation, not live regulated operations.

## Recommended Next Production Steps

1. Implement Microsoft Entra ID frontend sign-in.
2. Implement backend JWT validation.
3. Map Entra groups to application roles.
4. Remove client-controlled `actorRole` from protected endpoints.
5. Complete production database hardening and migration procedures.
6. Connect SharePoint document storage and metadata.
7. Connect Power Automate notifications.
8. Define Power BI reporting architecture.
9. Add monitoring, alerting, and production support runbooks.
10. Run a formal security and compliance review before live data use.
