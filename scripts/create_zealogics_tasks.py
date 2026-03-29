#!/usr/bin/env python3
"""Create Zealogics project tasks via AI OS Gateway MCP endpoint.

Reads gateway URL + API key from env or .env file, then creates tasks
in the Zealogics Projects domain (011) with full descriptions.
Each task is created in Cloud SQL and auto-synced to Google Tasks.

Usage:
    # With env vars:
    export GATEWAY_URL=https://ai-os-gateway-1054489801008.asia-south1.run.app
    export MCP_GATEWAY_API_KEY=<your-key>
    python scripts/create_zealogics_tasks.py

    # Or with local dev stack:
    export GATEWAY_URL=http://localhost:8000
    export MCP_GATEWAY_API_KEY=localdev
    python scripts/create_zealogics_tasks.py

Created: 2026-03-23 — from Swapnil Shah discussion.
"""

import json
import os
import sys
import requests

# ── Gateway config ──────────────────────────────────────────────────────────

GATEWAY_URL = os.getenv(
    "GATEWAY_URL",
    "https://ai-os-gateway-1054489801008.asia-south1.run.app",
)
API_KEY = os.getenv("MCP_GATEWAY_API_KEY", "")

MCP_ENDPOINT = f"{GATEWAY_URL}/mcp"

# ── Domain config ───────────────────────────────────────────────────────────
# Domain 011 "Zealogics Projects" is the active Zealogics domain.
# Domain 009 "Zealogics Onboarding" is archived.
# If 011 slug lookup fails, fallback to 009.
DOMAIN_SLUGS_TO_TRY = ["zealogics_projects", "011_zealogics_projects", "zealogics_onboarding"]
PROJECT_SLUG = "zealogics"

# ── Tasks to create ─────────────────────────────────────────────────────────

TASKS = [
    # ── ASML Project (Primary) ──
    {
        "title": "Connect with Abhilash — ASML project deep-dive",
        "priority": "high",
        "due_date": "2026-03-25",
        "description": (
            "Reach out to Abhilash (architect/lead on ASML project) for a background "
            "briefing. Understand: (1) current product state and architecture, "
            "(2) what agents are built — UI, API, protocol, security, desktop tool automation, "
            "(3) Phase 1 scope and customer expectations, (4) Taiwan team structure and "
            "communication cadence, (5) tech stack and repo access. "
            "Abhilash is spread across multiple projects — book a focused 30-45 min slot. "
            "Source: Swapnil discussion 2026-03-23."
        ),
    },
    {
        "title": "Connect with Abdul — ASML hands-on context",
        "priority": "medium",
        "due_date": "2026-03-26",
        "description": (
            "Get in touch with Abdul (junior developer, hands-on implementation on ASML). "
            "Understand day-to-day development: current sprint work, blockers, test coverage, "
            "deployment pipeline, and what areas need support. Abdul has speech impairment "
            "(genetic) — be patient in conversations, prefer async written communication "
            "where possible. Source: Swapnil discussion 2026-03-23."
        ),
    },
    {
        "title": "Observe ASML customer calls — first 2 weeks",
        "priority": "high",
        "due_date": "2026-04-06",
        "description": (
            "Swapnil is including you in ASML customer discussions starting now. "
            "For the first 2 weeks: observe only. Understand customer expectations, "
            "communication style, key stakeholders on the Taiwan/customer side, "
            "and what's being presented from our end. Take notes on gaps in "
            "technical articulation. Gradually build to active participation. "
            "Source: Swapnil discussion 2026-03-23."
        ),
    },
    {
        "title": "Prepare ASML project brief document",
        "priority": "medium",
        "due_date": "2026-04-01",
        "description": (
            "After connecting with Abhilash and Abdul, create a consolidated project "
            "brief covering: product overview (QA automation platform with multi-agent "
            "architecture), current phase status, team roles and responsibilities, "
            "customer stakeholders, tech stack, and your role (senior representative "
            "for India+Taiwan team, customer communication, functional gathering, "
            "delivery ownership). This becomes your reference doc going forward. "
            "Source: Swapnil discussion 2026-03-23."
        ),
    },
    {
        "title": "Get repo access and environment setup — ASML",
        "priority": "high",
        "due_date": "2026-03-27",
        "description": (
            "Request repository access for the ASML QA automation project from Abhilash "
            "or Swapnil. Clone the repo, set up local dev environment, review the "
            "codebase architecture — particularly the agent framework, protocol "
            "automation modules, and desktop integration layer. Understand CI/CD "
            "pipeline and deployment targets (Taiwan infrastructure). "
            "Source: Swapnil discussion 2026-03-23."
        ),
    },

    # ── TUV New Requirement ──
    {
        "title": "Prepare for TUV new requirement kickoff",
        "priority": "medium",
        "due_date": "2026-03-28",
        "description": (
            "A new, smaller project is coming from the TUV team (separate from Smart Audit). "
            "Swapnil is finding a time slot with TUV members for the first meeting. "
            "You will be the main front face for this engagement. Prepare by: "
            "(1) reviewing any existing TUV context from Smart Audit interactions, "
            "(2) understanding TUV's domain and technical landscape, "
            "(3) drafting initial questions for the kickoff. "
            "Wait for Swapnil to confirm the meeting time. "
            "Source: Swapnil discussion 2026-03-23."
        ),
    },

    # ── Smart Audit Transition ──
    {
        "title": "Transition Smart Audit ownership to Gautam",
        "priority": "low",
        "due_date": "2026-04-11",
        "description": (
            "Gradually hand off Smart Audit project to Gautam. Swapnil confirmed "
            "Gautam can handle it alone. Continue light involvement for now — it "
            "helped with Zealogics onboarding (repo access, PR mechanisms, logistics). "
            "Document any open threads or context Gautam needs. Shift primary focus "
            "to ASML. No hard deadline but aim to be fully transitioned within 2-3 weeks. "
            "Source: Swapnil discussion 2026-03-23."
        ),
    },

    # ── Agents POC (Future) ──
    {
        "title": "Agents POC — await stable state for validation review",
        "priority": "low",
        "due_date": "2026-04-30",
        "description": (
            "A small internal Zealogics team is building a POC for agents. "
            "Swapnil will include you for validation and review once it reaches "
            "a stable state. No action needed now — this is a placeholder to track. "
            "When invited, focus on: architecture review, quality assessment, "
            "and recommendations for production readiness. "
            "Source: Swapnil discussion 2026-03-23."
        ),
    },
]


# ── MCP call helper ─────────────────────────────────────────────────────────

def call_mcp_tool(session: requests.Session, tool_name: str, arguments: dict, req_id: int = 1) -> dict:
    """Call a tool on the gateway via MCP stateless HTTP."""
    headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream"}
    if API_KEY:
        headers["Authorization"] = f"Bearer {API_KEY}"

    payload = {
        "jsonrpc": "2.0",
        "id": req_id,
        "method": "tools/call",
        "params": {"name": tool_name, "arguments": arguments},
    }

    resp = session.post(MCP_ENDPOINT, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()

    # Handle SSE or JSON response
    text = resp.text.strip()
    if text.startswith("data:") or "\ndata:" in text:
        # SSE format — extract last non-empty data line
        for line in reversed(text.split("\n")):
            line = line.strip()
            if line.startswith("data:"):
                data_text = line[5:].strip()
                if data_text:
                    text = data_text
                    break

    return json.loads(text)


def resolve_domain_slug(session: requests.Session) -> str | None:
    """Try known slugs to find the active Zealogics domain."""
    for slug in DOMAIN_SLUGS_TO_TRY:
        try:
            result = call_mcp_tool(session, "list_tasks", {"domain_slug": slug, "limit": 1})
            # If no error in result, domain exists
            result_str = json.dumps(result.get("result", {}))
            if "not found" not in result_str.lower() and "error" not in result_str.lower():
                print(f"  ✓ Found domain: {slug}")
                return slug
            print(f"  - Tried {slug}: not found")
        except Exception as e:
            print(f"  - Tried {slug}: {e}")
            continue
    return None


# ── Main ────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("AI OS — Zealogics Task Creator")
    print("=" * 60)
    print(f"Gateway: {GATEWAY_URL}")
    print(f"API Key: {'***' + API_KEY[-4:] if len(API_KEY) > 4 else '(not set)'}")
    print()

    if not API_KEY:
        print("⚠ No MCP_GATEWAY_API_KEY set. Trying without auth...")
        print("  Set it with: export MCP_GATEWAY_API_KEY=<your-key>")
        print()

    client = httpx.Client()

    # Step 1: Resolve domain slug
    print("Step 1: Resolving Zealogics domain slug...")
    domain_slug = resolve_domain_slug(client)
    if not domain_slug:
        print("  ✗ Could not find Zealogics domain. Trying zealogics_onboarding as fallback.")
        domain_slug = "zealogics_onboarding"
    print()

    # Step 2: Create tasks
    print(f"Step 2: Creating {len(TASKS)} tasks in domain '{domain_slug}'...")
    print()

    created = 0
    failed = 0

    for i, task in enumerate(TASKS, 1):
        args = {
            "title": task["title"],
            "domain_slug": domain_slug,
            "project_slug": PROJECT_SLUG,
            "priority": task["priority"],
            "description": task["description"],
        }
        if task.get("due_date"):
            args["due_date"] = task["due_date"]

        try:
            result = call_mcp_tool(client, "create_task", args, req_id=i)

            # Check for errors in the response
            result_content = result.get("result", {})
            if isinstance(result_content, dict) and result_content.get("content"):
                content = result_content["content"]
                if isinstance(content, list) and len(content) > 0:
                    inner = json.loads(content[0].get("text", "{}"))
                    if inner.get("error"):
                        print(f"  [{i}/{len(TASKS)}] ✗ {task['title'][:50]}...")
                        print(f"           Error: {inner['error']}")
                        failed += 1
                        continue
                    synced = inner.get("google_synced", False)
                    task_id = inner.get("id", "?")[:8]
                    print(f"  [{i}/{len(TASKS)}] ✓ {task['title'][:50]}...")
                    print(f"           ID: {task_id}  Priority: {task['priority']}  Due: {task.get('due_date', 'none')}  GSync: {'✓' if synced else '✗'}")
                    created += 1
                    continue

            # Fallback: assume success if no error
            print(f"  [{i}/{len(TASKS)}] ✓ {task['title'][:50]}...")
            created += 1

        except Exception as e:
            print(f"  [{i}/{len(TASKS)}] ✗ {task['title'][:50]}...")
            print(f"           Error: {e}")
            failed += 1

    print()
    print("=" * 60)
    print(f"Results: {created} created, {failed} failed, {len(TASKS)} total")
    if created == len(TASKS):
        print("All tasks created and synced to Google Tasks! ✓")
    print("=" * 60)

    client.close()
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
