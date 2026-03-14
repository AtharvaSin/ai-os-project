# Custom MCP Servers

Each subdirectory is a self-contained MCP server deployed on Cloud Run.

## Architecture
MCP servers use Streamable HTTP transport — they run as remote containers accessible over the network.
Claude connects to them via custom connector URLs in the Claude.ai connector settings.

## Planned Servers

### supabase-mcp/
**Purpose:** Give Claude direct read/write access to the AI OS Supabase database.
**Capabilities:** Query tables, insert/update records, read workflow execution logs, check schema.
**Transport:** Streamable HTTP
**Deploy:** Cloud Run (asia-south1)
**Status:** Not started

### bharatvarsh-lore-mcp/
**Purpose:** Semantic search over Bharatvarsh novel lore using pgvector embeddings.
**Capabilities:** Query lore by topic, character, faction, timeline period. Returns grounded context for content generation.
**Transport:** Streamable HTTP
**Deploy:** Cloud Run (asia-south1)
**Data:** pgvector table in Supabase with embedded lore chunks
**Status:** Not started (Sprint 4)
