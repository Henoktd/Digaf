# UI Reviewer Experience Notes

This note covers Stage 53-55 UI polish for the local Digaf Shareholder Governance Platform prototype.

## UI Polish Summary

The frontend now uses a small shared component set for common reviewer surfaces:

- `PageHeader` for page titles, descriptions, badges, and reviewer notices.
- `KpiCard` for compact dashboard and module metrics.
- `StatusBadge` for consistent status colors and labels.
- `EmptyState` for clear zero-record states.

The goal is consistency, not a full redesign. The app keeps the existing Tailwind visual style, white content panels, slate navigation, compact tables, and Digaf governance wording.

## Status Badge Model

Status badges normalize underscore-separated values into readable labels and apply consistent tones:

- Success: `active`, `approved`, `completed`, `verified`, `passed`, `valid`, `on_track`, `issued`, `sent`, `configured`, `present`.
- Warning: `pending`, `warning`, `due_soon`.
- Danger: `rejected`, `revoked`, `expired`, `failed`, `tampered`, `overdue`.
- Neutral: `cancelled`, `draft`, `lifted`, `missing`, `not_configured`, unset values.

Some domain contexts can override the tone. For example, an active legal hold is intentionally displayed as a danger state because it is an active restriction.

## Empty State Model

List and table views use explicit empty states instead of blank panels. Current empty-state messages include:

- No shareholders found
- No transfers found
- No approvals found
- No audit records found
- No documents found
- No communications found
- No legal holds found
- No certificates found

Nested profile sections also use focused empty states for ownership, transfers, contact details, certificates, documents, communications, and legal holds.

## Reviewer-Facing Prototype Notices

The dashboard includes the prototype notice:

`Prototype demo environment — local RBAC and demo data are used.`

The QR verification page includes a privacy notice explaining that public verification does not expose shareholder names, contact details, KYC records, beneficial ownership, actor IDs, or internal approval details.

Workflow action cells consistently show `No action available` when an approval or transfer is not actionable, including completed, rejected, and cancelled workflows.

## Known UI Limitations

- Tables remain dense because reviewer workflows require comparison across many governance fields.
- The sidebar is desktop-first, with a horizontal mobile navigation fallback in the header.
- There is no persistent user/session selector yet; local prototype actions still use hardcoded local actor IDs.
- Statuses are display-normalized in the frontend, but future production releases should share status enums from a central contract.
- Empty states are informational only; they do not yet include contextual create links or remediation actions.

## Future UX Improvements

- Add role-aware action visibility once Entra authentication is connected.
- Add filters for high-volume tables such as approvals, audit logs, transfers, documents, and communications.
- Add reviewer drill-down links from dashboard KPI cards to filtered module views.
- Add structured rejection and cancellation reason display.
- Add toast notifications for workflow actions instead of relying only on page refresh.
- Add compact mobile table alternatives for core workflows after the data model stabilizes.
