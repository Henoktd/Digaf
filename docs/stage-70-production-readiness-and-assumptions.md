# Stage 70: Production-Readiness Checklist and Assumptions Register

## Purpose

Stage 70 consolidates production-readiness items and unresolved assumptions for the Digaf Shareholder Governance Platform production-ready pilot.

This document updates the planning picture after Stages 65-69. It does not change application code, schema, migrations, package files, seed data, or deployment configuration.

## Readiness Classification

| Status | Meaning |
| --- | --- |
| Ready for pilot planning | Documented enough to plan implementation or validation. |
| Partially ready | Some implementation exists, but production controls are incomplete. |
| Pending Digaf validation | Requires Digaf decision before production enforcement. |
| Not started | No implementation or detailed design yet. |

## Current High-Level Readiness

| Area | Current status | Notes |
| --- | --- | --- |
| Shareholder master data | Partially ready | Digaf-aligned fields exist in additive schema/API/frontend sections, but final mandatory rules remain pending. |
| KYC / AML / CFT profile | Partially ready | Structured pilot support exists; official KYC form and policy are not approved. |
| Beneficial ownership | Partially ready | Pilot table/API/UI support exists; requirements need Digaf validation. |
| Next of kin | Partially ready | Pilot support exists; final need and multi-contact behavior are pending. |
| Document checklist | Partially ready | Pilot support exists; final checklist and waiver rules are pending. |
| Payment profile | Partially ready | Pilot support exists; finance verification rules and sensitive-data controls are pending. |
| Excel import | Ready for pilot planning | Stage 67 defines preparation structure; implementation not started. |
| Certificate template | Ready for pilot planning | Stage 68 defines proposed template; final legal/design approval pending. |
| Approval workflow | Partially ready | MVP transfer approvals exist; shareholder onboarding workflow needs implementation and Digaf DOA validation. |
| Public QR verification | Partially ready | Existing QR verification exists; final certificate template integration pending. |
| SharePoint document storage | Pending Digaf validation | Document references exist; real SharePoint library, metadata, and access model not implemented. |
| Power Automate notifications | Pending Digaf validation | Planning exists; real flows not connected. |
| Power BI reporting | Pending Digaf validation | Planning exists; semantic model and reports not implemented. |
| Microsoft Entra authentication | Not started / planned | Required for production authorization. |
| Backend trusted authorization | Not started / planned | Current prototype uses request-provided actor roles. |
| Audit trail | Partially ready | Audit logs exist; immutability and full production coverage need review. |
| Data migration | Not started | Real production data import is prohibited until approved migration exercise. |

## Production-Readiness Checklist

### Governance and Scope

| Item | Status | Owner to validate |
| --- | --- | --- |
| Confirm pilot launch scope and modules | Pending Digaf validation | Management / Governance |
| Confirm official KYC form | Pending Digaf validation | Compliance / Legal |
| Confirm shareholder onboarding process | Pending Digaf validation | Governance / Compliance / Finance |
| Confirm transfer workflow and thresholds | Pending Digaf validation | Governance / CFO / Board Secretariat |
| Confirm Delegation of Authority matrix | Pending Digaf validation | CFO / CEO / Board |
| Confirm production data handling boundary | Pending Digaf validation | Management / Compliance / IT |

### Identity and Authorization

| Item | Status | Owner to validate |
| --- | --- | --- |
| Implement Microsoft Entra ID sign-in | Not started | IT |
| Validate backend JWTs | Not started | IT / Engineering |
| Map Entra groups to app roles | Pending Digaf validation | IT / Management |
| Remove client-controlled production `actorRole` | Not started | Engineering |
| Enforce endpoint authorization by trusted claims | Not started | Engineering / Compliance |
| Define break-glass admin procedure | Pending Digaf validation | IT / Management |

### Shareholder and KYC Data

| Item | Status | Owner to validate |
| --- | --- | --- |
| Confirm mandatory shareholder fields | Pending Digaf validation | Governance / Compliance |
| Confirm corporate shareholder requirements | Pending Digaf validation | Legal / Compliance |
| Confirm KYC risk scoring method | Pending Digaf validation | Compliance |
| Confirm PEP screening process | Pending Digaf validation | Compliance |
| Confirm sanctions/adverse media screening source | Pending Digaf validation | Compliance |
| Confirm beneficial ownership thresholds and evidence | Pending Digaf validation | Compliance / Legal |
| Confirm source-of-funds evidence rules | Pending Digaf validation | Compliance / Finance |

### Finance and Share Issuance

| Item | Status | Owner to validate |
| --- | --- | --- |
| Confirm payment method values | Pending Digaf validation | Finance |
| Confirm payment evidence requirements | Pending Digaf validation | Finance |
| Confirm reconciliation process | Pending Digaf validation | Finance |
| Confirm share classes and par values for pilot | Pending Digaf validation | Finance / Governance |
| Confirm total investment calculation rules | Pending Digaf validation | Finance |
| Confirm finance approval authority | Pending Digaf validation | CFO / Finance |

### Certificate Readiness

| Item | Status | Owner to validate |
| --- | --- | --- |
| Approve certificate visual template | Pending Digaf validation | Management / Legal |
| Approve certificate legal wording | Pending Digaf validation | Legal / Management |
| Confirm signatories | Pending Digaf validation | CEO / Board Secretariat |
| Confirm company seal handling | Pending Digaf validation | Governance / Legal |
| Confirm QR verification wording | Pending Digaf validation | Compliance / IT |
| Confirm certificate PDF storage location | Pending Digaf validation | IT / Governance |
| Confirm revocation/reissue rules | Pending Digaf validation | Governance / Legal |

### Import and Migration Readiness

| Item | Status | Owner to validate |
| --- | --- | --- |
| Confirm Excel import template headers | Pending Digaf validation | Governance / IT |
| Confirm duplicate handling rules | Pending Digaf validation | Compliance / Governance |
| Confirm import approval workflow | Pending Digaf validation | Governance / Compliance / Finance |
| Confirm whether import can update existing records | Pending Digaf validation | Governance / IT |
| Confirm production migration approval process | Pending Digaf validation | Management / Compliance |
| Run dry-run import with demo data only | Not started | Engineering / Governance |

### Documents and SharePoint

| Item | Status | Owner to validate |
| --- | --- | --- |
| Confirm SharePoint site/library | Pending Digaf validation | IT |
| Confirm folder structure | Pending Digaf validation | IT / Governance |
| Confirm document metadata taxonomy | Pending Digaf validation | IT / Compliance |
| Confirm retention labels | Pending Digaf validation | Compliance / Legal / IT |
| Confirm document access groups | Pending Digaf validation | IT / Management |
| Confirm upload, replacement, and waiver rules | Pending Digaf validation | Governance / Compliance |

### Notifications and Reporting

| Item | Status | Owner to validate |
| --- | --- | --- |
| Confirm Power Automate event list | Pending Digaf validation | Operations / IT |
| Confirm notification recipients | Pending Digaf validation | Management / IT |
| Confirm Teams/email channel choice | Pending Digaf validation | Operations / IT |
| Confirm SLA escalation rules | Pending Digaf validation | Management |
| Confirm Power BI report pages | Pending Digaf validation | Management / Compliance |
| Confirm row-level security model | Pending Digaf validation | IT / Compliance |
| Confirm regulatory report layouts | Pending Digaf validation | Compliance / Management |

### Operations, Audit, and Security

| Item | Status | Owner to validate |
| --- | --- | --- |
| Confirm audit log coverage | Partially ready | Compliance / Internal Audit |
| Confirm audit immutability expectations | Pending Digaf validation | Internal Audit / IT |
| Confirm backup and restore objectives | Pending Digaf validation | IT |
| Confirm monitoring and alerting | Not started | IT / Engineering |
| Confirm incident response process | Pending Digaf validation | IT / Management |
| Confirm production support ownership | Pending Digaf validation | Management / IT |
| Confirm rate limiting and abuse controls | Not started | Engineering / IT |

## Consolidated Assumptions Register

| ID | Assumption | Impact if incorrect | Status |
| --- | --- | --- | --- |
| S70-A01 | The Digaf Excel registration template remains the primary confirmed field source. | Field requirements and import mapping may change. | Assumed pending Digaf validation |
| S70-A02 | The proposed KYC form remains a draft for review, not approved policy. | Captured KYC fields may be over-scoped or non-compliant. | Confirmed project constraint |
| S70-A03 | Manual and Excel-imported onboarding should use the same approval controls. | Import could bypass governance controls. | Assumed pending Digaf validation |
| S70-A04 | Maker maps to Customer Service Officer or Governance Officer. | Role permissions may route work to wrong users. | Assumed pending Digaf validation |
| S70-A05 | Compliance Officer owns KYC/AML/CFT review. | Compliance accountability may be incorrect. | Assumed pending Digaf validation |
| S70-A06 | Finance Officer or Finance Manager owns payment verification. | Payment controls may be incorrect. | Assumed pending Digaf validation |
| S70-A07 | CFO or Authorized Executive owns standard final approval. | Final approval workflow may not match DOA. | Assumed pending Digaf validation |
| S70-A08 | CEO or Board approval is exception/threshold based. | High-value routing may be under- or over-controlled. | Assumed pending Digaf validation |
| S70-A09 | Certificates should be generated only after final approval. | Certificates may be issued before authority exists. | Assumed pending Digaf validation |
| S70-A10 | Certificate PDFs should be stored in SharePoint. | Document storage implementation may change. | Assumed pending Digaf validation |
| S70-A11 | Power Automate handles notifications only, not governance decisions. | Workflow truth could be split across systems. | Recommended control assumption |
| S70-A12 | Power BI is reporting layer only, not operational workflow source. | Operational actions may be based on stale reports. | Recommended control assumption |
| S70-A13 | Production roles should be derived from Entra claims/groups. | Client-controlled roles would remain a security gap. | Required for production readiness |
| S70-A14 | No real production shareholder data may be used until a controlled migration is approved. | Data protection and confidentiality risk. | Confirmed project constraint |
| S70-A15 | SharePoint metadata should include shareholder, document type, workflow stage, status, uploader, and retention data. | Search, audit, and retention may be weak. | Assumed pending Digaf validation |

## Critical Gating Decisions Before Production Pilot

The following decisions should be resolved before any real shareholder data is imported or entered:

1. Official KYC form and mandatory fields.
2. Delegation of Authority thresholds.
3. Final role/group mapping.
4. Payment verification rules.
5. Certificate template and signatories.
6. SharePoint document library and access model.
7. Power Automate notification recipients and escalation timing.
8. Power BI report scope and row-level security.
9. Production data migration plan.
10. Authentication and backend authorization approach.

## Recommended Next Step

Stage 71 should translate Stages 67-70 into a sequenced implementation backlog, separating:

- Safe next implementation tasks.
- Tasks blocked by Digaf validation.
- Security prerequisites.
- Pilot demo enhancements.
- Production go-live blockers.
