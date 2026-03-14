"""Integration tests for the PostgreSQL MCP module.

Requires a running PostgreSQL instance with the ai_os database.
Configure via .env file or environment variables:
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD

Run with: pytest tests/test_postgres.py -v
"""

import asyncio
import json
import os

import asyncpg
import pytest
from dotenv import load_dotenv

load_dotenv()

# Import module under test
from app.modules.postgres import register_tools


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
async def test_query_db_select(tools):
    """query_db should execute valid SELECT queries."""
    result = await tools["query_db"]("SELECT 1 AS test_value")
    data = json.loads(result)
    assert isinstance(data, list)
    assert data[0]["test_value"] == 1


@pytest.mark.asyncio
async def test_query_db_rejects_insert(tools):
    """query_db should reject INSERT statements."""
    result = await tools["query_db"]("INSERT INTO projects (name) VALUES ('test')")
    data = json.loads(result)
    assert "error" in data


@pytest.mark.asyncio
async def test_query_db_rejects_update(tools):
    """query_db should reject UPDATE statements."""
    result = await tools["query_db"]("UPDATE projects SET name = 'test'")
    data = json.loads(result)
    assert "error" in data


@pytest.mark.asyncio
async def test_query_db_rejects_delete(tools):
    """query_db should reject DELETE statements."""
    result = await tools["query_db"]("DELETE FROM projects")
    data = json.loads(result)
    assert "error" in data


@pytest.mark.asyncio
async def test_query_db_rejects_drop(tools):
    """query_db should reject DROP statements."""
    result = await tools["query_db"]("DROP TABLE projects")
    data = json.loads(result)
    assert "error" in data


@pytest.mark.asyncio
async def test_insert_record_invalid_table(tools):
    """insert_record should reject tables not in the allow-list."""
    result = await tools["insert_record"]("nonexistent_table", {"name": "test"})
    data = json.loads(result)
    assert "error" in data
    assert "allow-list" in data["error"]


@pytest.mark.asyncio
async def test_insert_record_valid(tools, db_pool):
    """insert_record should create a record and return it."""
    result = await tools["insert_record"]("knowledge_entries", {
        "title": "Test Entry",
        "content": "Test content for integration test",
        "domain": "test",
        "source_type": "manual",
    })
    data = json.loads(result)
    assert "id" in data
    assert data["title"] == "Test Entry"

    # Cleanup
    async with db_pool.acquire() as conn:
        await conn.execute(
            "DELETE FROM knowledge_entries WHERE id = $1::uuid", data["id"]
        )


@pytest.mark.asyncio
async def test_get_schema_all_tables(tools):
    """get_schema without table should return list of all tables."""
    result = await tools["get_schema"]()
    data = json.loads(result)
    assert isinstance(data, list)
    table_names = [t["table"] for t in data]
    assert "projects" in table_names
    assert "tasks" in table_names


@pytest.mark.asyncio
async def test_get_schema_specific_table(tools):
    """get_schema with table name should return column details."""
    result = await tools["get_schema"]("projects")
    data = json.loads(result)
    assert data["table"] == "projects"
    assert "columns" in data
    col_names = [c["name"] for c in data["columns"]]
    assert "id" in col_names
    assert "name" in col_names
    assert "slug" in col_names


@pytest.mark.asyncio
async def test_get_schema_nonexistent_table(tools):
    """get_schema with invalid table should return error."""
    result = await tools["get_schema"]("nonexistent_table_xyz")
    data = json.loads(result)
    assert "error" in data
