"""Configuration and database connection management for AI OS MCP Gateway."""

import os
import asyncpg
from dotenv import load_dotenv

# Load .env for local development
load_dotenv()

_db_pool: asyncpg.Pool | None = None
_api_key: str | None = None
_openai_api_key: str | None = None
_telegram_bot_token: str | None = None
_telegram_chat_id: str | None = None
_telegram_webhook_secret: str | None = None
_gemini_api_key: str | None = None
_linkedin_client_id: str | None = None
_linkedin_client_secret: str | None = None
_meta_app_id: str | None = None
_meta_app_secret: str | None = None


def _is_cloud_run() -> bool:
    """Detect if running on Cloud Run."""
    return os.getenv("K_SERVICE") is not None


def _load_secret(secret_id: str) -> str | None:
    """Load a secret from env or GCP Secret Manager."""
    value = os.getenv(secret_id)
    if value:
        return value

    if _is_cloud_run():
        try:
            from google.cloud import secretmanager
            client = secretmanager.SecretManagerServiceClient()
            name = f"projects/ai-operating-system-490208/secrets/{secret_id}/versions/latest"
            response = client.access_secret_version(request={"name": name})
            return response.payload.data.decode("utf-8")
        except Exception:
            return None

    return None


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


async def _load_google_oauth_env() -> None:
    """Load Google OAuth secrets from Secret Manager into env vars.

    On Cloud Run, the 3 Google OAuth secrets are in Secret Manager.
    This loads them into environment so google_oauth.py can find them.
    """
    if not _is_cloud_run():
        return

    oauth_secrets = ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GOOGLE_REFRESH_TOKEN"]
    for secret_id in oauth_secrets:
        if not os.getenv(secret_id):
            value = _load_secret(secret_id)
            if value:
                os.environ[secret_id] = value


def _load_openai_env() -> None:
    """Load OpenAI API key from Secret Manager into env vars.

    On Cloud Run, OPENAI_API_KEY is in Secret Manager.
    Locally, it is expected in .env or the environment.
    """
    key = _load_secret("OPENAI_API_KEY")
    if key:
        os.environ.setdefault("OPENAI_API_KEY", key)


def get_openai_api_key() -> str | None:
    """Get the OpenAI API key, loading from env or Secret Manager on first call."""
    global _openai_api_key
    if _openai_api_key:
        return _openai_api_key
    _openai_api_key = os.environ.get("OPENAI_API_KEY") or _load_secret("OPENAI_API_KEY")
    return _openai_api_key


def _load_anthropic_env() -> None:
    """Load Anthropic API key from Secret Manager into env vars.

    On Cloud Run, ANTHROPIC_API_KEY is in Secret Manager.
    Locally, it is expected in .env or the environment.
    """
    key = _load_secret("ANTHROPIC_API_KEY")
    if key:
        os.environ.setdefault("ANTHROPIC_API_KEY", key)


def get_anthropic_api_key() -> str | None:
    """Get the Anthropic API key."""
    return os.environ.get("ANTHROPIC_API_KEY") or _load_secret("ANTHROPIC_API_KEY")


def _load_gemini_env() -> None:
    """Load Gemini API key from Secret Manager into env vars."""
    key = _load_secret("GEMINI_API_KEY")
    if key:
        os.environ.setdefault("GEMINI_API_KEY", key)


def _load_linkedin_env() -> None:
    """Load LinkedIn OAuth secrets from Secret Manager into env vars."""
    for secret_id in ["LINKEDIN_CLIENT_ID", "LINKEDIN_CLIENT_SECRET"]:
        if not os.getenv(secret_id):
            value = _load_secret(secret_id)
            if value:
                os.environ[secret_id] = value


def _load_meta_env() -> None:
    """Load Meta (Facebook/Instagram) app secrets from Secret Manager into env vars."""
    for secret_id in ["META_APP_ID", "META_APP_SECRET"]:
        if not os.getenv(secret_id):
            value = _load_secret(secret_id)
            if value:
                os.environ[secret_id] = value


def get_linkedin_client_id() -> str | None:
    """Get the LinkedIn Client ID."""
    global _linkedin_client_id
    if _linkedin_client_id:
        return _linkedin_client_id
    _linkedin_client_id = os.environ.get("LINKEDIN_CLIENT_ID") or _load_secret("LINKEDIN_CLIENT_ID")
    return _linkedin_client_id


def get_linkedin_client_secret() -> str | None:
    """Get the LinkedIn Client Secret."""
    global _linkedin_client_secret
    if _linkedin_client_secret:
        return _linkedin_client_secret
    _linkedin_client_secret = os.environ.get("LINKEDIN_CLIENT_SECRET") or _load_secret("LINKEDIN_CLIENT_SECRET")
    return _linkedin_client_secret


def get_meta_app_id() -> str | None:
    """Get the Meta App ID."""
    global _meta_app_id
    if _meta_app_id:
        return _meta_app_id
    _meta_app_id = os.environ.get("META_APP_ID") or _load_secret("META_APP_ID")
    return _meta_app_id


def get_meta_app_secret() -> str | None:
    """Get the Meta App Secret."""
    global _meta_app_secret
    if _meta_app_secret:
        return _meta_app_secret
    _meta_app_secret = os.environ.get("META_APP_SECRET") or _load_secret("META_APP_SECRET")
    return _meta_app_secret


def _load_telegram_env() -> None:
    """Load Telegram secrets from Secret Manager into env vars.

    On Cloud Run, the 3 Telegram secrets are injected via --set-secrets.
    Locally, they are expected in .env or the environment.
    """
    for secret_id in ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID", "TELEGRAM_WEBHOOK_SECRET"]:
        if not os.getenv(secret_id):
            value = _load_secret(secret_id)
            if value:
                os.environ[secret_id] = value


def get_telegram_bot_token() -> str:
    """Get the Telegram bot token."""
    global _telegram_bot_token
    if _telegram_bot_token:
        return _telegram_bot_token
    _telegram_bot_token = os.environ.get("TELEGRAM_BOT_TOKEN") or _load_secret("TELEGRAM_BOT_TOKEN")
    if not _telegram_bot_token:
        raise RuntimeError("TELEGRAM_BOT_TOKEN not configured")
    return _telegram_bot_token


def get_telegram_chat_id() -> str:
    """Get the authorized Telegram chat ID."""
    global _telegram_chat_id
    if _telegram_chat_id:
        return _telegram_chat_id
    _telegram_chat_id = os.environ.get("TELEGRAM_CHAT_ID") or _load_secret("TELEGRAM_CHAT_ID")
    if not _telegram_chat_id:
        raise RuntimeError("TELEGRAM_CHAT_ID not configured")
    return _telegram_chat_id


def get_telegram_webhook_secret() -> str:
    """Get the Telegram webhook secret token."""
    global _telegram_webhook_secret
    if _telegram_webhook_secret:
        return _telegram_webhook_secret
    _telegram_webhook_secret = os.environ.get("TELEGRAM_WEBHOOK_SECRET") or _load_secret("TELEGRAM_WEBHOOK_SECRET")
    if not _telegram_webhook_secret:
        raise RuntimeError("TELEGRAM_WEBHOOK_SECRET not configured")
    return _telegram_webhook_secret


def get_gemini_api_key() -> str | None:
    """Get the Google Gemini API key for image generation."""
    global _gemini_api_key
    if _gemini_api_key:
        return _gemini_api_key
    _gemini_api_key = os.environ.get("GEMINI_API_KEY") or _load_secret("GEMINI_API_KEY")
    return _gemini_api_key


async def init_db_pool() -> None:
    """Initialize the asyncpg connection pool."""
    global _db_pool, _api_key

    _api_key = await _load_api_key()
    await _load_google_oauth_env()
    _load_openai_env()
    _load_anthropic_env()
    _load_telegram_env()
    _load_gemini_env()
    _load_linkedin_env()
    _load_meta_env()

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
