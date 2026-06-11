# Stage 69: Approval Workflow Alignment with Digaf Roles

## Purpose

Stage 69 aligns the current and proposed approval workflows with the real or assumed Digaf operational roles identified in Stages 65-66.

This is a planning and control-design document only. No backend authorization logic, frontend role switching, database schema, migrations, packages, or seed data are changed in this stage.

## Source Basis

- `docs/digaf-field-mapping.md`
- `docs/digaf-assumptions-register.md`
- `docs/role-permission-matrix.md`
- `docs/stage-66C-summary.md`
- `docs/stage-66F-summary.md`

The role model below is assumed pending Digaf validation.

## Current MVP Role Baseline

The current MVP uses local prototype roles:

| Current app role | Current purpose | Production note |
| --- | --- | --- |
| `maker` | Creates shareholder records and initiates requests | Should map to Customer Service Officer or Governance Officer. |
| `checker_1` | First transfer approval step | May map to Compliance or operational checker depending on workflow. |
| `checker_2` | Second transfer approval/completion step | Currently used as interim finance checker in Stage 66C/66F. |
| `governance_admin` | Local admin/full prototype role | Should not be broad production authority without Digaf approval. |
| `compliance_officer` | KYC/compliance review | Should map to Compliance Officer. |
| `viewer` | Read-only access | May map to auditor, management, or board read-only views depending on Digaf access rules. |

Production authorization must derive roles from authenticated identity claims, not from client-controlled `actorRole` request fields.

## Assumed Digaf Role Mapping

| Digaf business role | Proposed app role mapping | Responsibilities | Status |
| --- | --- | --- | --- |
| Customer Service Officer | `maker` | Initial data capture, import preparation, document checklist initiation | Assumed pending Digaf validation |
| Governance Officer | `maker` or governance-specific maker | Shareholder registry maintenance, maker submission, governance review support | Assumed pending Digaf validation |
| Compliance Officer | `compliance_officer` | KYC, AML, CFT, PEP/sanctions/adverse media review, risk rating | Assumed pending Digaf validation |
| Finance Officer | Finance checker role, currently interim `checker_2` | Payment evidence review and reconciliation | Assumed pending Digaf validation |
| Finance Manager | Finance checker or final finance reviewer, currently interim `checker_2` | Payment verification and finance approval | Assumed pending Digaf validation |
| CFO | Final approver | Final authorization for standard shareholder issuance or finance-controlled approval | Assumed pending Digaf validation |
| Authorized Executive | Final approver | Final authorization where CFO is delegated or unavailable | Assumed pending Digaf validation |
| CEO | Executive approver | Exceptional, high-value, or threshold-triggered cases | Assumed pending Digaf validation |
| Board / Board-level approver | Board approver | Exceptional cases, threshold cases, board-required transfers or issuances | Assumed pending Digaf validation |
| Board Secretary | Board reporting/read role | Board packs, approval history, certificate/ownership reporting | Assumed pending Digaf validation |
| Internal Auditor | Auditor/read role | Audit trail, user activity logs, approval history, compliance exceptions | Assumed pending Digaf validation |
| IT/System Administrator | System admin | User/group management, integration support, environment administration | Assumed pending Digaf validation |

## Proposed Shareholder Onboarding Workflow

| Stage | Status | Owner role | Action | Output |
| --- | --- | --- | --- | --- |
| Draft capture | `draft` | Maker | Capture core shareholder fields and required initial documents | Draft shareholder profile |
| Import validation, if applicable | `import_validated` | Maker / Governance Officer | Validate Excel-imported data and resolve row exceptions | Validated import row |
| KYC review | `kyc_review` | Compliance Officer | Complete CDD, PEP, sanctions, adverse media, source-of-funds and risk review | KYC decision and risk rating |
| Finance review | `finance_review` | Finance Officer / Finance Manager | Verify payment method, investment amount, share allocation, and supporting evidence | Payment verification decision |
| Final approval | `final_approval` | CFO or Authorized Executive | Authorize shareholder activation and share issuance | Final approval record |
| Exceptional escalation | `executive_or_board_review` | CEO or Board-level approver | Review high-value or exceptional case | Executive/board decision |
| Activation | `active` | System event after approval | Activate shareholder and allow certificate issuance | Active shareholder profile |
| Audit review | `audit_review_available` | Internal Auditor | Review evidence and audit trail | Audit evidence available |

## Proposed Certificate Issuance Workflow

Certificate generation should be gated by completed onboarding controls.

| Stage | Owner role | Control |
| --- | --- | --- |
| Certificate preparation | Maker / Governance Officer | Prepare certificate data from approved ownership records. |
| Certificate authorization check | CFO / Authorized Executive | Confirm issuance authorization exists. |
| Certificate generation | System | Generate certificate PDF/preview from approved template and render data. |
| QR/hash generation | System | Generate or confirm digital verification data. |
| Certificate storage | System / SharePoint integration | Store PDF in SharePoint and record `document_reference`. |
| Certificate issue event | System | Write certificate event and audit log. |
| Public verification | Public-safe route | Confirm certificate validity without exposing private data. |

## Proposed Share Transfer Workflow Alignment

The existing MVP transfer workflow already includes maker/checker controls. For Digaf alignment, the transfer workflow should be extended or mapped as follows:

| Transfer stage | Current pattern | Proposed Digaf owner | Notes |
| --- | --- | --- | --- |
| Transfer request creation | Maker | Maker / Governance Officer | Existing route can remain. |
| Eligibility check | System guard | System with Compliance/Governance visibility | Existing guard checks KYC, freezes, legal holds, pledged/encumbered shares. |
| Compliance review | Checker 1 or future compliance stage | Compliance Officer | Needed for KYC, transfer restrictions, PEP/sanctions exceptions. |
| Finance verification | Checker 2 or future finance stage | Finance Officer / Finance Manager | Needed for consideration/payment evidence where applicable. |
| Final approval | Current checker completion or future final stage | CFO / Authorized Executive | Needs Digaf delegation of authority validation. |
| Exceptional escalation | Not fully configured | CEO / Board-level approver | Threshold rules pending. |
| Certificate cancellation/reissue | System after approval | System with governance oversight | Must preserve audit and public verification history. |
| Register update | System after approval | System | Existing ownership transaction model should remain source of truth. |

## No-Single-User Approval Rule

The production workflow should enforce segregation of duties:

- Maker cannot approve their own submission.
- KYC checker should not be the maker for the same request.
- Finance checker should not be the maker for the same request.
- Final approver should not be the maker, KYC checker, or finance checker unless Digaf approves an emergency override.
- Executive or board approval should be separately evidenced when required.

The current MVP already has no-single-user controls in the transfer approval flow. Similar controls should be extended to shareholder registration, certificate issuance, Excel import commit, and exceptional approvals.

## Approval State Model

Recommended generic approval states:

- `draft`
- `submitted`
- `kyc_pending`
- `kyc_approved`
- `kyc_rejected`
- `finance_pending`
- `finance_verified`
- `finance_rejected`
- `final_pending`
- `final_approved`
- `final_rejected`
- `escalated`
- `approved_for_execution`
- `executed`
- `cancelled`

Avoid hardcoding workflow-specific state names too deeply until Digaf validates exact process terminology.

## Notification Alignment

Power Automate notification planning should align to workflow stage changes:

| Event | Recipient role |
| --- | --- |
| New shareholder submitted | Compliance Officer |
| KYC approved/rejected | Maker, Governance Officer, Finance role if approved |
| Finance review requested | Finance Officer / Finance Manager |
| Finance approved/rejected | Maker, Governance Officer, Final Approver |
| Final approval requested | CFO / Authorized Executive |
| Exceptional case escalated | CEO / Board-level approver, Board Secretary if applicable |
| Certificate issued | Maker, Governance Officer, shareholder communication workflow if approved |
| SLA overdue | Current owner role, manager/escalation recipient |
| AML/CFT exception | Compliance Officer, Internal Auditor |

## Reporting Alignment

Power BI and in-app reports should expose:

- Pending approvals by role and stage.
- Average approval duration by stage.
- SLA breaches by workflow type.
- Rejections and reasons by stage.
- High-risk shareholder onboarding status.
- KYC exceptions.
- Finance verification exceptions.
- Certificate issuance log.
- User activity log.
- Approval history.

## Implementation Notes for Later Stages

- Add explicit finance roles rather than relying permanently on `checker_2`.
- Add final approver roles for CFO and Authorized Executive.
- Add executive/board escalation roles and thresholds.
- Move production role assignment to Microsoft Entra ID groups.
- Remove client-controlled `actorRole` from protected workflows.
- Keep audit logs for every approval decision.
- Preserve existing transfer workflow compatibility while adding shareholder registration approvals.

## Assumptions Pending Digaf Validation

- Maker is Customer Service Officer or Governance Officer.
- Compliance Officer owns KYC/AML/CFT review.
- Finance Officer or Finance Manager owns payment verification.
- CFO or Authorized Executive performs final approval for standard cases.
- CEO or Board-level approval is required for exceptional or high-value cases.
- Internal Auditor has read-only access to audit evidence and exception reporting.
- Board Secretary has access to board reports and board approval evidence where required.
- IT/System Administrator manages users and integrations but should not approve regulated business decisions.

## Open Questions for Digaf

- What are the formal Delegation of Authority thresholds?
- Which cases require CEO approval?
- Which cases require board-level approval?
- Can CFO and Authorized Executive approve the same categories of requests?
- Should Compliance review occur before or after finance review in all cases?
- Are transfer approvals different from new shareholder issuance approvals?
- Who can waive required documents?
- Who can override legal holds, freezes, or pledge restrictions?
- What SLA should apply to each workflow stage?

## Recommended Next Step

Stage 71 should turn this alignment into a concrete implementation backlog covering:

- Role model updates.
- Approval state machine updates.
- Entra group mapping.
- Frontend role display changes.
- Backend authorization hardening.
- Audit and notification event coverage.
