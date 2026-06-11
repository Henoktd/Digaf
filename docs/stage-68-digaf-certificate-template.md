# Stage 68: Proposed Digaf Certificate Template

## Purpose

Stage 68 defines a proposed Digaf share certificate template structure for pilot review. This is a design specification only.

No PDF generation library, frontend template, backend route, database schema, package, or certificate issuance logic is changed in this stage.

## Source Basis

- `docs/digaf-field-mapping.md`
- `docs/stage-65-summary.md`
- `docs/certificate-pdf-and-qr-plan.md`
- Existing certificate render and QR verification API capabilities

The Digaf Excel template includes a certificate sample and confirms the core certificate fields. Final artwork, wording, signatories, seal handling, and production approval rules remain pending Digaf validation.

## Template Classification

Template name:

**Proposed Digaf Share Certificate Template — Draft for Digaf Review**

This template must not be treated as an approved legal certificate form until Digaf management, Legal, Compliance, and authorized signatories approve it.

## Confirmed Certificate Fields

| Field | Source | Proposed placement | Status |
| --- | --- | --- | --- |
| Certificate number | Excel template / certificate sample | Top-right certificate metadata block | Confirmed |
| Issuing company name | Existing entity data | Header and body statement | Confirmed |
| Shareholder name | Excel certificate sample | Main certificate body | Confirmed |
| Shareholder ID | Excel certificate sample | Certificate metadata block | Confirmed |
| Share quantity | Excel certificate sample | Main certificate body and share details table | Confirmed |
| Share class | Excel certificate sample | Main certificate body and share details table | Confirmed |
| Par value per share | Excel certificate sample | Share details table | Confirmed |
| Total value | Excel certificate sample | Share details table | Confirmed |
| Date of issue | Excel certificate sample | Main certificate body and metadata block | Confirmed |
| CEO signature block | Excel certificate sample | Lower signature area | Confirmed, pending final signatory validation |
| Board Chairperson signature block | Excel certificate sample | Lower signature area | Confirmed, pending final signatory validation |
| Company seal | Excel certificate sample | Lower center/right seal area | Confirmed, pending final seal handling |
| QR / digital verification | Excel production gap | Lower-right verification panel | Needs Digaf validation |

## Proposed Page Format

| Item | Recommendation |
| --- | --- |
| Page size | A4 portrait for pilot review unless Digaf requires Letter or landscape. |
| Print margins | Minimum 12 mm outer margin, with a visible certificate border inside the margin. |
| Color mode | Print-safe light background with dark text. Avoid low-contrast decorative backgrounds. |
| Logo | Use approved Digaf logo asset when available in the frontend/public assets. |
| Font approach | Use system-safe or approved corporate fonts. Avoid embedding unapproved fonts. |
| Versioning | Include template version metadata outside the visible certificate body or in a small footer. |

## Proposed Layout

### Header

The header should include:

- Digaf logo.
- Issuing company legal name.
- Certificate title: `Share Certificate`.
- Certificate number.
- Optional template version or generated timestamp in small text.

### Certificate Body

Proposed wording for review:

> This certifies that [Shareholder Name], Shareholder ID [Shareholder ID], is the registered holder of [Quantity] [Share Class] shares in [Issuing Company], subject to the company's governing documents and applicable laws.

This wording is proposed only. Digaf Legal and management must approve final legal text.

### Share Details Table

The table should include:

- Share class.
- Quantity.
- Par value per share.
- Total nominal value.
- Date of issue.
- Certificate status.

### Verification Panel

The verification panel should include:

- QR code.
- Public verification URL.
- Text: `Scan to verify certificate`.
- Public-safe verification note.

The QR code should route to the public verification page and must not encode private shareholder, KYC, payment, or approval details.

### Signature and Seal Area

The lower section should include:

- CEO signature block.
- Board Chairperson signature block.
- Company seal area.
- Optional date signed fields if Digaf requires them.

Signatures should be backed by approval records and audit evidence where possible. Uploaded image signatures or scanned signatures should not be used until Digaf confirms the control model.

### Footer

The footer should include:

- Certificate hash or short verification reference if Digaf approves visible hash display.
- Public verification instruction.
- Template version.
- Optional disclaimer that the certificate is valid only when verified through the official platform.

## Data Source Requirements

The template should be populated from trusted backend render data, not from client-controlled fields.

Existing endpoint:

```text
GET /api/certificates/:certificateId/render-data
```

Expected render data:

- Certificate ID.
- Serial number.
- Issuing company.
- Shareholder name.
- Shareholder ID or Digaf shareholder code when available.
- Share class.
- Quantity.
- Par value.
- Total value.
- Issue date.
- Certificate status.
- Hash algorithm.
- Hash generated timestamp.
- QR token.
- Public verification URL.
- QR SVG URL.

If par value or total value are not currently exposed by the render endpoint, a later implementation stage should add them carefully without breaking existing certificate APIs.

## Public Verification Rules

The public QR verification page should expose only public-safe certificate information:

- Certificate serial number.
- Issuing company.
- Share class.
- Quantity.
- Issue date.
- Certificate status.
- Revocation status.
- Verification timestamp.
- Hash verification result.

The public verification page must not expose:

- Shareholder contact details.
- KYC records.
- Beneficial ownership records.
- Payment details.
- Internal approval notes.
- Actor IDs.
- Audit payload internals.

## Certificate Lifecycle Controls

Certificate generation should occur only after:

- Shareholder core profile is complete.
- KYC / AML / CFT review is complete.
- Payment or finance verification is complete, where applicable.
- Final approver authorization is recorded.
- Required document checklist exceptions are resolved or formally waived.

Certificate status transitions should be auditable:

- Draft/prepared.
- Issued.
- Reissued.
- Revoked.
- Cancelled/replaced.

Revoked certificates should remain publicly verifiable as revoked.

## Versioning and Reproducibility

Certificate templates should be versioned so issued certificate PDFs can be reproduced or explained later.

Recommended metadata:

- Template ID.
- Template version.
- Rendered by system version or commit/version reference.
- Render timestamp.
- Certificate render data hash.
- QR verification URL at time of render.

## SharePoint Storage Plan

When PDF generation is implemented, the generated PDF should be uploaded to SharePoint and referenced from `document_reference`.

Recommended storage metadata:

- Shareholder ID.
- Certificate ID.
- Certificate serial number.
- Document type: `share_certificate_pdf`.
- Template version.
- Issue date.
- Status.
- Upload timestamp.
- Retention category.

## Assumptions Pending Digaf Validation

- CEO and Board Chairperson remain the required signatory blocks.
- Company seal is required on the certificate.
- A4 portrait layout is acceptable for pilot review.
- QR code should be visible on the certificate.
- Public verification should show certificate status and tamper/revocation state.
- Certificate PDFs should be stored in SharePoint.
- Visible certificate hash display is optional and pending Digaf preference.
- Final wording requires Digaf Legal and management approval.

## Out of Scope for Stage 68

- Building a PDF renderer.
- Updating certificate APIs.
- Updating frontend print preview.
- Uploading PDF files to SharePoint.
- Changing certificate issue/revoke logic.
- Creating real certificates from production data.

## Recommended Next Step

Stage 71 should schedule a certificate implementation workstream that:

- Adds missing render fields if required.
- Builds a draft frontend/PDF preview.
- Keeps official template wording configurable.
- Adds template version metadata.
- Preserves existing QR verification behavior.
