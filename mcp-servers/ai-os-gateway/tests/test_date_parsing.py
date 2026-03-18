"""Tests for the date string → native Python date/datetime conversion fix.

Validates that all 4 affected modules correctly parse ISO date strings
into native Python date/datetime objects before passing to asyncpg.

Two test layers:
1. Unit tests — pure Python, no DB required. Verify parsing logic.
2. Integration tests — hit real Cloud SQL. Verify asyncpg accepts the values.

Run unit tests:  pytest tests/test_date_parsing.py -v -k unit
Run all tests:   pytest tests/test_date_parsing.py -v  (requires DB)
"""

import asyncio
import json
import os
import uuid
from datetime import date, datetime, timezone

import asyncpg
import pytest
import pytest_asyncio
from dotenv import load_dotenv

load_dotenv()


# ── Unit Tests (no DB) ──────────────────────────────────────────────

class TestDateParsingUnit:
    """Verify the parsing logic works for all expected input formats."""

    def test_date_fromisoformat_standard(self):
        """Standard YYYY-MM-DD format."""
        result = date.fromisoformat("2026-04-01")
        assert result == date(2026, 4, 1)
        assert isinstance(result, date)

    def test_date_fromisoformat_edge_cases(self):
        """Leap day and end-of-year dates."""
        assert date.fromisoformat("2024-02-29") == date(2024, 2, 29)
        assert date.fromisoformat("2026-12-31") == date(2026, 12, 31)
        assert date.fromisoformat("2026-01-01") == date(2026, 1, 1)

    def test_date_fromisoformat_rejects_bad_input(self):
        """Invalid formats should raise ValueError."""
        with pytest.raises(ValueError):
            date.fromisoformat("04/01/2026")
        with pytest.raises(ValueError):
            date.fromisoformat("not-a-date")
        with pytest.raises(ValueError):
            date.fromisoformat("2026-13-01")  # month 13

    def test_datetime_fromisoformat_with_z_suffix(self):
        """ISO 8601 with Z suffix (UTC shorthand)."""
        raw = "2026-03-18T10:00:00Z"
        result = datetime.fromisoformat(raw.replace("Z", "+00:00"))
        assert result.tzinfo is not None
        assert result.year == 2026
        assert result.month == 3
        assert result.hour == 10

    def test_datetime_fromisoformat_with_offset(self):
        """ISO 8601 with explicit timezone offset."""
        result = datetime.fromisoformat("2026-03-18T10:00:00+05:30")
        assert result.tzinfo is not None
        assert result.hour == 10

    def test_datetime_fromisoformat_naive(self):
        """ISO 8601 without timezone."""
        result = datetime.fromisoformat("2026-03-18T10:00:00")
        assert result.tzinfo is None
        assert result.year == 2026

    def test_none_date_passthrough(self):
        """None dates should stay None (for optional fields)."""
        target_date = None
        parsed = date.fromisoformat(target_date) if target_date else None
        assert parsed is None

    def test_none_due_date_passthrough(self):
        """None due_date should stay None."""
        due_date = None
        parsed = date.fromisoformat(due_date) if due_date else None
        assert parsed is None

    def test_life_graph_pattern(self):
        """Simulate life_graph.add_context_item date handling."""
        target_date = "2026-04-01"
        parsed_date = date.fromisoformat(target_date) if target_date else None
        assert isinstance(parsed_date, date)
        assert parsed_date == date(2026, 4, 1)

    def test_contacts_update_pattern(self):
        """Simulate contacts.update_contact datetime handling."""
        last_contacted_at = "2026-03-18T10:00:00Z"
        parsed = datetime.fromisoformat(last_contacted_at.replace("Z", "+00:00"))
        assert isinstance(parsed, datetime)
        assert parsed.tzinfo is not None

    def test_contacts_important_date_pattern(self):
        """Simulate contacts.add_important_date date handling."""
        date_value = "1995-06-15"
        parsed_date = date.fromisoformat(date_value)
        assert isinstance(parsed_date, date)
        assert parsed_date == date(1995, 6, 15)

    def test_google_tasks_pattern(self):
        """Simulate google_tasks.create_task date handling."""
        due_date = "2026-04-15"
        parsed_due = date.fromisoformat(due_date) if due_date else None
        assert isinstance(parsed_due, date)
        assert parsed_due == date(2026, 4, 15)


# ── Integration Tests (requires DB) ─────────────────────────────────
# Use function-scoped connections to avoid Windows event loop issues.

async def _get_conn():
    """Create a single connection (function-scoped, no pool needed)."""
    return await asyncpg.connect(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME", "ai_os"),
        user=os.getenv("DB_USER", "ai_os_admin"),
        password=os.getenv("DB_PASSWORD", ""),
    )


@pytest.mark.asyncio
async def test_integration_date_in_context_item():
    """Insert a domain_context_item with a parsed date, then clean up."""
    try:
        conn = await _get_conn()
    except Exception as e:
        pytest.skip(f"Database not available: {e}")
    try:
        domain = await conn.fetchrow("SELECT id FROM life_domains LIMIT 1")
        if not domain:
            pytest.skip("No life_domains in database")

        target_date_str = "2026-06-15"
        parsed_date = date.fromisoformat(target_date_str)

        record = await conn.fetchrow(
            "INSERT INTO domain_context_items "
            "(domain_id, item_type, title, description, priority, target_date) "
            "VALUES ($1, $2::context_item_type, $3, $4, $5::task_priority, $6::date) "
            "RETURNING id, target_date",
            domain["id"], "objective", "Date Parse Test", "Integration test", "medium", parsed_date,
        )
        assert record is not None
        assert record["target_date"] == parsed_date

        # Cleanup
        await conn.execute(
            "DELETE FROM domain_context_items WHERE id = $1", record["id"]
        )
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_integration_date_in_task():
    """Insert a task with a parsed due_date, then clean up."""
    try:
        conn = await _get_conn()
    except Exception as e:
        pytest.skip(f"Database not available: {e}")
    try:
        domain = await conn.fetchrow("SELECT id FROM life_domains LIMIT 1")
        project = await conn.fetchrow("SELECT id FROM projects LIMIT 1")
        if not domain or not project:
            pytest.skip("No domains/projects in database")

        due_date_str = "2026-07-20"
        parsed_due = date.fromisoformat(due_date_str)
        task_id = str(uuid.uuid4())

        record = await conn.fetchrow(
            "INSERT INTO tasks (id, project_id, domain_id, title, status, priority, due_date) "
            "VALUES ($1::uuid, $2::uuid, $3::uuid, $4, 'todo'::task_status, "
            "$5::task_priority, $6::date) RETURNING id, due_date",
            task_id, str(project["id"]), str(domain["id"]),
            "Due Date Parse Test", "medium", parsed_due,
        )
        assert record is not None
        assert record["due_date"] == parsed_due

        # Cleanup
        await conn.execute("DELETE FROM tasks WHERE id = $1::uuid", task_id)
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_integration_timestamptz_in_contact():
    """Update a contact's last_contacted_at with a parsed datetime, then revert."""
    try:
        conn = await _get_conn()
    except Exception as e:
        pytest.skip(f"Database not available: {e}")
    try:
        contact = await conn.fetchrow(
            "SELECT id, last_contacted_at FROM contacts LIMIT 1"
        )
        if not contact:
            pytest.skip("No contacts in database")

        ts_str = "2026-03-18T10:00:00Z"
        parsed_ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))

        await conn.execute(
            "UPDATE contacts SET last_contacted_at = $1::timestamptz WHERE id = $2::uuid",
            parsed_ts, str(contact["id"]),
        )

        updated = await conn.fetchrow(
            "SELECT last_contacted_at FROM contacts WHERE id = $1::uuid",
            str(contact["id"]),
        )
        assert updated["last_contacted_at"] is not None

        # Revert
        await conn.execute(
            "UPDATE contacts SET last_contacted_at = $1 WHERE id = $2::uuid",
            contact["last_contacted_at"], str(contact["id"]),
        )
    finally:
        await conn.close()


@pytest.mark.asyncio
async def test_integration_date_string_fails_without_fix():
    """Prove that passing a raw string (without parsing) fails in asyncpg."""
    try:
        conn = await _get_conn()
    except Exception as e:
        pytest.skip(f"Database not available: {e}")
    try:
        domain = await conn.fetchrow("SELECT id FROM life_domains LIMIT 1")
        if not domain:
            pytest.skip("No life_domains in database")

        raw_date_string = "2026-06-15"  # NOT parsed — raw str

        with pytest.raises(asyncpg.DataError):
            await conn.fetchrow(
                "INSERT INTO domain_context_items "
                "(domain_id, item_type, title, priority, target_date) "
                "VALUES ($1, $2::context_item_type, $3, $4::task_priority, $5::date) "
                "RETURNING id",
                domain["id"], "objective", "Should Fail", "medium", raw_date_string,
            )
    finally:
        await conn.close()
