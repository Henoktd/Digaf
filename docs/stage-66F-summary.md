# Stage 66F Summary: Frontend Pilot Edit Guardrails

## Purpose

Stage 66F hardens the Stage 66E Digaf-aligned shareholder profile edit workflows for pilot use. This stage is frontend-only and does not change database schema, backend routes, migrations, package files, or production data.

## Files Changed

- `apps/web/src/components/DigafProfileEditWorkflows.tsx`
- `docs/stage-66F-summary.md`

## Frontend Areas Updated

The shareholder profile pilot edit workflow now includes:

- A pilot role selector for assumed Digaf workflow roles.
- Role-aware edit gating for each Digaf-aligned profile section.
- Client-side validation before API calls.
- Explicit replacement confirmations for workflows that replace section data.
- Clear draft and sensitive-data notices for KYC and payment fields.

## Role-Aware Edit Gating

The following role assumptions are implemented as frontend pilot controls only and remain pending Digaf validation:

| Workflow | Allowed Pilot Roles |
| --- | --- |
| Core shareholder details | Maker, Pilot admin |
| Identification documents | Maker, Compliance Officer, Pilot admin |
| KYC / AML / CFT profile | Compliance Officer, Pilot admin |
| Beneficial ownership | Maker, Compliance Officer, Pilot admin |
| Next of kin / emergency contact | Maker, Pilot admin |
| Document checklist | Maker, Compliance Officer, Pilot admin |
| Payment profile | Finance Checker, Pilot admin |

The default role is `Pilot admin` to keep local pilot testing practical. This is not a final authorization model.

## Validation Added

Client-side validation now checks:

- Core details:
  - Date of birth cannot be in the future.
  - Email address must be valid when provided.
  - Mobile number must be at least 7 characters when provided.
- Identification documents:
  - ID type is required.
  - ID number is required.
  - Expiry date cannot be before issue date.
- KYC / AML / CFT:
  - CDD completion timestamp is required when CDD is marked complete.
- Beneficial ownership:
  - Beneficial owner full name is required.
  - Percentage reference must be between 0 and 100 when provided.
- Next of kin:
  - Replacement confirmation is required.
  - Full name is required.
  - Relationship is required.
  - At least one phone number or email address is required.
  - Email address must be valid when provided.
- Document checklist:
  - Replacement confirmation is required.
  - Document type is required.
- Payment profile:
  - Total investment amount must be zero or greater when provided.
  - Payment verified by is required when verification status is `verified`.
  - Payment verified at is required when verification status is `verified`.

## Replacement Workflow Guardrails

The Stage 66C backend routes for next of kin and document checklist replace the relevant section contents. Stage 66F adds explicit confirmation checkboxes before those pilot updates can be submitted.

## Draft and Sensitive Notices

The KYC form now clearly states that the structure is draft and pending Digaf validation. The payment profile form now states that bank and payment fields are sensitive pilot fields and should only be used with demo or approved pilot records.

## Backend Routes Used

No backend routes were added or changed. The existing Stage 66C routes remain in use:

- `PUT /api/shareholders/:shareholderId/core-details`
- `POST /api/shareholders/:shareholderId/identity-documents`
- `PUT /api/shareholders/:shareholderId/kyc-profile`
- `POST /api/shareholders/:shareholderId/beneficial-owners`
- `PUT /api/shareholders/:shareholderId/next-of-kin`
- `PUT /api/shareholders/:shareholderId/document-checklist`
- `PUT /api/shareholders/:shareholderId/payment-profile`

## Compatibility Notes

- Existing MVP shareholder pages remain in place.
- Existing read-only Digaf profile sections remain in place.
- No schema, migration, backend API, seed, or package changes were made.
- Role gating is a frontend pilot aid only. Backend authorization remains unchanged from Stage 66C.

## Build Results

- `cd apps/web && npm.cmd run build`: Passed.
- `cd apps/api && npm.cmd run build`: Passed.

## Pending Digaf Validation

- Final role mapping and authorization policy.
- Whether pilot admin should exist outside local/internal testing.
- Final KYC form fields and official policy wording.
- Final next-of-kin replacement versus multi-contact edit behavior.
- Final document checklist editing model.
- Final finance verification rules and sensitive-field handling.

## Recommended Next Stage

Proceed to Stage 67 only after confirming whether Digaf wants frontend pilot editing to remain role-selectable for demos or move toward authenticated role-based controls.
