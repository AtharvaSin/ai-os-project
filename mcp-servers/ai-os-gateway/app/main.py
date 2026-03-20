"""AI OS MCP Gateway — FastAPI + FastMCP server.

Single Cloud Run service providing MCP tool access to the ai_os database
and Google workspace integrations. Accessible from Claude.ai, Claude Code,
and Category B/C workflows.
"""

import contextlib
import json
import logging

from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.types import ASGIApp, Receive, Scope, Send
from fastmcp import FastMCP

from app import config
from app.auth.bearer import verify_bearer_token
from app.modules import postgres, google_tasks, drive_write, drive_read, calendar_sync, telegram, life_graph, capture, contacts, bharatvarsh, composite, media_gen, linkedin, meta, creative_writer
from app.telegram.webhook import router as telegram_router

logger = logging.getLogger(__name__)


# Create FastMCP server
mcp = FastMCP(name="AI-OS-Gateway")

# Register all module tools
postgres.register_tools(mcp, config.get_db_pool)
google_tasks.register_tools(mcp, config.get_db_pool)
drive_write.register_tools(mcp, config.get_db_pool)
drive_read.register_tools(mcp, config.get_db_pool)
calendar_sync.register_tools(mcp, config.get_db_pool)
telegram.register_tools(mcp, config.get_db_pool)
life_graph.register_tools(mcp, config.get_db_pool)
capture.register_tools(mcp, config.get_db_pool)
contacts.register_tools(mcp, config.get_db_pool)
bharatvarsh.register_tools(mcp, config.get_db_pool)
composite.register_tools(mcp, config.get_db_pool)
media_gen.register_tools(mcp, config.get_db_pool)
linkedin.register_tools(mcp, config.get_db_pool)
meta.register_tools(mcp, config.get_db_pool)
creative_writer.register_tools(mcp, config.get_db_pool)

# Create the MCP HTTP sub-app (stateless — no session persistence needed)
# path="/mcp" so the sub-app handles /mcp directly (no 307 redirect)
mcp_app = mcp.http_app(path="/mcp", stateless_http=True)


class MCPAuthMiddleware:
    """Pure ASGI middleware for bearer auth on /mcp endpoints.

    Unlike BaseHTTPMiddleware, this does NOT eagerly read the request body,
    which avoids stalling/timeouts on larger payloads.

    Auth is optional: if an Authorization header is present, it MUST be
    valid. If absent, the request passes through (allows Claude.ai
    custom connectors which don't send Bearer tokens).
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        path = scope.get("path", "")
        if not path.startswith("/mcp"):
            await self.app(scope, receive, send)
            return

        # Extract Authorization header from raw ASGI headers
        auth_value = None
        for header_name, header_val in scope.get("headers", []):
            if header_name == b"authorization":
                auth_value = header_val.decode("latin-1")
                break

        if auth_value:
            # Validate bearer token
            parts = auth_value.split(" ", 1)
            if len(parts) != 2 or parts[0].lower() != "bearer":
                response = JSONResponse(
                    status_code=401,
                    content={"error": "Invalid Authorization format", "code": "AUTH_INVALID"},
                )
                await response(scope, receive, send)
                return

            from app.config import get_api_key
            if parts[1] != get_api_key():
                response = JSONResponse(
                    status_code=401,
                    content={"error": "Invalid API key", "code": "AUTH_DENIED"},
                )
                await response(scope, receive, send)
                return

        # Auth OK (or no auth header) — pass through without touching body
        await self.app(scope, receive, send)


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

# Auth middleware for /mcp endpoints (pure ASGI — no body buffering)
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
        "version": "0.2.0",
        "database": db_status,
        "google_oauth": google_status,
        "modules": ["postgres", "google_tasks", "drive_write", "drive_read", "calendar_sync", "telegram", "life_graph", "capture", "contacts", "bharatvarsh", "composite", "media_gen", "linkedin", "meta", "creative_writer"],
    }


# No OAuth discovery endpoints defined — all return 404 via FastAPI default.
# This correctly tells MCP clients (including Claude.ai) that no OAuth is required.


# --- Direct HTTP upload endpoint (bypasses MCP parameter transport) ---

@app.post("/api/upload")
async def api_upload_file(
    file: UploadFile = File(...),
    project_slug: str = Form(...),
    subfolder: str | None = Form(None),
    mime_type: str | None = Form(None),
    request: Request = None,
):
    """Upload a BINARY file to Google Drive via multipart form data.

    USE THIS for: DOCX, PDF, XLSX, PPTX, images (PNG/JPG/SVG), ZIP, and
    any non-text file. Sends raw bytes — no base64 encoding needed.

    For plain-text files (Markdown, JSON, YAML, code), use the MCP tool
    upload_file with file_content instead.

    Usage from Claude Code:
        curl -X POST https://ai-os-gateway-1054489801008.asia-south1.run.app/api/upload \
          -H "Authorization: Bearer $MCP_GATEWAY_API_KEY" \
          -F "file=@document.docx" \
          -F "project_slug=ai-operating-system" \
          -F "subfolder=PRDs"

    Form fields:
        file (required): The binary file to upload.
        project_slug (required): Target project (ai-operating-system, bharatvarsh, ai-and-u, zealogics).
        subfolder (optional): Drive subfolder name (PRDs, Architecture, Marketing, etc.).
        mime_type (optional): Override auto-detected MIME type.

    Returns: JSON with artifact record including drive_url and drive_file_id.
    """
    from app.modules.drive_write import upload_file_bytes

    # Enforce bearer auth
    auth_header = request.headers.get("Authorization") if request else None
    if auth_header:
        try:
            await verify_bearer_token(request)
        except Exception as exc:
            status = getattr(exc, "status_code", 401)
            detail = getattr(exc, "detail", {"error": "Unauthorized"})
            return JSONResponse(status_code=status, content=detail)

    # Read the uploaded file bytes
    file_bytes = await file.read()
    if not file_bytes:
        return JSONResponse(
            status_code=400,
            content={"error": "Empty file"},
        )

    filename = file.filename or "upload"

    try:
        result = await upload_file_bytes(
            file_bytes=file_bytes,
            filename=filename,
            project_slug=project_slug,
            get_pool=config.get_db_pool,
            mime_type=mime_type,
            subfolder=subfolder,
        )
        return result
    except ValueError as exc:
        return JSONResponse(status_code=400, content={"error": str(exc)})
    except RuntimeError as exc:
        return JSONResponse(status_code=503, content={"error": str(exc)})
    except Exception as exc:
        return JSONResponse(status_code=500, content={"error": f"Upload failed: {exc}"})


# --- Telegram webhook router (BEFORE the catch-all mount) ---
app.include_router(telegram_router)


# --- Mount MCP sub-app LAST (catch-all at root) ---
# The sub-app handles /mcp internally. Mounted at "/" so that
# POST /mcp works directly without a 307 redirect.
app.mount("/", mcp_app)
