# Stage 72 Summary: Excel Import Dry-Run Validation Foundation

## Stage Objective

Stage 72 implements a dry-run validation foundation for Digaf shareholder Excel import preparation.

This stage does not upload Excel files, does not parse workbook binaries, does not insert or update shareholder records, and does not use real shareholder production data.

## Source References

- `docs/stage-67-excel-import-preparation.md`
- `docs/stage-71-implementation-backlog-and-sequencing.md`
- `docs/digaf-field-mapping.md`
- `docs/digaf-assumptions-register.md`

The Digaf Excel registration template remains the primary source for confirmed import fields. Draft KYC-only fields remain pending Digaf validation.

## Backend Changes

### Files Added

- `apps/api/src/services/shareholderImportDryRun.ts`
- `apps/api/src/routes/importRoutes.ts`

### Files Updated

- `apps/api/src/server.ts`

### API Route Added

```text
POST /api/imports/shareholders/dry-run
```

The route accepts a JSON array of shareholder import row objects and returns structured validation results. It is intentionally dry-run only.

Allowed pilot roles:

- `maker`
- `compliance_officer`
- `governance_admin`

### Backend Behavior

The route:

- Requires `actorId` and `actorRole`.
- Accepts up to 100 rows per request.
- Validates row objects without database writes.
- Reads existing shareholder and certificate identifiers for duplicate-candidate checks.
- Returns row-level errors and warnings with responsible-role guidance.
- Returns the Digaf import field mapping version used by the validator.

No audit log is written because no regulated record is changed.

## Validation Coverage

The dry-run validator checks:

- Required Digaf-confirmed fields.
- Individual-specific fields such as gender, date of birth, and occupation.
- Date format and future-date issues.
- Email format.
- Mobile number minimum length.
- Positive share quantity and par value.
- Non-negative investment amount.
- Investment amount reconciliation against shares times par value.
- Risk rating values.
- Screening result vocabulary warnings.
- AML approval status values.
- Duplicate shareholder code, certificate number, TIN, ID number, email, and mobile candidates.
- Batch-level duplicate candidates across submitted rows.

## Frontend Changes

### Files Added

- `apps/web/src/components/ShareholderImportDryRunPanel.tsx`
- `apps/web/app/imports/page.tsx`

### Files Updated

- `apps/web/src/lib/api.ts`
- `apps/web/src/components/AppShell.tsx`

### UI Added

A new **Import Prep** navigation item opens:

```text
/imports
```

The page provides a Stage 72 dry-run interface using fake demo rows only. It displays:

- Dry-run status and safety labels.
- Summary counts for ready, warning, blocked, error, and duplicate-candidate rows.
- Row-level validation messages.
- Responsible role for each validation message.
- Field mapping returned by the API.

The page does not allow real Excel upload.

## Demo Data Boundary

The frontend uses fake demo rows only:

- No real shareholder production data.
- No file upload.
- No database commit.
- No certificate generation.
- No SharePoint upload.

## Compatibility Notes

- Existing shareholder creation and profile workflows are unchanged.
- Existing MVP routes are unchanged.
- Existing Stage 66D-66F Digaf profile UI remains unchanged.
- The new route is additive under `/api/imports`.
- The new page is additive under `/imports`.
- No package files were changed.
- No schema or migration files were changed.

## Build Results

- `cd apps/web && npm.cmd run build`: Passed.
- `cd apps/api && npm.cmd run build`: Passed.

## Assumptions Pending Digaf Validation

- The Stage 67 mapping version is acceptable for pilot dry-run review.
- Shareholder import should use maker/compliance/governance review before any commit workflow.
- Duplicate shareholder code and certificate number should block import commit.
- TIN, primary ID, email, and mobile matches should be treated as duplicate candidates requiring review.
- Payment method, screening result, and AML approval vocabularies remain provisional.
- Total investment amount reconciliation may become more nuanced if Digaf supports share premiums, discounts, or other pricing logic.

## Out of Scope

- Excel workbook parsing.
- File upload.
- Database import batch tables.
- Import commit workflow.
- Approval workflow integration.
- Real production shareholder data.
- SharePoint document storage.
- Power Automate notifications.
- Power BI reporting.

## Recommended Next Stage

Recommended next stage: **Stage 73 - Excel Import Batch Persistence and Review Plan**.

Stage 73 should decide whether to implement database-backed import batches and row exception tracking, still without committing real shareholder records.
