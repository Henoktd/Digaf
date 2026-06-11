# Stage 71: Implementation Backlog and Sequencing Plan

## Purpose

Stage 71 converts the Stage 67-70 planning package into an implementation backlog for the Digaf Shareholder Governance Platform production-ready pilot.

This stage is a planning and sequencing stage only. It does not change source code, database schema, migrations, API behavior, frontend forms, packages, seed data, or deployment configuration.

## Source Inputs

- `docs/stage-67-excel-import-preparation.md`
- `docs/stage-68-digaf-certificate-template.md`
- `docs/stage-69-approval-workflow-role-alignment.md`
- `docs/stage-70-production-readiness-and-assumptions.md`
- `docs/digaf-field-mapping.md`
- `docs/digaf-assumptions-register.md`
- Stage 66B-66F implementation summaries

## Sequencing Principles

Implementation should follow these rules:

1. Preserve existing MVP workflows.
2. Keep database changes additive.
3. Avoid importing or using real shareholder production data.
4. Keep draft KYC items clearly marked pending Digaf validation.
5. Do not make client-controlled roles a production authorization mechanism.
6. Build dry-run and review controls before commit controls.
7. Use existing backend APIs and audit patterns where possible.
8. Keep SharePoint, Power Automate, and Power BI integrations as controlled workstreams.

## Recommended Implementation Waves

### Wave 1: Stabilize Current Stage 66 Work

Goal: make the current Digaf-aligned profile work easier to review and safer to demo.

Tasks:

| ID | Task | Type | Dependency | Status |
| --- | --- | --- | --- | --- |
| 71-01 | Commit or otherwise preserve Stage 66D-66F frontend and documentation changes | Repo hygiene | Current review | Ready |
| 71-02 | Add manual QA checklist for shareholder profile display and edit workflows | Documentation / QA | Stage 66F | Ready |
| 71-03 | Verify empty-state and mobile behavior on shareholder profile | QA | Stage 66F | Ready |
| 71-04 | Confirm whether the role selector remains demo-only or should be hidden behind dev/pilot mode | Product decision | Digaf/internal decision | Pending validation |

Acceptance checks:

- Web build passes.
- API build passes.
- Shareholder list/profile still load.
- Existing MVP shareholder creation and KYC status update still work.
- New pilot edit sections are visibly marked pending Digaf validation.

### Wave 2: Excel Import Dry-Run Foundation

Goal: support safe spreadsheet validation without committing records.

Tasks:

| ID | Task | Type | Dependency | Status |
| --- | --- | --- | --- | --- |
| 71-05 | Define import mapping constants for Digaf Excel headers | Backend / shared config | Stage 67 | Ready |
| 71-06 | Create import validation service for parsed row objects | Backend | Stage 67 | Ready |
| 71-07 | Add dry-run validation endpoint for demo-safe sample payloads | Backend API | 71-05, 71-06 | Ready |
| 71-08 | Add validation result types to frontend API helpers | Frontend | 71-07 | Ready after API |
| 71-09 | Add frontend import review placeholder for dry-run results only | Frontend | 71-08 | Ready after API |
| 71-10 | Add demo fixture with fake shareholder rows only | Test/demo data | 71-06 | Ready |

Out of scope for this wave:

- Real Excel file upload.
- Production import commit.
- Real shareholder data.
- SharePoint storage.

Acceptance checks:

- Invalid rows produce structured row/column errors.
- Valid rows are marked ready for review.
- Duplicate detection can be simulated using existing demo data.
- No database writes occur during dry-run.

### Wave 3: Certificate Template Preview

Goal: produce a proposed certificate preview using existing certificate render data without final PDF generation.

Tasks:

| ID | Task | Type | Dependency | Status |
| --- | --- | --- | --- | --- |
| 71-11 | Confirm render-data endpoint exposes all required template fields | Backend review | Stage 68 | Ready |
| 71-12 | Add missing safe render fields if required, such as par value and total value | Backend API | 71-11 | Ready if gap exists |
| 71-13 | Create frontend certificate template preview component | Frontend | 71-11/71-12 | Ready |
| 71-14 | Use existing QR SVG URL in preview | Frontend | Existing certificate API | Ready |
| 71-15 | Add visible draft label: Proposed template pending Digaf approval | Frontend | Stage 68 | Ready |
| 71-16 | Document print/PDF limitations until approved PDF generation approach is selected | Documentation | Stage 68 | Ready |

Out of scope for this wave:

- Final PDF generation.
- Real electronic signatures.
- Production certificate issuance changes.
- SharePoint upload.

Acceptance checks:

- Preview loads from trusted render data.
- QR code remains scannable.
- Public verification exposes only public-safe data.
- Draft template label is visible.

### Wave 4: Approval Workflow Expansion Plan

Goal: prepare shareholder onboarding approvals without disrupting existing transfer approvals.

Tasks:

| ID | Task | Type | Dependency | Status |
| --- | --- | --- | --- | --- |
| 71-17 | Draft approval state machine for shareholder registration | Design | Stage 69 | Ready |
| 71-18 | Identify required additions to `approval_request` or related tables | Database plan | 71-17 | Ready |
| 71-19 | Define API contract for registration approval submission/decision | Backend API plan | 71-17 | Ready |
| 71-20 | Define frontend approval queue changes by workflow type | Frontend plan | 71-19 | Ready |
| 71-21 | Confirm no-single-user rule for registration approvals | Validation | Digaf DOA | Pending validation |
| 71-22 | Confirm CFO/CEO/Board threshold routing | Validation | Digaf DOA | Blocked pending validation |

Implementation should not begin for threshold-specific routing until Digaf validates the Delegation of Authority matrix.

Acceptance checks for later implementation:

- Existing transfer approvals still work.
- Registration approvals have auditable stages.
- Maker cannot approve own submission.
- Compliance and finance decisions are separately recorded.

### Wave 5: Production Security Foundation

Goal: remove the biggest production-readiness blockers.

Tasks:

| ID | Task | Type | Dependency | Status |
| --- | --- | --- | --- | --- |
| 71-23 | Finalize Entra app registration plan | Security / IT | Digaf IT decision | Pending validation |
| 71-24 | Map Entra groups to app roles | Security / access | 71-23 | Pending validation |
| 71-25 | Implement frontend sign-in | Frontend/security | 71-23 | Blocked pending auth plan |
| 71-26 | Implement backend JWT validation | Backend/security | 71-23 | Blocked pending auth plan |
| 71-27 | Replace client-provided production roles with trusted claims | Backend/security | 71-26 | Blocked pending auth |
| 71-28 | Add authorization tests for protected write endpoints | Tests | 71-27 | Blocked pending auth |

This wave is a production prerequisite before live regulated records are used.

### Wave 6: SharePoint, Power Automate, and Power BI Workstreams

Goal: connect Microsoft 365 integrations after Digaf validates ownership, access, and metadata.

Tasks:

| ID | Task | Type | Dependency | Status |
| --- | --- | --- | --- | --- |
| 71-29 | Confirm SharePoint site, library, folder structure, and metadata | Integration planning | Digaf IT | Pending validation |
| 71-30 | Implement document upload/reference workflow | Backend/frontend integration | 71-29 | Blocked pending SharePoint design |
| 71-31 | Confirm Power Automate notification events and recipients | Integration planning | Operations / IT | Pending validation |
| 71-32 | Implement notification dispatch events after committed database transactions | Backend integration | 71-31 | Blocked pending notification design |
| 71-33 | Confirm Power BI report pages, measures, and RLS | Reporting planning | Management / Compliance / IT | Pending validation |
| 71-34 | Build reporting views or curated export model | Database/reporting | 71-33 | Blocked pending reporting design |

## Immediate Next Implementation Recommendation

The safest next implementation stage is:

**Stage 72: Excel Import Dry-Run Validation Foundation**

Recommended Stage 72 scope:

- No real Excel upload yet.
- No real production data.
- No database commit.
- Build a backend validation service for Digaf-mapped row objects.
- Add a dry-run API route accepting demo/sample rows.
- Return structured validation errors and warnings.
- Add a small frontend review screen or developer-only utility if desired.
- Add demo-only fixture rows.

Why this is the safest next build:

- It advances Stage 67 without touching production data.
- It tests field mapping decisions.
- It gives Digaf a concrete validation artifact to review.
- It avoids premature approval workflow or authentication complexity.

## Tasks Blocked by Digaf Validation

Do not implement these as production-enforced behavior until Digaf validates them:

- Official KYC mandatory fields.
- Corporate shareholder requirements.
- Beneficial ownership thresholds.
- Next-of-kin requirement.
- Document waiver authority.
- Finance/payment verification rules.
- Certificate legal wording and signatories.
- Delegation of Authority thresholds.
- CEO/Board escalation routing.
- SharePoint access groups and retention labels.
- Power BI row-level security.

## Tasks That Can Proceed Safely Before Digaf Validation

These can proceed as pilot/demo-safe work if clearly labeled:

- Import dry-run validation with fake/sample data.
- Certificate draft preview using demo data.
- Documentation and QA checklists.
- Read-only display improvements.
- Error reporting structure.
- Manual test plans.
- Non-production fixtures.

## Build and Test Expectations for Future Implementation Stages

Each implementation stage should run:

```text
cd apps/web
npm.cmd run build

cd ../api
npm.cmd run build
```

Additional stage-specific tests should be added when implementation touches:

- Import validation rules.
- Approval routing.
- Certificate rendering.
- Authorization.
- Sensitive data handling.
- SharePoint/notification/reporting integrations.

## Release Hygiene Recommendation

Before Stage 72 begins, the current Stage 66D-71 documents and frontend work should be reviewed and committed as a coherent checkpoint. This reduces risk before starting another implementation wave.

## Summary

Stages 67-70 are now translated into an implementation path. The next practical build is an Excel import dry-run validation foundation, followed by a certificate preview workstream and then deeper approval/security work after Digaf validates the Delegation of Authority and production access model.
