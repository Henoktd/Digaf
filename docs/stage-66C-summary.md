# Stage 66C Summary - Backend API Support for Digaf-Aligned Shareholder Profile Sections

## Stage Objective

Stage 66C adds backend API support for the Digaf-aligned shareholder core fields and related profile sections introduced by the additive Stage 66B database migration.

This stage preserves existing MVP API behavior. No database schema changes, frontend form changes, package changes, or real shareholder data inserts were made.

## Source References

- `docs/stage-66A-database-api-plan.md`
- `docs/digaf-field-mapping.md`
- `docs/digaf-assumptions-register.md`
- `database/migrations/003_digaf_shareholder_alignment.sql`

The Digaf Excel registration template remains the primary source for confirmed fields. KYC, beneficial ownership, next-of-kin, banking, and expanded checklist fields remain based on the **Proposed Shareholder KYC Form - Draft for Digaf Review** and are not treated as approved Digaf policy.

## Existing Routes Preserved

The following MVP routes remain in place:

- `GET /api/shareholders`
- `POST /api/shareholders`
- `PATCH /api/shareholders/:shareholderId/kyc`
- `GET /api/shareholders/:shareholderId`

Existing create and KYC update behavior is preserved. The shareholder list and profile responses now include additional nullable Digaf-aligned core fields.

## Core Fields Exposed

The shareholder list/profile responses now expose the following Stage 66B core fields where present:

| Field | Source basis | Compatibility note |
|---|---|---|
| `shareholder_code` | Digaf Excel template | Nullable; UUID remains system key. |
| `gender` | Digaf Excel template | Nullable pending Digaf validation of mandatory rules. |
| `date_of_birth` | Digaf Excel template | Nullable and date-typed. |
| `nationality` | Digaf Excel template | Nullable. |
| `occupation` | Digaf Excel template | Nullable. |
| `tin_number` | Digaf Excel template | Nullable. |
| `primary_id_number` | Digaf Excel template | Nullable summary field; detailed ID data uses identity document table. |
| `mobile_number` | Digaf Excel template | Backward-compatible with existing `contact_details.phone` during create/update. |
| `email_address` | Digaf Excel template | Backward-compatible with existing `contact_details.email` during create/update. |
| `physical_address` | Digaf Excel template | Nullable summary address field. |
| `source_of_funds_declaration` | Digaf Excel template | Nullable summary declaration field. |

## Routes Added

### Profile Aggregate

- `GET /api/shareholders/:shareholderId/profile-details`

Returns:

- `core`
- `identity_documents`
- `kyc_profile`
- `beneficial_owners`
- `next_of_kin`
- `document_checklist`
- `payment_profiles`

### Core Details

- `PUT /api/shareholders/:shareholderId/core-details`

Supports updates to:

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

The route also updates legacy `contact_details.phone` and `contact_details.email` when mobile or email fields are provided.

### Identity Documents

- `GET /api/shareholders/:shareholderId/identity-documents`
- `POST /api/shareholders/:shareholderId/identity-documents`

Supports structured identity document metadata including document role, ID type, ID number, issuing authority, issue/expiry dates, country of issue, optional document reference, verification status, verifier, verification timestamp, and notes.

### KYC Profile

- `GET /api/shareholders/:shareholderId/kyc-profile`
- `PUT /api/shareholders/:shareholderId/kyc-profile`

Supports the expanded KYC/AML/CFT profile fields created in Stage 66B, including CDD, PEP, sanctions, adverse media, risk rating, AML officer approval, source of funds categories, employment details, declarations, and review metadata.

This route is separate from the existing `PATCH /api/shareholders/:shareholderId/kyc` route, which remains the MVP KYC status and decision route.

### Beneficial Owners

- `GET /api/shareholders/:shareholderId/beneficial-owners`
- `POST /api/shareholders/:shareholderId/beneficial-owners`

Supports beneficial owner capture, relationship, ID/TIN summary fields, country of residence, percentage reference, verification metadata, optional document reference, and notes.

### Next of Kin

- `GET /api/shareholders/:shareholderId/next-of-kin`
- `PUT /api/shareholders/:shareholderId/next-of-kin`

Supports replacement of the current next-of-kin set using a `contacts` array. An empty array clears the current section.

### Document Checklist

- `GET /api/shareholders/:shareholderId/document-checklist`
- `PUT /api/shareholders/:shareholderId/document-checklist`

Supports replacement of the current document checklist using an `items` array. Each item tracks document type, requirement status, checklist status, source basis, optional document reference, review metadata, and notes.

### Payment Profile

- `GET /api/shareholders/:shareholderId/payment-profile`
- `PUT /api/shareholders/:shareholderId/payment-profile`

Supports payment/banking/dividend instruction fields, payment method, total investment amount, verification status, verifier, verification timestamp, optional document reference, and notes.

Payment profile writes upsert by `paymentProfileType`, defaulting to `dividend`.

## Error Handling and Validation

- Shareholder route parameters are validated as UUIDs.
- Missing shareholder IDs return `404 NOT_FOUND`.
- Invalid request payloads return `400 BAD_REQUEST`.
- Write routes follow the existing `actorId` and `actorRole` pattern.
- Write routes use parameterized SQL and transaction boundaries.
- Write routes create `audit_log` entries for traceability.

## Compatibility Notes

- Existing frontend routes and payloads remain compatible.
- Existing MVP shareholder creation continues to support `email` and `phone`; these values now also populate `email_address` and `mobile_number`.
- Existing KYC status logic remains in `PATCH /api/shareholders/:shareholderId/kyc`.
- New fields remain nullable/optional where Digaf validation is pending.
- No real shareholder production data was uploaded, inserted, or transformed.
- No packages were added.

## Assumptions Pending Digaf Validation

- Expanded KYC, beneficial ownership, next-of-kin, banking, and document checklist fields are pilot candidates from the draft KYC form.
- `PUT /api/shareholders/:shareholderId/kyc-profile` is treated as the current structured KYC profile upsert, while the existing KYC route remains the approval/status update path.
- `PUT /api/shareholders/:shareholderId/next-of-kin` and `PUT /api/shareholders/:shareholderId/document-checklist` replace the current section contents.
- `POST /api/shareholders/:shareholderId/beneficial-owners` appends a beneficial owner record; verification responsibility remains assumed to sit with Compliance.
- The current API role set does not include a dedicated Finance Officer or Finance Manager role. For Stage 66C, payment profile writes are restricted to `checker_2` or `governance_admin` as an interim mapping.
- Maker capture remains allowed for core details, identity documents, beneficial owner capture, next-of-kin, and checklist maintenance where appropriate.

## Build Results

- `cd apps/api && npm.cmd run build` - passed.
- `cd apps/web && npm.cmd run build` - passed.

## Recommended Next Stage

Recommended next stage: **Stage 66D - Frontend shareholder profile UI alignment**.

Stage 66D should add frontend views/forms for the new backend profile sections while preserving the current MVP shareholder and KYC workflows. Digaf should still validate final mandatory rules, role mappings, approval thresholds, document checklist values, and payment verification ownership before production enforcement.
