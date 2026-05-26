# Backend API Plan 
# Backend API Plan

## Architecture Rule

The backend API is the control layer of the SVH Governance Platform.

It will handle:
- Authentication and authorization
- Workflow engine
- Approval routing
- SLA enforcement
- Certificate hashing
- QR verification
- Audit logging
- PostgreSQL access
- SharePoint document references
- Power Automate notification triggers

## No Dataverse

Dataverse is not used.

All workflow state and approval records will be stored in PostgreSQL through the backend API.

## Stage 24 Validation and Governance Hardening

Stage 24 adds a shared API error format for newly hardened validation paths:

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "approvalId must be a valid UUID"
  }
}
```

The backend now uses reusable validation helpers for UUID checks, required string
checks, non-empty string checks, and actor ID normalization. Actor IDs are
trimmed before governance decisions are evaluated so maker/checker comparisons
are deterministic.

Approval action routes validate approval request IDs before database access and
continue to enforce the regulated maker-checker posture:
- The maker cannot approve as Checker 1.
- Checker 2 cannot be the maker.
- Checker 2 cannot be Checker 1.
- Approval stage and status gates remain mandatory.
- Transfer completion still requires passed KYC, passed encumbrance checks, no
  freeze reference, and a board approval reference when board approval is
  required.

Certificate hash, revoke, event, and public verification routes now use the
consistent error helper where straightforward, including UUID validation for
certificate-scoped actions and non-empty actor/reason validation for revocation.
Successful certificate verification output remains public-safe.

This keeps the Final v3 No-Dataverse API aligned with a regulated microfinance
governance posture: explicit input validation, consistent failure semantics,
clear accountability for actors, and conservative workflow enforcement through
the backend control layer.
