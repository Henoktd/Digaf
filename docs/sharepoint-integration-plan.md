# SharePoint Integration Plan

## Purpose

SharePoint is planned as the document repository for the Digaf Shareholder Governance Platform. PostgreSQL remains the structured governance ledger, while SharePoint stores files such as certificates, KYC evidence, board resolutions, legal hold notices, transfer documents, and communication attachments.

This plan prepares the integration model only. Real Microsoft Graph calls are not implemented in the current stage.

## Document Repository Model

The application should store structured document metadata in `document_reference` and store file binaries in SharePoint.

PostgreSQL should remain the source for:

- Document record ID
- Entity linkage
- Document type
- Related business record
- Retention category
- Legal hold linkage
- Created timestamp
- Audit trail

SharePoint should store:

- File content
- Version history
- Library-level permissions
- Retention labels where configured
- Document collaboration history

## Proposed SharePoint Site/Library Structure

Recommended site:

```text
Digaf Governance
```

Recommended libraries:

- `Shareholder Documents`
- `KYC Evidence`
- `Share Certificates`
- `Share Transfers`
- `Board Resolutions`
- `Legal Holds`
- `Communications`
- `Regulatory Packs`

Recommended folder pattern:

```text
<Library>/<Entity>/<Record Type>/<Record ID or Shareholder Name>/<YYYY>/
```

Example:

```text
Share Transfers/Digaf/share_transfer/transfer-uuid/2026/
```

## File Naming Conventions

Use predictable names that support audit review:

```text
DIGAF_<document_type>_<related_record_type>_<related_id>_<YYYYMMDD>_<version>.<ext>
```

Examples:

```text
DIGAF_share_certificate_shareholder_000123_20260526_v1.pdf
DIGAF_transfer_support_share_transfer_000456_20260526_v1.pdf
DIGAF_legal_hold_notice_shareholder_000789_20260526_v1.pdf
```

File names should avoid secrets, personal identification numbers, and unnecessary sensitive detail.

## Metadata Mapping From document_reference

Recommended mapping:

| `document_reference` field | SharePoint metadata |
| --- | --- |
| `id` | Governance Document ID |
| `entity_id` | Entity ID |
| `file_url` | SharePoint URL |
| `library` | Library |
| `document_type` | Document Type |
| `metadata_json` | Additional Metadata |
| `retention_category` | Retention Category |
| `legal_hold_id` | Legal Hold ID |
| `related_entity` | Related Entity |
| `related_id` | Related Record ID |
| `created_at` | Registered At |

SharePoint metadata should support filtering by shareholder, transfer, certificate, legal hold, retention category, and reporting period.

## Upload Flow Planned Later

Planned upload flow:

1. User uploads a file through the web app.
2. Backend validates file type, size, role, and related business record.
3. Backend uploads the file to SharePoint through Microsoft Graph.
4. Backend creates or updates `document_reference`.
5. Backend writes an audit log entry.
6. Backend returns the document reference to the frontend.

The backend should own SharePoint writes so frontend users do not need broad direct library permissions.

## Legal Hold Considerations

- Documents linked to active legal holds must not be deleted.
- `document_reference.legal_hold_id` should map to SharePoint metadata.
- SharePoint retention labels should align with legal hold policy.
- Legal hold release should be explicit and audited.
- Export and evidence workflows must preserve file versions and metadata.

## Permissions Considerations

- Use least-privilege Microsoft Graph permissions.
- Prefer app-only permissions with strict site/library scope if approved.
- Separate read and write privileges where possible.
- Restrict legal hold, KYC, and certificate evidence access.
- Avoid storing secrets in SharePoint metadata.
- Review whether external sharing should be disabled for governance libraries.
- Audit access to sensitive files through Microsoft 365 and application logs.
