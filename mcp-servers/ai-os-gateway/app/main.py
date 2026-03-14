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
from app.modules import postgres, google_tasks, drive_write, calendar_sync


# Create FastMCP server
mcp = FastMCP(name="AI-OS-Gateway")

# Register all module tools
postgres.register_tools(mcp, config.get_db_pool)
google_tasks.register_tools(mcp, config.get_db_pool)
drive_write.register_tools(mcp, config.get_db_pool)
calendar_sync.register_tools(mcp, config.get_db_pool)

# Create the MCP HTTP sub-app (stateless — no session persistence needed)
mcp_app = mcp.http_app(path="/", stateless_http=True)


class MCPAuthMiddleware(BaseHTTPMiddleware):
    """Middleware to enforce bearer auth on /mcp endpoints."""

    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/mcp"):
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

# CORS — allow Claude.ai domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://claude.ai",
        "https://claude.com",
        "http://localhost:3000",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth middleware for /mcp endpoints
app.add_middleware(MCPAuthMiddleware)

# Mount MCP server at /mcp
app.mount("/mcp", mcp_app)


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
        "modules": ["postgres", "google_tasks", "drive_write", "calendar_sync"],
    }
