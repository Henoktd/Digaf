# End-to-End Test Plan

This plan defines manual end-to-end test cases for the Digaf Shareholder Governance Platform MVP. Run these tests locally first, then repeat the smoke-critical cases against the deployed demo when preparing a release.

Status values should be recorded as `Not run`, `Pass`, `Fail`, or `Blocked`.

## E2E-001 - Dashboard Loads

- Test ID: `E2E-001`
- Objective: Confirm the dashboard loads and exposes the main governance modules.
- Preconditions: Frontend, backend, and database are running with seeded data.
- Steps:
  1. Open the local frontend.
  2. Wait for the dashboard to load.
  3. Confirm navigation or summary links for major modules are visible.
- Expected result: Dashboard loads without visible errors and shows the expected governance modules.
- Evidence to capture: Screenshot of dashboard and browser console status if relevant.
- Status placeholder: `Not run`

## E2E-002 - Shareholder List Loads

- Test ID: `E2E-002`
- Objective: Confirm the shareholder registry can be viewed.
- Preconditions: Seeded shareholder records exist.
- Steps:
  1. Open the shareholder registry page.
  2. Wait for the list to load.
  3. Confirm multiple shareholder rows or the expected empty state appears.
- Expected result: Shareholder list loads from the API and displays expected registry data.
- Evidence to capture: Screenshot of shareholder list and API response if troubleshooting.
- Status placeholder: `Not run`

## E2E-003 - Create Shareholder

- Test ID: `E2E-003`
- Objective: Confirm a maker can create a shareholder record.
- Preconditions: User is operating as the local prototype `maker` role; required reference data exists.
- Steps:
  1. Open the create shareholder page.
  2. Enter valid shareholder details.
  3. Submit the form.
  4. Return to the shareholder list.
- Expected result: New shareholder is created, appears in the list, and can be opened.
- Evidence to capture: Screenshot of completed form or success state and resulting shareholder row.
- Status placeholder: `Not run`

## E2E-004 - Open Shareholder Profile

- Test ID: `E2E-004`
- Objective: Confirm a shareholder profile displays detailed information.
- Preconditions: At least one shareholder exists.
- Steps:
  1. Open the shareholder list.
  2. Select a shareholder.
  3. Review profile details, ownership information, KYC status, certificates, and related workflow sections where available.
- Expected result: Shareholder profile loads with expected details and no data fetch errors.
- Evidence to capture: Screenshot of the shareholder profile.
- Status placeholder: `Not run`

## E2E-005 - Update KYC as Compliance Officer

- Test ID: `E2E-005`
- Objective: Confirm the `compliance_officer` role can update shareholder KYC.
- Preconditions: User is operating as local prototype `compliance_officer`; a shareholder profile is available.
- Steps:
  1. Open a shareholder profile.
  2. Open the KYC update action.
  3. Enter a valid KYC status or expiry update.
  4. Submit the update.
  5. Refresh or reopen the profile.
- Expected result: KYC update succeeds and the new KYC state is visible.
- Evidence to capture: Screenshot of updated KYC state and related audit log entry.
- Status placeholder: `Not run`

## E2E-006 - Reject KYC Update as Maker

- Test ID: `E2E-006`
- Objective: Confirm the `maker` role cannot perform compliance-only KYC updates.
- Preconditions: User is operating as local prototype `maker`; a shareholder profile is available.
- Steps:
  1. Open a shareholder profile.
  2. Attempt to perform the same KYC update action used by a compliance officer.
  3. Submit the update if the UI allows the attempt.
- Expected result: KYC update is blocked by role validation or the action is unavailable to the maker role.
- Evidence to capture: Screenshot of blocked UI state, disabled action, or error response.
- Status placeholder: `Not run`

## E2E-007 - View Cap Table

- Test ID: `E2E-007`
- Objective: Confirm cap table data loads.
- Preconditions: Seeded ownership data exists.
- Steps:
  1. Open the cap table page.
  2. Review share class and ownership rows.
  3. Confirm totals or percentages are visible where implemented.
- Expected result: Cap table loads and reflects seeded ownership data.
- Evidence to capture: Screenshot of cap table.
- Status placeholder: `Not run`

## E2E-008 - Transfer Eligibility Blocked by Legal Hold/Freeze

- Test ID: `E2E-008`
- Objective: Confirm transfer eligibility is blocked for a shareholder with a legal hold or freeze.
- Preconditions: A shareholder exists with legal hold or freeze status.
- Steps:
  1. Open the transfer eligibility workflow.
  2. Select the blocked shareholder.
  3. Enter valid transfer details.
  4. Run the eligibility check.
- Expected result: Eligibility check fails and clearly identifies the legal hold or freeze blocker.
- Evidence to capture: Screenshot of blocked eligibility result.
- Status placeholder: `Not run`

## E2E-009 - Transfer Eligibility Passes for Eligible Shareholder

- Test ID: `E2E-009`
- Objective: Confirm an eligible shareholder passes transfer eligibility checks.
- Preconditions: A shareholder exists with transferable shares, current KYC, and no legal hold or freeze.
- Steps:
  1. Open the transfer eligibility workflow.
  2. Select the eligible shareholder.
  3. Enter valid transfer details within available holdings.
  4. Run the eligibility check.
- Expected result: Eligibility check passes and the workflow allows transfer request creation.
- Evidence to capture: Screenshot of successful eligibility result.
- Status placeholder: `Not run`

## E2E-010 - Create Transfer Request

- Test ID: `E2E-010`
- Objective: Confirm a maker can create a transfer request after passing eligibility.
- Preconditions: User is operating as local prototype `maker`; eligible shareholder and recipient details are available.
- Steps:
  1. Complete a passing eligibility check.
  2. Enter required transfer request details.
  3. Submit the transfer request.
  4. Open the transfers or approvals page.
- Expected result: Transfer request is created with a pending approval state.
- Evidence to capture: Screenshot of created transfer request and pending approval status.
- Status placeholder: `Not run`

## E2E-011 - Approve Checker 1 With Valid Role

- Test ID: `E2E-011`
- Objective: Confirm `checker_1` can approve the first checker step.
- Preconditions: A transfer request is pending Checker 1 approval; user is operating as `checker_1`.
- Steps:
  1. Open the approval queue.
  2. Select the pending transfer request.
  3. Approve as Checker 1.
  4. Refresh the approval queue.
- Expected result: Checker 1 approval succeeds and the request advances to Checker 2.
- Evidence to capture: Screenshot of updated approval status and audit log entry.
- Status placeholder: `Not run`

## E2E-012 - Reject Checker 1 With Invalid Role

- Test ID: `E2E-012`
- Objective: Confirm an invalid role cannot perform Checker 1 approval.
- Preconditions: A transfer request is pending Checker 1 approval; user is operating as a role other than `checker_1` or `governance_admin` if admin override is allowed.
- Steps:
  1. Open the approval queue.
  2. Select the pending transfer request.
  3. Attempt Checker 1 approval with the invalid role.
- Expected result: Approval is blocked or unavailable for the invalid role.
- Evidence to capture: Screenshot of blocked action, disabled control, or error response.
- Status placeholder: `Not run`

## E2E-013 - Approve Checker 2 With Valid Role

- Test ID: `E2E-013`
- Objective: Confirm `checker_2` can complete the second checker step.
- Preconditions: A transfer request has completed Checker 1 approval; user is operating as `checker_2`.
- Steps:
  1. Open the approval queue.
  2. Select the transfer request pending Checker 2 approval.
  3. Approve as Checker 2.
  4. Refresh the transfer or approval view.
- Expected result: Checker 2 approval succeeds and the transfer is completed.
- Evidence to capture: Screenshot of completed transfer status and audit log entry.
- Status placeholder: `Not run`

## E2E-014 - Cap Table Updates After Checker 2

- Test ID: `E2E-014`
- Objective: Confirm the cap table reflects ownership changes after final transfer approval.
- Preconditions: A transfer request has been completed by Checker 2.
- Steps:
  1. Record cap table values before the transfer where possible.
  2. Complete Checker 2 approval.
  3. Open the cap table.
  4. Compare updated ownership values.
- Expected result: Cap table reflects the completed transfer and ownership totals remain consistent.
- Evidence to capture: Before and after screenshots or exported values.
- Status placeholder: `Not run`

## E2E-015 - Audit Log Records Workflow Actions

- Test ID: `E2E-015`
- Objective: Confirm workflow actions are recorded in the audit log.
- Preconditions: Recent shareholder, KYC, transfer, and approval actions have been performed.
- Steps:
  1. Open the audit log page.
  2. Search or scan for recent workflow actions.
  3. Confirm actor, action, entity, timestamp, and relevant metadata are present where implemented.
- Expected result: Audit log includes records for tested workflow actions.
- Evidence to capture: Screenshot of matching audit log rows.
- Status placeholder: `Not run`

## E2E-016 - SLA Monitor Shows Completed/Pending Items

- Test ID: `E2E-016`
- Objective: Confirm the SLA monitor shows workflow items and status.
- Preconditions: Seeded or recently created workflow items exist.
- Steps:
  1. Open the SLA monitor page.
  2. Review pending, completed, or overdue items.
  3. Confirm recent transfer or KYC workflow items appear where applicable.
- Expected result: SLA monitor loads and displays completed and pending workflow evidence.
- Evidence to capture: Screenshot of SLA monitor.
- Status placeholder: `Not run`

## E2E-017 - Certificate List Loads

- Test ID: `E2E-017`
- Objective: Confirm certificate records can be viewed.
- Preconditions: Seeded certificate records exist.
- Steps:
  1. Open the certificates page.
  2. Wait for certificate rows to load.
  3. Confirm certificate IDs, shareholder references, and status values are visible.
- Expected result: Certificate list loads with expected certificate data.
- Evidence to capture: Screenshot of certificate list.
- Status placeholder: `Not run`

## E2E-018 - QR Verification Valid/Revoked States

- Test ID: `E2E-018`
- Objective: Confirm QR verification supports valid and revoked certificate states.
- Preconditions: At least one valid certificate and one revoked certificate exist.
- Steps:
  1. Open the QR verification page or direct verification URL for a valid certificate.
  2. Confirm the valid result.
  3. Open the verification URL for a revoked certificate.
  4. Confirm the revoked result.
- Expected result: Valid certificates verify successfully and revoked certificates are identified as revoked.
- Evidence to capture: Screenshots of valid and revoked verification results.
- Status placeholder: `Not run`

## E2E-019 - Legal Hold Page Loads

- Test ID: `E2E-019`
- Objective: Confirm legal hold records can be viewed.
- Preconditions: Seeded legal hold records exist.
- Steps:
  1. Open the legal holds page.
  2. Wait for records to load.
  3. Confirm shareholder references, hold type, and status values are visible where implemented.
- Expected result: Legal hold page loads and displays expected records.
- Evidence to capture: Screenshot of legal hold page.
- Status placeholder: `Not run`

## E2E-020 - Document References Load

- Test ID: `E2E-020`
- Objective: Confirm document reference records can be viewed.
- Preconditions: Seeded document references exist.
- Steps:
  1. Open the documents page.
  2. Wait for document records to load.
  3. Confirm document names, categories, and reference links or metadata are visible where implemented.
- Expected result: Document references load without errors.
- Evidence to capture: Screenshot of documents page.
- Status placeholder: `Not run`

## E2E-021 - Communications Load

- Test ID: `E2E-021`
- Objective: Confirm communication records can be viewed.
- Preconditions: Seeded communication records exist.
- Steps:
  1. Open the communications page.
  2. Wait for communication records to load.
  3. Confirm subject, recipient or shareholder reference, channel, and status values are visible where implemented.
- Expected result: Communications load without errors.
- Evidence to capture: Screenshot of communications page.
- Status placeholder: `Not run`

## E2E-022 - Local vs Deployed Environment Comparison

- Test ID: `E2E-022`
- Objective: Confirm local and deployed demo environments behave consistently for core read and workflow paths.
- Preconditions: Local and deployed demo environments are available; data sets are known and comparable.
- Steps:
  1. Run API smoke tests locally.
  2. Run API smoke tests against the deployed demo.
  3. Load dashboard, shareholder list, cap table, certificates, approvals, audit log, SLA monitor, legal holds, documents, and communications locally.
  4. Load the same pages in the deployed demo.
  5. Compare visible data, status values, and error behavior.
- Expected result: Core pages and API endpoints behave consistently, with differences explained by known data set differences.
- Evidence to capture: Smoke test output and side-by-side screenshots for any differences.
- Status placeholder: `Not run`
