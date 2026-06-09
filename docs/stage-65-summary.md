# Stage 65 Summary - Digaf Source Input Analysis

## Stage Objective

Stage 65 analyzed Digaf source inputs and created documentation artifacts for field mapping and assumptions management. This stage is documentation and mapping only. No database schema, frontend form, or backend API changes were made.

## Source Inputs Analyzed

| Source input | Classification | How it was used |
|---|---|---|
| `docs/source-inputs/Digaf_Shareholder_Registration_Template 2.xlsx` | Primary Digaf-provided Excel template | Used as the confirmed source for shareholder registration fields, compliance workflow, roles, reports, certificate sample, and production gaps. |
| `docs/source-inputs/Shareholder_KYC_Form.docx` | **Proposed Shareholder KYC Form — Draft for Digaf Review** | Used only as a proposed source for candidate KYC, beneficial ownership, next of kin, banking, and office-use fields. It is not treated as approved Digaf policy or an official regulatory document. |

No real shareholder production data was uploaded, imported, or used.

## Created Documents

- `docs/digaf-field-mapping.md`
- `docs/digaf-assumptions-register.md`
- `docs/stage-65-summary.md`

## Confirmed from Digaf's Excel Template

The Excel template confirms the following field and process areas for pilot planning:

- Shareholder registration fields:
  - Shareholder ID
  - Full name
  - Gender
  - Date of birth
  - Nationality
  - Occupation
  - TIN number
  - National ID / passport number
  - Mobile number
  - Email address
  - Physical address
  - Share certificate number
  - Number of shares purchased
  - Par value per share
  - Total investment amount
  - Date of purchase
  - Payment method
  - Source of funds declaration
  - Status

- Compliance/KYC/AML/CFT fields:
  - Customer due diligence completed
  - PEP status
  - Sanction screening result
  - Adverse media screening result
  - Risk rating
  - AML Officer approval

- Required documents:
  - National ID or passport
  - Passport-size photograph
  - TIN certificate
  - Proof of address
  - Source of funds declaration
  - Board approval, if required

- Workflow and role indicators:
  - Maker
  - Checker
  - Approver
  - Final Authorizer
  - Customer Service Officer
  - Compliance Officer
  - Finance Officer
  - Finance Manager
  - Internal Auditor
  - CEO
  - Board Secretary
  - System Administrator

- Reporting outputs:
  - Shareholder Register
  - Share Capital Summary
  - New Shareholders Report
  - Share Transfer Report
  - PEP Screening Report
  - High-Risk Shareholder Report
  - AML/CFT Exception Report
  - User Activity Log
  - Approval History
  - Certificate Issuance Log
  - Share Capital Position
  - Ownership Structure Report
  - Beneficial Ownership Report

- Certificate sample fields:
  - Certificate number
  - Shareholder name
  - Share quantity and share class
  - Par value
  - Total value
  - Date of issue
  - Shareholder ID
  - CEO signature block
  - Board Chairperson signature block
  - Company seal

- Production gaps explicitly noted in the Excel template:
  - NBE compliance requirements are not fully mapped.
  - PEP and sanctions screening integration is not defined.
  - Share transfer approval workflow requires detailed configuration.
  - Board and management reporting templates need finalization.
  - Delegation of Authority matrix must be uploaded.
  - Digital certificate generation and verification process needs configuration.
  - Audit trail and document retention requirements need confirmation.
  - Beneficial ownership verification should be included.
  - Conflict of interest declaration should be included.
  - Automatic exception reporting to Compliance and Internal Audit should be included.
  - Complete audit logs should not be alterable by system users.

## Assumed from the Draft KYC Form

The draft KYC form proposes additional fields and controls, but these require Digaf review before implementation:

- Shareholder type: individual or corporate.
- Former / other names.
- Place of birth, marital status, and number of dependants.
- Expanded address fields: city, region/state, country, postal code.
- Preferred contact method and alternate contact fields.
- Primary and secondary ID metadata, including issuing authority, issue date, expiry date, and country of issue.
- TIN issuing country and TIN exemption declaration.
- Employment status, employer/business name, business sector, annual income range, and years at current job.
- Expanded source of funds categories.
- Share class, mode of acquisition, previous shareholder, percentage ownership, and date of first acquisition.
- Beneficial ownership details.
- PEP relationship and role details.
- AML/CFT declarations for sanctions, financial crime conviction, investigation status, and holdings in other financial institutions.
- Next of kin / emergency contact fields.
- Banking and dividend payment details.
- Expanded document checklist for corporate shareholders, beneficial owner authorization, name change evidence, PEP/source of wealth statement, and board resolution.
- Office-use fields for KYC officer, review date, approval status, officer ID, verification result, remarks, and authorized signature.

These items are treated as candidate pilot fields only. They should not be implemented as mandatory production fields until Digaf validates business need, regulatory basis, retention expectations, and data protection controls.

## Key Gaps Remaining

- Official Digaf-approved KYC form and final field list.
- Delegation of Authority thresholds for CFO, CEO, Authorized Executive, and Board-level approvals.
- Detailed KYC risk scoring methodology and risk rating criteria.
- PEP, sanctions, and adverse media screening source, vendor, or manual process.
- Payment verification evidence requirements and finance reconciliation rules.
- Legal hold, transfer freeze, and pledge registration/release rules.
- Final share certificate template, signatories, seal handling, QR/hash verification requirements, and certificate cancellation/reissue rules.
- Share transfer threshold rules and board/management approval criteria.
- SharePoint document library design, metadata taxonomy, retention policy, and access groups.
- Power Automate notification events, recipients, escalation timing, and message templates.
- Power BI report layouts, measures, filters, refresh cadence, and role-level security.
- NBE and any other applicable regulatory reporting requirements.
- Data migration and production data handling approach.

## Recommended Next Stage

Recommended next stage: **Stage 66 - Digaf validation workshop and implementation backlog refinement**.

Stage 66 should review the field mapping and assumptions register with Digaf Compliance, Finance, Governance/Customer Service, IT, Internal Audit, and management. The objective should be to confirm:

- Which Excel-confirmed fields are mandatory for pilot launch.
- Which draft KYC fields Digaf accepts, rejects, or modifies.
- Final approval workflow, role mapping, and delegation thresholds.
- Required document checklist and SharePoint storage model.
- Reporting priorities for management, compliance, audit, and regulatory reporting.
- Notifications and escalation requirements.
- Certificate template and authorization rules.

Only after Stage 66 validation should the project proceed to database schema changes, frontend form changes, backend API changes, workflow configuration, or reporting model implementation.

