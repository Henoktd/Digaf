# Role Permission Matrix

## Scope

This is the local prototype role model for the Digaf Shareholder Governance Platform. It documents the Stage 32 Role-Based Access Control foundation for local reviewers and developers.

The current prototype sends `actorRole` from the frontend/request body. In production, `actorRole` must come from authenticated identity claims, not from client-controlled input. Future mapping should use Microsoft Entra ID groups.

The no-single-user approval rule remains separate from role permission checks:

- A maker cannot approve their own transfer as Checker 1.
- Checker 2 cannot be the maker.
- Checker 2 cannot be the same user as Checker 1.

## Local Prototype Roles

| Role | Purpose |
| --- | --- |
| `maker` | Creates shareholder records and initiates share transfer requests. |
| `checker_1` | Performs the first approval step for pending transfer requests. |
| `checker_2` | Performs the second approval step and completes eligible transfers. |
| `governance_admin` | Administrative governance role with full local prototype permissions. |
| `compliance_officer` | Performs KYC review and compliance-oriented read workflows. |
| `viewer` | Read-only reviewer role for local prototype visibility. |

## Permission Matrix

| Permission | `maker` | `checker_1` | `checker_2` | `governance_admin` | `compliance_officer` | `viewer` |
| --- | --- | --- | --- | --- | --- | --- |
| View dashboard | Yes | Yes | Yes | Yes | Yes | Yes |
| View shareholder registry | Yes | Yes | Yes | Yes | Yes | Yes |
| Create shareholder | Yes | No | No | Yes | No | No |
| Update shareholder KYC | No | No | No | Yes | Yes | No |
| Check transfer eligibility | Yes | Yes | Yes | Yes | Yes | Yes |
| Create transfer request | Yes | No | No | Yes | No | No |
| Approve Checker 1 | No | Yes | No | Yes | No | No |
| Approve Checker 2 | No | No | Yes | Yes | No | No |
| View certificates | Yes | Yes | Yes | Yes | Yes | Yes |
| Revoke certificate | No | No | No | Yes | No | No |
| View audit logs | Yes | Yes | Yes | Yes | Yes | Yes |
| View SLA monitor | Yes | Yes | Yes | Yes | Yes | Yes |
| View legal holds | Yes | Yes | Yes | Yes | Yes | Yes |
| View documents | Yes | Yes | Yes | Yes | Yes | Yes |
| View communications | Yes | Yes | Yes | Yes | Yes | Yes |

## Implementation Notes

- Stage 32 introduced the local `actorRole` foundation and hardened selected mutation endpoints.
- Stage 33 documents the role model and exposes a small local RBAC indicator in the UI.
- This is not a login system and does not implement role switching.
- Production authorization must derive roles from trusted identity claims, then map those claims to the application roles above.
