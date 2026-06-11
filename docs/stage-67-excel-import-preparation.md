# Stage 67: Excel Import Preparation Structure

## Purpose

Stage 67 prepares the structure for importing Digaf shareholder registration data from the Digaf-provided Excel template. This is a planning and design stage only.

No production shareholder data should be uploaded, imported, transformed, or stored during this stage. No database schema, API routes, frontend forms, migrations, packages, or seed data are changed by this document.

## Source Basis

- Primary source: `docs/source-inputs/Digaf_Shareholder_Registration_Template 2.xlsx`
- Field mapping: `docs/digaf-field-mapping.md`
- Assumptions register: `docs/digaf-assumptions-register.md`
- Stage 66 database/API plan and implementation summaries

The Excel template is treated as Digaf-confirmed source input. Draft KYC fields from the proposed KYC form remain pending Digaf validation and should not be mandatory import requirements unless Digaf approves them.

## Import Principle

The import process should be a controlled onboarding workflow, not a direct spreadsheet-to-production-table write.

Recommended flow:

1. Upload or reference the Excel file in a controlled environment.
2. Parse the workbook into an import batch.
3. Map columns to application fields.
4. Validate rows without committing shareholder records.
5. Produce an import exception report.
6. Allow maker correction or re-upload.
7. Submit validated batch for Compliance and Finance review where applicable.
8. Commit approved records through the same application rules used by normal onboarding.
9. Write audit events and import evidence.

## Proposed Import Objects

These are proposed future implementation concepts, not schema changes in Stage 67.

| Object | Purpose | Notes |
| --- | --- | --- |
| Import batch | Represents one uploaded workbook or import attempt | Stores source filename, uploader, upload timestamp, status, and validation summary. |
| Import row | Represents one shareholder row parsed from Excel | Stores raw row number, parsed values, validation status, and link to created records after commit. |
| Import error | Represents validation failures or warnings | Includes row number, column name, error severity, message, and suggested correction. |
| Import mapping version | Represents the column mapping used for the batch | Allows future Digaf template revisions without breaking old import evidence. |
| Import approval record | Captures maker submission, compliance review, finance review, and final approval | Should integrate with the existing approval model rather than becoming a separate control system. |

## Column Mapping Preparation

| Excel field | Proposed target | Import action | Required before commit | Status |
| --- | --- | --- | --- | --- |
| Shareholder ID | `shareholder.shareholder_code` | Upsert/match candidate | Required if provided by Digaf; otherwise system-generated | Confirmed |
| Full name | `shareholder.legal_name` | Create/update shareholder core | Yes | Confirmed |
| Gender | `shareholder.gender` | Create/update shareholder core | Required for individuals pending validation | Confirmed |
| Date of birth | `shareholder.date_of_birth` | Create/update shareholder core | Required for individuals pending validation | Confirmed |
| Nationality | `shareholder.nationality` | Create/update shareholder core | Yes | Confirmed |
| Occupation | `shareholder.occupation` | Create/update shareholder core | Required for individuals pending validation | Confirmed |
| TIN number | `shareholder.tin_number` | Create/update shareholder core | Yes unless Digaf confirms exemptions | Confirmed |
| National ID / passport number | `shareholder.primary_id_number`; `shareholder_identity_documents.id_number` | Create core summary and primary identity document row | Yes | Confirmed |
| Mobile number | `shareholder.mobile_number`; `contact_details.phone` compatibility | Create/update contact fields | Yes | Confirmed |
| Email address | `shareholder.email_address`; `contact_details.email` compatibility | Create/update contact fields | Yes | Confirmed |
| Physical address | `shareholder.physical_address` | Create/update core address field | Yes | Confirmed |
| Share certificate number | `share_certificate.serial_number` | Match or prepare certificate issuance record | Required after certificate issuance, not necessarily before profile creation | Confirmed |
| Number of shares purchased | Share subscription/acquisition model; later `share_ownership.quantity` | Validate and stage for ownership creation | Yes for issuance/import commit | Confirmed |
| Par value per share | `share_class.par_value` or staged acquisition snapshot | Validate against known share class | Yes | Confirmed |
| Total investment amount | `shareholder_payment_profiles.total_investment_amount` or future subscription table | Stage for finance review | Yes | Confirmed |
| Date of purchase | Ownership/acquisition effective date | Stage for ownership and certificate records | Yes | Confirmed |
| Payment method | `shareholder_payment_profiles.payment_method` | Stage for finance review | Yes | Confirmed |
| Source of funds declaration | `shareholder.source_of_funds_declaration`; `shareholder_kyc_profiles.source_of_funds_summary` | Stage for compliance review | Yes | Confirmed |
| Status | `shareholder.status` | Map to approved app status values | Yes | Confirmed |
| CDD completed | `shareholder_kyc_profiles.cdd_completed` | Stage for compliance review | Yes before activation | Confirmed |
| PEP status | `shareholder_kyc_profiles.pep_status` | Stage for compliance review | Yes before activation | Confirmed |
| Sanction screening result | `shareholder_kyc_profiles.sanction_screening_result` | Stage for compliance review | Yes before activation | Confirmed |
| Adverse media screening result | `shareholder_kyc_profiles.adverse_media_screening_result` | Stage for compliance review | Yes before activation | Confirmed |
| Risk rating | `shareholder_kyc_profiles.risk_rating` | Stage for compliance review and reporting | Yes before activation | Confirmed |
| AML Officer approval | `shareholder_kyc_profiles.aml_officer_approval_status`; approval/audit event | Stage for compliance approval | Yes before activation | Confirmed |

## Document Checklist Import Preparation

The Excel template confirms several required documents. The import should not require actual document upload in the same step unless Digaf approves that process.

Recommended import behavior:

- Create checklist expectations for each imported shareholder.
- Mark documents as `pending` unless a valid `document_reference` is provided.
- Link documents later through SharePoint-ready document reference workflows.
- Do not embed files in Excel import payloads.

Confirmed checklist items:

- National ID or passport copy.
- Passport-size photograph.
- TIN certificate.
- Proof of address.
- Source of funds declaration document.
- Board approval or board resolution, if required.

## Validation Rules

Recommended row-level validations:

- Full name must be present.
- Email must be valid when present.
- Mobile number must be present and meet Digaf-approved formatting rules once confirmed.
- Date of birth must be a valid date and cannot be in the future.
- TIN number must be present unless Digaf confirms an exemption process.
- National ID / passport number must be present.
- Number of shares purchased must be a positive number.
- Par value must match a configured share class or be flagged for review.
- Total investment amount must be zero or greater and reconcile with share quantity and par value rules once Digaf confirms pricing logic.
- Date of purchase must be a valid date.
- Payment method must match approved values after Digaf validates the finance list.
- CDD, PEP, sanctions, adverse media, risk, and AML approval values must map to configured compliance values.
- Duplicate shareholder candidates should be detected using shareholder code, TIN, primary ID number, email, and normalized full name.

## Duplicate and Conflict Handling

Potential duplicate checks:

- Existing `shareholder_code`.
- Existing `tin_number`.
- Existing `primary_id_number`.
- Existing `email_address`.
- Same legal name plus date of birth.
- Same legal name plus mobile number.

Recommended conflict outcomes:

| Conflict type | Proposed action |
| --- | --- |
| Exact existing shareholder code | Block commit unless user selects update mode. |
| Exact TIN or primary ID match | Warn or block pending Compliance review. |
| Existing email/mobile only | Warning; may be reused by representatives or shared contacts. |
| Existing certificate number | Block unless certificate migration/reconciliation mode is active. |
| Unknown share class/par value | Block ownership/certificate creation, allow shareholder profile staging only if approved. |

## Import Status Model

Proposed statuses:

- `uploaded`
- `parsed`
- `validation_failed`
- `validated_with_warnings`
- `ready_for_review`
- `compliance_review`
- `finance_review`
- `final_approval`
- `approved_for_commit`
- `committed`
- `rejected`
- `cancelled`

## Error Report Format

Each validation run should produce an error report with:

- Batch ID.
- Source filename.
- Import mapping version.
- Row number.
- Column name.
- Field name.
- Severity: error or warning.
- Message.
- Suggested correction.
- Responsible role: Maker, Compliance, Finance, Admin.

## Security and Data Protection

- Do not use real production data until Digaf approves a controlled migration exercise.
- Treat uploaded Excel files as sensitive.
- Store raw import files in SharePoint or approved secure storage, not in source control.
- Restrict access to import batches by role.
- Mask or avoid sensitive fields in logs.
- Keep raw row payloads out of public error messages.
- Ensure import events are auditable.

## Out of Scope for Stage 67

- Implementing an Excel parser.
- Creating import database tables.
- Creating upload UI.
- Writing import API routes.
- Loading real shareholder data.
- Generating certificates from import data.
- Connecting SharePoint or Power Automate.

## Open Questions for Digaf

- Will Digaf provide a final import workbook format with fixed headers?
- Should the import create new shareholders only, update existing shareholders, or support both?
- Should certificate numbers be imported as historical records or generated by the platform after approval?
- What are the approved payment method values?
- What share classes and par values are valid for pilot launch?
- Which duplicate matches should block import versus create warnings?
- Who approves final import commit?
- Should import review follow the same maker, KYC checker, finance checker, and final approver model as manual onboarding?

## Recommended Next Step

Stage 71 should convert this preparation structure into an implementation backlog for:

- Import mapping configuration.
- Backend dry-run validation endpoint.
- Import batch storage.
- Frontend upload/validation review UI.
- Audit and approval integration.
