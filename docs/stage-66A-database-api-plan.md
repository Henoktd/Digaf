# Stage 66A Database and API Implementation Plan

## Purpose

Stage 66A prepares the database and API implementation plan for aligning the Digaf Shareholder Governance Platform with the Stage 65 field mapping. This is a planning-only stage.

No database schema, frontend forms, backend API code, package files, or migrations should be changed in Stage 66A. Existing MVP behavior must remain working.

## Source Documents

- `docs/digaf-field-mapping.md`
- `docs/digaf-assumptions-register.md`
- `docs/stage-65-summary.md`

The Digaf-provided Excel registration template remains the primary source for confirmed field alignment. The KYC form remains **Proposed Shareholder KYC Form — Draft for Digaf Review** and must not be treated as approved Digaf policy or an official regulatory document.

## Current Database Baseline Reviewed

Current migrations reviewed:

- `database/migrations/001_initial_governance_schema.sql`
- `database/migrations/002_regulated_governance_tables.sql`

Current shareholder-related API areas reviewed:

- `apps/api/src/routes/shareholderRoutes.ts`
- `apps/api/src/routes/transferRoutes.ts`
- `apps/api/src/routes/approvalRoutes.ts`
- `apps/api/src/routes/certificateRoutes.ts`
- `apps/api/src/routes/documentRoutes.ts`
- `apps/api/src/routes/capTableRoutes.ts`
- `apps/api/src/routes/dashboardRoutes.ts`

Current frontend forms reviewed for payload compatibility:

- `apps/web/src/components/CreateShareholderForm.tsx`
- `apps/web/src/components/UpdateKycForm.tsx`

## Current Shareholder Fields Already Supported

| Area | Current support | Database location | Current API exposure | Notes |
|---|---|---|---|---|
| Shareholder system ID | Supported | `shareholder.shareholder_id` | Returned by list/detail endpoints | UUID exists. Excel describes auto-generated shareholder ID; later stage may add a human-readable shareholder code. |
| Entity link | Supported | `shareholder.entity_id` | Create/list/detail | Required for multi-entity governance. |
| Legal name | Supported | `shareholder.legal_name` | Create/list/detail | Maps to Excel full name. |
| Shareholder type | Partially supported | `shareholder.type` | Create/list/detail | Current values are `individual` and `institution`. Stage 65 draft KYC uses Individual/Corporate; value alignment is needed. |
| Status | Supported | `shareholder.status` | Create/list/detail | Current default is `active`. Digaf workflow may need `draft`, `pending_review`, or `approved` states before activation. |
| Email and phone | Partially supported | `shareholder.contact_details` JSONB | Create/list/detail | Current API stores `email` and `phone` in JSON. Excel wants mobile number and email as core fields. |
| KYC status | Supported | `shareholder.kyc_status`; `kyc_record.kyc_status` | Create/list/detail; KYC update endpoint | Current values are `not_started`, `pending`, `verified`, `expired`. |
| KYC expiry | Supported | `shareholder.kyc_expiry`; `kyc_record.expiry_date` | Create/list/detail; KYC update endpoint | Useful for transfer eligibility checks. |
| Risk classification | Supported | `shareholder.risk_classification` | Create/list/detail; KYC update endpoint | Current values are `low`, `medium`, `high`. |
| Proxy eligible | Supported | `shareholder.proxy_eligible` | Create/list/detail | MVP field; not explicitly in Stage 65 mapping but can remain. |
| Relationship start date | Partially supported | `shareholder.relationship_start_date` | Create/list/detail | Can support date of first relationship, but not necessarily date of share purchase. |
| KYC review record | Partially supported | `kyc_record` | KYC update endpoint writes latest record | Current table tracks status, expiry, document references, reviewer, approval date, last review date. Missing detailed screening fields. |
| Beneficial ownership | Partially supported | `beneficial_ownership` | Not exposed in reviewed shareholder API payload | Table exists, but current columns are basic and do not fully match Stage 65 beneficial owner fields. |
| Share ownership | Supported | `share_ownership` | Shareholder profile, cap table, dashboard | Tracks share class, quantity, pledged and encumbered quantity, effective date, status. |
| Share class and par value | Supported | `share_class.class_name`, `share_class.par_value` | Cap table/certificates partially expose class name | Par value exists but certificate and shareholder APIs do not consistently expose it. |
| Certificates | Supported | `share_certificate`, `certificate_event` | Certificate list, profile, render data, QR verify | Serial number, shareholder, share class, quantity, issue date, status, hash, QR token, revocation fields exist. |
| Transfers | Supported | `share_transfer`, `approval_request`, `ownership_transaction` | Transfer and approval endpoints | Transfer eligibility checks KYC, freezes, legal holds, pledged and encumbered quantities. |
| Documents | Supported as references | `document_reference` | Document list and shareholder profile document aggregation | Current table is suitable for SharePoint-ready references. No checklist-completion table yet. |
| Legal holds / freezes | Supported | `legal_hold`, `transfer_freeze` | Profile, transfer eligibility, legal hold routes | Good MVP basis for legal hold/freeze planning. Pledge business rules still need validation. |
| Audit trail | Supported | `audit_log`, `certificate_event` | Audit and certificate events | Append-only enforcement is noted as future hardening. |

## Current Gaps Against Digaf Field Mapping

### Confirmed Excel Fields Not Yet Structured in Current Shareholder Model

| Field | Current status | Recommended target |
|---|---|---|
| Gender | Missing | `shareholder.gender` or profile table, pending final design. |
| Date of birth | Missing | `shareholder.date_of_birth` for individual shareholders. |
| Nationality | Missing | `shareholder.nationality`. |
| Occupation | Missing | `shareholder.occupation` or KYC/profile table. |
| TIN number | Missing | `shareholder.tin_number`, with future KYC metadata in separate table. |
| National ID / passport number | Missing | Structured identity document table, with optional primary summary field if needed. |
| Mobile number | Partially stored as JSON phone | Add structured `mobile_number` or preserve in `contact_details` during transition and expose consistently. |
| Email address | Partially stored as JSON email | Add structured `email_address` or preserve in `contact_details` during transition and expose consistently. |
| Physical address | Missing | Structured address/profile table or `shareholder.physical_address`. |
| Number of shares purchased | Represented through ownership/certificate quantity, not purchase-specific | Use `share_subscription` or `ownership_transaction` enhancement rather than `shareholder` column. |
| Total investment amount | Missing | Finance/subscription/payment table. |
| Date of purchase | Partially represented by ownership effective date and certificate issue date | Add acquisition/subscription transaction field, not master shareholder field. |
| Payment method | Missing | Finance/subscription/payment table. |
| Source of funds declaration | Missing as structured field | KYC/source-of-funds table plus document reference. |
| CDD completed | Partially represented by KYC status | Add detailed KYC review fields. |
| PEP status | Missing | KYC screening table. |
| Sanction screening result | Missing | KYC screening table. |
| Adverse media screening result | Missing | KYC screening table. |
| AML Officer approval | Partially represented by KYC reviewer/approval date | Add KYC approval metadata and approval workflow integration. |

### Draft KYC Fields Requiring Digaf Validation Before Implementation

These should not be treated as approved production requirements yet:

- Former / other names.
- Place of birth.
- Marital status.
- Number of dependants.
- Alternate phone, fax, preferred contact method.
- Structured address fields beyond the Excel physical address.
- Primary and secondary ID metadata beyond National ID / passport number.
- TIN issuing country and TIN exemption declaration.
- Employer/business name, employer address, employment status, business sector, years at current job, annual income range.
- Source of funds categories.
- Detailed beneficial owner identity fields.
- PEP family/associate flag, position, role, country, and organization.
- AML/CFT self-declarations.
- Next of kin / emergency contact fields.
- Banking and dividend payment fields.
- Expanded document checklist items.
- KYC officer office-use fields.

## New Fields Required from the Digaf Template

The following fields should be treated as confirmed Excel-driven requirements for implementation planning:

| Field | Implementation priority | Suggested storage approach |
|---|---|---|
| Gender | High | Direct shareholder/profile field. |
| Date of birth | High | Direct shareholder/profile field. |
| Nationality | High | Direct shareholder/profile field. |
| Occupation | High | Direct shareholder/profile field. |
| TIN number | High | Direct shareholder field plus document reference for TIN certificate. |
| National ID / passport number | High | Identity document table; optional primary ID summary for list views. |
| Mobile number | High | Direct contact field or normalized contact table. |
| Email address | High | Direct contact field or normalized contact table. |
| Physical address | High | Direct address/profile field initially; can normalize later if Digaf requires structured address reporting. |
| Share certificate number | Already supported | `share_certificate.serial_number`. |
| Number of shares purchased | High | Subscription/acquisition transaction model, not shareholder master. |
| Par value per share | Already supported | `share_class.par_value`; expose through certificate/report APIs. |
| Total investment amount | High | Finance/subscription/payment table. |
| Date of purchase | High | Subscription/acquisition transaction model. |
| Payment method | High | Finance/subscription/payment table. |
| Source of funds declaration | High | KYC source-of-funds fields plus document reference. |
| CDD completed | High | KYC review/screening table. |
| PEP status | High | KYC screening table. |
| Sanction screening result | High | KYC screening table. |
| Adverse media screening result | High | KYC screening table. |
| AML Officer approval | High | KYC approval workflow fields and audit event. |

## Fields to Add Directly to `shareholder`

Recommended direct additions are stable master/profile fields that are frequently needed for list views, registry reports, and joins.

| Proposed column | Type | Source | Reason |
|---|---|---|---|
| `shareholder_code` | `TEXT UNIQUE` | Excel auto-generated Shareholder ID | Keep UUID as system key while adding human-readable Digaf shareholder ID. |
| `gender` | `TEXT` | Excel | Core individual profile/reporting field. |
| `date_of_birth` | `DATE` | Excel | Core individual profile/KYC field. |
| `nationality` | `TEXT` | Excel | Core profile/compliance field. |
| `occupation` | `TEXT` | Excel | Core profile/KYC field from Excel. |
| `tin_number` | `TEXT` | Excel | Core tax identifier. |
| `primary_id_number` | `TEXT` | Excel | Minimal alignment for National ID / passport number. Detailed metadata should be in identity table. |
| `mobile_number` | `TEXT` | Excel | Move from JSON-only contact into structured field while preserving backward compatibility. |
| `email_address` | `TEXT` | Excel | Move from JSON-only contact into structured field while preserving backward compatibility. |
| `physical_address` | `TEXT` | Excel | Required source field; can later normalize if Digaf validates structured address fields. |
| `source_of_funds_declaration` | `TEXT` | Excel | Confirmed Excel field. Store summary declaration here only if Digaf wants it on the register; otherwise keep in KYC table. |

Compatibility note: `contact_details` JSONB should not be removed in the first migration. New structured contact fields can be backfilled from existing JSON and then used by new API responses. Existing MVP code can continue reading `contact_details` until frontend migration is complete.

## Fields to Place in Separate KYC / Profile Tables

### Extend or Replace `kyc_record`

The existing `kyc_record` table is a good starting point but is too thin for Digaf field alignment. A future migration should either add columns to `kyc_record` or introduce related tables such as `kyc_screening_result` and `kyc_declaration`.

Recommended additions:

| Field group | Suggested table | Notes |
|---|---|---|
| CDD completed | `kyc_record` | Boolean plus reviewer/date. |
| PEP status | `kyc_screening_result` or `kyc_record` | Confirmed from Excel. |
| Sanction screening result | `kyc_screening_result` | Confirmed from Excel; needs manual/vendor source field later. |
| Adverse media screening result | `kyc_screening_result` | Confirmed from Excel. |
| AML Officer approval | `kyc_record` / `approval_request` | Should become approval event, not just a text field. |
| Source of funds categories | `kyc_source_of_funds` or JSONB field | Draft KYC details need validation. |
| Annual income range | `kyc_financial_profile` | Draft KYC field; validation required. |
| Employment details | `shareholder_profile` or `kyc_financial_profile` | Draft KYC field; validation required. |
| AML/CFT declarations | `kyc_declaration` | Draft KYC field; validation required. |
| Conflict of interest declaration | `kyc_declaration` | Recommended in Excel gap section; needs Digaf validation. |

### Identity Documents

Create a separate table, for example `shareholder_identity_document`, because a shareholder can have more than one identity document and document metadata has lifecycle concerns.

Suggested fields:

- `id`
- `shareholder_id`
- `entity_id`
- `document_role` such as `primary` or `secondary`
- `id_type`
- `id_number`
- `issuing_authority`
- `issue_date`
- `expiry_date`
- `country_of_issue`
- `document_reference_id`
- `verification_status`
- `created_at`

The direct `shareholder.primary_id_number` can remain a convenience field for the Excel-confirmed National ID / passport number.

### Beneficial Ownership

The current `beneficial_ownership` table exists but should be extended if Digaf validates the draft KYC beneficial ownership fields.

Recommended additions:

- `is_ultimate_beneficial_owner` on the shareholder/profile side, or a specific beneficial ownership confirmation table.
- `beneficial_owner_id_type`
- `beneficial_owner_id_number`
- `beneficial_owner_tin`
- `beneficial_owner_country_of_residence`
- `verification_method`
- `verification_notes`
- `verified_by`

### Next of Kin / Emergency Contact

If Digaf validates next-of-kin capture, use a separate table such as `shareholder_emergency_contact`.

Do not put these fields directly on `shareholder` unless Digaf confirms exactly one contact per shareholder and no history is needed.

### Banking and Dividend Payment

The draft KYC form includes banking and dividend payment details. Because these are sensitive and may have independent approval/change controls, use a separate table such as `shareholder_payment_instruction` if Digaf validates the requirement.

Do not add bank account details to `shareholder` directly.

## Fields to Track as Documents Instead of Database Columns

The actual files should be tracked using `document_reference`, not stored as database columns.

| Document / evidence | Storage approach | Notes |
|---|---|---|
| National ID or passport copy | `document_reference` | Link to shareholder and optionally identity document row. |
| Passport-size photograph | `document_reference` | Metadata should identify document type and version. |
| TIN certificate | `document_reference` | Link to shareholder and TIN metadata. |
| Proof of address | `document_reference` | Use metadata for proof date and address match status if needed. |
| Source of funds declaration document | `document_reference` | Store declaration summary separately only if needed for reporting. |
| Board approval / board resolution | `board_resolution_ref` plus `document_reference` | Existing tables already support this pattern. |
| Share transfer document or allotment letter | `document_reference` | Link to `share_transfer`, `ownership_transaction`, or future subscription record. |
| Beneficial owner authorization letter | `document_reference` | Link to beneficial ownership record if implemented. |
| Marriage / legal name change certificate | `document_reference` | Draft KYC item; validation required. |
| PEP declaration / source of wealth statement | `document_reference` | Draft KYC item; validation required. |
| Company registration documents | `document_reference` | Required if corporate shareholder model is confirmed. |
| Corporate board resolution authorizing shareholding | `board_resolution_ref` plus `document_reference` | Validation required for corporate shareholder process. |
| Certificate PDF | `document_reference` | Current seed already uses this pattern. |

Recommended addition for a later migration: a `document_checklist_item` table to track required/not-required/attached/waived/rejected status per shareholder or workflow. This is better than adding many boolean columns.

## Suggested Database Migration Plan

### Migration 003 - Backward-Compatible Shareholder Field Alignment

Goal: add stable Excel-confirmed fields without breaking MVP screens or current seed data.

Suggested changes:

- Add nullable structured fields to `shareholder`:
  - `shareholder_code`
  - `gender`
  - `date_of_birth`
  - `nationality`
  - `occupation`
  - `tin_number`
  - `primary_id_number`
  - `mobile_number`
  - `email_address`
  - `physical_address`
  - optionally `source_of_funds_declaration`
- Backfill `mobile_number` and `email_address` from `contact_details->>'phone'` and `contact_details->>'email'`.
- Keep all new columns nullable initially so existing MVP demo data and tests continue working.
- Add non-unique indexes only where query need is clear, for example `shareholder_code`, `tin_number`, and `primary_id_number` after validation.
- Do not remove `contact_details` in this migration.

### Migration 004 - KYC Screening and Identity Detail Tables

Goal: separate compliance review details from the shareholder master table.

Suggested changes:

- Add `shareholder_identity_document`.
- Extend `kyc_record` or add `kyc_screening_result`.
- Add fields for CDD completed, PEP status, sanction screening, adverse media screening, AML officer approval metadata, and screening notes.
- Preserve existing `shareholder.kyc_status`, `shareholder.kyc_expiry`, and `shareholder.risk_classification` as summary fields for fast transfer eligibility checks.

### Migration 005 - Subscription / Payment / Acquisition Records

Goal: model Excel share purchase fields without overloading the shareholder table.

Suggested changes:

- Add a `share_subscription` or `share_acquisition` table for:
  - shares purchased
  - share class
  - par value snapshot
  - total investment amount
  - date of purchase
  - payment method
  - payment verification status
  - finance reviewer
  - approval reference
  - source transaction / certificate reference
- Link to `share_ownership`, `ownership_transaction`, `approval_request`, and `document_reference`.

### Migration 006 - Document Checklist and Optional Draft KYC Fields

Goal: implement only the draft KYC fields Digaf validates.

Suggested changes after validation:

- Add `document_checklist_item`.
- Add `shareholder_emergency_contact` only if next of kin is approved.
- Add `shareholder_payment_instruction` only if banking/dividend details are approved.
- Add beneficial ownership details only if Digaf confirms the exact beneficial ownership form and reporting needs.

### Migration Controls

- Each migration should be additive and nullable at first.
- Add constraints only after backfill and validation.
- Do not drop or rename existing MVP columns in the first implementation cycle.
- Keep audit logging for all new write endpoints.
- Provide rollback scripts or documented rollback notes for each migration.

## Suggested API Changes

### Preserve Existing MVP Endpoints

Keep these endpoints backward-compatible:

- `GET /api/shareholders`
- `POST /api/shareholders`
- `GET /api/shareholders/:shareholderId`
- `PATCH /api/shareholders/:shareholderId/kyc`

Existing frontend payloads should continue to work while new fields are introduced.

### Add Optional Fields to Existing Shareholder Create / Update

For the next implementation stage, allow `POST /api/shareholders` to accept optional new Excel-confirmed fields:

- `shareholderCode`
- `gender`
- `dateOfBirth`
- `nationality`
- `occupation`
- `tinNumber`
- `primaryIdNumber`
- `mobileNumber`
- `emailAddress`
- `physicalAddress`
- `sourceOfFundsDeclaration`

During transition:

- Continue accepting `email` and `phone`.
- Normalize `email` into `email_address`.
- Normalize `phone` into `mobile_number`.
- Continue populating `contact_details` for old consumers.

### Add Dedicated Update Endpoints

Recommended endpoint additions:

| Endpoint | Purpose |
|---|---|
| `PATCH /api/shareholders/:shareholderId/profile` | Update stable master/profile fields such as gender, DOB, nationality, occupation, TIN, primary ID summary, contact, address. |
| `POST /api/shareholders/:shareholderId/identity-documents` | Add primary/secondary identity document metadata. |
| `PATCH /api/shareholders/:shareholderId/identity-documents/:documentId` | Update or verify identity document metadata. |
| `POST /api/shareholders/:shareholderId/kyc/screening` | Capture CDD, PEP, sanctions, adverse media, risk rating, and AML officer review. |
| `POST /api/shareholders/:shareholderId/beneficial-ownership` | Add beneficial ownership details after Digaf validation. |
| `GET /api/shareholders/:shareholderId/documents/checklist` | Return expected and attached document checklist state. |
| `PATCH /api/shareholders/:shareholderId/documents/checklist/:itemId` | Mark checklist item status such as required, attached, waived, rejected. |
| `POST /api/share-subscriptions` | Capture share purchase/subscription/payment fields from the Excel template. |

### Add Approval Request Support for Shareholder Registration

Current approval flow is transfer-oriented. For Digaf alignment, add support for:

- `request_type = 'shareholder_registration'`
- Maker submission.
- KYC checker stage.
- Finance/payment checker stage.
- Final approver stage.
- Exceptional/high-value escalation to CEO or board-level approval.

Do this by extending `approval_request` stage handling rather than creating an unrelated approval mechanism.

### Reporting API Changes

Future API reporting should expose:

- Shareholder register with Excel-confirmed fields.
- Share capital summary with par value and investment amount where available.
- New shareholders report.
- PEP screening report.
- High-risk shareholder report.
- AML/CFT exception report.
- Beneficial ownership report.
- Certificate issuance log with certificate serial, holder, class, quantity, issue date, hash/QR status.

Prefer database views or dedicated reporting queries over large frontend-side joins.

## Suggested Frontend Changes for the Next Stage

No frontend changes should be made in Stage 66A. For the next implementation stage, plan:

- Expand shareholder creation into sections:
  - Master data
  - Personal / institutional information
  - Identification
  - Contact and address
  - Share subscription / acquisition
  - Source of funds
  - Document checklist
- Move KYC review into a compliance-focused screen:
  - CDD completed
  - PEP status
  - sanctions screening
  - adverse media screening
  - risk rating
  - AML officer review notes
- Add read-only profile panels for:
  - documents
  - ownership
  - certificates
  - approval history
  - audit log
- Preserve the existing MVP create form until new fields are backed by additive API support.
- Keep mobile layouts sectioned and collapsible where forms become long.
- Clearly label draft KYC-only sections as pending Digaf validation until Digaf approves the final KYC form.

## Risks and Compatibility Notes

| Risk | Compatibility note / mitigation |
|---|---|
| Existing MVP relies on `contact_details` JSONB | Keep `contact_details`; add structured contact fields additively; backfill but do not remove. |
| Current shareholder type uses `institution`, while draft KYC uses `corporate` | Decide whether to map `institution` to `corporate` or support both. Avoid breaking existing records. |
| New fields may be nullable during transition | Add fields nullable first; enforce required fields only after frontend/API and seed data are updated. |
| Draft KYC fields may not be approved | Do not implement draft-only fields until Digaf validation. Keep these in plan only. |
| Sensitive KYC/banking data could be overexposed | Use separate tables, role-based endpoints, audit logs, and avoid adding sensitive fields to broad list endpoints. |
| Share purchase fields do not belong on `shareholder` | Use subscription/acquisition/payment records to avoid losing transaction history. |
| Certificate template signatories are not final | Keep certificate signatory/template config outside hardcoded schema where possible. |
| Approval model is currently transfer-specific | Extend approval stages carefully so existing transfer approvals continue working. |
| Reporting requirements may change after Digaf review | Prefer reporting views/API layers that can evolve without changing core tables repeatedly. |
| Existing `apps/api/src/server.ts` is dirty in the working tree | Stage 66A does not rely on or modify that file. Treat separately before implementation work. |

## Assumptions Pending Digaf Validation

- Maker is Customer Service Officer or Governance Officer.
- KYC Checker is Compliance Officer.
- Payment / finance checker is Finance Officer or Finance Manager.
- Final Approver is CFO or Authorized Executive.
- Exceptional or high-value cases require CEO or Board-level approval.
- Internal Auditor performs audit review and has report/audit trail access.
- System admin is IT/System Administrator.
- New shareholder registration requires maker, KYC review, finance/payment verification, final approval, and audit evidence before activation.
- KYC review must complete before finance/payment verification and final share issuance approval.
- Payment evidence requirements, acceptable payment methods, and reconciliation rules are not final.
- Certificate issuance requires final approval before generation and activation.
- CEO and Board Chairperson certificate signature blocks are placeholders pending final Digaf certificate template confirmation.
- Legal hold, freeze, pledge registration, release, and override rules are not final.
- SharePoint will be used, or at least represented, as the document storage/reference system.
- Power Automate notification recipients, templates, and escalation timing are not final.
- Power BI reporting scope, layout, measures, refresh cadence, and row-level security are not final.
- No real shareholder production data should be imported or used until Digaf approves a controlled data migration exercise.
- The draft KYC form fields remain candidate pilot fields only.

## Recommended Next Stage

Recommended next stage: **Stage 66B - Draft additive migration specification and API contract design**.

Stage 66B should still avoid implementation until Digaf confirms priority and validation decisions, but it can produce:

- Proposed migration file outline.
- API request/response contract examples.
- Backfill rules for contact fields.
- Required test cases.
- Frontend form section blueprint.

Implementation should begin only after the migration and API contract are reviewed and approved.

