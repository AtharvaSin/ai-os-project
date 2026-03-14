# Database Migrations

## Convention

All schema changes to the `ai_os` database are managed through numbered SQL migration files in this directory.

### Naming
```
NNN_description.sql
```
Examples: `001_projects.sql`, `002_contacts.sql`, `003_pipelines.sql`, `004_knowledge.sql`

### Rules
- Each migration file must be **idempotent** — use `IF NOT EXISTS` for tables, `CREATE OR REPLACE` for functions.
- Migrations are applied in numerical order.
- Never modify an already-applied migration. Create a new migration for changes.
- Each migration should include comments explaining what it creates and why.

### Applying Migrations

**Via apply.sh (recommended):**
```bash
./database/migrations/apply.sh
```
This connects to the ai_os database via cloud-sql-proxy and runs all migrations in order.

**Manually via psql:**
```bash
# Start the proxy (if not running)
cloud-sql-proxy bharatvarsh-website:us-central1:bharatvarsh-db --port=5432 &

# Apply a specific migration
PGPASSWORD=$AI_OS_DB_PASSWORD psql -h 127.0.0.1 -U ai_os_admin -d ai_os -f database/migrations/001_projects.sql
```

**Via Cloud SQL Studio:**
Copy-paste the SQL into the Cloud SQL Studio editor in the GCP Console (connect to bharatvarsh-db, switch to ai_os database).

### Connection Details

| Property | Value |
|----------|-------|
| Instance | bharatvarsh-website:us-central1:bharatvarsh-db |
| Database | ai_os |
| User | ai_os_admin |
| Password | Stored in Secret Manager: AI_OS_DB_PASSWORD |
| Local proxy | localhost:5432 (via cloud-sql-proxy) |

### Rollback Approach

There is no automated rollback. If a migration needs to be undone:
1. Write a new migration that reverses the changes (e.g., `005_rollback_004.sql`).
2. Apply it as a forward migration.
3. Document what was rolled back and why.

### Schema Documentation

After applying migrations, regenerate the schema docs:
```bash
PGPASSWORD=$AI_OS_DB_PASSWORD pg_dump -h 127.0.0.1 -U ai_os_admin -d ai_os --schema-only > database/DB_SCHEMA.md
```
This file is also uploaded to the Claude Project KB as the canonical schema reference.

### Migration Status

| Migration | Description | Status |
|-----------|-------------|--------|
| 001_projects.sql | Projects, phases, milestones, tasks, artifacts, tags | Pending |
| 002_contacts.sql | Contacts, relationships, important_dates, audiences | Planned |
| 003_pipelines.sql | Pipelines, runs, logs, campaigns, posts | Planned |
| 004_knowledge.sql | Knowledge entries, embeddings, connections, skill registry | Planned |
