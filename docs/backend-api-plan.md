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