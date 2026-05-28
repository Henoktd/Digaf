# Mobile Responsive Review Notes

## Mobile Review Scope

Stage 64 focuses on making the existing MVP usable on phone-sized screens without changing backend behavior, database schema, or product workflow logic.

The review scope covers:

- Responsive application shell and navigation.
- Mobile-safe page padding and content width.
- KPI/card stacking on small screens.
- Horizontal table scrolling where dense ledger tables are required.
- Long value wrapping for hashes, IDs, URLs, and tokens.
- QR verification readability for phone-based certificate review.

## Pages Checked

Primary phone review pages:

- `/`
- `/certificates`
- `/qr?serialNumber=DIGAF-CERT-2026-000002`
- `/shareholders`
- `/transfers`
- `/approvals`

Additional responsive coverage:

- `/shareholders/[shareholderId]`
- `/cap-table`
- `/audit-log`
- `/sla-monitor`
- `/legal-holds`
- `/documents`
- `/communications`
- `/integrations`

## Known Limitations

- Ledger-style tables remain horizontally scrollable on mobile because they contain governance evidence fields that should not be hidden in this MVP stage.
- The mobile navigation is a horizontal scroll navigation, not a hamburger menu or persistent bottom tab bar.
- Forms are mobile-safe but still optimized for reviewer/demo workflows rather than high-volume mobile data entry.
- Certificate print preview is still a demo HTML preview. The official Digaf certificate template remains pending Digaf confirmation.
- Physical QR scanning depends on the running environment URL being reachable by the scanning phone. For local testing, the phone must be able to reach the host machine or use the deployed Vercel URL.

## Future Mobile UX Improvements

- Add route-aware active navigation state and a compact mobile menu button.
- Add mobile card summaries above dense tables for approvals, transfers, certificates, and audit records.
- Add table column prioritization or detail drawers for phone users.
- Add touch-optimized filter/search controls for large registries.
- Add a certificate-first mobile detail page with QR, verification URL, and print-preview actions.
- Add automated visual regression checks for 390px, 430px, tablet, and desktop viewports.

## QR Scan Testing Checklist

1. Start the local API and web apps, or use the Vercel deployment.
2. Open `/certificates` on desktop or mobile.
3. Confirm the certificate QR code is visible and not clipped.
4. Scan the QR with a phone camera.
5. Confirm the phone opens `/qr?serialNumber=<certificate-serial-number>`.
6. Confirm the verification result fits the phone screen without horizontal page scrolling.
7. Confirm the privacy notice remains visible.
8. Confirm the result does not expose shareholder contact, KYC, approval, or private workflow details.
9. Test a known valid serial, for example `DIGAF-CERT-2026-000002`.
10. Test a revoked serial where available and confirm the revoked state remains visible.
