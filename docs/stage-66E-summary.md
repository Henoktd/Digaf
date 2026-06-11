# Stage 66E Summary - Pilot-Safe Edit Workflows for Digaf Profile Sections

## Stage Objective

Stage 66E adds controlled frontend edit workflows for the Digaf-aligned shareholder profile sections introduced in Stages 66B-66D.

This stage preserves the existing MVP user experience and keeps the Stage 66D read-only profile sections in place. No database schema, migrations, backend route logic, package files, or real shareholder data were changed.

## Frontend Pages Changed

- `apps/web/app/shareholders/[shareholderId]/page.tsx`

The page continues to render the existing MVP sections:

- Profile & KYC
- Ownership
- Certificates
- Transfer history
- Legal holds
- Documents
- Communications

The Stage 66D Digaf-aligned display sections remain unchanged in purpose, with the Stage 66E edit workflows added inside the Digaf profile area.

## Components and Helpers Changed

- `apps/web/src/components/DigafProfileSections.tsx`
  - Wires the Stage 66E pilot edit workflows into the Digaf profile display.

- `apps/web/src/components/DigafProfileEditWorkflows.tsx`
  - New client component containing controlled, collapsible edit forms.
  - Uses the existing frontend API helpers and `router.refresh()` after successful writes.
  - Marks pilot/draft areas as pending Digaf validation.

- `apps/web/src/lib/api.ts`
  - Stage 66D helper types were tightened to support explicit `undefined` values from form helpers under `exactOptionalPropertyTypes`.

## Edit Workflows Added

The shareholder profile now includes a **Pilot Edit Workflows** section with forms for:

- Core shareholder details
- Identification document capture
- Draft KYC / AML / CFT profile update
- Beneficial owner capture
- Next of kin update
- Document checklist update
- Payment profile update

All forms use the existing Stage 66C backend routes. The forms are intentionally scoped for pilot preparation rather than final production policy enforcement.

## Backend Routes Used

- `PUT /api/shareholders/:shareholderId/core-details`
- `POST /api/shareholders/:shareholderId/identity-documents`
- `PUT /api/shareholders/:shareholderId/kyc-profile`
- `POST /api/shareholders/:shareholderId/beneficial-owners`
- `PUT /api/shareholders/:shareholderId/next-of-kin`
- `PUT /api/shareholders/:shareholderId/document-checklist`
- `PUT /api/shareholders/:shareholderId/payment-profile`

The existing MVP KYC status form still uses:

- `PATCH /api/shareholders/:shareholderId/kyc`

## Pilot Safety Notes

- Forms are hidden behind collapsible panels to preserve the read-first profile experience.
- Each form displays the pilot actor and pending-validation context.
- Draft KYC-related workflows remain labeled as pending Digaf validation.
- Identity documents and beneficial owners are append-style workflows.
- Core details and payment profile are update/upsert workflows.
- Next of kin and document checklist currently use backend replacement routes. The UI explicitly warns that these are pilot single-record replacement workflows until final multi-row editing is designed.
- File upload, SharePoint document linking, production approval policies, and final role enforcement remain out of scope for this stage.

## Mobile Responsiveness Notes

- Edit panels stack naturally on mobile.
- Form controls use responsive grids that collapse to one column on small screens.
- Buttons and status messages wrap on small screens.
- Long actor IDs and notes use break-word behavior where needed.
- Existing wide read-only tables remain horizontally scrollable.

## Assumptions and Pending Digaf Validation

- The AI-generated KYC form remains the **Proposed Shareholder KYC Form - Draft for Digaf Review**.
- Expanded KYC, beneficial ownership, next-of-kin, document checklist, and banking/payment fields are still draft pilot fields.
- The local pilot actor remains `henok.local_dev`, following existing frontend form patterns.
- Payment profile updates continue to use the interim `checker_2` role mapping from Stage 66C.
- Next-of-kin and checklist replacement behavior should be revisited after Digaf validates final workflow expectations.

## Build Results

- `cd apps/web && npm.cmd run build` - passed.
- `cd apps/api && npm.cmd run build` - passed.

## Recommended Next Stage

Recommended next stage: **Stage 66F - Frontend validation, role gating, and UX hardening**.

Stage 66F should add stronger client-side validation, role-aware edit availability, safer multi-row editing for next-of-kin and document checklist records, and clearer reviewer workflows after Digaf confirms mandatory fields and approval responsibilities.
