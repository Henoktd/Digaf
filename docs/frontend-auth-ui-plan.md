# Frontend Authentication UI Plan

## Purpose

This document prepares the frontend for future Microsoft Entra ID sign-in. Stage 34 does not implement sign-in UI, role switching, session storage, or authentication packages.

## Future UI Changes

### Sign in button

Add a clear sign-in button in the application shell when no authenticated session is present. The button should start the Microsoft Entra ID sign-in flow.

### User profile badge

After sign-in, show a compact profile badge with the signed-in user's display name or email. Keep the badge small so it does not compete with governance workflow content.

### Role badge from Entra group mapping

Show the mapped local role after backend or shared auth logic maps Entra groups to the application role model:

- `maker`
- `checker_1`
- `checker_2`
- `governance_admin`
- `compliance_officer`
- `viewer`

The badge should indicate the effective role, not raw Entra group names.

### Unauthorized state

Add a clear unauthorized state for users who are authenticated but do not have permission for an action or route. The message should be concise and should not expose sensitive policy details.

### Session expiry handling

When a session expires, show a small prompt to sign in again. Avoid losing in-progress form data where practical.

### Replacing hardcoded local actors

The current local prototype uses hardcoded local actors for workflow testing. Future implementation should replace those actors with the authenticated user's identity claims:

- `actorId` should come from a stable authenticated user claim.
- `actorRole` should be derived from trusted Entra group mapping.
- Protected endpoints should eventually stop accepting client-controlled `actorRole`.

## UI Placement

The application shell is the expected place for sign-in state, the profile badge, and the effective role badge. Workflow pages should continue to focus on governance tasks.

## Implementation Notes

- Do not add role switching UI for production authorization.
- Do not expose raw access tokens in the UI.
- Do not assume frontend checks are sufficient for authorization. Backend authorization remains mandatory.
