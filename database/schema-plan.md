# \# PostgreSQL Governance Ledger Schema Plan

# 

# \## Architecture Rule

# 

# PostgreSQL is the single structured data store for the Digaf Shareholder Governance Platform.

# 

# The backend API is the only application layer allowed to read and write PostgreSQL.

# 

# \## Initial Tables

# 

# \- entity

# \- shareholder

# \- share\_class

# \- share\_certificate

# \- approval\_request

# \- certificate\_event

# \- audit\_log

# 

# \## Next Tables

# 

# \- share\_ownership

# \- ownership\_transaction

# \- cap\_table\_snapshot

# \- share\_transfer

# \- transfer\_freeze

# \- kyc\_record

# \- beneficial\_ownership

# \- document\_reference

# \- communication\_log

# \- legal\_hold

# \- sla\_config

# \- board\_resolution\_ref

# 

# \## Governance Notes

# 

# The audit\_log and certificate\_event tables are append-only by design. Enforcement will be strengthened later at the API and PostgreSQL permission levels.

\## Stage 6 Tables Added



These tables support the regulated microfinance governance context:



\- beneficial\_ownership

\- kyc\_record

\- share\_ownership

\- ownership\_transaction

\- cap\_table\_snapshot

\- share\_transfer

\- transfer\_freeze

\- document\_reference

\- legal\_hold

\- sla\_config

\- communication\_log

\- board\_resolution\_ref



\## Microfinance Governance Notes



Because the first deployment entity is a microfinance institution, the schema must support strict governance, KYC expiry tracking, beneficial ownership review, transfer freezes, encumbrance checks, maker-checker-checker approvals, SLA tracking, legal hold, and audit evidence preservation from the beginning.

