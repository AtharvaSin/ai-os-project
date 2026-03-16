"""Upload 38 knowledge seed docs to Google Drive Knowledge folders.

Creates the folder structure:
  AI OS/Knowledge/{System, Personal, Projects/{AI-OS, Bharatvarsh, AI-and-U, Zealogics}}

Then uploads all .md files from docs/knowledge-seed/ to matching folders.

Usage:
  Set env vars GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
  python scripts/seed_knowledge_drive.py
"""

import os
import sys
import time
from pathlib import Path

from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# --- Config ---
SEED_DIR = Path(__file__).resolve().parent.parent / "docs" / "knowledge-seed"
TOKEN_URI = "https://oauth2.googleapis.com/token"
SCOPES = ["https://www.googleapis.com/auth/drive"]

# Folder structure to create in Drive
KNOWLEDGE_FOLDERS = [
    "AI OS/Knowledge",
    "AI OS/Knowledge/System",
    "AI OS/Knowledge/Personal",
    "AI OS/Knowledge/Projects",
    "AI OS/Knowledge/Projects/AI-OS",
    "AI OS/Knowledge/Projects/Bharatvarsh",
    "AI OS/Knowledge/Projects/AI-and-U",
    "AI OS/Knowledge/Projects/Zealogics",
]

# Map local subdir to Drive folder path
LOCAL_TO_DRIVE = {
    "System": "AI OS/Knowledge/System",
    "Personal": "AI OS/Knowledge/Personal",
    "Projects/AI-OS": "AI OS/Knowledge/Projects/AI-OS",
    "Projects/Bharatvarsh": "AI OS/Knowledge/Projects/Bharatvarsh",
    "Projects/AI-and-U": "AI OS/Knowledge/Projects/AI-and-U",
    "Projects/Zealogics": "AI OS/Knowledge/Projects/Zealogics",
}


def get_credentials():
    """Build OAuth2 credentials from env vars and refresh the access token."""
    client_id = os.environ.get("GOOGLE_CLIENT_ID")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
    refresh_token = os.environ.get("GOOGLE_REFRESH_TOKEN")

    if not all([client_id, client_secret, refresh_token]):
        print("ERROR: Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN")
        sys.exit(1)

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        token_uri=TOKEN_URI,
        client_id=client_id,
        client_secret=client_secret,
        scopes=SCOPES,
    )
    creds.refresh(Request())
    print(f"  Authenticated. Token expires: {creds.expiry}")
    return creds


def find_or_create_folder(service, name, parent_id=None, cache=None):
    """Find folder by name under parent, or create it. Returns folder ID."""
    cache_key = f"{parent_id}:{name}"
    if cache and cache_key in cache:
        return cache[cache_key]

    q = f"name = '{name}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false"
    if parent_id:
        q += f" and '{parent_id}' in parents"

    result = service.files().list(q=q, spaces="drive", fields="files(id, name)", pageSize=1).execute()
    files = result.get("files", [])

    if files:
        folder_id = files[0]["id"]
        if cache is not None:
            cache[cache_key] = folder_id
        return folder_id

    body = {"name": name, "mimeType": "application/vnd.google-apps.folder"}
    if parent_id:
        body["parents"] = [parent_id]

    folder = service.files().create(body=body, fields="id").execute()
    folder_id = folder["id"]
    print(f"  Created folder: {name} (parent: {parent_id or 'root'})")
    if cache is not None:
        cache[cache_key] = folder_id
    return folder_id


def resolve_folder_path(service, path, cache):
    """Navigate/create a full folder path like 'AI OS/Knowledge/System'. Returns leaf folder ID."""
    parts = [p.strip() for p in path.split("/") if p.strip()]
    parent_id = None
    for part in parts:
        parent_id = find_or_create_folder(service, part, parent_id, cache)
    return parent_id


def upload_file(service, filepath, folder_id):
    """Upload a single file to a Drive folder. Returns file ID."""
    media = MediaFileUpload(str(filepath), mimetype="text/markdown", resumable=False)
    metadata = {"name": filepath.name, "parents": [folder_id]}
    uploaded = service.files().create(body=metadata, media_body=media, fields="id, name, webViewLink").execute()
    return uploaded


def main():
    print("=" * 60)
    print("AI OS Knowledge Seeding — Google Drive Upload")
    print("=" * 60)

    # Validate seed directory
    if not SEED_DIR.exists():
        print(f"ERROR: Seed directory not found: {SEED_DIR}")
        sys.exit(1)

    seed_files = sorted(SEED_DIR.rglob("*.md"))
    print(f"\nFound {len(seed_files)} seed files in {SEED_DIR}")

    # Authenticate
    print("\n[1/3] Authenticating with Google Drive API...")
    creds = get_credentials()
    service = build("drive", "v3", credentials=creds)
    print("  Drive API connected.")

    # Create folder structure
    print("\n[2/3] Creating Knowledge folder structure...")
    folder_cache = {}
    folder_ids = {}

    for folder_path in KNOWLEDGE_FOLDERS:
        folder_id = resolve_folder_path(service, folder_path, folder_cache)
        folder_ids[folder_path] = folder_id
        print(f"  OK: {folder_path} -> {folder_id}")

    # Upload files
    print(f"\n[3/3] Uploading {len(seed_files)} seed documents...")
    uploaded_count = 0
    failed = []

    for filepath in seed_files:
        # Determine relative path from seed dir
        rel_path = filepath.relative_to(SEED_DIR)
        # Get the parent directory as a string (e.g., "System", "Projects/Bharatvarsh")
        local_subdir = str(rel_path.parent).replace("\\", "/")

        drive_folder = LOCAL_TO_DRIVE.get(local_subdir)
        if not drive_folder:
            print(f"  SKIP: {rel_path} — no mapping for '{local_subdir}'")
            failed.append((str(rel_path), "no folder mapping"))
            continue

        target_folder_id = folder_ids.get(drive_folder)
        if not target_folder_id:
            print(f"  SKIP: {rel_path} — folder ID not found for '{drive_folder}'")
            failed.append((str(rel_path), "folder ID missing"))
            continue

        try:
            result = upload_file(service, filepath, target_folder_id)
            uploaded_count += 1
            print(f"  [{uploaded_count:2d}/{len(seed_files)}] {rel_path} -> {result['name']} ({result['id'][:12]}...)")
            # Small delay to avoid rate limiting
            if uploaded_count % 10 == 0:
                time.sleep(1)
        except Exception as e:
            print(f"  FAIL: {rel_path} — {e}")
            failed.append((str(rel_path), str(e)))

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"  Folders created/verified: {len(KNOWLEDGE_FOLDERS)}")
    print(f"  Files uploaded: {uploaded_count}/{len(seed_files)}")
    if failed:
        print(f"  Failed: {len(failed)}")
        for name, reason in failed:
            print(f"    - {name}: {reason}")
    else:
        print("  Failures: 0")

    print(f"\nDrive scanner will pick these up at next scheduled run (daily 06:00 IST).")
    print("To trigger manually: POST to drive-knowledge-scanner Cloud Run service URL.")
    print("Embedding generator runs every 5 min and will auto-embed new entries.")


if __name__ == "__main__":
    main()
