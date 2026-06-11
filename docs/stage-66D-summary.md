# Stage 66D Summary - Frontend Shareholder Profile UI Alignment

## Stage Objective

Stage 66D updates the frontend shareholder profile experience to display Digaf-aligned profile sections supported by the Stage 66C backend routes.

This stage is display-focused. No database schema, migrations, package files, backend route logic, or real shareholder data were changed.

## References Used

- `docs/digaf-field-mapping.md`
- `docs/digaf-assumptions-register.md`
- `docs/stage-66A-database-api-plan.md`
- `docs/stage-66C-summary.md`

The Digaf Excel registration template remains the primary confirmed source. KYC, beneficial ownership, next-of-kin, expanded checklist, and banking/payment profile areas are shown as draft pilot structures pending Digaf validation.

## Frontend Pages Changed

- `apps/web/app/shareholders/page.tsx`
- `apps/web/app/shareholders/[shareholderId]/page.tsx`

## Components and Helpers Changed

- `apps/web/src/lib/api.ts`
  - Added typed frontend helpers for the Stage 66C shareholder profile routes.
  - Added `get...` aliases for the display/read helpers while preserving the repo's existing `fetch...` helper naming pattern.
  - Added response types for core details, identity documents, KYC profile, beneficial owners, next of kin, document checklist, and payment profiles.

- `apps/web/src/components/DigafProfileSections.tsx`
  - Added a new display-only component for Digaf-aligned shareholder profile sections.
  - Uses existing UI primitives and empty-state patterns.

## Shareholder Registry Updates

The shareholder list now displays safe high-level Digaf fields:

- `shareholder_code`
- `mobile_number`
- `email_address`
- `tin_number`
- existing KYC status, KYC expiry, risk, status, type, and proxy eligibility

The table remains horizontally scrollable on smaller screens.

## Shareholder Profile Sections Added

The shareholder detail page now displays:

- Core shareholder details
- Identification documents
- KYC / AML / CFT profile
- Beneficial ownership
- Next of kin / emergency contact
- Document checklist
- Payment profile
- Approval / office-use summary

Existing MVP sections remain in place:

- Profile & KYC
- Ownership
- Certificates
- Transfer history
- Legal holds
- Documents
- Communications

## Backend Routes Consumed or Supported by Helpers

The profile page consumes:

- `GET /api/shareholders/:shareholderId/profile-details`

Frontend helper support was also added for:

- `PUT /api/shareholders/:shareholderId/core-details`
- `GET /api/shareholders/:shareholderId/identity-documents`
- `POST /api/shareholders/:shareholderId/identity-documents`
- `GET /api/shareholders/:shareholderId/kyc-profile`
- `PUT /api/shareholders/:shareholderId/kyc-profile`
- `GET /api/shareholders/:shareholderId/beneficial-owners`
- `POST /api/shareholders/:shareholderId/beneficial-owners`
- `GET /api/shareholders/:shareholderId/next-of-kin`
- `PUT /api/shareholders/:shareholderId/next-of-kin`
- `GET /api/shareholders/:shareholderId/document-checklist`
- `PUT /api/shareholders/:shareholderId/document-checklist`
- `GET /api/shareholders/:shareholderId/payment-profile`
- `PUT /api/shareholders/:shareholderId/payment-profile`

No complex edit forms were added in this stage.

## Mobile Responsiveness Notes

- New section cards stack on mobile.
- Wide tables use `overflow-x-auto`.
- Long shareholder codes, ID numbers, TINs, document references, and file-like identifiers use `break-words`.
- The shareholder list keeps horizontal table scrolling instead of forcing page-level overflow.
- Buttons and badges are wrapped using existing responsive shell patterns.

## Assumptions and Pending Digaf Validation

- Draft KYC-related sections display the label: `Draft KYC structure pending Digaf validation`.
- Empty sections use pilot-safe placeholders such as "No KYC profile has been captured yet", "No identity documents have been captured yet", "No beneficial owner records have been captured yet", and "To be completed during pilot onboarding."
- Expanded KYC, beneficial ownership, next-of-kin, banking, and document checklist fields remain draft pilot fields until Digaf confirms official requirements.
- Approval / office-use summary is limited to fields currently returned by the Stage 66C backend response.
- Payment profile helper writes default to the interim `checker_2` role mapping established in Stage 66C because the API role model does not yet include dedicated Finance Officer or Finance Manager roles.

## Build Results

- `cd apps/web && npm.cmd run build` - passed.
- `cd apps/api && npm.cmd run build` - passed.

## Recommended Next Stage

Recommended next stage: **Stage 66E - Pilot-safe edit workflows for Digaf profile sections**.

Stage 66E should add carefully scoped forms for the newly displayed profile sections, with role-aware access, validation rules, and field mandatory/optional behavior confirmed by Digaf Compliance, Finance, Governance, and management.
