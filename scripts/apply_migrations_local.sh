#!/usr/bin/env bash
# apply_migrations_local.sh
# Run after `docker compose -f docker/docker-compose.dev.yml up -d` on first setup.
# Make executable: chmod +x scripts/apply_migrations_local.sh
#
# Applies migrations 001-020 to the local Docker postgres in order.
# Exits on the first failure.

set -e

CONTAINER=ai-os-postgres-local
USER=ai_os_admin
DB=ai_os
MIGRATIONS_DIR="$(cd "$(dirname "$0")/../database/migrations" && pwd)"

echo "Applying AI OS migrations to ${DB} in container ${CONTAINER}"
echo "Migrations dir: ${MIGRATIONS_DIR}"
echo ""

for n in 001 002 003 004 005 006 007 008 009 010 011 012 013 014 015 016 017 018 019 020; do
    file=$(ls "${MIGRATIONS_DIR}/${n}_"*.sql 2>/dev/null | head -1)
    if [ -z "$file" ]; then
        echo "WARNING: No migration file found for prefix ${n} — skipping"
        continue
    fi
    echo "Applying: $(basename "$file")"
    docker exec -i "${CONTAINER}" psql -U "${USER}" -d "${DB}" < "${file}"
done

echo ""
echo "Done. All migrations applied."
