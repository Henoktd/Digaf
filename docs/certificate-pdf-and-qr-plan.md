# Certificate PDF and QR Plan

## Current Implementation

The current certificate module supports:

- Certificate list retrieval.
- Certificate hash generation.
- HMAC-backed QR/signature token generation.
- Certificate revocation.
- Certificate event history.
- Public verification by serial number.
- Public verification by QR token or signature token.
- Scannable QR image generation for certificate previews.
- PDF-ready render data retrieval for future certificate template work.

The current stage does not implement real PDF generation and does not add a PDF library.

## Future PDF Generation Approach

Future PDF generation should use the backend as the trusted render-data source and a dedicated PDF rendering step.

Recommended approach:

1. Fetch certificate-safe render data from the API.
2. Apply the data to a controlled certificate template.
3. Render a PDF using an approved server-side PDF library or external rendering service.
4. Store the final PDF in SharePoint.
5. Save the SharePoint URL and metadata in `document_reference`.
6. Write certificate and audit events.

PDF generation should not read directly from the frontend or client-controlled data.

## Certificate Render Data Endpoint

Endpoint:

```text
GET /api/certificates/:certificateId/render-data
```

The endpoint returns certificate-safe data needed for future PDF generation:

- Certificate ID
- Serial number
- Issuing company
- Shareholder name
- Share class
- Quantity
- Issue date
- Status
- Revocation status
- Certificate hash
- Hash algorithm
- Hash generated timestamp
- QR token
- Public verification URL
- QR SVG URL
- Render metadata

Requesting render data writes a best-effort certificate event:

```text
render_data_accessed
```

This event is for preview traceability and should not block the response if event insertion fails.

## Scannable QR Image Endpoint

Endpoint:

```text
GET /api/certificates/:certificateId/qr.svg
```

The QR endpoint validates `certificateId` as a UUID, loads only the certificate serial number, and generates an SVG QR code that points to:

```text
${FRONTEND_PUBLIC_BASE_URL}/qr?serialNumber=<serial-number>
```

The QR image does not encode shareholder name, KYC details, contact details, approval internals, certificate hash values, or private workflow data. It only opens the public verification page, which performs the existing public-safe certificate verification flow.

## Certificate Print Preview QR

Endpoint:

```text
GET /api/certificates/:certificateId/print-preview
```

The demo print-preview HTML includes a scannable QR code, the text `Scan to verify certificate`, and the public verification URL. The demo disclaimer remains visible because the official Digaf certificate template is still pending Digaf confirmation.

## QR Token Verification

Endpoint:

```text
GET /api/certificates/verify/by-token/:qrToken
```

The token verification endpoint checks `qr_token` or `signature_token` and returns the same public-safe verification shape as serial number verification.

Serial verification remains available:

```text
GET /api/certificates/verify/:serialNumber
```

## Public-Safe Verification Fields

Public verification responses may include:

- Serial number
- Issuing company
- Share class
- Quantity
- Issue date
- Certificate status
- Revocation status
- Hash algorithm
- Hash generated timestamp
- Hash verification result
- Verification timestamp

Public verification responses must not expose private shareholder or workflow details.

## Privacy Restrictions

Public verification routes must not expose:

- Shareholder name
- Contact details
- KYC records
- Beneficial ownership records
- Actor IDs
- Approval internals
- Internal transfer workflow notes
- Source IP data
- Internal audit payloads

Internal render-data endpoints may include shareholder name because they are intended for authenticated future PDF generation workflows, not public QR verification.

## Revocation Behavior

When a certificate is revoked:

- `status` is set to `revoked`.
- `revocation_status` is set to `revoked`.
- A certificate event is written.
- An audit log entry is written.
- Public verification should clearly show a revoked result.

Revoked certificates should remain verifiable as revoked rather than disappearing from the registry.

## Tamper Detection Behavior

Public verification recomputes the certificate hash and HMAC signature token from canonical certificate data.

Expected results:

- `valid`: stored hash and signature token match recomputed values.
- `tamper_detected`: stored hash or signature token does not match recomputed values.
- `hash_missing`: certificate hash or required hash data is missing.

If tampering is detected, the public verification status should show `tampered` even if the certificate database status is otherwise issued.

## Future Certificate Template Requirements

Future certificate templates should define:

- Issuing company name and branding.
- Certificate title.
- Serial number placement.
- Shareholder name placement.
- Share class and quantity placement.
- Issue date placement.
- QR code placement.
- Public verification URL.
- Authorized signature area.
- Disclaimer text.
- Template version.
- Render timestamp.
- Page size and print margins.

Templates should be versioned so previously issued certificate PDFs remain reproducible.

The official certificate artwork, final QR placement, signature blocks, and production wording remain pending Digaf confirmation.

## Future SharePoint Storage Flow

Planned storage flow:

1. Generate certificate render data.
2. Render PDF from approved template.
3. Upload PDF to the SharePoint certificate library.
4. Create or update a `document_reference` record.
5. Link the document reference to the certificate.
6. Write `certificate_event` and `audit_log` records.
7. Display the SharePoint-backed document reference in the application.

SharePoint should store the PDF and version history. PostgreSQL should remain the structured ledger for certificate metadata, status, and audit evidence.
