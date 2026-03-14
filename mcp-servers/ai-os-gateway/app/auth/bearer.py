"""Bearer token authentication for MCP Gateway endpoints."""

from fastapi import Request, HTTPException


async def verify_bearer_token(request: Request) -> str:
    """FastAPI dependency to validate Bearer token authentication.

    Checks the Authorization header for a valid Bearer token
    matching the configured API key.
    """
    from app.config import get_api_key

    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=401,
            detail={"error": "Missing Authorization header", "code": "AUTH_MISSING"},
        )

    parts = auth_header.split(" ", 1)
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid Authorization format. Expected: Bearer <token>", "code": "AUTH_INVALID"},
        )

    token = parts[1]
    if token != get_api_key():
        raise HTTPException(
            status_code=401,
            detail={"error": "Invalid API key", "code": "AUTH_DENIED"},
        )

    return token
