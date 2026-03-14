"""Configuration and database connection management for AI OS MCP Gateway."""

import os
import asyncpg
from dotenv import load_dotenv

# Load .env for local development
load_dotenv()

_db_pool: asyncpg.Pool | None = None
_api_key: str | None = None


def _is_cloud_run() -> bool:
    """Detect if running on Cloud Run."""
    return os.getenv("K_SERVICE") is not None


async def _load_api_key() -> str:
    """Load API key from env or Secret Manager."""
    key = os.getenv("MCP_GATEWAY_API_KEY") or os.getenv("API_KEY")
    if key:
        return key

    if _is_cloud_run():
        from google.cloud import secretmanager
        client = secretmanager.SecretManagerServiceClient()
        name = "projects/ai-operating-system-490208/secrets/MCP_GATEWAY_API_KEY/versions/latest"
        response = client.access_secret_version(request={"name": name})
        return response.payload.data.decode("utf-8")

    raise ValueError("MCP_GATEWAY_API_KEY not configured")


async def init_db_pool() -> None:
    """Initialize the asyncpg connection pool."""
    global _db_pool, _api_key

    _api_key = await _load_api_key()

    db_name = os.getenv("DB_NAME", "ai_os")
    db_user = os.getenv("DB_USER", "ai_os_admin")
    db_password = os.getenv("DB_PASSWORD", os.getenv("AI_OS_DB_PASSWORD", ""))

    socket_path = os.getenv("DB_SOCKET_PATH")
    db_host = os.getenv("DB_HOST")

    if socket_path and not db_host:
        # Cloud Run: connect via Unix socket (Auth Proxy sidecar handles TLS)
        dsn = f"postgresql://{db_user}:{db_password}@/{db_name}?host={socket_path}"
        _db_pool = await asyncpg.create_pool(
            dsn=dsn,
            min_size=1,
            max_size=5,
            ssl=False,
        )
    else:
        # Local dev: connect via TCP through cloud-sql-proxy (proxy handles TLS)
        _db_pool = await asyncpg.create_pool(
            host=db_host or "localhost",
            port=int(os.getenv("DB_PORT", "5432")),
            database=db_name,
            user=db_user,
            password=db_password,
            min_size=1,
            max_size=5,
            ssl=False,
        )


def get_db_pool() -> asyncpg.Pool:
    """Get the database connection pool."""
    if _db_pool is None:
        raise RuntimeError("Database pool not initialized. Call init_db_pool() first.")
    return _db_pool


def get_api_key() -> str:
    """Get the API key for bearer auth."""
    if _api_key is None:
        raise RuntimeError("API key not loaded. Call init_db_pool() first.")
    return _api_key


async def close_db_pool() -> None:
    """Close the database connection pool."""
    global _db_pool
    if _db_pool:
        await _db_pool.close()
        _db_pool = None


def get_google_credentials():
    """Get Google OAuth credentials. Returns None until Phase 2 is configured."""
    try:
        from app.auth.google_oauth import load_credentials
        return load_credentials()
    except Exception:
        return None
