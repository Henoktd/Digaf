# Reporting and Dashboard Plan

This document describes the current dashboard metrics and the recommended reporting direction for the Digaf Shareholder Governance Platform.

## Current Dashboard KPIs

The current dashboard is powered by `GET /api/dashboard/summary` and surfaces operational governance metrics from PostgreSQL.

Current KPIs:

- Entity count
- Shareholder count
- Active shareholder count
- Total shares
- Certificate count
- Issued certificate count
- Revoked certificate count
- Transfer count
- Pending transfer count
- Completed transfer count
- Pending approval count
- Approved approval count
- Overdue approval count
- Active legal hold count
- Active transfer freeze count
- Audit log count
- Document reference count
- Communication count

Current dashboard detail panels:

- Top ownership rows by active share quantity
- Recent audit actions
- SLA snapshot for approval workflow status
- System architecture summary

## Future Power BI Reporting Model

Power BI should eventually consume a governed reporting model rather than querying operational tables directly from the UI application path.

Recommended future pattern:

- PostgreSQL remains the system of record.
- Curated reporting views expose stable reporting shapes.
- Power BI connects to read-only views or a replicated reporting database.
- Row-level security is defined for regulated stakeholder access.
- Dataset refresh cadence is agreed with governance and compliance owners.
- Report definitions are version-controlled where practical.

## Suggested Power BI Datasets

Suggested datasets:

- Shareholder master dataset
- KYC and beneficial ownership dataset
- Share ownership and cap table dataset
- Certificate register dataset
- Share transfer workflow dataset
- Approval workflow and SLA dataset
- Legal hold and transfer freeze dataset
- Audit log evidence dataset
- Document reference dataset
- Communications dataset

Each dataset should include a refresh timestamp, environment label, and data classification notes.

## Governance Reports

Recommended governance reports:

- Board governance overview
- Shareholder register status
- Active workflow summary
- Maker-checker approval performance
- Legal hold and freeze summary
- Governance exception register
- Data completeness and stale record report

## Shareholder Reports

Recommended shareholder reports:

- Active shareholder register
- Shareholder onboarding and creation trends
- KYC status distribution
- KYC expiry and renewal watchlist
- Beneficial ownership verification status
- High-risk shareholder review list
- Proxy eligibility summary

## Certificate Reports

Recommended certificate reports:

- Certificate register
- Issued certificates
- Revoked certificates
- Certificate reissue history
- Certificate verification events
- QR verification status summary
- Certificate hash exception report

## Transfer Reports

Recommended transfer reports:

- Transfer request register
- Pending transfer workflow report
- Completed transfer report
- Blocked transfer eligibility report
- Transfer freeze impact report
- Board approval required transfer report
- Transfer volume by period

## SLA Reports

Recommended SLA reports:

- Pending approval SLA dashboard
- Overdue approval report
- Due soon approval report
- Completed within SLA report
- Escalation level report
- SLA by request type and stage
- Average time in stage report

## Audit Reports

Recommended audit reports:

- Full audit log extract
- Workflow action evidence report
- Shareholder change history
- KYC decision history
- Certificate event history
- Transfer approval evidence pack
- Admin and privileged action report

Audit reports must preserve actor, action, table, record ID, timestamp, old value, new value, and source metadata where available.

## Regulatory Reporting Pack

A future regulatory reporting pack should include:

- Shareholder register snapshot
- Cap table snapshot
- Beneficial ownership summary
- KYC compliance summary
- Transfer approvals and exceptions
- Certificate issuance and revocation summary
- Legal hold and freeze register
- SLA and escalation summary
- Audit evidence extract
- Document reference index

The pack should be exportable for a defined reporting period and should include environment, generation timestamp, and responsible reviewer.

## Future Export Requirements

Future export capabilities should support:

- CSV export for tabular reports
- PDF export for board and regulatory packs
- XLSX export for reviewer analysis
- Filtered export by entity, date range, workflow status, role, and shareholder
- Evidence bundle export for transfer approval workflows
- Redaction or masking for sensitive fields
- Export audit logging
- Export file naming conventions
- SharePoint storage for approved reporting packs
- Power BI certified dataset refresh and lineage documentation
