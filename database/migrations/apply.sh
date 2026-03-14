#!/usr/bin/env bash
# apply.sh — Run migrations and seeds against the ai_os database
# Uses Cloud SQL Proxy for local connections
#
# Connection: bharatvarsh-website:us-central1:bharatvarsh-db
# Database:   ai_os
# User:       ai_os_admin
#
# Usage:
#   ./apply.sh                      # Apply all migrations then seeds
#   ./apply.sh --migrate            # Migrations only
#   ./apply.sh --seed               # Seeds only
#   ./apply.sh --file <path.sql>    # Run a single SQL file
#
# Prerequisites:
#   - cloud-sql-proxy running: cloud-sql-proxy bharatvarsh-website:us-central1:bharatvarsh-db --port 5432
#   - AI_OS_DB_PASSWORD set in environment (or fetched from Secret Manager below)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DB_DIR="$(dirname "$SCRIPT_DIR")"
MIGRATIONS_DIR="$SCRIPT_DIR"
SEEDS_DIR="$DB_DIR/seeds"

# Database connection
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-ai_os}"
DB_USER="${DB_USER:-ai_os_admin}"

# Fetch password from Secret Manager if not set
if [[ -z "${AI_OS_DB_PASSWORD:-}" ]]; then
    echo "AI_OS_DB_PASSWORD not set. Fetching from Secret Manager..."
    AI_OS_DB_PASSWORD=$(gcloud secrets versions access latest \
        --secret=AI_OS_DB_PASSWORD \
        --project=ai-operating-system-490208 2>/dev/null) || {
        echo "ERROR: Could not fetch AI_OS_DB_PASSWORD from Secret Manager."
        echo "Either set AI_OS_DB_PASSWORD env var or ensure gcloud is authenticated."
        exit 1
    }
fi

export PGPASSWORD="$AI_OS_DB_PASSWORD"

run_sql() {
    local file="$1"
    local label="$2"
    echo "→ Running $label: $(basename "$file")"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --set ON_ERROR_STOP=1 \
        -f "$file"
    echo "  ✓ $(basename "$file") applied"
}

run_migrations() {
    echo ""
    echo "=== Applying migrations ==="
    for f in "$MIGRATIONS_DIR"/[0-9]*.sql; do
        [[ -f "$f" ]] || continue
        run_sql "$f" "migration"
    done
    echo "=== Migrations complete ==="
}

run_seeds() {
    echo ""
    echo "=== Applying seeds ==="
    for f in "$SEEDS_DIR"/[0-9]*.sql; do
        [[ -f "$f" ]] || continue
        run_sql "$f" "seed"
    done
    echo "=== Seeds complete ==="
}

# Parse arguments
MODE="${1:---all}"

case "$MODE" in
    --migrate)
        run_migrations
        ;;
    --seed)
        run_seeds
        ;;
    --file)
        [[ -z "${2:-}" ]] && { echo "Usage: $0 --file <path.sql>"; exit 1; }
        run_sql "$2" "file"
        ;;
    --all|"")
        run_migrations
        run_seeds
        ;;
    *)
        echo "Usage: $0 [--migrate|--seed|--file <path.sql>|--all]"
        exit 1
        ;;
esac

echo ""
echo "Done."
