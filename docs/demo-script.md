# Demo Script

## Demo Objective

Demonstrate the Digaf Shareholder Governance Platform MVP as a working governance workflow prototype covering shareholder records, KYC, ownership, transfers, approvals, certificates, audit evidence, SLA monitoring, legal holds, documents, communications, deployment, and local RBAC planning.

## Demo Audience

- Digaf governance stakeholders
- Compliance and risk reviewers
- Operations users
- Technology and integration reviewers
- Executive sponsors evaluating production readiness

## Pre-Demo Setup Checklist

- Confirm the backend API is running locally or the deployed API is healthy.
- Confirm the frontend is running locally or the deployed web app is available.
- Confirm PostgreSQL or Neon has demo seed data.
- Open the dashboard in a clean browser session.
- Prepare at least two verified shareholders for transfer demonstration.
- Prepare one shareholder profile suitable for KYC update.
- Confirm an eligible transfer can be created.
- Confirm approval queue is empty or has known demo records.
- Confirm certificate and QR verification pages load.
- Have the production readiness checklist and reviewer guide available.

## Demo Environment URLs

Local:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/health`
- Backend database health: `http://localhost:4000/health/db`
- Backend version: `http://localhost:4000/api/version`

Deployed demo:

- Frontend: `https://digaf-web.vercel.app`
- Backend version: `https://digaf-api.vercel.app/api/version`
- Backend database health: `https://digaf-api.vercel.app/health/db`

## Suggested Demo Storyline

Tell the story of a controlled shareholder governance process:

1. Governance users maintain shareholder records.
2. Compliance reviews and updates KYC status.
3. Ownership is visible through the cap table.
4. A transfer is checked for eligibility before it can be initiated.
5. A maker creates the transfer request.
6. Checker 1 and Checker 2 approve the request through segregated workflow steps.
7. Audit logs, SLA monitoring, certificates, documents, communications, and legal holds provide governance evidence around the process.

## Step 1: Dashboard Overview

Open the dashboard and orient reviewers to the platform modules. Explain that the MVP is a local/deployed prototype demonstrating the control layer for shareholder governance.

Highlight:

- Navigation structure
- Governance workflow focus
- Local RBAC prototype note
- Available modules

## Step 2: Shareholder Registry

Open the shareholder registry. Show the list of shareholder master records and explain the key fields:

- Legal name
- Type
- Status
- KYC status
- Risk classification
- Proxy eligibility where available

Optionally create a new shareholder if the demo requires showing maker action.

## Step 3: Shareholder Profile

Open a shareholder profile. Walk through the profile sections:

- Master record
- Ownership
- Certificates
- Incoming and outgoing transfers
- Legal holds
- Documents
- Communications

Explain that this page provides a consolidated governance view of one shareholder.

## Step 4: KYC Update Workflow

Use the KYC update form on a shareholder profile. Update status, expiry date, risk classification, and decision notes.

Explain:

- This is a compliance action.
- Stage 32 enforces local prototype role checks.
- The update writes to shareholder data, KYC record data, and audit evidence.

## Step 5: Cap Table

Open the cap table. Show current ownership by shareholder and share class.

Explain:

- Ownership is sourced from PostgreSQL.
- Transfers update ownership only after successful approval completion.
- The cap table is a controlled view of current share ownership.

## Step 6: Transfer Eligibility Check

Open Transfers and choose transferor, transferee, and share quantity. Run the eligibility check.

Explain the guard conditions:

- Shareholder existence
- Verified KYC
- KYC expiry
- Transfer freeze
- Active legal hold
- Available shares
- Encumbrance warnings

## Step 7: Transfer Request Creation

If eligibility passes, create the transfer request.

Explain:

- The maker initiates the request.
- The transfer is routed to Checker 1.
- An approval request is created.
- Audit evidence is recorded.

## Step 8: Approval Queue with Checker 1 and Checker 2

Open the approval queue.

Approve as Checker 1, then refresh or observe the approval moving to Checker 2. Approve as Checker 2 to complete the transfer.

Explain:

- Checker 1 and Checker 2 are separate local prototype roles.
- The no-single-user rule is separate from role permission checks.
- Checker 2 completion updates the transfer and ownership records.

## Step 9: Audit Log

Open the audit log. Show records for the KYC update, transfer creation, and approvals.

Explain:

- Audit records support governance evidence.
- Records capture actor, action, table, record, old value, new value, and timestamps where available.

## Step 10: SLA Monitor

Open the SLA monitor. Show approval queue timing and escalation-oriented fields.

Explain:

- SLA monitoring supports governance operations.
- Future Power Automate notifications can use this information for escalation.

## Step 11: Certificates and QR Verification

Open certificates. Show certificate status, hash-related fields, and certificate events where available.

Use QR verification to verify a certificate serial number.

Explain:

- Certificate hashes support tamper detection.
- QR verification provides a public-safe verification surface.
- HMAC secret changes can invalidate prior certificate hash verification.

## Step 12: Legal Holds

Open legal holds. Show active or historical holds.

Explain:

- Legal holds can block transfer eligibility.
- This module is currently read-oriented in the MVP.

## Step 13: Documents and Communications

Open documents and communications.

Explain:

- Documents currently reference governance artifacts and future SharePoint integration.
- Communications represent logged shareholder or governance communications.
- Future Microsoft 365 integration will harden storage, metadata, retention, and notifications.

## Closing Summary

Summarize the demonstrated value:

- Centralized shareholder governance workflows
- Maker-checker approval controls
- KYC and transfer eligibility controls
- Audit and SLA visibility
- Certificate and QR verification foundation
- Production deployment path
- Role model and Entra ID authentication planning

## Questions to Ask Reviewers

- Does the workflow match Digaf's expected shareholder governance process?
- Are the proposed roles and permissions correct?
- Are KYC fields and risk classifications sufficient for review?
- Are transfer eligibility blocking reasons complete?
- Are audit log records sufficient as evidence?
- What notifications should be sent and to whom?
- Which SharePoint libraries and metadata fields should be used?
- What reports are required for management, compliance, and regulators?
- What production approval process is needed before live data use?

## Known Prototype Caveats to Disclose

- Authentication is not full Microsoft Entra ID login yet.
- Local roles are simulated through `actorRole`.
- Hardcoded local actors are used for demo workflows.
- SharePoint, Power Automate, and Power BI integrations are planned but not fully implemented.
- Demo data is not production data.
- The MVP should not be used for live regulated operations until security, identity, data protection, and operational hardening are complete.
