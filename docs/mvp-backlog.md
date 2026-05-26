# MVP Backlog

This backlog translates reviewer feedback, production readiness gaps, and roadmap items into implementation candidates. Priorities should be reviewed during regular triage and adjusted as business, compliance, and technical constraints become clearer.

## P0 Must Fix Before Production

| Item | Description | Rationale | Status |
| --- | --- | --- | --- |
| Entra ID sign-in | Implement Microsoft Entra ID authentication for the frontend. | Production users must authenticate through trusted identity. | planned |
| Backend JWT validation | Validate access tokens on protected backend endpoints. | Backend authorization must be based on trusted tokens. | planned |
| Replace client-controlled actorRole | Remove request-body `actorRole` trust from protected production endpoints. | Client-controlled roles are prototype-only and not production-safe. | planned |
| Production CORS hardening | Restrict API origins to approved deployed frontend URLs. | Reduces cross-origin exposure. | planned |
| Secret rotation | Define and execute rotation for API, database, and certificate HMAC secrets before production. | Prevents prototype/demo secrets from becoming production secrets. | planned |
| Database backup/restore process | Define, test, and document Neon backup and restore procedures. | Production data must be recoverable. | planned |
| Data retention policy | Define retention, archival, deletion, and legal hold rules. | Required for regulated data governance. | planned |
| End-to-end test suite | Add workflow tests for shareholder, KYC, transfer, approval, audit, and certificate flows. | Reduces production regression risk. | planned |
| QR verification hardening | Review public verification output, rate limits, tamper responses, and certificate lifecycle behavior. | Public verification must be safe and reliable. | planned |

## P1 MVP Completion

| Item | Description | Rationale | Status |
| --- | --- | --- | --- |
| SharePoint document upload integration | Connect document workflows to SharePoint libraries and metadata. | Documents need governed storage and retention. | planned |
| Power Automate notification triggers | Trigger notifications for approvals, SLA escalation, KYC expiry, certificate events, and legal holds. | Users need timely operational alerts. | planned |
| Power BI reporting model | Define and connect governed reporting views or semantic model. | Management and compliance reporting is required. | planned |
| Certificate PDF generation | Generate certificate PDFs from approved certificate records. | Certificates need formal printable artifacts. | planned |
| Audit export | Add export capability for audit evidence. | Reviewers and auditors need portable evidence packs. | planned |
| User management and role assignment | Define how admins request, approve, and remove user role access. | Entra group membership needs operational governance. | planned |
| Maker-checker rejection flow | Add rejection and return-for-correction behavior to approval workflows. | Real approvals need negative decisions, not only approval. | planned |
| Transfer cancellation flow | Allow controlled cancellation of pending transfer requests. | Operations need a governed way to stop invalid or withdrawn transfers. | planned |
| Legal hold create/lift workflow | Add controlled create and lift actions for legal holds. | Legal hold lifecycle needs workflow control and audit evidence. | planned |
| Regulatory reporting pack | Define standard reports and exports for regulatory and governance review. | Supports production compliance readiness. | planned |

## P2 Post-MVP Enhancements

| Item | Description | Rationale | Status |
| --- | --- | --- | --- |
| Advanced SLA escalation rules | Add configurable escalation thresholds and recipient rules. | Improves operational governance. | deferred |
| Certificate lifecycle dashboard | Add visual status tracking for issued, revoked, reissued, and verified certificates. | Improves certificate operations visibility. | deferred |
| Bulk shareholder import | Support validated batch onboarding or updates. | Useful for migration or large registry maintenance. | deferred |
| Document metadata validation | Enforce required metadata by document type and workflow stage. | Improves document governance quality. | deferred |
| Communication templates | Add reusable templates for shareholder and governance communications. | Reduces manual communication effort. | deferred |
| Enhanced audit search | Add filters, saved views, and export presets. | Makes audit review more efficient. | deferred |
| Reporting data mart | Build a curated reporting layer for Power BI. | Supports stable reporting without overloading operational tables. | deferred |

## P3 Future Roadmap

| Item | Description | Rationale | Status |
| --- | --- | --- | --- |
| Board portal integration | Integrate board resolution references or approvals with a board portal. | Aligns transfer workflows with board governance. | deferred |
| E-signature integration | Add controlled signature workflows for certificates, transfer documents, or resolutions. | Supports digital governance processes. | deferred |
| Advanced risk scoring | Add shareholder and transfer risk scoring based on compliance signals. | Improves compliance review prioritization. | deferred |
| External shareholder portal | Provide selected self-service access for shareholders. | Future external engagement capability. | deferred |
| Multi-entity governance expansion | Extend workflows for additional entities or subsidiaries. | Supports group-wide governance. | deferred |
| Automated regulatory submissions | Generate and submit regulatory reports through approved channels. | Long-term compliance automation. | deferred |

## Backlog Maintenance Notes

- New reviewer feedback should first be captured with [feedback-capture-template.md](feedback-capture-template.md).
- Feedback should be triaged using [feedback-triage-process.md](feedback-triage-process.md).
- Backlog priority should reflect production risk, regulatory need, workflow value, and implementation effort.
- Each accepted backlog item should become a clearly scoped implementation stage or sprint item before work begins.
