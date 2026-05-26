# Power BI Reporting Plan

## Purpose

Power BI is planned as the reporting and dashboard layer for the Digaf Shareholder Governance Platform. PostgreSQL remains the structured governance ledger, and the application dashboard remains the operational UI.

This plan prepares the reporting model only. Real Power BI embedding is not implemented in the current stage.

## Suggested Semantic Model

The future semantic model should expose curated governance reporting tables or views rather than raw operational tables only.

Recommended model areas:

- Shareholder registry
- KYC and beneficial ownership
- Share ownership and cap table
- Certificates and certificate events
- Share transfers
- Approval workflows
- SLA status
- Legal holds and transfer freezes
- Document references
- Communications
- Audit logs

The model should include refresh metadata and environment labels so reviewers can distinguish local, demo, staging, and production reporting outputs.

## Core Tables

Suggested core tables or views:

- `entity`
- `shareholder`
- `beneficial_ownership`
- `kyc_record`
- `share_class`
- `share_ownership`
- `ownership_transaction`
- `cap_table_snapshot`
- `share_certificate`
- `certificate_event`
- `share_transfer`
- `approval_request`
- `transfer_freeze`
- `legal_hold`
- `document_reference`
- `communication_log`
- `audit_log`
- `sla_config`

Future reporting views should flatten common relationships for Power BI usability.

## Measures/KPIs

Recommended measures:

- Total shareholders
- Active shareholders
- KYC verified shareholders
- KYC expired shareholders
- Total shares
- Ownership percentage
- Top shareholder concentration
- Issued certificates
- Revoked certificates
- Pending transfers
- Completed transfers
- Pending approvals
- Approved approvals
- Overdue approvals
- Active legal holds
- Active transfer freezes
- Document reference count
- Communication count
- Audit event count
- Average approval time
- SLA breach rate

## Report Pages

Recommended report pages:

- Executive governance overview
- Shareholder register
- KYC and beneficial ownership
- Cap table and ownership concentration
- Certificate register
- Transfer workflow
- Approval SLA monitor
- Legal holds and freezes
- Document reference index
- Communications activity
- Audit evidence
- Regulatory reporting pack

## Refresh Strategy

Recommended refresh approach:

- Demo: manual or scheduled refresh after seed/data updates.
- Future staging: scheduled refresh aligned to UAT needs.
- Future production: scheduled refresh with documented frequency and owner.
- Critical operational views should remain in the application UI rather than depending on Power BI refresh latency.

Refresh jobs should record:

- Dataset name
- Environment
- Refresh start and finish time
- Refresh result
- Error details if failed

## Security Considerations

- Use read-only database access for Power BI.
- Do not expose production database credentials to report authors unnecessarily.
- Separate demo, staging, and production datasets.
- Classify shareholder, KYC, certificate, legal hold, and audit data as sensitive.
- Avoid exporting sensitive fields unless approved.
- Review sharing permissions for workspaces and reports.
- Ensure reports do not bypass application authorization expectations.

## Future Row-Level Security Notes

Future row-level security should consider:

- Entity-level access.
- Role-level access for governance admins, compliance officers, makers, checkers, and viewers.
- Sensitive KYC field restrictions.
- Legal hold visibility restrictions.
- Audit log visibility restrictions.
- Board or regulator read-only access patterns.

Microsoft Entra ID group membership should eventually drive report access and row-level security rules.
