# SVH Governance Platform Implementation Plan 
# SVH Governance Platform Implementation Plan

## Architecture Direction

This project follows the Final v3 No-Dataverse architecture.

Core stack:
- React/Next.js frontend
- Backend API
- PostgreSQL governance ledger
- SharePoint document repository
- Microsoft Entra ID identity
- Power Automate for notifications only
- Power BI reporting

## Key Rule

Dataverse is not used.

All workflow state, approval routing, SLA tracking, transfer controls, certificate events, audit logs, and governance records will be handled by the backend API and PostgreSQL.

## Phase 1 Goal

Build a clickable React prototype with mock data and local PostgreSQL readiness.

Phase 1 screens:
- Dashboard
- Shareholder Registry
- Shareholder Profile
- Cap Table
- Certificate Issuance
- Certificate Detail
- Transfer Request
- Approval Queue
- Legal Hold Management
- SLA Monitor
- Communication Log
- Audit Log
- Public QR Verification