# MVP Demo Readiness

This note defines what the current Digaf Shareholder Governance Platform MVP is ready to demonstrate and what remains demo-only until Digaf provides official source material.

## What the MVP Demonstrates

- Shareholder registry navigation and shareholder profile review.
- Local role-based workflow simulation for maker, checker, governance admin, compliance, and viewer paths.
- KYC status update flow for demo records.
- Cap table visibility and share ownership review.
- Certificate registry, certificate hash generation, QR token verification, and certificate render data.
- Lightweight certificate print preview for browser Print > Save as PDF.
- Transfer eligibility guard, transfer creation, checker approval queue, rejection, and cancellation.
- Audit log, SLA monitor, legal holds, communications, documents, integrations planning, and reporting preparation views.
- Local development and deployed demo readiness using Vercel and Neon.

## What Is Demo-only

- Demo records are placeholder data and must not be treated as Digaf's official shareholder register.
- Local role simulation is not production authentication or authorization.
- Microsoft Entra ID integration is planned but not implemented.
- SharePoint, Power Automate, and Power BI integrations are represented as readiness and configuration planning.
- Certificate print preview is a demo template, not an official legal certificate.
- Browser Print > Save as PDF is used for demo output. No server-side PDF generation library is included.
- Deployed Neon data may differ from local PostgreSQL data unless a deliberate sync or reseed has been completed.

## Certificate PDF/Print-preview Explanation

The backend exposes a lightweight HTML certificate preview at:

```text
GET /api/certificates/:certificateId/print-preview
```

The page is suitable for browser printing or saving as PDF. It includes certificate-safe fields only: issuing company, serial number, shareholder name, share class, quantity, issue date, status, revocation status, hash algorithm, certificate hash, public verification URL placeholder, and QR or verification token text.

The preview intentionally excludes KYC details, contact details, beneficial ownership details, approval internals, and private workflow metadata.

Disclaimer shown on the preview:

```text
Demo template for MVP review. Official certificate template pending Digaf confirmation.
```

The existing render-data endpoint remains available for future official template work:

```text
GET /api/certificates/:certificateId/render-data
```

## QR Verification Explanation

The public QR verification flow supports certificate verification by serial number and by QR token:

```text
GET /api/certificates/verify/:serialNumber
GET /api/certificates/verify/by-token/:qrToken
```

The frontend QR page supports:

```text
/qr?serialNumber=DIGAF-CERT-2026-000001
```

The QR result is intentionally privacy-limited. It can show certificate status, share class, quantity, issue date, revocation status, hash algorithm, and hash verification result. It must not show shareholder name, contact information, KYC records, beneficial ownership, actor IDs, or approval internals.

Public statuses:

- `valid`: certificate exists and hash evidence matches.
- `revoked`: certificate exists but is revoked.
- `tampered`: certificate exists but hash verification detected a mismatch.
- `not found`: serial number or token was not found.

## What Digaf Should Provide After MVP Review

- Excel shareholder register.
- Official certificate template.
- Approval matrix.
- KYC checklist.
- Transfer forms.
- Reporting requirements.

The official source material should be reviewed before importing real shareholder data, finalizing certificate layout, connecting production identity, or preparing regulated production operations.

## Suggested Demo Flow

1. Open the dashboard and explain the governance modules.
2. Open shareholders and review a demo shareholder profile.
3. Show KYC status and explain the planned Digaf checklist dependency.
4. Open cap table and review demo ownership.
5. Open certificates and show the render-data preview.
6. Click Open Demo Certificate and use browser Print > Save as PDF if a PDF artifact is needed.
7. Open `/qr?serialNumber=DIGAF-CERT-2026-000001` and explain privacy-limited public verification.
8. Create or review a transfer request and demonstrate maker-checker approval flow.
9. Open audit log and SLA monitor to show governance evidence.
10. Open documents, communications, and integrations to show readiness for future Microsoft 365 and reporting work.

## Known Caveats

- The MVP should use demo data only.
- Official Digaf shareholder register import is not included until Digaf supplies the Excel source.
- Official certificate design is pending Digaf confirmation.
- Authentication is still prototype-level and must be replaced with Microsoft Entra ID before production use.
- Public QR verification is demo-ready but final public URL, hosting domain, and certificate wording require Digaf approval.
- Neon demo data must be checked before stakeholder review because it is separate from local PostgreSQL.
- Production-grade backups, monitoring, incident response, and compliance sign-off are not complete.
