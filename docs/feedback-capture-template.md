# Feedback Capture Template

Use this template to capture reviewer feedback from local development testing, deployed demo testing, walkthroughs, and stakeholder review sessions.

## Feedback Record

| Field | Value |
| --- | --- |
| Reviewer name |  |
| Reviewer department / role |  |
| Review date |  |
| Environment tested | local / deployed demo |
| Module reviewed |  |
| Feedback type | bug / enhancement / usability / compliance / security / data/reporting / integration |
| Feedback description |  |
| Expected behavior |  |
| Actual behavior |  |
| Screenshot / evidence link |  |
| Severity | low / medium / high / critical |
| Priority | P0 / P1 / P2 / P3 |
| Owner |  |
| Target stage / sprint |  |
| Status | new / triaged / planned / in progress / done / deferred |
| Notes |  |

## Field Guidance

Reviewer name: Person submitting or representing the feedback.

Reviewer department / role: Business area or responsibility, such as Governance, Compliance, Legal, Operations, IT, Risk, or Executive reviewer.

Review date: Date the feedback was captured.

Environment tested: Use `local` for local PostgreSQL and local app testing, or `deployed demo` for Vercel + Neon testing.

Module reviewed: Name the module or workflow, such as Shareholder Registry, KYC Update, Transfer Approval, Certificates, Audit Log, SLA Monitor, Documents, Communications, Deployment, RBAC, or Entra planning.

Feedback type:

- `bug`: Something works incorrectly.
- `enhancement`: New capability or expanded workflow request.
- `usability`: Navigation, wording, clarity, layout, or efficiency issue.
- `compliance`: Governance, regulatory, approval, evidence, or policy issue.
- `security`: Authentication, authorization, secrets, data exposure, or hardening issue.
- `data/reporting`: Data quality, metrics, exports, dashboards, or reporting issue.
- `integration`: SharePoint, Power Automate, Power BI, Entra ID, Vercel, Neon, or external system issue.

Severity:

- `low`: Minor issue or polish item with low operational impact.
- `medium`: Meaningful workflow issue with workaround available.
- `high`: Important business, compliance, security, or data issue that blocks a major workflow or review.
- `critical`: Production-blocking issue, severe security concern, data integrity risk, or regulatory blocker.

Priority:

- `P0`: Must be fixed before production or before the next formal review.
- `P1`: Required for MVP completion.
- `P2`: Valuable post-MVP enhancement.
- `P3`: Future roadmap item.

Status:

- `new`: Captured but not reviewed.
- `triaged`: Reviewed and classified.
- `planned`: Accepted into a stage or sprint.
- `in progress`: Actively being implemented or validated.
- `done`: Implemented, verified, and ready to close.
- `deferred`: Not planned for the current MVP or production readiness window.
