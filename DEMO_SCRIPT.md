# Digaf Shareholder Governance Platform
# Demo Script & Presenter Guide

**Version:** 1.0
**Prepared by:** Sol Ventures
**Demo Duration:** 25–35 minutes
**Audience:** Digaf Microcredit Provider SC — Board & Management Team

---

## Before You Start — Setup Checklist

Complete these steps at least 30 minutes before the demo.

### Accounts to Use

| Browser | Email | Password | Role |
|---|---|---|---|
| Main browser (Chrome) | `henok.d@ease-int.com` | *(your password)* | Governance Admin |
| Incognito window | `digaf@gmail.com` | *(your password)* | Checker 1 |

### Pre-Demo Data to Enter (do this before the audience arrives)

Work through these in order — each one feeds the next step.

**Step A — Create Share Classes** (System → Share Classes)

| Field | Class 1 | Class 2 |
|---|---|---|
| Class Name | `Ordinary Class A` | `Preference Class B` |
| Par Value | `100` | `100` |
| Voting Rights | Yes | No |
| Votes per Share | `1` | `0` |
| Status | Active | Active |

**Step B — Create 4 Shareholders** (Shareholders → Registry)

| Field | #1 | #2 | #3 | #4 |
|---|---|---|---|---|
| Legal Name | `Abebe Girma` | `Tigist Haile` | `Mekdes Alemu` | `Digaf Holdings PLC` |
| Type | Individual | Individual | Individual | Institution |
| KYC Status | Verified | Verified | Verified | Verified |
| Risk | Low | Low | Medium | Low |
| KYC Expiry | 2027-06-30 | 2027-06-30 | 2026-12-31 | 2027-06-30 |
| Relationship Start | 2020-01-15 | 2021-03-10 | 2022-06-01 | 2019-05-01 |

**Step C — Issue 4 Certificates** (Governance → Certificates)

| Shareholder | Share Class | Quantity | Issue Date |
|---|---|---|---|
| Abebe Girma | Ordinary Class A | `5000` | 2020-01-15 |
| Tigist Haile | Ordinary Class A | `3000` | 2021-03-10 |
| Mekdes Alemu | Ordinary Class A | `2000` | 2022-06-01 |
| Digaf Holdings PLC | Ordinary Class A | `10000` | 2019-05-01 |

**Step D — Record a Board Resolution** (Governance → Board Resolutions)

| Field | Value |
|---|---|
| Resolution Number | `BR-2026-001` |
| Resolution Date | `2026-06-01` |
| Description | `Board authorises share transfers and dividend declaration for FY2026` |
| Approved Action | `Approve share transfers and declare annual dividend` |

**Step E — Configure SLA Rule** (System → SLA Config)

| Field | Value |
|---|---|
| Request Type | `share_transfer` |
| Stage | `checker_1_review` |
| Duration | `48` hours |
| Escalation Trigger | `24` hours |
| Escalation Recipient | `henok.d@ease-int.com` |

**Step F — Open Incognito Window**
- Open a second browser window in Incognito mode
- Log in with `digaf@gmail.com` (Checker 1 account)
- Keep this window minimised until Scene 4

---

## Demo Script

---

### SCENE 1 — Introduction & Dashboard (3 minutes)

**[Main browser — logged in as Governance Admin]**

**Say:**
> "What I am going to show you today is the Digaf Shareholder Governance Platform — a purpose-built system that manages all aspects of your shareholder registry, from KYC compliance to share certificates, transfers, dividends, and regulatory reporting. Everything is audited, everything is controlled, and everything is accessible from one place."

**Action:** Show the Dashboard.

**Point to each section and say:**

> "At the top, you can see live metrics for the entire registry — total shareholders, KYC verification status, certificates issued, dividends declared, pending approvals, and any active legal holds."

> "These three progress bars show the health of your governance processes at a glance — KYC compliance, certificate pipeline, and the approval workflow."

> "Below that is your ownership table — showing who your largest shareholders are and their percentage of total shares."

> "And here at the bottom is a live audit feed — every single action taken in the system is recorded automatically with a timestamp and the identity of the person who did it. This cannot be edited or deleted."

---

### SCENE 2 — Shareholder Registry & KYC (5 minutes)

**[Navigate to: Shareholders → Registry]**

**Say:**
> "This is the Shareholder Registry — the single source of truth for all shareholder master records."

**Action:** Show the table with the shareholders you entered.

**Say:**
> "Every shareholder has a KYC status, a risk classification, and an expiry date on their documentation. The system tracks all of this automatically."

**Action:** Click on **Abebe Girma** to open his profile.

**Say:**
> "When I click on a shareholder, I get their full profile — their contact information, KYC status, all the shares they hold, every certificate issued to them, every transfer they have been involved in, and any related documents or legal holds."

> "This is the complete governance record for one individual, all in one place."

**Action:** Navigate to **Shareholders → KYC Compliance**

**Say:**
> "The KYC Compliance Monitor groups all shareholders by urgency. Verified shareholders are in green. Any shareholder with KYC expiring in the next 30 days appears in amber — we get an early warning to begin the renewal process. Expired shareholders appear in red and cannot be involved in any share transfer until their KYC is renewed. The system enforces this automatically."

---

### SCENE 3 — Share Certificates & QR Verification (5 minutes)

**[Navigate to: Governance → Certificates]**

**Say:**
> "Every shareholder's ownership is backed by a formal share certificate. Each certificate has a unique serial number, a digital integrity hash, and a QR code."

**Action:** Click on any certificate serial number.

**Say:**
> "Here is the full certificate record — the shareholder, the share class, the quantity, the issue date, and the full event history of this certificate from the moment it was created."

**Action:** Point to the QR code section.

**Say:**
> "This QR code can be scanned by anyone — a regulator, a notary, a transfer agent — without needing a login to the platform. Let me show you."

**Action:** Navigate to **System → QR Verify** (or open on a phone).

**Say:**
> "This is a public verification page. I enter the serial number, or scan the QR code on a printed certificate, and the system immediately tells me whether the certificate is genuine, who issued it, and whether it has been tampered with. The actual shareholder's private information is never shown here — only the certificate's authenticity."

**Action:** Enter a serial number and click Verify. Show the **Valid** result.

> "If a certificate had been revoked, or if someone had altered the printed document, this page would immediately flag it."

---

### SCENE 4 — Share Transfer & Maker-Checker Approval (8 minutes)

**[Navigate to: Governance → Transfers]**

**Say:**
> "Now I will show you one of the most important controls in the system — the share transfer workflow. No transfer can happen without passing an eligibility check and going through a two-stage maker-checker approval. This is a four-eyes principle built into every transfer."

**Action:** Fill in the Create Transfer form.

- Transferor: **Abebe Girma**
- Transferee: **Tigist Haile**
- Number of Shares: **1000**
- Price per Share: **150**

**Say:**
> "Before I can even create the transfer, the system runs an eligibility check. It verifies that the transferor actually holds the shares, that both parties have valid KYC, that the shares are not under any legal freeze or encumbrance, and it calculates the stamp duty payable under Ethiopian law."

**Action:** Click **Check Eligibility**.

**Say:**
> "All checks have passed. You can see the eligibility summary and the stamp duty amount. Now I submit the transfer."

**Action:** Click **Create Transfer**.

**Say:**
> "The transfer has been submitted and is now sitting in the Approval Queue waiting for Checker 1 to review it."

**[Navigate to: Governance → Approvals]**

**Say:**
> "Here in the Approval Queue, you can see the transfer is pending at Checker 1 stage, with an SLA deadline. If this deadline is missed, the system will escalate it automatically."

**Action:** Switch to the **Incognito window** (logged in as Checker 1 — digaf@gmail.com).

**Say:**
> "Now I switch to the Checker 1 account. In a real operation, this would be a different person on a different computer. The Maker who submitted the transfer cannot approve their own request — the system enforces this separation."

**Action:** Navigate to Governance → Approvals in the incognito window.

**Say:**
> "Checker 1 can see the pending request, review all the details, and make an independent decision."

**Action:** Click **Approve C1**.

**Say:**
> "Checker 1 has approved. The request now moves to Checker 2 for final approval."

**Action:** Switch back to the main browser. Navigate to Approvals.

**Say:**
> "As Governance Admin, I also have Checker 2 authority. In your operation, this would be a third person."

**Action:** Click **Approve C2**.

**Say:**
> "The transfer is complete. Abebe Girma has transferred 1,000 shares to Tigist Haile. The ownership records have been updated, and the full history of this transaction — who submitted it, who approved it, when each step happened — is permanently recorded in the audit log."

---

### SCENE 5 — Dividend Declaration (5 minutes)

**[Navigate to: Governance → Dividend Register]**

**Say:**
> "When the board declares a dividend, the system does the heavy lifting automatically. I enter the amount per share, the record date, and the withholding tax rate, and the system calculates every shareholder's entitlement instantly."

**Action:** Fill in the Declare Dividend form.

- Share Class: **Ordinary Class A**
- Amount per Share: **12.50**
- Record Date: **2026-06-15**
- Payment Date: **2026-06-30**
- Withholding Tax Rate: **10**
- Board Resolution Ref: **BR-2026-001**

**Action:** Click **Declare**.

**Say:**
> "The dividend has been declared. Let me open the detail view."

**Action:** Click **View** next to the declaration.

**Say:**
> "The system has automatically calculated the gross entitlement, the withholding tax, and the net amount for every single shareholder — based on exactly how many shares they held on the record date. No manual calculation. No spreadsheet."

**Action:** Point to the entitlements table.

> "I can export this directly to CSV for the finance team to process payments. Once payments are made, I mark the dividend as paid and the records are updated."

---

### SCENE 6 — Compliance & Regulatory Reports (4 minutes)

**[Navigate to: Operations → Regulatory Reports]**

**Say:**
> "At any time, I can generate a complete regulatory summary report — shareholder registry, KYC compliance status, capital structure, certificate issuance, dividend history, and governance activity — all in one document."

**Action:** Click **Print**.

> "This can be saved as a PDF in one click, ready for a regulatory submission or a board meeting."

**[Navigate to: Shareholders → Cap Table]**

**Say:**
> "The Cap Table gives the board a real-time view of ownership concentration — who holds what percentage of the company, which shares are pledged or encumbered."

**[Navigate to: System → Audit Log]**

**Say:**
> "And finally — every single action we have taken in this demo is recorded here in the Audit Log. Who did it, what changed, the exact timestamp, and the before and after values. This log cannot be modified. It is a permanent, tamper-proof record that satisfies regulatory requirements for governance transparency."

---

### SCENE 7 — Close (2 minutes)

**Say:**
> "To summarise — the Digaf Shareholder Governance Platform gives you:
>
> **One:** A complete, real-time shareholder registry with KYC compliance tracking.
>
> **Two:** Digitally verifiable share certificates with QR code authentication.
>
> **Three:** A controlled transfer workflow with mandatory maker-checker approval and SLA enforcement.
>
> **Four:** Automated dividend calculation with one-click export for payment processing.
>
> **Five:** A permanent, auditable record of every governance action — meeting the requirements of the National Bank of Ethiopia and your own internal controls.
>
> The system is live, it is production-ready, and everything you saw today is real data entered in real time."

---

## Likely Questions & Answers

**Q: Can the system connect to our existing data — Excel files or the current register?**
A: Yes. The import module accepts Excel and CSV files. You can bulk-upload your existing shareholder data directly.

**Q: What happens if a checker is unavailable to approve?**
A: The SLA monitor tracks the deadline. If it is missed, the system escalates to a designated recipient automatically. The Governance Admin can also action approvals directly.

**Q: Is the data secure?**
A: The platform runs on Supabase (enterprise-grade PostgreSQL with Row Level Security) and is hosted on Vercel. All data is encrypted in transit and at rest. The audit log is immutable.

**Q: Can we control who sees what?**
A: Yes. The role system has six levels — Governance Admin, Maker, Checker 1, Checker 2, Compliance Officer, and Viewer. Each role has clearly defined permissions.

**Q: What about the National Bank reporting requirements?**
A: The Regulatory Reports page generates a summary covering shareholders, KYC, capital structure, certificates, dividends, and governance activity — formatted for internal governance and regulatory filing.

**Q: Can shareholders verify their own certificate?**
A: Yes. The QR Verify page is publicly accessible without a login. Any shareholder can scan the QR code on their printed certificate to confirm its authenticity.

---

## Demo Day Checklist

- [ ] Run the role SQL for both accounts (see setup above)
- [ ] Sign out and sign back in on both browsers to refresh role tokens
- [ ] Enter all pre-demo data (Scenes A–F above)
- [ ] Confirm Dashboard shows real numbers (not zeros)
- [ ] Open incognito window and log in as Checker 1
- [ ] Test the QR Verify page with a real serial number
- [ ] Set screen resolution to 1920×1080 or higher
- [ ] Use Chrome — hide bookmarks bar for a cleaner screen
- [ ] Close all other browser tabs
- [ ] Turn off email and Slack notifications
- [ ] Have the platform URL ready to share with the audience after the demo

---

*Demo Script prepared by Sol Ventures — info@sol-ventures.com*
