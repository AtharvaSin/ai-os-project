"""Unit and integration tests for content pipeline features in postgres module.

Tests cover:
  - _prep_value: dict/list → JSON string serialization for asyncpg
  - _serialize: time/timedelta handling
  - _INTEGER_PK_TABLES: integer PK detection
  - upload_content_image: end-to-end image upload tool

Run with: pytest tests/test_content_pipeline.py -v
"""

import asyncio
import json
import os
from datetime import time, timedelta, datetime, date
from decimal import Decimal
import uuid

import pytest
from dotenv import load_dotenv

load_dotenv()

# Import functions under test
from app.modules.postgres import _prep_value, _serialize, _INTEGER_PK_TABLES, register_tools


# ---------------------------------------------------------------------------
# Unit tests — no DB required
# ---------------------------------------------------------------------------

class TestPrepValue:
    """_prep_value converts dicts/lists to JSON strings for asyncpg JSONB."""

    def test_dict_becomes_json_string(self):
        result = _prep_value({"key": "value", "nested": {"a": 1}})
        assert isinstance(result, str)
        parsed = json.loads(result)
        assert parsed["key"] == "value"
        assert parsed["nested"]["a"] == 1

    def test_list_becomes_json_string(self):
        result = _prep_value([1, 2, {"a": "b"}])
        assert isinstance(result, str)
        parsed = json.loads(result)
        assert parsed == [1, 2, {"a": "b"}]

    def test_string_passthrough(self):
        result = _prep_value("hello")
        assert result == "hello"

    def test_int_passthrough(self):
        result = _prep_value(42)
        assert result == 42

    def test_none_passthrough(self):
        result = _prep_value(None)
        assert result is None

    def test_bool_passthrough(self):
        result = _prep_value(True)
        assert result is True

    def test_empty_dict(self):
        result = _prep_value({})
        assert result == "{}"

    def test_empty_list(self):
        result = _prep_value([])
        assert result == "[]"


class TestSerialize:
    """_serialize converts DB-native types to JSON-safe Python types."""

    def test_time_to_isoformat(self):
        t = time(18, 0, 0)
        result = _serialize(t)
        assert result == "18:00:00"

    def test_timedelta_to_string(self):
        td = timedelta(hours=2, minutes=30)
        result = _serialize(td)
        assert result == "2:30:00"

    def test_datetime_to_isoformat(self):
        dt = datetime(2026, 4, 6, 18, 0, 0)
        result = _serialize(dt)
        assert "2026-04-06" in result

    def test_date_to_isoformat(self):
        d = date(2026, 4, 6)
        result = _serialize(d)
        assert result == "2026-04-06"

    def test_uuid_to_string(self):
        u = uuid.UUID("12345678-1234-5678-1234-567812345678")
        result = _serialize(u)
        assert result == "12345678-1234-5678-1234-567812345678"

    def test_decimal_to_float(self):
        d = Decimal("3.14")
        result = _serialize(d)
        assert result == 3.14

    def test_json_string_decoded(self):
        """JSONB columns arrive as raw JSON strings — should be decoded."""
        result = _serialize('{"key": "value"}')
        assert isinstance(result, dict)
        assert result["key"] == "value"

    def test_plain_string_passthrough(self):
        result = _serialize("hello world")
        assert result == "hello world"

    def test_nested_dict_serialization(self):
        result = _serialize({
            "ts": datetime(2026, 1, 1),
            "id": uuid.UUID("12345678-1234-5678-1234-567812345678"),
        })
        assert result["ts"] == "2026-01-01T00:00:00"
        assert result["id"] == "12345678-1234-5678-1234-567812345678"


class TestIntegerPKTables:
    """content_posts and content_pipeline_log should be in _INTEGER_PK_TABLES."""

    def test_content_posts_is_integer_pk(self):
        assert "content_posts" in _INTEGER_PK_TABLES

    def test_content_pipeline_log_is_integer_pk(self):
        assert "content_pipeline_log" in _INTEGER_PK_TABLES

    def test_tasks_is_not_integer_pk(self):
        assert "tasks" not in _INTEGER_PK_TABLES

    def test_projects_is_not_integer_pk(self):
        assert "projects" not in _INTEGER_PK_TABLES


# ---------------------------------------------------------------------------
# Integration tests — require DB connection
# ---------------------------------------------------------------------------

class MockMCP:
    """Mock FastMCP that captures registered tools."""

    def __init__(self):
        self.tools = {}

    def tool(self, description=""):
        def decorator(func):
            self.tools[func.__name__] = func
            return func
        return decorator


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def db_pool():
    import asyncpg
    pool = await asyncpg.create_pool(
        host=os.getenv("DB_HOST", "localhost"),
        port=int(os.getenv("DB_PORT", "5432")),
        database=os.getenv("DB_NAME", "ai_os"),
        user=os.getenv("DB_USER", "ai_os_admin"),
        password=os.getenv("DB_PASSWORD", ""),
        min_size=1,
        max_size=3,
    )
    yield pool
    await pool.close()


@pytest.fixture
def tools(db_pool):
    mock_mcp = MockMCP()
    register_tools(mock_mcp, lambda: db_pool)
    return mock_mcp.tools


@pytest.mark.asyncio
async def test_update_record_integer_pk(tools, db_pool):
    """update_record should work with integer PK tables (content_posts)."""
    # Get a known content_posts record
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id, post_id FROM content_posts LIMIT 1")

    if row is None:
        pytest.skip("No content_posts records to test with")

    record_id = str(row["id"])
    # Update a safe field (visual_direction)
    result = await tools["update_record"](
        "content_posts", record_id, {"visual_direction": "test_update"}
    )
    data = json.loads(result)
    assert "_meta" in data
    assert data["_meta"]["action"] == "updated"

    # Restore
    await tools["update_record"](
        "content_posts", record_id, {"visual_direction": None}
    )


@pytest.mark.asyncio
async def test_update_record_jsonb_field(tools, db_pool):
    """update_record should handle JSONB dict values via _prep_value."""
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT id FROM content_posts LIMIT 1")

    if row is None:
        pytest.skip("No content_posts records to test with")

    record_id = str(row["id"])
    test_manifest = {"test_key": "test_value", "nested": {"a": 1}}
    result = await tools["update_record"](
        "content_posts", record_id, {"style_overrides": test_manifest}
    )
    data = json.loads(result)
    assert "_meta" in data

    # Cleanup
    await tools["update_record"](
        "content_posts", record_id, {"style_overrides": None}
    )


@pytest.mark.asyncio
async def test_upload_content_image(tools, db_pool):
    """upload_content_image should store base64 and advance status."""
    # Use a tiny 1x1 PNG as test image
    tiny_png_b64 = (
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8"
        "/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=="
    )

    # Find a post to test with (ideally one in prompt_ready status)
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT post_id, status FROM content_posts "
            "WHERE status = 'prompt_ready' LIMIT 1"
        )

    if row is None:
        pytest.skip("No prompt_ready content_posts to test with")

    post_id = row["post_id"]
    original_status = row["status"]

    result = await tools["upload_content_image"](
        post_id=post_id,
        image_base64=tiny_png_b64,
        file_name="test_pixel.png",
        mime_type="image/png",
    )
    data = json.loads(result)

    assert data.get("uploaded") is True
    assert data["status"] == "image_uploaded"
    assert data["post_id"] == post_id

    # Verify DB was updated
    async with db_pool.acquire() as conn:
        updated = await conn.fetchrow(
            "SELECT status, render_manifest FROM content_posts WHERE post_id = $1",
            post_id,
        )
        assert updated["status"] == "image_uploaded"
        manifest = json.loads(updated["render_manifest"]) if isinstance(
            updated["render_manifest"], str
        ) else updated["render_manifest"]
        assert "source_image_base64" in manifest
        assert manifest["source_file_name"] == "test_pixel.png"

        # Verify audit log was created
        log = await conn.fetchrow(
            "SELECT action, new_status FROM content_pipeline_log "
            "WHERE post_id = $1 ORDER BY performed_at DESC LIMIT 1",
            post_id,
        )
        assert log["action"] == "image_upload"
        assert log["new_status"] == "image_uploaded"

    # Rollback: restore original status and clean render_manifest
    async with db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE content_posts SET status = $1::content_post_status, "
            "render_manifest = NULL WHERE post_id = $2",
            original_status, post_id,
        )
        await conn.execute(
            "DELETE FROM content_pipeline_log WHERE post_id = $1 AND details::text LIKE '%test_pixel%'",
            post_id,
        )


@pytest.mark.asyncio
async def test_upload_content_image_invalid_post(tools):
    """upload_content_image should return error for non-existent post."""
    result = await tools["upload_content_image"](
        post_id="NONEXISTENT-999",
        image_base64="dGVzdA==",
        file_name="test.png",
    )
    data = json.loads(result)
    assert "error" in data
    assert "not found" in data["error"]
