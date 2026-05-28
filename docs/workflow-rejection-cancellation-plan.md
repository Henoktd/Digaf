# Workflow Rejection and Cancellation Plan

This plan covers the combined Stage 50-52 workflow cleanup for share transfer rejection, maker cancellation, and consistent terminal workflow states.

## Approval Rejection Flow

Approvals can be rejected through `POST /api/approvals/:approvalId/reject`.

Required request fields:

- `actorId`
- `actorRole`
- `decisionNotes`

The API validates the approval ID, locks the `approval_request` row with `FOR UPDATE`, and only processes pending `share_transfer` approval requests. Checker 1 review can be rejected by `checker_1` or `governance_admin`. Checker 2 review can be rejected by `checker_2` or `governance_admin`.

On rejection, the approval request remains at its current stage for traceability, but its status becomes `rejected`, `current_approver_id` is cleared, and `decision_notes` stores the rejection note. The linked `share_transfer` is also set to `rejected`.

## Transfer Cancellation Flow

Transfers can be cancelled through `POST /api/transfers/:transferId/cancel`.

Required request fields:

- `actorId`
- `actorRole`
- `reason`

The API validates the transfer ID, locks the `share_transfer` row with `FOR UPDATE`, and only allows cancellation while the transfer is in `draft`, `pending_checker_1`, or `pending_checker_2`. Makers can cancel only their own transfers. Governance admins can cancel eligible transfers without maker ownership.

On cancellation, the share transfer status becomes `cancelled`. The linked approval request, when present, is set to `cancelled`, `current_approver_id` is cleared, and `decision_notes` stores the cancellation reason.

## Status Model

Transfer statuses used by the local workflow:

- `draft`
- `pending_checker_1`
- `pending_checker_2`
- `completed`
- `rejected`
- `cancelled`

Approval statuses used by the local workflow:

- `draft`
- `pending`
- `approved`
- `rejected`
- `cancelled`

Rejected and cancelled states are terminal for the current prototype. Existing successful approval flow remains unchanged: Checker 1 approval advances the transfer to `pending_checker_2`, and Checker 2 approval completes the transfer.

## Audit Logging

Approval rejection writes an `audit_log` row with:

- `action = share_transfer_rejected`
- `table_name = approval_request`
- `record_id = approvalId`
- previous approval and transfer status data in `old_value_json`
- rejected status, actor, role, and notes in `new_value_json`

Transfer cancellation writes an `audit_log` row with:

- `action = share_transfer_cancelled`
- `table_name = share_transfer`
- `record_id = transferId`
- previous transfer and approval status data in `old_value_json`
- cancelled status, actor, role, and reason in `new_value_json`

## Role Rules

Rejection:

- `checker_1` can reject only at `checker_1_review`.
- `checker_2` can reject only at `checker_2_review`.
- `governance_admin` can reject at either checker review stage.

Cancellation:

- `maker` can cancel only their own eligible transfer.
- `governance_admin` can cancel any eligible transfer.

## No-Single-User Rules

The no-single-user control applies to rejection as well as approval:

- Checker 1 rejection actor cannot equal `maker_id`.
- Checker 2 rejection actor cannot equal `maker_id`.
- Checker 2 rejection actor cannot equal `checker1_id`.

## Future Rejection Reason Categories

Future releases should replace free-text-only rejection notes with optional structured categories such as:

- `kyc_issue`
- `insufficient_documentation`
- `encumbrance_or_freeze`
- `board_approval_missing`
- `share_balance_issue`
- `policy_exception`
- `other`

Free-text notes should remain available for reviewer context and audit evidence.

## Future Notification Triggers

Future notification work should trigger messages for:

- Checker 1 rejection to maker.
- Checker 2 rejection to maker and Checker 1.
- Maker cancellation to current approver.
- Governance admin cancellation to maker and current approver.
- Terminal workflow status changes for reporting and dashboard refresh.
