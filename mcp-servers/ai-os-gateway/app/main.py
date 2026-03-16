"""AI OS MCP Gateway — FastAPI + FastMCP server.

Single Cloud Run service providing MCP tool access to the ai_os database
and Google workspace integrations. Accessible from Claude.ai, Claude Code,
and Category B/C workflows.
"""

import contextlib

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from fastmcp import FastMCP

from app import config
from app.auth.bearer import verify_bearer_token
from app.modules import postgres, google_tasks, drive_write, drive_read, calendar_sync, telegram
from app.telegram.webhook import router as telegram_router


# Create FastMCP server
mcp = FastMCP(name="AI-OS-Gateway")

# Register all module tools
postgres.register_tools(mcp, config.get_db_pool)
google_tasks.register_tools(mcp, config.get_db_pool)
drive_write.register_tools(mcp, config.get_db_pool)
drive_read.register_tools(mcp, config.get_db_pool)
calendar_sync.register_tools(mcp, config.get_db_pool)
telegram.register_tools(mcp, config.get_db_pool)

# Create the MCP HTTP sub-app (stateless — no session persistence needed)
# path="/mcp" so the sub-app handles /mcp directly (no 307 redirect)
mcp_app = mcp.http_app(path="/mcp", stateless_http=True)


class MCPAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce bearer auth on /mcp endpoints.

    Auth is optional: if an Authorization header is present, it MUST be
    valid. If absent, the request passes through (allows Claude.ai
    custom connectors which don't send Bearer tokens). Claude Code and
    other clients that send Bearer tokens get validated.
    """

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/mcp"):
            auth_header = request.headers.get("Authorization")
            if auth_header:
                try:
                    await verify_bearer_token(request)
                except Exception as exc:
                    status = getattr(exc, "status_code", 401)
                    detail = getattr(exc, "detail", {"error": "Unauthorized"})
                    return JSONResponse(status_code=status, content=detail)
        return await call_next(request)


@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown of DB pool + MCP session manager."""
    await config.init_db_pool()
    async with mcp_app.router.lifespan_context(app):
        yield
    await config.close_db_pool()


app = FastAPI(
    title="AI OS MCP Gateway",
    description="MCP tool bridge for Claude.ai, Claude Code, and AI OS workflows",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow all origins for MCP compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth middleware for /mcp endpoints
app.add_middleware(MCPAuthMiddleware)


# --- Explicit routes MUST be defined BEFORE the catch-all mount ---

@app.get("/health")
async def health():
    """Health check — verifies DB connectivity."""
    try:
        pool = config.get_db_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    google_status = "configured" if config.get_google_credentials() else "not configured"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "service": "ai-os-gateway",
        "version": "0.1.0",
        "database": db_status,
        "google_oauth": google_status,
        "modules": ["postgres", "google_tasks", "drive_write", "drive_read", "calendar_sync", "telegram"],
    }


# No OAuth discovery endpoints defined — all return 404 via FastAPI default.
# This correctly tells MCP clients (including Claude.ai) that no OAuth is required.


# --- Telegram webhook router (BEFORE the catch-all mount) ---
app.include_router(telegram_router)


# --- Mount MCP sub-app LAST (catch-all at root) ---
# The sub-app handles /mcp internally. Mounted at "/" so that
# POST /mcp works directly without a 307 redirect.
app.mount("/", mcp_app)
