# Digaf Shareholder Governance Platform
## User Manual

**Version:** 1.0
**Prepared for:** Digaf Microcredit Provider SC
**Audience:** All platform users (Makers, Checkers, Compliance Officers, Governance Administrators, Viewers)
**Document Status:** Final — Based on production application structure

---

# Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Main Features](#4-main-features)
   - 4.1 [Shareholder Registry](#41-shareholder-registry)
   - 4.2 [Certificate Management](#42-certificate-management)
   - 4.3 [Share Transfers](#43-share-transfers)
   - 4.4 [Dividend Register](#44-dividend-register)
   - 4.5 [Approval Queue](#45-approval-queue)
   - 4.6 [KYC Compliance Monitor](#46-kyc-compliance-monitor)
   - 4.7 [Cap Table](#47-cap-table)
   - 4.8 [Legal Hold Management](#48-legal-hold-management)
   - 4.9 [Board Resolutions](#49-board-resolutions)
   - 4.10 [Share Classes](#410-share-classes)
   - 4.11 [Shareholder Import](#411-shareholder-import)
   - 4.12 [SLA Monitor](#412-sla-monitor)
   - 4.13 [SLA Configuration](#413-sla-configuration)
   - 4.14 [Regulatory Reports](#414-regulatory-reports)
   - 4.15 [Communication Log](#415-communication-log)
   - 4.16 [Document References](#416-document-references)
   - 4.17 [Audit Log](#417-audit-log)
   - 4.18 [QR Certificate Verification](#418-qr-certificate-verification)
5. [Step-by-Step Workflows](#5-step-by-step-workflows)
6. [Forms and Data Entry](#6-forms-and-data-entry)
7. [User Roles and Permissions](#7-user-roles-and-permissions)
8. [Notifications and Alerts](#8-notifications-and-alerts)
9. [Reports, Exports, and Downloads](#9-reports-exports-and-downloads)
10. [Troubleshooting](#10-troubleshooting)
11. [Frequently Asked Questions](#11-frequently-asked-questions)
12. [Best Practices](#12-best-practices)
13. [Glossary](#13-glossary)
14. [Support](#14-support)

---

# 1. Introduction

## 1.1 Purpose of the Platform

The **Digaf Shareholder Governance Platform** is a secure, web-based system designed to manage all aspects of shareholder governance at Digaf Microcredit Provider SC. It provides a single, trusted source of truth for shareholder records, share certificates, ownership transfers, dividend declarations, and regulatory compliance.

The platform replaces manual, paper-based or spreadsheet-driven governance processes with a controlled, auditable digital workflow — ensuring every action is recorded, every approval is tracked, and every certificate is verifiable.

## 1.2 Who This Manual Is For

This manual is written for:

- **Governance Administrators** who manage the full system
- **Compliance Officers** responsible for KYC compliance and legal holds
- **Makers** who create transfer requests, certificates, and dividend declarations
- **Checkers (Checker 1 & Checker 2)** who review and approve governance requests
- **Viewers** with read-only access to reports and records

No technical background is required to use this manual. All instructions are written in plain business language.

## 1.3 What You Can Do With This System

The platform covers the following areas:

| Area | What You Can Do |
|---|---|
| **Shareholder Registry** | Add, view, and manage shareholder master records |
| **Certificates** | Issue, print, verify, and revoke share certificates |
| **Transfers** | Initiate and approve share ownership transfers |
| **Dividends** | Declare dividends and compute per-shareholder entitlements |
| **Approvals** | Review and approve governance requests through a maker-checker workflow |
| **KYC Compliance** | Track KYC verification status and renewal alerts |
| **Cap Table** | View ownership percentages, share classes, and concentration |
| **Legal Holds** | Track regulatory freezes and preservation orders |
| **Board Resolutions** | Record resolutions that authorise governance actions |
| **Reports** | Generate regulatory summary reports and export data |
| **Audit Log** | Trace every system change with full before/after records |
| **QR Verification** | Verify the authenticity of any certificate without logging in |

---

# 2. Getting Started

## 2.1 How to Access the Platform

The Digaf Shareholder Governance Platform is a web application. You do not need to install any software.

1. Open your web browser (Google Chrome, Microsoft Edge, or Mozilla Firefox are recommended).
2. Navigate to the platform URL provided by your system administrator.
3. The login page will appear automatically.

> **Note:** The platform is optimised for desktop use. A mobile view is available but the full feature set is best experienced on a laptop or desktop computer with a screen width of at least 1024 pixels.

## 2.2 Logging In

1. On the login page, enter your **email address** in the Email field.
2. Enter your **password** in the Password field.
3. Click the **Sign In** button.
4. If your credentials are correct, you will be redirected to the Dashboard.

**If login fails:**
- Check that your email address is spelled correctly (no extra spaces).
- Ensure Caps Lock is not accidentally enabled when typing your password.
- Contact your Governance Administrator if you have forgotten your password or your account has not yet been created.

> **Note:** User accounts are created by the Governance Administrator. You cannot self-register on this platform. Contact your administrator to request access.

## 2.3 First-Time Users

When you log in for the first time:

1. You will land on the **Dashboard**, which shows a summary of all key governance metrics.
2. Your **name, email, and role** are shown in the top-right corner of every page (on desktop) and in the sidebar footer.
3. Take a moment to review the Dashboard before navigating to any specific module.
4. Your access level depends on your assigned **role** (see Section 7 for details on roles and permissions).

> **Tip:** If the Dashboard displays empty metrics (zeros across all cards), the system is active but no data has been entered yet. Start by adding shareholder records in the **Shareholder Registry**.

## 2.4 Basic Navigation Overview

The platform uses a fixed sidebar on the left side of the screen (on desktop). All major sections are accessible from this sidebar.

### Desktop Sidebar Navigation

The sidebar is divided into five sections:

| Section Label | Menu Items |
|---|---|
| **Dashboard** | Dashboard (home) |
| **Shareholders** | Registry, KYC Compliance, Cap Table |
| **Governance** | Certificates, Transfers, Dividend Register, Approvals, Legal Holds, Board Resolutions |
| **Operations** | Regulatory Reports, Communications, Documents, SLA Monitor |
| **System** | Audit Log, Share Classes, SLA Config, QR Verify |

**To navigate:** Click any menu item in the sidebar. The currently active page is highlighted with an indigo background.

### Mobile Navigation

On smaller screens (tablets, phones):
- A row of pill-shaped buttons appears at the top of the screen for quick access to main pages.
- A menu icon (hamburger icon) gives access to the full navigation list.

### Page Structure

Every page follows the same layout:

```
[Page Title]
[Short Description]
─────────────────────────────────
[KPI Summary Cards]     (if applicable)
[Main Content / Table / Form]
```

---

# 3. Dashboard Overview

The **Dashboard** is the first page you see after logging in. It gives you a real-time snapshot of the entire governance operation.

## 3.1 Top KPI Cards

Six summary cards appear at the top of the Dashboard:

| Card | What It Shows |
|---|---|
| **Shareholders** | Total number of shareholder records in the system |
| **KYC Status** | Number of shareholders with verified KYC status |
| **Certificates** | Total certificates issued across all shareholders |
| **Dividends Declared** | Total number of dividend declarations recorded |
| **Pending Approvals** | Number of approval requests still awaiting action |
| **Active Legal Holds** | Number of legal holds currently in force |

Cards with a **red accent** indicate items that require attention (e.g., overdue approvals, active holds).

## 3.2 Registry Health Charts

Three horizontal progress bar charts show the health of core processes at a glance:

| Chart | Breakdown |
|---|---|
| **KYC Compliance** | Verified (green), Expiring Soon (amber), Expired (red), No KYC Set (grey) |
| **Certificate Pipeline** | Issued (green), Draft (blue), Revoked (red) |
| **Approval Pipeline** | Approved (green), Pending (amber), Overdue (red) |

Each bar segment is proportional to the total. Hover over any segment to see the count.

## 3.3 Workflow Summary Cards

Below the health charts, four additional cards show:

- **Transfers:** Total transfer requests, by status
- **Approvals:** Total approvals, pending, and overdue

## 3.4 Top Ownership Table

This table shows the **top shareholders by ownership percentage**, including:
- Shareholder name
- Number of shares held
- Percentage of total shares owned

This gives board members and compliance officers a quick view of concentration risk.

## 3.5 Recent Audit Activity

A live list of the most recent system actions, showing:
- Who performed the action (actor)
- What was changed (action type: insert, update, delete)
- Which record was affected (table name)
- When the change was made (timestamp)

## 3.6 SLA Snapshot

A summary table of the most recent approval requests with their SLA status:
- Request type and approval stage
- SLA due date
- Whether the item is on track, due soon, or overdue

Click any item on the Dashboard to navigate to the relevant detail page.

---

# 4. Main Features

---

## 4.1 Shareholder Registry

**Navigation:** Shareholders → Registry

The Shareholder Registry is the master list of all individuals and institutions that hold or have held shares in Digaf.

### What It Shows

| Column | Description |
|---|---|
| Name | Full legal name (clickable — opens the shareholder's profile) |
| Code | Internal reference code |
| Contact | Mobile number and email address |
| TIN | Tax Identification Number |
| Type | Individual or Institution |
| Status | Active, Pending, or Suspended |
| KYC | KYC verification status badge |
| KYC Expiry | Date when KYC documentation expires |
| Risk | Risk classification (Low, Medium, High) |
| Proxy | Whether the shareholder is proxy-eligible |

The table is paginated (50 records per page). Use the page controls at the bottom to navigate through records.

### Adding a New Shareholder

A create form appears above the shareholder table. Complete all required fields and click **Save**.

See Section 6.1 for full form instructions.

### Searching and Filtering

- Use the **Import** button (top right of page header) to import multiple shareholders from a file.
- Use the **Export CSV** button to download the full registry as a spreadsheet.

### Viewing a Shareholder Profile

Click the shareholder's name in the table to open their full profile page. The profile includes:
- Master contact and KYC data
- All shareholding positions (by share class)
- Certificate history
- Transfer history (outgoing and incoming)
- Active legal holds
- Related documents
- Communication history

---

## 4.2 Certificate Management

**Navigation:** Governance → Certificates

Share certificates are the formal, verifiable records of share ownership. Each certificate has a unique serial number, a digital hash for tamper detection, and a QR code for public verification.

### What It Shows

| Column | Description |
|---|---|
| Serial Number | Unique certificate identifier |
| Shareholder | Certificate holder name |
| Share Class | The class of shares (e.g., Ordinary Class A) |
| Quantity | Number of shares on this certificate |
| Issue Date | Date the certificate was formally issued |
| Status | Draft, Issued, or Revoked |
| Hash Algorithm | Cryptographic algorithm used (e.g., SHA-256) |
| Revocation Status | Whether the certificate has been revoked |

### Issuing a Certificate

1. Complete the **Create Certificate** form above the table.
2. Select the **Shareholder** from the dropdown.
3. Select the **Share Class** from the dropdown.
4. Enter the **Quantity** of shares.
5. Set the **Issue Date**.
6. Click **Save**.

The certificate is created in **Draft** status. It must be formally issued (status changed to **Issued**) before it becomes active.

### Viewing a Certificate

Click the serial number in the table to view:
- Full certificate details
- A rendered certificate preview with the company logo
- A **QR Code** that any stakeholder can scan to verify the certificate's authenticity
- An event timeline showing the full history of the certificate (created, issued, revoked, etc.)

### Printing a Certificate

1. Open a certificate by clicking its serial number.
2. Click the **Print Certificate** button.
3. The certificate opens in a print-ready view.
4. Use your browser's print function (Ctrl+P / Cmd+P) to print or save as PDF.

### Revoking a Certificate

Certificate revocation is an action recorded in the event timeline. Once revoked, the QR verification page will clearly show the certificate as **Revoked**. Contact your Governance Administrator to initiate a revocation.

---

## 4.3 Share Transfers

**Navigation:** Governance → Transfers

The Transfers module manages the process of transferring share ownership from one shareholder (the Transferor) to another (the Transferee). Every transfer must pass an eligibility check and then go through the maker-checker approval workflow.

### What It Shows

Each transfer record is displayed as a card showing:
- Transfer amount (number of shares)
- Transferor name and Transferee name
- Status badge (Pending, Approved, Completed, Cancelled)
- Compliance check results:
  - **KYC Check** — whether both parties have valid KYC
  - **Encumbrance Check** — whether the shares are free of encumbrances
  - **Board Approval** — whether a board resolution is required

### Initiating a Transfer (Maker Role)

The transfer form is a two-step process:

**Step 1 — Eligibility Check**
1. Select the **Transferor** (the shareholder selling/transferring shares) from the dropdown.
2. Select the **Transferee** (the shareholder receiving shares) from the dropdown.
3. Enter the **Number of Shares** to transfer.
4. Optionally, enter the **Price per Share** (in ETB). This is used to calculate stamp duty.
5. Click **Check Eligibility**.

The system will automatically verify:
- Whether the transferor holds enough available shares
- Whether both parties have valid, non-expired KYC status
- Whether the shares are free of pledges, encumbrances, or legal freezes
- Stamp duty payable (if price per share was entered)

If the eligibility check passes, you will see a green confirmation and can proceed to Step 2.

If the check fails, the system shows the specific blocking reasons (e.g., "KYC expired for transferor", "Shares are encumbered"). You must resolve these before creating the transfer.

**Step 2 — Create Transfer**
6. Review the eligibility summary.
7. Click **Create Transfer** to submit the request.
8. The transfer is sent to the **Approval Queue** for Checker 1 review.

---

## 4.4 Dividend Register

**Navigation:** Governance → Dividend Register

The Dividend Register records all dividend declarations made by Digaf and automatically calculates the net entitlement for each shareholder based on their certificate holdings at the record date.

### What It Shows

| Column | Description |
|---|---|
| Record Date | The date used to determine which shareholders qualify |
| Share Class | Which class of shares the dividend applies to |
| Per Share Amount | Dividend amount per share (in ETB) |
| Total Amount | Total dividend pool (ETB) |
| WHT % | Withholding tax rate applied |
| Shareholders | Count of shareholders entitled |
| Payment Date | Scheduled date for dividend payment |
| Status | Declared or Paid |

### Declaring a Dividend

1. Complete the **Declare Dividend** form.
2. Select the **Share Class** the dividend applies to (leave blank for all classes, if supported).
3. Enter the **Amount per Share** in ETB.
4. Set the **Record Date** — shareholders who hold certificates on this date will receive the dividend.
5. Set the **Payment Date**.
6. Enter the **Withholding Tax Rate** as a percentage (e.g., 10 for 10%).
7. Enter the **Board Resolution Reference** that authorises the dividend.
8. Click **Declare**.

The system automatically calculates each shareholder's entitlement (gross, withholding tax, and net) based on their active certificates at the record date.

### Viewing Dividend Details

Click **View** next to any declaration in the table. The detail page shows:

- Summary KPI cards: Total Gross, Total WHT, Total Net, Count of Paid Shareholders
- Declaration details (board resolution reference, declared by, notes)
- A full **Shareholder Entitlements Table** showing each shareholder's shares at record date, gross amount, WHT, net amount, and payment status

### Marking a Dividend as Paid

1. Open the dividend detail page.
2. Click the **Mark as Paid** button.
3. Confirm the action in the confirmation dialog.
4. All entitlement records are updated to status **Paid**.

### Exporting Dividend Entitlements

On the dividend detail page, click the **Export CSV** button to download the full entitlements table as a spreadsheet for payment processing.

---

## 4.5 Approval Queue

**Navigation:** Governance → Approvals

The Approval Queue is the central workflow hub for reviewing and approving governance requests. Digaf uses a **two-stage checker approval process** (Checker 1 → Checker 2).

### What It Shows

| Column | Description |
|---|---|
| Type | The type of request (e.g., Share Transfer) |
| Stage | Current approval stage (Checker 1 Review or Checker 2 Review) |
| Transfer | Transferor → Transferee (for transfer requests) |
| Shares | Number of shares in the request |
| SLA Due | The deadline by which this request should be resolved |
| Status | Pending, Approved, or Rejected |
| Maker | The user ID of the person who created the request |
| Actions | Approve C1, Approve C2, Reject buttons (role-dependent) |

### Filtering Approvals

- Use the **Search** box to filter by shareholder name or request type.
- Use the **Status Filter** dropdown to show only Pending, Approved, or Rejected requests.

### Approving a Request (Checker 1)

1. Find the pending request in the table (status = Pending, stage = Checker 1 Review).
2. Review the transfer details (transferor, transferee, shares).
3. Check the SLA due date — items in red are overdue.
4. Click **Approve C1**.
5. The request moves to **Checker 2 Review** stage.

### Approving a Request (Checker 2)

1. Find the request in the table (stage = Checker 2 Review).
2. Review and click **Approve C2**.
3. The request is marked **Approved** and the transfer is completed.

### Rejecting a Request

1. Click the **Reject** button on any pending request.
2. A confirmation dialog appears asking for a rejection reason.
3. Enter a clear reason in the text field.
4. Click **Reject** to confirm.
5. The request is marked **Rejected** and the maker is notified.

### Bulk Approval (Checker 1 Only)

You can approve multiple pending requests at once:

1. Tick the checkboxes next to the requests you wish to approve.
2. Click the **Approve Selected (Checker 1)** button that appears at the top.
3. Confirm the bulk action in the confirmation dialog.
4. All selected requests advance to Checker 2 Review.

> **Note:** Bulk approval is only available for Checker 1 actions and only for items in Pending/Checker 1 Review status.

---

## 4.6 KYC Compliance Monitor

**Navigation:** Shareholders → KYC Compliance

The KYC Compliance Monitor provides a tiered view of all shareholders grouped by the urgency of their KYC compliance status.

### What It Shows

**Summary cards at the top:**

| Card | Colour | Meaning |
|---|---|---|
| Verified | Green | KYC is current and valid |
| Expired | Red | KYC has expired — transfers blocked |
| Expiring (30 Days) | Amber | KYC expires within 30 days |
| Expiring (90 Days) | Orange | KYC expires within 90 days |
| No Expiry Set | Grey | KYC status exists but no expiry date has been entered |

**Grouped sections below** show a table for each urgency level with:
- Shareholder name and type
- KYC status badge
- KYC expiry date
- Days remaining (or days overdue)
- Contact details (email and mobile)
- **Update KYC →** button linking to the shareholder's profile

### Updating KYC Status

1. Click the **Update KYC →** button next to the shareholder requiring an update.
2. You are taken to the KYC update form on the shareholder's profile page.
3. Select the new **KYC Status** from the dropdown.
4. Enter the new **KYC Expiry Date**.
5. Update the **Risk Classification** if required.
6. Click **Save**.

> **Important:** Shareholders with an expired KYC status cannot be named as a transferor or transferee in a transfer request. The eligibility check will block the transfer until KYC is renewed.

---

## 4.7 Cap Table

**Navigation:** Shareholders → Cap Table

The Cap Table provides a consolidated view of share ownership across all shareholders and share classes.

### What It Shows

**Top 3 Shareholders cards** — Quick view of the three largest shareholders by ownership percentage.

**Cap Table** — Full ownership breakdown:

| Column | Description |
|---|---|
| Shareholder Name | Full legal name |
| Type | Individual or Institution |
| Share Class | Class of shares held |
| Quantity | Number of shares held |
| Ownership % | Percentage of total issued shares |
| Pledged | Number of shares pledged as security |
| Encumbered | Number of shares under encumbrance orders |
| Status | Current shareholder status |

The total share count is displayed as a badge in the page header.

---

## 4.8 Legal Hold Management

**Navigation:** Governance → Legal Holds

Legal holds are preservation orders that restrict the transfer or disposal of shares. They are typically imposed during litigation, regulatory investigations, or court orders.

### What It Shows

**KPI Cards:**
- **Total Holds** — All holds ever recorded
- **Active Holds** — Holds currently in force
- **Active Freezes** — Holds that include a share transfer freeze

**Active Holds card grid** — A visual card for each active hold showing:
- Entity name and shareholder
- Hold type (e.g., Litigation Hold, Regulatory Hold)
- Reason for the hold
- Whether a transfer freeze is in effect

**Full Legal Holds Table** — All holds (active and lifted):

| Column | Description |
|---|---|
| Hold Type | Category of legal hold |
| Shareholder | Affected shareholder |
| Reason | Reason for the hold |
| Status | Active or Lifted |
| Authority Reference | Reference number from the imposing authority |
| Imposed By | User who recorded the hold |
| Imposed At | Date the hold was recorded |
| Freeze Status | Whether transfers are frozen |

> **Note:** Legal holds are recorded by the Governance Administrator or Compliance Officer. Any transfer attempt involving a shareholder with an active freeze will be blocked by the eligibility check.

---

## 4.9 Board Resolutions

**Navigation:** Governance → Board Resolutions

Board Resolutions records the formal decisions made by the board of directors that authorise governance actions such as dividend declarations, large transfers, or share class changes.

### What It Shows

| Column | Description |
|---|---|
| Resolution No. | Unique resolution reference number |
| Date | Date of the board meeting or resolution |
| Description | Summary of what was resolved |
| Approved Action | Specific action authorised by the resolution |
| Document | Link to the supporting document (if available) |
| Created | Date the resolution was recorded in the system |

### Recording a Board Resolution

1. Complete the **Create Board Resolution** form.
2. Enter the **Resolution Number** (as per the minute book or official record).
3. Enter the **Resolution Date**.
4. Enter a **Description** summarising the content of the resolution.
5. Enter the **Approved Action** — the specific governance action authorised.
6. Optionally, paste the **Document URL** if a digital copy is available.
7. Click **Save**.

> **Tip:** Resolution references are used in dividend declarations and transfer approvals to provide an audit trail linking the action back to board authority.

---

## 4.10 Share Classes

**Navigation:** System → Share Classes

Share Classes define the types of shares that exist in Digaf's capital structure. Each certificate and ownership record must belong to a share class.

### What It Shows

| Column | Description |
|---|---|
| Class Name | Name of the share class (e.g., Ordinary Class A) |
| Par Value | Nominal value per share |
| Voting | Whether this class carries voting rights (Yes/No) |
| Votes per Share | Number of votes each share of this class carries |
| Tier | Voting class tier (if applicable) |
| Status | Active or Inactive |
| Notes | Additional notes |
| Created | Date the class was defined |

### Creating a Share Class

1. Complete the **Create Share Class** form.
2. Enter the **Class Name**.
3. Enter the **Par Value** per share.
4. Check the **Voting Rights** box if this class carries votes.
5. Enter the number of **Votes per Share** (default is 1).
6. Enter the **Voting Class Tier** if applicable.
7. Select the **Status** (Active or Inactive).
8. Optionally, add **Notes**.
9. Click **Save**.

> **Note:** Share classes should be configured before entering shareholder or certificate records, as they are required fields in those forms.

---

## 4.11 Shareholder Import

**Navigation:** Shareholders → Registry → Import (button in page header)

The Import module allows you to upload multiple shareholder records at once from an Excel or CSV file, instead of entering them one by one.

> **Warning:** The import area is labelled "Use test data only — do not upload production shareholder records" during validation phases. Confirm with your administrator before importing live data.

### Import Process

**Step 1 — Prepare Your File**
- Your file must be in Excel (.xlsx) or CSV (.csv) format.
- The columns must match the required shareholder fields (legal name, type, email, etc.).
- Contact your administrator for the standard import template.

**Step 2 — Upload and Validate (Dry Run)**
1. Navigate to the Import page.
2. Drag your file into the upload area, or click to browse and select it.
3. The system performs a **dry-run validation** — it checks every row for errors without saving anything.
4. Review the validation results. Each row is marked:
   - **Valid** — ready to import
   - **Warning** — will be imported but has non-critical issues
   - **Error** — cannot be imported until corrected

**Step 3 — Resolve Issues**
5. For rows with errors: correct the source file and re-upload.
6. For rows you wish to skip: click the **Exclude** button next to that row.

**Step 4 — Persist the Batch**
7. When satisfied with the results, click **Persist Batch**.
8. The system creates all valid shareholder records.
9. The batch is assigned a status (**Persisted** or **Failed**) and is visible in the **Import Batches** history page.

### Viewing Past Import Batches

**Navigation:** Shareholders → Registry → Import → View All Batches

| Column | Description |
|---|---|
| File Name | Name of the uploaded file (clickable) |
| Status | Validation, Persisted, or Failed |
| Rows | Total rows in the file |
| Errors | Count of rows with errors |
| Warnings | Count of rows with warnings |
| Submitted By | User who performed the import |
| Created | Date of upload |

---

## 4.12 SLA Monitor

**Navigation:** Operations → SLA Monitor

The SLA Monitor tracks the timeliness of all approval requests against their agreed Service Level Agreement (SLA) deadlines.

### What It Shows

**KPI Cards:**
| Card | Colour | Meaning |
|---|---|---|
| Total Tracked | Neutral | All approvals being monitored |
| Overdue | Red | Approvals past their SLA deadline |
| Due Soon | Amber | Approvals approaching their deadline |
| Completed | Green | Approvals resolved within SLA |

**SLA Items Table:**

| Column | Description |
|---|---|
| Request Type | Type of governance request |
| Stage | Current approval stage |
| Status | Overall approval status |
| SLA Status | On Track, Due Soon, Overdue, or Completed |
| Days Remaining | Days until (or since) the SLA deadline |
| Approver | Current approver assigned |
| Transfer | Transferor → Transferee (if applicable) |
| Escalation | Escalation level and recipient |

---

## 4.13 SLA Configuration

**Navigation:** System → SLA Config

SLA Configuration allows administrators to define the target timeframes and escalation rules for each type of governance approval.

### What It Shows

| Column | Description |
|---|---|
| Request Type | Type of governance request |
| Stage | Which stage this rule applies to |
| Duration | Target completion time (hours or days) |
| Escalation Trigger | Threshold that triggers escalation |
| Escalation Recipient | Who is notified when escalation is triggered |

### Adding an SLA Rule

1. Complete the **Create SLA Config** form.
2. Select the **Request Type**.
3. Select the **Stage** (Checker 1 Review or Checker 2 Review).
4. Enter the **Duration** and unit (hours or days).
5. Set the **Escalation Trigger** threshold.
6. Enter the **Escalation Recipient**.
7. Click **Save**.

---

## 4.14 Regulatory Reports

**Navigation:** Operations → Regulatory Reports

The Regulatory Reports page generates a real-time summary report suitable for internal governance reviews and regulatory filings. It is a read-only page — no data is entered here.

### What It Shows

The report is divided into six sections:

| Section | Content |
|---|---|
| **1. Shareholder Registry** | Total shareholders, active count, breakdown by type |
| **2. KYC Compliance** | Verified, pending, expired, expiring counts and breakdown table |
| **3. Capital Structure** | Issued certificates by share class |
| **4. Certificate Issuance** | Total, issued, and revoked certificate counts |
| **5. Dividend Register** | Total declarations, total declared amount, entitlement status breakdown |
| **6. Governance Activity** | Transfer counts, pending approvals, active legal holds, audit log entry count |

### Printing the Report

1. Click the **Print** button in the top-right corner of the page.
2. Your browser's print dialog will open.
3. Select **Save as PDF** to save a digital copy, or send to a physical printer.

---

## 4.15 Communication Log

**Navigation:** Operations → Communications

The Communication Log is a read-only record of all system-generated notifications sent to shareholders or governance users.

### What It Shows

**KPI Cards:**
- Total Communications sent
- Number of successfully delivered messages
- Most recent channel and timestamp

**Full Communications Table:**

| Column | Description |
|---|---|
| Type | Communication type (e.g., Dividend Notice, KYC Alert) |
| Recipient | Shareholder or user who received the notification |
| Channel | Delivery method (e.g., Email, SMS) |
| Subject | Communication subject line |
| Delivery Status | Sent, Delivered, Failed |
| Sent At | Timestamp of the notification |

> **Note:** This log is automatically populated by governance events (dividend declarations, KYC expiry alerts, etc.). Users cannot create entries manually.

---

## 4.16 Document References

**Navigation:** Operations → Documents

Document References are governance evidence records — links to documents (resolutions, KYC files, certificates) associated with shareholder events.

### What It Shows

**KPI Cards:**
- Total document references
- Count under active legal hold protection

**Recent Evidence card grid** — The three most recent documents with key details.

**Full Documents Table:**

| Column | Description |
|---|---|
| Document Type | Type of document (e.g., Board Resolution, KYC File) |
| Library | Document storage library name |
| Retention Category | Defined retention period category |
| Legal Hold Status | Whether the document is subject to a legal hold |
| Related Entity | The governance entity the document relates to |
| Authority Reference | Reference from the authorising body |
| Created | Date the document reference was recorded |

> **Note:** Document references are links to external storage locations. The actual documents are not stored inside the platform.

---

## 4.17 Audit Log

**Navigation:** System → Audit Log

The Audit Log is the complete, immutable record of every change made in the platform. Every insert, update, and deletion is captured automatically. This page is read-only.

### What It Shows

**KPI Cards:**
- Total audit log entries
- Latest actor and timestamp
- Latest action and affected table

**Audit Log Table:**

| Column | Description |
|---|---|
| Actor | User ID of the person who made the change |
| Action | Type of change: Insert, Update, or Delete |
| Table | Which database entity was affected (e.g., shareholder, share_transfer) |
| Record ID | Unique identifier of the changed record |
| Old Value | What the data looked like before the change (abbreviated) |
| New Value | What the data looks like after the change (abbreviated) |
| Timestamp | Exact date and time of the change (UTC) |
| Source IP | IP address of the user at the time of the change |

The table is paginated (50 entries per page). Use the page controls to browse older entries.

> **Important:** The Audit Log cannot be modified or deleted. It is a permanent record for regulatory compliance and dispute resolution.

---

## 4.18 QR Certificate Verification

**Navigation:** System → QR Verify (or navigate directly to the verification URL)

This page allows anyone — including external parties such as regulators, notaries, or transfer agents — to verify the authenticity of a share certificate without needing a platform account.

### How to Verify a Certificate

1. Navigate to the QR Verification page.
2. Either:
   - **Scan the QR code** on a printed certificate using a phone camera, which will open this page automatically with the certificate pre-loaded, or
   - **Enter the serial number** manually in the search field.
3. Click **Verify**.

### What the Result Shows

| Result | Meaning |
|---|---|
| **Valid** | The certificate is genuine, active, and has not been tampered with |
| **Revoked** | The certificate was valid but has since been formally revoked |
| **Tamper Detected** | The certificate data does not match the recorded hash — the document may have been altered |
| **Hash Missing** | The certificate exists but has not been assigned an integrity hash (contact the administrator) |

The result also shows:
- Issuing company
- Share class and quantity
- Issue date
- Hash algorithm used
- Verification timestamp

> **Note:** This page is intentionally public and does not display any private shareholder information (name, contact, KYC data). It only confirms the certificate's authenticity.

---

# 5. Step-by-Step Workflows

## 5.1 Workflow: Onboarding a New Shareholder

**Who can do this:** Maker, Governance Administrator

1. Navigate to **Shareholders → Registry**.
2. Scroll to the **Create Shareholder** form above the table.
3. Enter the shareholder's **Legal Name**.
4. Select the **Type**: Individual or Institution.
5. Enter the **Email Address** and **Mobile Number**.
6. Enter the **TIN Number** (Tax Identification Number).
7. Select the **KYC Status** (typically "Pending" for a new shareholder).
8. Select the **Risk Classification**: Low, Medium, or High.
9. Enter the **KYC Expiry Date** if documents have been received and verified.
10. Enter the **Relationship Start Date**.
11. Check **Proxy Eligible** if the shareholder may act as a proxy holder.
12. Click **Save**.
13. The new shareholder appears in the registry table.
14. Click the shareholder's name to verify the profile was created correctly.

---

## 5.2 Workflow: Issuing a Share Certificate

**Who can do this:** Maker, Governance Administrator

**Pre-requisite:** The shareholder must exist in the registry. At least one share class must be configured.

1. Navigate to **Governance → Certificates**.
2. Complete the **Create Certificate** form:
   - Select the **Shareholder** from the dropdown.
   - Select the **Share Class**.
   - Enter the **Quantity** of shares.
   - Enter the **Issue Date**.
3. Click **Save**.
4. The certificate is created in **Draft** status.
5. Click the certificate's serial number to open its detail page.
6. Verify all details are correct.
7. Change the status to **Issued** (contact administrator if you cannot see this action).
8. Click **Print Certificate** to generate the printed version.
9. The QR code on the printed certificate is immediately verifiable on the public QR Verify page.

---

## 5.3 Workflow: Processing a Share Transfer

**Who can do this:** Maker (initiates), Checker 1 (first approval), Checker 2 (final approval)

**Pre-requisite:** Both transferor and transferee must exist in the registry with valid (non-expired) KYC status. The transferor must hold sufficient available shares.

**Maker's Steps:**
1. Navigate to **Governance → Transfers**.
2. In the **Create Transfer** form, select the **Transferor**.
3. Select the **Transferee**.
4. Enter the **Number of Shares** to transfer.
5. Enter the **Price per Share** (optional, for stamp duty calculation).
6. Click **Check Eligibility**.
7. Review the eligibility results. If all checks pass (green), proceed.
8. If any check fails (red), resolve the issue (e.g., update KYC, remove encumbrance) and retry.
9. Click **Create Transfer**.
10. The system routes the request to the Approval Queue.

**Checker 1's Steps:**
11. Navigate to **Governance → Approvals**.
12. Locate the pending transfer request (Stage: Checker 1 Review).
13. Review the transfer details.
14. Click **Approve C1** to approve, or **Reject** with a reason to reject.
15. If approved, the request moves to Checker 2 Review.

**Checker 2's Steps:**
16. Navigate to **Governance → Approvals**.
17. Locate the request (Stage: Checker 2 Review).
18. Review and click **Approve C2** to finalise.
19. The transfer status changes to **Approved** and the ownership records are updated.

---

## 5.4 Workflow: Declaring and Paying a Dividend

**Who can do this:** Maker (declares), Governance Administrator (marks paid)

**Pre-requisite:** A board resolution authorising the dividend must be recorded. Share certificates must be active and issued.

**Declaring the dividend:**
1. Navigate to **Governance → Dividend Register**.
2. Complete the **Declare Dividend** form.
3. Select the applicable **Share Class** (or leave blank if it applies to all).
4. Enter the **Amount per Share** in ETB.
5. Set the **Record Date** — entitlements are calculated for shareholders holding active certificates on this date.
6. Set the **Payment Date**.
7. Enter the **Withholding Tax Rate** as a percentage.
8. Enter the **Board Resolution Reference**.
9. Click **Declare**.
10. The system calculates each shareholder's gross, WHT, and net entitlement automatically.

**Reviewing entitlements:**
11. Click **View** next to the declaration in the table.
12. Review the Shareholder Entitlements Table.
13. Click **Export CSV** to download for payment processing.

**Marking as paid:**
14. After payments have been processed externally, return to the dividend detail page.
15. Click **Mark as Paid**.
16. Confirm the action.
17. All entitlement records are updated to **Paid** status.

---

## 5.5 Workflow: Importing Multiple Shareholders

**Who can do this:** Governance Administrator

1. Obtain the standard import template from your administrator.
2. Fill in the template with shareholder data. Do not modify the column headers.
3. Save the file in Excel (.xlsx) or CSV (.csv) format.
4. Navigate to **Shareholders → Registry** and click **Import**.
5. Drag the file into the upload area or click to browse.
6. The system runs a dry-run validation. Review the results.
7. Rows marked with errors must be corrected in the source file before proceeding.
8. Rows you wish to exclude can be excluded individually using the **Exclude** button.
9. When satisfied, click **Persist Batch**.
10. Confirm. The shareholder records are created.
11. Navigate to **Import Batches** to verify the batch status is **Persisted**.

---

# 6. Forms and Data Entry

## 6.1 Create Shareholder Form

**Location:** Shareholders → Registry (top of page)

| Field | Type | Required | Notes |
|---|---|---|---|
| Legal Name | Text | Yes | Full legal name as on identification documents |
| Type | Dropdown | Yes | Individual or Institution |
| Email Address | Email | No | Used for notifications |
| Mobile Number | Text | No | Used for SMS notifications |
| TIN Number | Text | No | Tax Identification Number |
| KYC Status | Dropdown | Yes | Not Started, Pending, Verified, Expired |
| Risk Classification | Dropdown | Yes | Low, Medium, High |
| KYC Expiry Date | Date | No | Required if KYC status is Verified |
| Relationship Start Date | Date | No | Date the shareholder relationship began |
| Proxy Eligible | Checkbox | No | Check if the shareholder may act as proxy |

## 6.2 Create Certificate Form

**Location:** Governance → Certificates (top of page)

| Field | Type | Required | Notes |
|---|---|---|---|
| Shareholder | Dropdown | Yes | Must exist in the registry |
| Share Class | Dropdown | Yes | Must be defined in Share Classes |
| Quantity | Number | Yes | Number of shares on this certificate |
| Issue Date | Date | Yes | Date of formal issuance |

## 6.3 Create Transfer Form

**Location:** Governance → Transfers (top of page)

| Field | Type | Required | Notes |
|---|---|---|---|
| Transferor | Dropdown | Yes | Shareholder selling/transferring |
| Transferee | Dropdown | Yes | Shareholder receiving shares |
| Number of Shares | Number | Yes | Must not exceed transferor's available shares |
| Price per Share (ETB) | Number | No | Optional; triggers stamp duty calculation |

## 6.4 Declare Dividend Form

**Location:** Governance → Dividend Register (top of page)

| Field | Type | Required | Notes |
|---|---|---|---|
| Share Class | Dropdown | No | Leave blank to apply to all share classes |
| Amount per Share (ETB) | Number | Yes | Dividend amount per share |
| Record Date | Date | Yes | Determines eligible shareholders |
| Payment Date | Date | Yes | Scheduled payment date |
| Withholding Tax Rate (%) | Number | Yes | Enter as percentage (e.g., 10 for 10%) |
| Board Resolution Reference | Text | No | Reference to authorising board resolution |

## 6.5 Validation Rules

The platform enforces the following data validation rules:

- **Required fields** must be filled before submission. Empty required fields are highlighted with a red border and an error message below the field.
- **Date fields** must contain valid calendar dates. Future dates are allowed where the business logic requires (e.g., payment dates).
- **Number fields** must contain positive numbers. Decimal places are accepted where relevant.
- **Dropdown fields** must have a selection made before the form can be submitted.
- **Email fields** must follow standard email format (e.g., name@company.com).

## 6.6 Saving, Editing, and Deleting Records

- **Saving:** Click the **Save** or **Submit** button on any form. A green success toast notification confirms the record was saved.
- **Editing:** Most records are edited by navigating to the record (e.g., shareholder profile) and clicking an **Edit** or **Update** button in the relevant section.
- **Deleting:** Record deletion is restricted. Most records cannot be deleted to preserve the audit trail. Contact your Governance Administrator if a record needs to be removed.

---

# 7. User Roles and Permissions

The platform uses a role-based access control system. Your role determines which actions you can perform.

## 7.1 Role Definitions

| Role | Description |
|---|---|
| **Maker** | Creates governance requests (transfers, certificates, dividends). Cannot approve their own requests. |
| **Checker 1** | Reviews and approves or rejects requests at the first stage. |
| **Checker 2** | Reviews and provides final approval or rejection at the second stage. |
| **Compliance Officer** | Manages KYC compliance, monitors legal holds, and reviews regulatory risk. |
| **Governance Administrator** | Full access to all features. Can perform all Maker, Checker 1, and Checker 2 actions. |
| **Viewer** | Read-only access. Can view reports, dashboard, registry, and logs but cannot create or approve anything. |

## 7.2 Permissions Matrix

| Action | Maker | Checker 1 | Checker 2 | Compliance | Admin | Viewer |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| View Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| View Shareholder Registry | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Create Shareholder | ✓ | — | — | — | ✓ | — |
| Update KYC Status | — | — | — | ✓ | ✓ | — |
| Create Certificate | ✓ | — | — | — | ✓ | — |
| Initiate Transfer | ✓ | — | — | — | ✓ | — |
| Approve (Checker 1) | — | ✓ | — | — | ✓ | — |
| Approve (Checker 2) | — | — | ✓ | — | ✓ | — |
| Reject Approval | — | ✓ | ✓ | — | ✓ | — |
| Declare Dividend | ✓ | — | — | — | ✓ | — |
| Mark Dividend Paid | — | — | — | — | ✓ | — |
| View Audit Log | — | — | — | ✓ | ✓ | — |
| Configure SLA Rules | — | — | — | — | ✓ | — |
| Manage Share Classes | — | — | — | — | ✓ | — |
| View Reports | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Export CSV | ✓ | ✓ | ✓ | ✓ | ✓ | — |
| Import Shareholders | — | — | — | — | ✓ | — |

## 7.3 How Roles Are Assigned

Roles are assigned by the Governance Administrator when creating or updating a user account. You cannot change your own role. Contact your administrator if you believe your role needs to be updated.

Your current role is displayed in the sidebar footer next to your name.

---

# 8. Notifications and Alerts

## 8.1 In-App Toast Notifications

The platform shows brief notification banners (toasts) in response to actions you take. These appear in the top-right corner of the screen and disappear after a few seconds.

| Notification Type | Appearance | Meaning |
|---|---|---|
| **Success** | Green | The action completed successfully (e.g., "Approved (Checker 1)") |
| **Error** | Red | The action failed (e.g., "Approval failed — please try again") |
| **Info** | Blue | Informational update (e.g., "Approval rejected") |
| **Warning** | Amber | A non-blocking warning requiring attention |

## 8.2 KPI Card Alerts

KPI cards on the Dashboard and other pages use colour-coded accent bars to signal urgency:

| Accent Colour | Meaning |
|---|---|
| **Green (Emerald)** | Positive metric — things are in order |
| **Amber (Yellow)** | Warning — attention may be required |
| **Red (Rose)** | Danger — immediate action likely required |
| **Grey (Slate)** | Neutral — informational metric |

## 8.3 SLA Overdue Alerts

On the **Approval Queue** and **SLA Monitor** pages, any approval that has passed its SLA deadline is highlighted. The SLA status badge changes to **Overdue** (red). Escalation rules (if configured) will automatically notify the designated escalation recipient.

## 8.4 KYC Expiry Alerts

The **KYC Compliance Monitor** groups shareholders by urgency tier. Shareholders with expired or soon-to-expire KYC appear in highlighted sections. The count of expiring/expired shareholders is also shown on the main Dashboard.

## 8.5 Confirmation Dialogs

Before any destructive or irreversible action (rejecting an approval, marking a dividend as paid, bulk approvals), a confirmation dialog appears asking you to confirm or cancel. For rejections, you are also required to enter a written reason.

---

# 9. Reports, Exports, and Downloads

## 9.1 Regulatory Summary Report

**Location:** Operations → Regulatory Reports

- Covers: Shareholder registry, KYC compliance, capital structure, certificate issuance, dividend register, governance activity.
- To export as PDF: Click **Print** → select **Save as PDF** in the browser print dialog.
- This is a point-in-time report generated at the moment you open the page.

## 9.2 Shareholder Registry Export

**Location:** Shareholders → Registry → **Export CSV** button

- Exports the full shareholder list to a CSV file.
- Includes all visible table columns.
- File downloads immediately to your browser's default downloads folder.

## 9.3 Dividend Entitlements Export

**Location:** Governance → Dividend Register → View (any declaration) → **Export CSV** button

- Exports the full shareholder entitlements table for that declaration.
- Includes: shareholder name, shares at record date, gross, WHT, net, payment status.
- Useful for payment processing and tax reporting.

## 9.4 Certificate Printing

**Location:** Governance → Certificates → Click serial number → **Print Certificate**

- Opens a formatted, print-ready certificate view.
- Use your browser's print function (Ctrl+P / Cmd+P).
- Select **Save as PDF** to create a digital copy.

## 9.5 Audit Log

**Location:** System → Audit Log

- The Audit Log is viewable within the platform and is paginated.
- To export (To be confirmed): Contact your administrator — a full data export may be available on request.

---

# 10. Troubleshooting

## 10.1 Cannot Log In

| Symptom | Likely Cause | Solution |
|---|---|---|
| "Invalid credentials" error | Wrong email or password | Re-enter your email and password carefully. Check Caps Lock. |
| Page does not load | No internet connection | Check your network connection and refresh the page. |
| Account not found | Account not yet created | Contact your Governance Administrator to create your account. |
| Repeated failed logins | Account may be locked | Contact your Governance Administrator to reset your account. |

## 10.2 Eligibility Check Fails for a Transfer

| Blocking Reason | Cause | Solution |
|---|---|---|
| "KYC expired for transferor/transferee" | One or both parties have expired KYC | Update the KYC status and expiry date on the shareholder's profile, then retry. |
| "Insufficient available shares" | Transferor does not hold enough shares | Verify the transferor's current share holdings on their profile. Reduce the transfer quantity. |
| "Shares are encumbered" | Shares are subject to a pledge or encumbrance order | The encumbrance must be lifted before the transfer can proceed. Contact your compliance officer. |
| "Transfer freeze is active" | A legal hold with a freeze is in place | The legal hold must be lifted by the Governance Administrator. |

## 10.3 A Page Shows Empty Data or Zeros

| Symptom | Likely Cause | Solution |
|---|---|---|
| Dashboard shows all zeros | No data has been entered yet | Begin by entering shareholder records, share classes, and certificates. |
| Table shows "No records found" | Filter or search is too restrictive | Clear the search and reset the status filter to "All". |
| KPI cards show "0" on a page | Data exists but is not linked correctly | Contact your administrator to verify data integrity. |

## 10.4 Cannot Find a Button or Action

| Symptom | Likely Cause | Solution |
|---|---|---|
| "Approve" button is missing on an approval | Your role does not have approval rights | Confirm your role with your administrator. Only Checker 1, Checker 2, and Admin can approve. |
| "Create" form is not visible | Your role is Viewer | Viewers have read-only access. Contact your administrator to request a role change if needed. |
| "Export CSV" button is not visible | Your role may not have export rights | Contact your administrator to confirm your permissions. |

## 10.5 Certificate QR Code Does Not Scan

| Symptom | Likely Cause | Solution |
|---|---|---|
| QR code scan shows nothing | Poor lighting or camera distance | Improve lighting and hold camera 15–25cm from the QR code. |
| QR code scan opens wrong page | Old or unofficial QR code format | Enter the serial number manually on the QR Verify page instead. |
| Verification shows "Tamper Detected" | Certificate document may have been altered | Report immediately to your Governance Administrator. Do not accept the certificate as valid. |

## 10.6 Import Batch Fails Validation

| Symptom | Likely Cause | Solution |
|---|---|---|
| Many rows show errors | Incorrect column headers or format | Re-download the standard import template and re-enter your data. |
| Rows show "duplicate record" | Shareholder already exists in the system | Exclude the duplicate rows or update the existing records manually. |
| File upload fails | File format not supported | Ensure the file is .xlsx or .csv. Do not upload .xls (old Excel) or .pdf files. |

---

# 11. Frequently Asked Questions

**Q: Can I reset my own password?**
A: Password reset is managed through the Supabase authentication system. Contact your Governance Administrator to request a password reset link.

---

**Q: Can the same person be both the Maker and Checker on the same request?**
A: No. The four-eyes principle requires that the person who creates a request (Maker) cannot be the same person who approves it. The Checker must be a different individual. Only a Governance Administrator can override this, and it is not recommended.

---

**Q: What happens if an approval is rejected by Checker 1?**
A: The approval request is marked as Rejected. The transfer (or other request) is cancelled. The Maker must create a new request if they wish to proceed. A rejection reason is required and is recorded in the audit log.

---

**Q: Can a certificate be reissued after revocation?**
A: A revoked certificate cannot be made active again. A new certificate must be issued. The revoked certificate remains in the system as a permanent historical record.

---

**Q: How is the dividend entitlement calculated?**
A: The system looks at all **active, issued certificates** for each shareholder as of the **record date** of the dividend. The entitlement is calculated as:
- Gross = Shares at Record Date × Amount per Share
- WHT = Gross × Withholding Tax Rate
- Net = Gross − WHT

---

**Q: Can I transfer shares if the transferor has a legal hold but no transfer freeze?**
A: A legal hold without a transfer freeze does not block the transfer. Only a hold with an active **transfer freeze** will block the eligibility check.

---

**Q: Can I edit a dividend declaration after it has been made?**
A: No. Once declared, dividend details cannot be edited. If an error was made, contact your Governance Administrator immediately. A correcting entry or cancellation may be required.

---

**Q: What does "Expiring (30 Days)" mean on the KYC Monitor?**
A: It means the shareholder's KYC documentation is set to expire within the next 30 calendar days. You should initiate the renewal process now to avoid the KYC lapsing, which would block future transfers.

---

**Q: Can anyone outside the company verify a certificate?**
A: Yes. The QR Verify page is publicly accessible without a login. Any person who has a printed certificate can scan the QR code to confirm it is genuine. No private shareholder information is displayed on the public verification page.

---

**Q: Why does the Audit Log show a UUID instead of a person's name?**
A: The Audit Log records the system's internal user identifier (UUID). Your Governance Administrator can cross-reference the UUID with the user account to identify the person. Display names in the Audit Log are planned for a future update. (*To be confirmed.*)

---

# 12. Best Practices

## 12.1 Data Entry Accuracy

- Always enter the shareholder's **full legal name** exactly as it appears on their identification documents. Avoid nicknames or abbreviations.
- Double-check **TIN numbers** before saving — errors here affect tax reporting.
- Set **KYC expiry dates** accurately. The system relies on these dates to alert you when renewals are due and to block transfers when KYC has lapsed.
- Enter **board resolution references** consistently (e.g., always use the format "BR-YYYY-NNN") so they are easy to search and reference later.

## 12.2 Workflow Discipline

- **Makers should not rush the eligibility check.** Read all warning messages carefully before creating a transfer. Warnings do not block the transfer but may indicate issues that need attention.
- **Checkers should not approve requests without reviewing the details.** The approval system exists to provide an independent check. Rubber-stamp approvals defeat the purpose of the four-eyes principle.
- **Never share your login credentials** with a colleague. Each user must log in individually so the audit log records the correct actor for each action.
- **Log out** when you leave your workstation unattended. Use your browser's logout function — do not simply close the tab.

## 12.3 KYC Management

- Review the **KYC Compliance Monitor** at least once a week to catch expiring records before they lapse.
- Prioritise the **Expired** and **Expiring Within 30 Days** tiers — these shareholders cannot be involved in transfers until renewed.
- Maintain copies of supporting KYC documents in a secure, access-controlled location.

## 12.4 SLA Compliance

- Check the **Approval Queue** at the start of each working day to ensure no items are overdue.
- If you are a Checker and will be unavailable (e.g., annual leave), notify your Governance Administrator in advance so approvals can be reassigned or expedited.
- Use the **SLA Monitor** to identify recurring bottlenecks in the approval workflow.

## 12.5 Certificate Management

- Always verify a certificate's details (shareholder, share class, quantity) before clicking **Print**. Printed certificates with errors must be formally revoked and reissued.
- Keep a record of all printed certificate serial numbers in the official certificate register.
- Use the **QR Verify** page to spot-check certificates periodically.

## 12.6 Security and Account Safety

- Use a **strong, unique password** for your account — at least 12 characters with a mix of letters, numbers, and symbols.
- Do not access the platform on public Wi-Fi networks without a VPN.
- Report any suspicious activity (e.g., audit log entries you did not make) to your Governance Administrator immediately.
- Request your account to be **deactivated immediately** if you leave the organisation or change roles.

---

# 13. Glossary

| Term | Definition |
|---|---|
| **Audit Log** | A permanent, timestamped record of every action taken in the system, including who did it, what changed, and when. |
| **Cap Table** | Short for "Capitalisation Table" — a summary of all shareholders and their ownership percentages. |
| **Certificate** | A formal document (and digital record) certifying that a shareholder holds a specific number of shares. |
| **Checker 1** | The first-stage approver in the maker-checker workflow. |
| **Checker 2** | The second-stage (final) approver in the maker-checker workflow. |
| **Compliance Officer** | A designated individual responsible for ensuring KYC compliance, legal hold management, and regulatory adherence. |
| **Dividend** | A payment made to shareholders out of the company's profits, proportional to their shareholding. |
| **Encumbrance** | A legal restriction on shares — for example, shares pledged as security for a loan. Encumbered shares cannot be transferred freely. |
| **Eligibility Check** | An automated system check run before a transfer is created, verifying KYC validity, share availability, and absence of legal restrictions. |
| **ETB** | Ethiopian Birr — the currency used in the platform for financial amounts. |
| **Four-Eyes Principle** | A governance control requiring that any important action must be reviewed and approved by at least two authorised individuals (the Maker and at least one Checker). |
| **Governance** | The system of rules, practices, and processes by which a company manages and controls its shareholder affairs. |
| **KPI** | Key Performance Indicator — a summary metric shown on the dashboard and page headers. |
| **KYC** | Know Your Customer — the process of verifying the identity and risk profile of shareholders. |
| **KYC Expiry** | The date on which a shareholder's KYC documentation expires and must be renewed. |
| **Legal Hold** | A formal order to preserve and protect records and assets (including shares) from disposal, pending legal or regulatory proceedings. |
| **Maker** | A user who initiates governance requests (transfers, certificate issuances, dividend declarations). |
| **Net Entitlement** | The dividend amount a shareholder receives after withholding tax has been deducted. |
| **Pagination** | The system of breaking large lists into pages (50 records per page) to improve performance and readability. |
| **Par Value** | The nominal (face) value of a share as stated in the company's memorandum of association. |
| **Pledge** | A share is pledged when it has been used as collateral for a loan or other obligation. |
| **QR Code** | A machine-readable barcode printed on share certificates that links to the public verification page. |
| **Record Date** | The date used to determine which shareholders are entitled to receive a dividend. Only shareholders who hold valid, issued certificates on this date qualify. |
| **Revocation** | The formal cancellation of a share certificate, making it permanently invalid. |
| **Role** | A defined set of permissions assigned to a user account, determining what actions the user can perform. |
| **Serial Number** | A unique identifier assigned to each share certificate. |
| **SHA-256** | A cryptographic hashing algorithm used to generate a unique fingerprint of a certificate's data, enabling tamper detection. |
| **SLA** | Service Level Agreement — an agreed timeframe within which a governance action (e.g., an approval) should be completed. |
| **Stamp Duty** | A tax levied on the transfer of shares, calculated as a percentage of the transfer value (based on Ethiopian Stamp Duty Proclamation No. 110/1998). |
| **Tamper Detected** | A QR verification result indicating that the certificate document does not match the hash stored in the system — suggesting the document may have been altered. |
| **Transferee** | The shareholder receiving shares in a transfer transaction. |
| **Transferor** | The shareholder selling or transferring shares. |
| **TIN** | Tax Identification Number — the unique number assigned to a taxpayer by the revenue authority. |
| **Viewer** | A platform user with read-only access. Viewers can view but cannot create, edit, or approve records. |
| **WHT** | Withholding Tax — a portion of dividend income deducted at source before payment to the shareholder. |

---

# 14. Support

## 14.1 How to Request Help

If you encounter an issue that is not resolved by this manual or the Troubleshooting section, contact your **Governance Administrator** in the first instance.

For technical issues, report the problem to: **info@sol-ventures.com**

## 14.2 What to Include in a Support Request

To ensure your issue is resolved quickly, please provide the following information when reporting a problem:

1. **Your name and role** in the system
2. **The page or module** where the issue occurred (e.g., "Governance → Approvals")
3. **What you were trying to do** (e.g., "I was trying to approve a Checker 1 request")
4. **What happened** (e.g., "The Approve C1 button was not visible")
5. **What you expected to happen** (e.g., "I expected to see the Approve C1 button because I have the Checker 1 role")
6. **A screenshot** of the error or unexpected behaviour, if possible
7. **The date and time** the issue occurred

## 14.3 Feature Requests

If you would like to suggest a new feature or improvement to the platform, document your request clearly and submit it to your Governance Administrator, including:
- The problem you are trying to solve
- Your proposed solution
- How often you encounter this situation
- Which users would benefit from the change

---

*End of User Manual*

---

**Document Information**

| Field | Value |
|---|---|
| Application | Digaf Shareholder Governance Platform |
| Organisation | Digaf Microcredit Provider SC |
| Version | 1.0 |
| Date | June 2026 |
| Prepared by | Sol Ventures — info@sol-ventures.com |
| Status | Final |

---
