"""Google Drive write integration for AI OS MCP Gateway.

Uploads Claude-generated documents to organized Drive folders and logs
artifact metadata in Cloud SQL. Drive folder hierarchy:
  AI OS/AI Operating System/{PRDs,Architecture,Decision Memos,Session Artifacts}/
  AI OS/AI&U/{Scripts,Thumbnails,Research}/
  AI OS/Bharatvarsh/{Marketing,Lore Docs,Content}/
  AI OS/Zealogics/{Project Docs,Deliverables}/

Phase 2: Full implementation pending Google OAuth setup.
"""

from fastmcp import FastMCP

NOT_CONFIGURED_MSG = (
    "Google OAuth not configured. This module requires GOOGLE_CLIENT_ID, "
    "GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN environment variables. "
    "See Phase 2 setup instructions."
)


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register Google Drive write tools on the MCP server."""

    @mcp.tool(
        description="Upload a file to Google Drive in the correct project folder. "
        "Resolves the target folder from project_slug and optional subfolder "
        "(e.g., 'PRDs', 'Architecture', 'Scripts'). "
        "Logs the artifact in Cloud SQL with drive_file_id and drive_url. "
        "Returns the artifact record with the Drive URL for sharing."
    )
    async def upload_file(
        file_content: str,
        filename: str,
        project_slug: str,
        subfolder: str | None = None,
    ) -> str:
        return NOT_CONFIGURED_MSG

    @mcp.tool(
        description="Create a Google Doc in the project's Drive folder. "
        "Converts content to Google Doc format for collaborative editing. "
        "Logs the artifact in Cloud SQL. Returns the Drive URL."
    )
    async def create_doc(
        title: str,
        content: str,
        project_slug: str,
        subfolder: str | None = None,
    ) -> str:
        return NOT_CONFIGURED_MSG

    @mcp.tool(
        description="Create a new folder in Google Drive. "
        "Can be nested under an existing parent path. "
        "Returns the folder ID and URL."
    )
    async def create_drive_folder(
        name: str,
        parent_path: str | None = None,
    ) -> str:
        return NOT_CONFIGURED_MSG
