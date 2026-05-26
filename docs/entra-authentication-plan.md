# Microsoft Entra ID Authentication Plan

## Purpose

Stage 34 prepares the Digaf Shareholder Governance Platform for Microsoft Entra ID authentication and future group-to-role mapping. This stage is planning and implementation prep only. It does not implement full login, does not add authentication packages, and does not replace the local prototype `actorRole` behavior introduced in Stage 32.

## Current Local Prototype Model

The local prototype sends `actorId` and `actorRole` in request bodies for protected workflow actions. Backend endpoints validate `actorRole` against the local role set documented in [role-permission-matrix.md](role-permission-matrix.md).

This model is useful for local workflow testing, but it is not a production authentication model because request-body roles are client-controlled input.

## Target Production Authentication Model

In production, users should authenticate with Microsoft Entra ID through the frontend. The frontend should obtain an access token for the backend API, then call protected API endpoints with that token.

The backend should validate the token before executing protected actions. The backend should derive the application role from trusted token claims, especially group claims, and should not accept `actorRole` from client-controlled request bodies for protected endpoints.

## Microsoft Entra ID App Registrations Needed

Two app registrations are expected:

- Frontend application registration for the Next.js web app.
- Backend/API application registration for the Express API.

Using separate registrations keeps browser sign-in concerns separate from API authorization and allows the API to expose explicit scopes.

## Frontend App Registration

The frontend app registration should represent `digaf-web`.

Planned settings:

- Platform type: Single-page application or web, depending on the final auth library and hosting pattern.
- Redirect URIs: local and deployed frontend callback URLs.
- API permissions: delegated permission to call the backend API scope.
- Supported account type: single tenant unless Digaf explicitly needs external tenant access.

The frontend should show sign-in state, request an access token for the API, and pass the token as an `Authorization: Bearer <token>` header.

## Backend/API App Registration

The backend/API app registration should represent `digaf-api`.

Planned settings:

- Expose an API scope for frontend calls.
- Validate token audience against the API app registration.
- Validate issuer against the Digaf tenant.
- Read group claims or app roles from validated tokens.

The backend should become the source of authorization decisions. It should map trusted Entra group claims to local application roles before running protected workflow actions.

## Redirect URI Planning

Local development redirect URI candidates:

- `http://localhost:3000`
- `http://localhost:3000/auth/callback`

Production redirect URI candidates:

- `https://digaf-web.vercel.app`
- `https://digaf-web.vercel.app/auth/callback`

The final URI should match the auth library and route design selected during implementation. Do not add callback routes until the sign-in implementation phase.

## API Scope Planning

Initial backend API scope proposal:

- Scope name: `access_as_user`
- Display name: Access Digaf Governance API
- Purpose: Allow signed-in Digaf users to call the governance API as themselves.

The frontend app registration should request this delegated scope when acquiring access tokens for API calls.

## Group-to-Role Mapping

Proposed Microsoft Entra ID groups:

| Entra group | Local role |
| --- | --- |
| `Digaf-Governance-Makers` | `maker` |
| `Digaf-Governance-Checker1` | `checker_1` |
| `Digaf-Governance-Checker2` | `checker_2` |
| `Digaf-Governance-Admins` | `governance_admin` |
| `Digaf-Compliance-Officers` | `compliance_officer` |
| `Digaf-Governance-Viewers` | `viewer` |

If a user belongs to more than one group, the local role should be selected by priority:

1. `governance_admin`
2. `compliance_officer`
3. `checker_2`
4. `checker_1`
5. `maker`
6. `viewer`

This priority is captured in the Stage 34 backend prep utility, but it is not wired into live endpoints yet.

## Environment Variables Needed Later

Frontend:

- `NEXT_PUBLIC_ENTRA_CLIENT_ID`
- `NEXT_PUBLIC_ENTRA_TENANT_ID`
- `NEXT_PUBLIC_API_BASE_URL`

Backend:

- `ENTRA_TENANT_ID`
- `ENTRA_API_AUDIENCE`
- `ENTRA_ISSUER`
- `ALLOWED_ORIGINS`

These variables should be added only during the authentication implementation phase. Do not commit secrets or tenant-specific private values.

## Security Notes

- Production authorization must not trust `actorRole` from the request body.
- Backend endpoints must validate JWT signature, issuer, audience, expiry, and token use before deriving roles.
- Group-to-role mapping must happen after token validation.
- Missing or unrecognized groups should produce a conservative authorization result.
- The no-single-user approval rule remains separate from role permission checks and must continue to be enforced by workflow logic.
- CORS controls are not authentication and must not be treated as a substitute for token validation.
- Access tokens should be sent only over HTTPS outside local development.

## Implementation Phases

### Phase 1: Local actorRole prototype

Keep the current local `actorRole` flow for local development and workflow review. This is the current Stage 32 behavior.

### Phase 2: Frontend sign-in with Entra

Add frontend sign-in, sign-out, token acquisition, session display, and basic unauthorized states. The UI plan is documented in [frontend-auth-ui-plan.md](frontend-auth-ui-plan.md).

### Phase 3: Backend JWT validation

Add backend token validation for protected API endpoints. Validate issuer, audience, expiry, and signature before reading user or group claims.

### Phase 4: Group claims to actorRole mapping

Map trusted Entra group claims to local application roles using the group-to-role matrix above.

### Phase 5: Remove client-controlled actorRole from protected endpoints

Stop accepting `actorRole` from protected request bodies. Derive actor context from validated identity claims and keep the no-single-user approval checks intact.
