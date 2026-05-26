# Reviewer Guide

## What Reviewers Should Test

Reviewers should focus on the core governance workflow and evidence surfaces:

- Dashboard navigation and module availability
- Shareholder registry browsing
- Shareholder profile review
- Shareholder creation
- KYC update workflow
- Cap table review
- Transfer eligibility check
- Transfer request creation
- Checker 1 approval
- Checker 2 approval
- Audit log evidence
- SLA monitor visibility
- Certificate list and QR verification
- Legal hold visibility
- Documents and communications visibility
- Local RBAC role expectations

## What Reviewers Should Not Test Yet

The following items are not production-ready in the current prototype:

- Microsoft Entra ID sign-in
- Production JWT validation
- Real Entra group membership changes
- Production role switching
- Live SharePoint document upload and retention behavior
- Live Power Automate notifications
- Power BI semantic model or dashboards
- Production backup and restore
- Security penetration testing against a production environment
- Live regulated data workflows

## Suggested Test Accounts/Roles in Local Prototype Terms

The local prototype uses simulated actors and roles:

| Local role | Suggested actor label | Primary review action |
| --- | --- | --- |
| `maker` | `henok.local_dev` | Create shareholders and transfer requests. |
| `checker_1` | `checker1.local_dev` | Approve transfer requests at Checker 1. |
| `checker_2` | `checker2.local_dev` | Approve transfer requests at Checker 2. |
| `governance_admin` | `admin.local_dev` | Review administrator-level role assumptions. |
| `compliance_officer` | `compliance.local_dev` | Update shareholder KYC. |
| `viewer` | `viewer.local_dev` | Review read-only expectations. |

These are prototype terms only. They are not production accounts.

## Expected Behavior by Role

- `maker`: Can create shareholder records, check transfer eligibility, and create transfer requests.
- `checker_1`: Can approve the first checker step for pending transfer approvals.
- `checker_2`: Can approve the second checker step and complete eligible transfers.
- `governance_admin`: Intended to have full local prototype permissions.
- `compliance_officer`: Can update shareholder KYC and review compliance-oriented information.
- `viewer`: Can review information but should not perform protected mutation actions.

The no-single-user approval rule remains separate from role permissions. A user should not be able to complete maker, Checker 1, and Checker 2 responsibilities for the same regulated workflow.

## Where to Report Feedback

Capture feedback with:

- Page or module name
- Steps taken
- Expected behavior
- Actual behavior
- Screenshot where useful
- Severity or business impact
- Whether the issue occurred locally or on the deployed demo

Use the team's normal project feedback channel or GitHub issue process if available.

## Local vs Deployed Environments

Local environment:

- Frontend runs from `apps/web`.
- Backend API runs from `apps/api`.
- Database is local PostgreSQL.
- Intended for development and workflow testing.

Deployed demo:

- Frontend runs on Vercel as `digaf-web`.
- Backend API runs on Vercel as `digaf-api`.
- Database runs on Neon PostgreSQL.
- Intended for stakeholder review and demo validation.

Differences in data can occur if local PostgreSQL and Neon are seeded differently.

## Current Role Identity Simulation

Current role identity is simulated until Microsoft Entra ID integration is implemented. The frontend sends `actorRole` for local prototype workflows, and the backend validates those roles for selected protected actions.

Production behavior must replace this with authenticated identity claims from Microsoft Entra ID and group-to-role mapping. Client-controlled `actorRole` must not be trusted for production protected endpoints.
