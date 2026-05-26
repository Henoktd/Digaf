# Power Automate Notification Plan

## Purpose

Power Automate is planned as the notification layer for the Digaf Shareholder Governance Platform. The backend API and PostgreSQL ledger remain responsible for workflow state, validation, approvals, and audit evidence.

This plan prepares the notification model only. Real Power Automate calls are not implemented in the current stage.

## Notification-Only Role

Power Automate should send notifications to configured channels such as email or Microsoft Teams after the backend has already committed a governance event.

Power Automate may:

- Deliver notifications.
- Route alerts to configured recipients.
- Format messages for email or Teams.
- Support reminder and escalation messaging.

Power Automate must not own:

- Shareholder records
- Transfer eligibility decisions
- Approval state
- Certificate status
- Legal hold state
- Audit log truth
- Database writes for regulated workflow decisions

## Notification Events

Events that should trigger notifications:

- `shareholder_created`
- `shareholder_kyc_updated`
- `share_transfer_created`
- `checker_1_approved`
- `checker_2_completed`
- `certificate_revoked`
- `legal_hold_imposed`
- `SLA overdue`

Notification dispatch should occur only after the related database transaction succeeds.

## Proposed Webhook Payload Structure

Recommended payload:

```json
{
  "eventType": "share_transfer_created",
  "environment": "demo",
  "entityId": "uuid",
  "recordType": "share_transfer",
  "recordId": "uuid",
  "actorId": "maker.local_dev",
  "occurredAtUtc": "2026-05-26T12:00:00.000Z",
  "severity": "normal",
  "summary": "Share transfer request created",
  "details": {
    "stage": "checker_1_review",
    "status": "pending",
    "currentApproverRole": "checker_1"
  },
  "links": {
    "frontendUrl": "https://digaf-web.vercel.app/transfers",
    "apiRecordUrl": "https://digaf-api.vercel.app/api/transfers"
  }
}
```

Payloads should avoid sensitive personal data unless the notification channel and recipient list are approved for that data.

## Retry/Error Handling Plan

Recommended backend behavior for future implementation:

- Send notification after the database transaction commits.
- Use a short timeout for webhook calls.
- Log notification attempt status.
- Do not roll back the business transaction if notification delivery fails.
- Queue or mark failed notifications for retry where appropriate.
- Include correlation IDs for troubleshooting.
- Avoid duplicate notifications by storing event IDs or delivery records.

Recommended Power Automate behavior:

- Validate payload shape.
- Route by `eventType`, severity, and environment.
- Retry transient connector failures.
- Send failure alerts to administrators.
- Preserve run history for operational evidence.

## What Power Automate Should Not Own

Power Automate should not:

- Decide whether a transfer is eligible.
- Approve or reject workflow stages.
- Update shareholder KYC state.
- Revoke certificates.
- Impose or lift legal holds.
- Write directly to PostgreSQL for regulated workflow state.
- Act as the audit system of record.
- Store secrets or long-lived sensitive business data in flow definitions.
