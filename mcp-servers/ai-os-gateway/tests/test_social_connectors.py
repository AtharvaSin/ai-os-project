"""Test suite for LinkedIn and Meta social media connectors.

Tests the full workflow: OAuth token management, posting, metrics retrieval,
and database logging. Uses mocked HTTP responses (no real API keys needed).

Run: cd mcp-servers/ai-os-gateway && python -m pytest tests/test_social_connectors.py -v
  or: python tests/test_social_connectors.py  (standalone)
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from unittest.mock import AsyncMock, MagicMock, patch, PropertyMock
from typing import Any

# ---------------------------------------------------------------------------
# Standalone runner setup — add project root to path
# ---------------------------------------------------------------------------
_project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _project_root not in sys.path:
    sys.path.insert(0, _project_root)


# ---------------------------------------------------------------------------
# Mock asyncpg pool + connection for DB operations
# ---------------------------------------------------------------------------
class MockConnection:
    """Simulates asyncpg connection with execute/fetchrow/fetchval."""

    def __init__(self):
        self.executed: list[tuple[str, tuple]] = []
        self._fetchrow_result: dict | None = None

    async def execute(self, query: str, *args):
        self.executed.append((query, args))

    async def fetchrow(self, query: str, *args):
        self.executed.append((query, args))
        return self._fetchrow_result

    async def fetchval(self, query: str, *args):
        return 1


class MockPool:
    """Simulates asyncpg connection pool."""

    def __init__(self):
        self.conn = MockConnection()

    def acquire(self):
        return _AsyncContextManager(self.conn)


class _AsyncContextManager:
    def __init__(self, obj):
        self.obj = obj

    async def __aenter__(self):
        return self.obj

    async def __aexit__(self, *args):
        pass


# ---------------------------------------------------------------------------
# Test fixtures
# ---------------------------------------------------------------------------
def _make_pool() -> MockPool:
    return MockPool()


def _mock_social_account(
    platform: str = "linkedin",
    account_id: str = "test-person-123",
    token: str = "mock-access-token-xxx",
    refresh: str = "mock-refresh-token-yyy",
) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "platform": platform,
        "account_name": f"Test {platform.title()} Account",
        "account_id": account_id,
        "access_token": token,
        "refresh_token": refresh,
        "token_expires_at": datetime.now(tz=timezone.utc) + timedelta(days=30),
        "scopes": ["w_member_social", "r_liteprofile"],
        "metadata": json.dumps({"ig_user_id": account_id}) if platform == "instagram" else "{}",
    }


# ---------------------------------------------------------------------------
# Test 1: Social OAuth — Token retrieval & caching
# ---------------------------------------------------------------------------
async def test_token_retrieval():
    """Verify get_access_token loads from DB and caches."""
    print("\n=== Test 1: Token Retrieval & Caching ===")

    pool = _make_pool()
    account = _mock_social_account()

    # Mock fetchrow to return account data
    # We need to mock the module-level function
    with patch("app.auth.social_oauth.get_active_account", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = account

        from app.auth.social_oauth import get_access_token, clear_token_cache
        clear_token_cache()

        token = await get_access_token(pool, "linkedin")
        assert token == "mock-access-token-xxx", f"Expected mock token, got {token}"
        print("  [PASS] Token loaded from DB")

        # Second call should use cache (get_active_account not called again)
        mock_get.reset_mock()
        token2 = await get_access_token(pool, "linkedin")
        assert token2 == "mock-access-token-xxx"
        mock_get.assert_not_called()
        print("  [PASS] Token served from cache on second call")

        clear_token_cache()
        print("  [PASS] Cache cleared successfully")


# ---------------------------------------------------------------------------
# Test 2: Social OAuth — Token refresh (LinkedIn)
# ---------------------------------------------------------------------------
async def test_linkedin_token_refresh():
    """Verify LinkedIn token refresh when near expiry."""
    print("\n=== Test 2: LinkedIn Token Refresh ===")

    pool = _make_pool()
    expired_account = _mock_social_account()
    expired_account["token_expires_at"] = datetime.now(tz=timezone.utc) + timedelta(hours=12)  # Within 24h buffer

    os.environ["LINKEDIN_CLIENT_ID"] = "test-client-id"
    os.environ["LINKEDIN_CLIENT_SECRET"] = "test-client-secret"

    mock_refresh_response = MagicMock()
    mock_refresh_response.status_code = 200
    mock_refresh_response.json.return_value = {
        "access_token": "new-refreshed-token-zzz",
        "expires_in": 5184000,
        "refresh_token": "new-refresh-token",
    }

    with patch("app.auth.social_oauth.get_active_account", new_callable=AsyncMock) as mock_get, \
         patch("httpx.AsyncClient") as mock_client_cls:

        mock_get.return_value = expired_account

        # Mock httpx.AsyncClient context manager
        mock_client = AsyncMock()
        mock_client.post = AsyncMock(return_value=mock_refresh_response)
        mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

        from app.auth.social_oauth import get_access_token, clear_token_cache, _update_token_in_db
        clear_token_cache()

        with patch("app.auth.social_oauth._update_token_in_db", new_callable=AsyncMock) as mock_update:
            token = await get_access_token(pool, "linkedin")
            assert token == "new-refreshed-token-zzz", f"Expected refreshed token, got {token}"
            mock_update.assert_called_once()
            print("  [PASS] Token refreshed when near expiry")
            print("  [PASS] DB updated with new token")

    # Cleanup env
    os.environ.pop("LINKEDIN_CLIENT_ID", None)
    os.environ.pop("LINKEDIN_CLIENT_SECRET", None)
    from app.auth.social_oauth import clear_token_cache
    clear_token_cache()


# ---------------------------------------------------------------------------
# Test 3: LinkedIn — Post to LinkedIn
# ---------------------------------------------------------------------------
async def test_post_to_linkedin():
    """Verify LinkedIn posting workflow end-to-end."""
    print("\n=== Test 3: Post to LinkedIn ===")

    pool = _make_pool()
    account = _mock_social_account()

    mock_api_response = {"created": True, "post_id": "urn:li:share:7170000000000001"}

    with patch("app.auth.social_oauth.get_access_token", new_callable=AsyncMock, return_value="mock-token"), \
         patch("app.auth.social_oauth.get_active_account", new_callable=AsyncMock, return_value=account), \
         patch("app.auth.social_oauth.log_social_post", new_callable=AsyncMock, return_value="log-id-123"):

        # Mock httpx for the LinkedIn API call
        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.headers = {"x-restli-id": "urn:li:share:7170000000000001"}
        mock_response.json.return_value = mock_api_response

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.request = AsyncMock(return_value=mock_response)
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            # Import and register tools on a mock MCP
            from fastmcp import FastMCP
            test_mcp = FastMCP(name="test-linkedin")
            from app.modules.linkedin import register_tools
            register_tools(test_mcp, lambda: pool)

            # Call the post tool via call_tool
            tool_result = await test_mcp.call_tool(
                "post_to_linkedin",
                {"content": "Test post from AI OS social connector!", "visibility": "PUBLIC"},
            )
            result_str = tool_result.content[0].text
            result = json.loads(result_str)

            assert result.get("posted") is True, f"Expected posted=True, got {result}"
            assert "urn:li:share" in result.get("post_id", ""), f"Expected post URN, got {result}"
            assert result.get("post_url", "").startswith("https://"), f"Expected URL, got {result}"
            print(f"  [PASS] Post created: {result['post_id']}")
            print(f"  [PASS] Post URL: {result['post_url']}")
            print(f"  [PASS] Timestamp: {result['timestamp']}")
            print(f"  [PASS] Related tools: {result['_meta']['related_tools']}")


# ---------------------------------------------------------------------------
# Test 4: LinkedIn — Get metrics
# ---------------------------------------------------------------------------
async def test_linkedin_metrics():
    """Verify LinkedIn metrics retrieval."""
    print("\n=== Test 4: LinkedIn Post Metrics ===")

    pool = _make_pool()
    account = _mock_social_account()

    mock_actions_response = MagicMock()
    mock_actions_response.status_code = 200
    mock_actions_response.json.return_value = {
        "likesSummary": {"totalLikes": 42},
        "commentsSummary": {"totalFirstLevelComments": 7},
    }

    mock_stats_response = MagicMock()
    mock_stats_response.status_code = 200
    mock_stats_response.json.return_value = {
        "elements": [{"totalShareStatistics": {"impressionCount": 1500, "shareCount": 12}}],
    }

    call_count = 0

    async def mock_request(method, url, **kwargs):
        nonlocal call_count
        call_count += 1
        if "socialActions" in url:
            return mock_actions_response
        return mock_stats_response

    with patch("app.auth.social_oauth.get_access_token", new_callable=AsyncMock, return_value="mock-token"), \
         patch("app.auth.social_oauth.get_active_account", new_callable=AsyncMock, return_value=account):

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.request = mock_request
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            from fastmcp import FastMCP
            test_mcp = FastMCP(name="test-linkedin-metrics")
            from app.modules.linkedin import register_tools
            register_tools(test_mcp, lambda: pool)

            tool_result = await test_mcp.call_tool(
                "get_linkedin_metrics",
                {"post_id": "urn:li:share:7170000000000001"},
            )
            result_str = tool_result.content[0].text
            result = json.loads(result_str)

            assert result["likes"] == 42, f"Expected 42 likes, got {result['likes']}"
            assert result["comments"] == 7
            assert result["impressions"] == 1500
            assert result["shares"] == 12
            print(f"  [PASS] Likes: {result['likes']}")
            print(f"  [PASS] Comments: {result['comments']}")
            print(f"  [PASS] Shares: {result['shares']}")
            print(f"  [PASS] Impressions: {result['impressions']}")


# ---------------------------------------------------------------------------
# Test 5: Facebook — Post to Page
# ---------------------------------------------------------------------------
async def test_post_to_facebook():
    """Verify Facebook Page posting workflow."""
    print("\n=== Test 5: Post to Facebook Page ===")

    pool = _make_pool()
    fb_account = _mock_social_account(platform="facebook", account_id="123456789")

    mock_fb_response = MagicMock()
    mock_fb_response.status_code = 200
    mock_fb_response.json.return_value = {"id": "123456789_987654321"}

    with patch("app.auth.social_oauth.get_access_token", new_callable=AsyncMock, return_value="mock-fb-token"), \
         patch("app.auth.social_oauth.get_active_account", new_callable=AsyncMock, return_value=fb_account), \
         patch("app.auth.social_oauth.log_social_post", new_callable=AsyncMock, return_value="log-id"):

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=mock_fb_response)
            mock_client.get = AsyncMock(return_value=mock_fb_response)
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            from fastmcp import FastMCP
            test_mcp = FastMCP(name="test-meta")
            from app.modules.meta import register_tools
            register_tools(test_mcp, lambda: pool)

            tool_result = await test_mcp.call_tool(
                "post_to_facebook",
                {"message": "Test Facebook post from AI OS!", "link": "https://example.com"},
            )
            result_str = tool_result.content[0].text
            result = json.loads(result_str)

            assert result.get("posted") is True, f"Expected posted=True, got {result}"
            assert result.get("post_id") == "123456789_987654321"
            assert result.get("_meta", {}).get("platform") == "facebook"
            print(f"  [PASS] Post created: {result['post_id']}")
            print(f"  [PASS] Post URL: {result['post_url']}")
            print(f"  [PASS] Platform confirmed: {result['_meta']['platform']}")


# ---------------------------------------------------------------------------
# Test 6: Instagram — Two-step post (container + publish)
# ---------------------------------------------------------------------------
async def test_post_to_instagram():
    """Verify Instagram two-step posting (container creation + publish)."""
    print("\n=== Test 6: Post to Instagram (Two-Step) ===")

    pool = _make_pool()
    ig_account = _mock_social_account(platform="instagram", account_id="ig-user-456")
    ig_account["metadata"] = json.dumps({"ig_user_id": "ig-user-456"})

    # Step 1: container creation response
    container_response = MagicMock()
    container_response.status_code = 200
    container_response.json.return_value = {"id": "container-789"}

    # Step 2: publish response
    publish_response = MagicMock()
    publish_response.status_code = 200
    publish_response.json.return_value = {"id": "17890000000000001"}

    call_sequence = []

    async def mock_post(url, **kwargs):
        call_sequence.append(url)
        if "/media_publish" in url:
            return publish_response
        return container_response

    with patch("app.auth.social_oauth.get_access_token", new_callable=AsyncMock, return_value="mock-ig-token"), \
         patch("app.auth.social_oauth.get_active_account", new_callable=AsyncMock, return_value=ig_account), \
         patch("app.auth.social_oauth.log_social_post", new_callable=AsyncMock, return_value="log-id"):

        with patch("httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post = mock_post
            mock_client.get = AsyncMock(return_value=container_response)
            mock_client_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            from fastmcp import FastMCP
            test_mcp = FastMCP(name="test-instagram")
            from app.modules.meta import register_tools
            register_tools(test_mcp, lambda: pool)

            tool_result = await test_mcp.call_tool(
                "post_to_instagram",
                {
                    "caption": "AI-powered workflow automation #AI #tech",
                    "image_url": "https://example.com/test-image.jpg",
                },
            )
            result_str = tool_result.content[0].text
            result = json.loads(result_str)

            assert result.get("posted") is True, f"Expected posted=True, got {result}"
            assert result.get("post_id") == "17890000000000001"
            assert len(call_sequence) == 2, f"Expected 2 API calls (container+publish), got {len(call_sequence)}"
            print(f"  [PASS] Container created (step 1)")
            print(f"  [PASS] Post published (step 2): {result['post_id']}")
            print(f"  [PASS] Two-step API flow verified ({len(call_sequence)} calls)")


# ---------------------------------------------------------------------------
# Test 7: Social post logging
# ---------------------------------------------------------------------------
async def test_social_post_logging():
    """Verify posts are logged to social_post_log table."""
    print("\n=== Test 7: Social Post Logging ===")

    pool = _make_pool()
    account = _mock_social_account()

    with patch("app.auth.social_oauth.get_active_account", new_callable=AsyncMock, return_value=account):
        from app.auth.social_oauth import log_social_post

        log_id = await log_social_post(
            pool,
            platform="linkedin",
            content_preview="Test post content for logging",
            content_type="post",
            external_post_id="urn:li:share:123",
            external_url="https://linkedin.com/feed/update/urn:li:share:123/",
            status="published",
            metadata={"visibility": "PUBLIC"},
        )

        assert log_id is not None and len(log_id) == 36, f"Expected UUID, got {log_id}"
        assert len(pool.conn.executed) > 0, "Expected DB insert"
        insert_query = pool.conn.executed[-1][0]
        assert "social_post_log" in insert_query, f"Expected insert into social_post_log, got {insert_query}"
        print(f"  [PASS] Log entry created: {log_id}")
        print(f"  [PASS] DB insert verified: social_post_log table")


# ---------------------------------------------------------------------------
# Test 8: Error handling — no account configured
# ---------------------------------------------------------------------------
async def test_no_account_error():
    """Verify graceful error when no social account is configured."""
    print("\n=== Test 8: Error Handling — No Account ===")

    pool = _make_pool()

    with patch("app.auth.social_oauth.get_active_account", new_callable=AsyncMock, return_value=None):
        from app.auth.social_oauth import get_access_token, clear_token_cache
        clear_token_cache()

        try:
            await get_access_token(pool, "linkedin")
            assert False, "Expected RuntimeError"
        except RuntimeError as exc:
            assert "No active linkedin account" in str(exc)
            print(f"  [PASS] RuntimeError raised: {exc}")


# ---------------------------------------------------------------------------
# Test 9: Tool registration — all tools registered correctly
# ---------------------------------------------------------------------------
async def test_tool_registration():
    """Verify all LinkedIn and Meta tools register on MCP server."""
    print("\n=== Test 9: Tool Registration ===")

    from fastmcp import FastMCP

    test_mcp = FastMCP(name="test-registration")
    pool = _make_pool()

    from app.modules.linkedin import register_tools as register_linkedin
    from app.modules.meta import register_tools as register_meta

    register_linkedin(test_mcp, lambda: pool)
    register_meta(test_mcp, lambda: pool)

    tools = await test_mcp.list_tools()
    tool_names = {t.name for t in tools}

    expected_tools = {
        # LinkedIn (4 tools)
        "post_to_linkedin",
        "get_linkedin_metrics",
        "list_linkedin_posts",
        "get_linkedin_profile",
        # Meta (4 tools)
        "post_to_facebook",
        "post_to_instagram",
        "get_meta_metrics",
        "list_meta_posts",
    }

    for expected in expected_tools:
        assert expected in tool_names, f"Missing tool: {expected}"
        print(f"  [PASS] {expected}")

    print(f"\n  Total tools registered: {len(tool_names)} (expected {len(expected_tools)})")


# ---------------------------------------------------------------------------
# Test 10: Full cross-post workflow
# ---------------------------------------------------------------------------
async def test_cross_post_workflow():
    """Simulate a full cross-post: LinkedIn + Facebook + Instagram."""
    print("\n=== Test 10: Full Cross-Post Workflow ===")

    pool = _make_pool()
    results = {}

    # Mock all accounts
    accounts = {
        "linkedin": _mock_social_account(platform="linkedin"),
        "facebook": _mock_social_account(platform="facebook", account_id="page-123"),
        "instagram": _mock_social_account(platform="instagram", account_id="ig-456"),
    }
    accounts["instagram"]["metadata"] = json.dumps({"ig_user_id": "ig-456"})

    # Mock API responses per platform
    linkedin_resp = MagicMock()
    linkedin_resp.status_code = 201
    linkedin_resp.headers = {"x-restli-id": "urn:li:share:cross-001"}
    linkedin_resp.json.return_value = {"created": True, "post_id": "urn:li:share:cross-001"}

    facebook_resp = MagicMock()
    facebook_resp.status_code = 200
    facebook_resp.json.return_value = {"id": "page-123_post-002"}

    ig_container_resp = MagicMock()
    ig_container_resp.status_code = 200
    ig_container_resp.json.return_value = {"id": "container-003"}

    ig_publish_resp = MagicMock()
    ig_publish_resp.status_code = 200
    ig_publish_resp.json.return_value = {"id": "ig-post-004"}

    async def mock_get_account(pool, platform):
        return accounts.get(platform)

    async def mock_get_token(pool, platform):
        return f"mock-{platform}-token"

    with patch("app.auth.social_oauth.get_access_token", side_effect=mock_get_token), \
         patch("app.auth.social_oauth.get_active_account", side_effect=mock_get_account), \
         patch("app.auth.social_oauth.log_social_post", new_callable=AsyncMock, return_value="log-id"):

        # 1. Post to LinkedIn
        with patch("httpx.AsyncClient") as mock_cls:
            mock_client = AsyncMock()
            mock_client.request = AsyncMock(return_value=linkedin_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            from fastmcp import FastMCP
            mcp_li = FastMCP(name="crosspost-li")
            from app.modules.linkedin import register_tools as reg_li
            reg_li(mcp_li, lambda: pool)
            tr = await mcp_li.call_tool("post_to_linkedin", {"content": "Cross-post test!"})
            r = json.loads(tr.content[0].text)
            results["linkedin"] = r
            print(f"  [PASS] LinkedIn: {r.get('post_id', 'N/A')}")

        # 2. Post to Facebook
        with patch("httpx.AsyncClient") as mock_cls:
            mock_client = AsyncMock()
            mock_client.post = AsyncMock(return_value=facebook_resp)
            mock_client.get = AsyncMock(return_value=facebook_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            mcp_fb = FastMCP(name="crosspost-fb")
            from app.modules.meta import register_tools as reg_meta
            reg_meta(mcp_fb, lambda: pool)
            tr = await mcp_fb.call_tool("post_to_facebook", {"message": "Cross-post test!"})
            r = json.loads(tr.content[0].text)
            results["facebook"] = r
            print(f"  [PASS] Facebook: {r.get('post_id', 'N/A')}")

        # 3. Post to Instagram
        call_idx = [0]
        ig_responses = [ig_container_resp, ig_publish_resp]

        async def ig_mock_post(url, **kwargs):
            resp = ig_responses[min(call_idx[0], 1)]
            call_idx[0] += 1
            return resp

        with patch("httpx.AsyncClient") as mock_cls:
            mock_client = AsyncMock()
            mock_client.post = ig_mock_post
            mock_client.get = AsyncMock(return_value=ig_container_resp)
            mock_cls.return_value.__aenter__ = AsyncMock(return_value=mock_client)
            mock_cls.return_value.__aexit__ = AsyncMock(return_value=False)

            mcp_ig = FastMCP(name="crosspost-ig")
            from app.modules.meta import register_tools as reg_meta2
            reg_meta2(mcp_ig, lambda: pool)
            tr = await mcp_ig.call_tool(
                "post_to_instagram",
                {"caption": "Cross-post test!", "image_url": "https://example.com/img.jpg"},
            )
            r = json.loads(tr.content[0].text)
            results["instagram"] = r
            print(f"  [PASS] Instagram: {r.get('post_id', 'N/A')}")

    # Verify all succeeded
    for platform, r in results.items():
        assert r.get("posted") is True, f"{platform} posting failed: {r}"
    print(f"\n  [PASS] Cross-post complete: {len(results)} platforms posted successfully")


# ---------------------------------------------------------------------------
# Runner
# ---------------------------------------------------------------------------
async def run_all_tests():
    """Run all tests sequentially."""
    print("=" * 70)
    print("  AI OS Social Connectors — Test Suite")
    print("  LinkedIn + Meta (Facebook/Instagram) MCP Gateway Modules")
    print("=" * 70)

    tests = [
        test_token_retrieval,
        test_linkedin_token_refresh,
        test_post_to_linkedin,
        test_linkedin_metrics,
        test_post_to_facebook,
        test_post_to_instagram,
        test_social_post_logging,
        test_no_account_error,
        test_tool_registration,
        test_cross_post_workflow,
    ]

    passed = 0
    failed = 0

    for test_fn in tests:
        try:
            await test_fn()
            passed += 1
        except Exception as exc:
            print(f"\n  [FAIL] {test_fn.__name__}: {exc}")
            import traceback
            traceback.print_exc()
            failed += 1

    print("\n" + "=" * 70)
    print(f"  Results: {passed} passed, {failed} failed, {passed + failed} total")
    print("=" * 70)

    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
