# Data Backup and Restore Plan

This plan covers backup and restore practices for the Digaf Shareholder Governance Platform MVP. It applies to local PostgreSQL and the Neon-backed deployed demo. The current system should use demo data only until production security and operational controls are complete.

## Local PostgreSQL Backup Using pg_dump

Use `pg_dump` before local database resets, seed refreshes, risky manual data edits, or demo preparation changes.

Recommended plain SQL backup from the repository root:

```powershell
New-Item -ItemType Directory -Force backups
pg_dump --format=plain --no-owner --no-privileges --file "backups\digaf_local_YYYYMMDD_HHMM.sql" "$env:DATABASE_URL"
```

If `DATABASE_URL` is not set in the shell, replace `"$env:DATABASE_URL"` with the local PostgreSQL connection string.

Recommended local backup naming:

```text
digaf_local_YYYYMMDD_HHMM_<purpose>.sql
```

Examples:

```text
digaf_local_20260526_0930_before_seed_refresh.sql
digaf_local_20260526_1700_before_transfer_demo.sql
```

## Local PostgreSQL Restore Using psql

Use `psql` to restore a plain SQL backup into the intended local database.

```powershell
psql "$env:DATABASE_URL" -f "backups\digaf_local_YYYYMMDD_HHMM_before_seed_refresh.sql"
```

If the target database already contains conflicting records, reset the schema first only after confirming the database is local and disposable:

```powershell
psql "$env:DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
psql "$env:DATABASE_URL" -f database\migrations\001_initial_governance_schema.sql
psql "$env:DATABASE_URL" -f database\migrations\002_regulated_governance_tables.sql
psql "$env:DATABASE_URL" -f "backups\digaf_local_YYYYMMDD_HHMM_before_seed_refresh.sql"
```

Do not run schema reset commands against Neon demo or future production databases unless a rollback has been approved.

## Neon Backup/Export Considerations

Neon provides managed PostgreSQL capabilities, including branch-based workflows and managed storage. For the deployed demo:

- Prefer a Neon branch or export before destructive data refreshes.
- Confirm the exact Neon project, branch, and database before exporting or restoring.
- Treat demo database exports as sensitive because they may include shareholder-like personal data.
- Avoid replacing the deployed demo database immediately before reviewer sessions unless the reviewers have agreed to a refresh.
- For future production, define recovery point objective, recovery time objective, backup retention, and restore drills before go-live.

For a logical export with `pg_dump`, use the Neon connection string in `DATABASE_URL`:

```powershell
$env:DATABASE_URL = "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require"
New-Item -ItemType Directory -Force backups
pg_dump --format=plain --no-owner --no-privileges --file "backups\digaf_neon_demo_YYYYMMDD_HHMM_before_refresh.sql" "$env:DATABASE_URL"
```

## Migration vs Seed Distinction

Migrations define database structure. Seeds populate demo or reference data.

- Migrations live in `database\migrations`.
- Seeds live in `database\seeds`.
- Migrations should be applied in numeric order.
- Seeds should be applied only when the target environment is intended to receive demo/reference records.
- Production should not receive demo seed data unless explicitly approved as safe non-regulated setup data.

Current migration order:

```powershell
psql "$env:DATABASE_URL" -f database\migrations\001_initial_governance_schema.sql
psql "$env:DATABASE_URL" -f database\migrations\002_regulated_governance_tables.sql
```

Current seed order:

```powershell
psql "$env:DATABASE_URL" -f database\seeds\001_seed_digaf.sql
psql "$env:DATABASE_URL" -f database\seeds\002_seed_shareholders.sql
psql "$env:DATABASE_URL" -f database\seeds\003_seed_share_ownership.sql
psql "$env:DATABASE_URL" -f database\seeds\004_seed_certificates.sql
psql "$env:DATABASE_URL" -f database\seeds\005_seed_share_transfers.sql
psql "$env:DATABASE_URL" -f database\seeds\006_seed_legal_holds.sql
psql "$env:DATABASE_URL" -f database\seeds\007_seed_communication_logs.sql
psql "$env:DATABASE_URL" -f database\seeds\008_seed_document_references.sql
psql "$env:DATABASE_URL" -f database\seeds\009_rebrand_demo_shareholder.sql
```

## When to Reset Local DB

Reset the local database when:

- Migrations need to be replayed from a clean state.
- Seed data is stale or inconsistent.
- Manual testing created confusing demo workflow state.
- A local developer needs to reproduce a clean demo environment.
- Local data no longer matches the expected test plan.

Before resetting local data:

- Confirm the connection string points to local PostgreSQL.
- Take a backup if any records are worth keeping.
- Stop the local API if it is actively writing to the database.
- Reapply migrations and seeds in order.
- Verify `/health/db` and key API list endpoints after reset.

## When to Reset Neon Demo DB

Reset the Neon demo database only when:

- Reviewer demo data has become unusable.
- A planned demo refresh is scheduled.
- Migration/seed drift prevents deployed demo validation.
- The team has agreed that existing reviewer evidence can be discarded.

Do not reset Neon demo data:

- During an active reviewer window.
- Without taking a backup or branch snapshot first.
- When the target branch or database is uncertain.
- To fix an application bug that should be fixed in code.

## Sensitive Data Handling

- Treat backups as sensitive even if they contain demo data.
- Do not commit backup files to Git.
- Store backups outside the repository or in an ignored `backups` folder.
- Do not paste database URLs, passwords, HMAC secrets, or full backup contents into tickets or chat.
- Redact shareholder personal data from screenshots and evidence unless the reviewer has approved the demo data set.
- Rotate secrets if a database URL or `CERTIFICATE_HMAC_SECRET` is exposed.

## Backup Naming Convention

Use a predictable name that includes environment, timestamp, and purpose:

```text
digaf_<environment>_YYYYMMDD_HHMM_<purpose>.sql
```

Recommended environment labels:

- `local`
- `neon_demo`
- `neon_staging`
- `production`

Recommended purposes:

- `before_reset`
- `before_seed_refresh`
- `before_release`
- `before_demo`
- `manual_export`

## Restore Checklist

- [ ] Confirm the restore target environment.
- [ ] Confirm the restore target database name or Neon branch.
- [ ] Confirm the backup file matches the intended source environment and timestamp.
- [ ] Confirm the backup file is plain SQL if restoring with `psql`.
- [ ] Confirm no reviewers or users are actively testing the target environment.
- [ ] Take a fresh backup or Neon branch snapshot before destructive restore.
- [ ] Stop application writes if practical.
- [ ] Restore with `psql`.
- [ ] Reapply migrations if restoring into an empty schema.
- [ ] Reapply seeds only if the target environment should contain demo data.
- [ ] Run `/health/db`.
- [ ] Run API smoke tests.
- [ ] Open key UI pages and verify expected records.
- [ ] Record restore time, operator, source backup, target database, and validation result.

## Disaster Recovery Notes

- Local recovery depends on available `pg_dump` files and the committed migration/seed SQL files.
- Neon demo recovery should prefer branch restore or a known logical export.
- Future production recovery requires a formal RPO/RTO, backup retention policy, tested restore process, and named recovery owner.
- Audit logs and certificate events are governance evidence; recovery plans must preserve them when restoring regulated environments.
- Certificate verification depends on `CERTIFICATE_HMAC_SECRET`. Restoring database records without the matching secret can cause certificate verification failures.
- A restore is not complete until the API, frontend, and key workflow data have been validated.
