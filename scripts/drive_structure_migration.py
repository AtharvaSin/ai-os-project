"""Google Drive structure migration — unify root + deduplicate Knowledge files.

Executes the Drive reorganisation plan in three phases:
  Phase 1: Move files from "AI Operating System/" to "AI OS/Artifacts/" subfolders.
  Phase 2: Deduplicate Knowledge/ files (keep the ingested version, trash others).
  Phase 3: Update the artifacts DB table to reflect new paths.

Prerequisites:
  1. Start cloud-sql-proxy:
       cloud-sql-proxy bharatvarsh-website:us-central1:bharatvarsh-db --port=5432
  2. Set environment variables (or populate .env):
       GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
       AI_OS_DB_PASSWORD  (DB_USER, DB_NAME, DB_HOST, DB_PORT optional)

Usage:
  # Dry run (default) — preview all actions without touching Drive or DB:
  python scripts/drive_structure_migration.py

  # Execute for real:
  python scripts/drive_structure_migration.py --execute

  # Run only specific phases:
  python scripts/drive_structure_migration.py --phase 1 --execute
  python scripts/drive_structure_migration.py --phase 2 --execute
  python scripts/drive_structure_migration.py --phase 3 --execute
"""

from __future__ import annotations

import argparse
import logging
import os
import sys
from dataclasses import dataclass, field
from typing import Any

import pg8000
from dotenv import load_dotenv
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-7s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("drive-migration")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
GOOGLE_FOLDER_MIME = "application/vnd.google-apps.folder"

# Phase 1 — folder mapping from old location to canonical Artifacts subfolder.
# Keys are subfolder names under the old "AI Operating System/" root.
# Values are the target path segments under "AI OS/Artifacts/".
FOLDER_MAP: dict[str, str] = {
    "Instructions": "Instructions",
    "Architecture": "Architecture",
    "PRDs": "Architecture",
    "Implementation Plans": "Architecture",
    "Daily Briefs": "Daily-Briefs",
}

# BRAND_TEMPLATES sub-contexts are handled specially.
BRAND_TEMPLATE_CONTEXTS = [
    "context-a-ai-os",
    "context-b-bharatvarsh",
    "context-c-portfolio",
]

# Default target for any subfolder not in FOLDER_MAP.
DEFAULT_ARTIFACTS_SUBFOLDER = "Architecture"

# Phase 2 — Knowledge subfolders to scan for duplicates.
KNOWLEDGE_SUBFOLDERS = [
    "AI OS/Knowledge/System",
    "AI OS/Knowledge/Personal",
    "AI OS/Knowledge/Projects/AI-OS",
    "AI OS/Knowledge/Projects/Bharatvarsh",
    "AI OS/Knowledge/Projects/AI-and-U",
    "AI OS/Knowledge/Projects/Zealogics",
]


# ---------------------------------------------------------------------------
# Data classes for summary tracking
# ---------------------------------------------------------------------------
@dataclass
class MigrationSummary:
    """Accumulates counts and details for the final report."""

    phase1_moved: list[str] = field(default_factory=list)
    phase1_folders_deleted: list[str] = field(default_factory=list)
    phase1_errors: list[str] = field(default_factory=list)
    phase2_kept: list[str] = field(default_factory=list)
    phase2_trashed: list[str] = field(default_factory=list)
    phase2_errors: list[str] = field(default_factory=list)
    phase3_updated: list[str] = field(default_factory=list)
    phase3_errors: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Google Drive helpers
# ---------------------------------------------------------------------------
def build_drive_service() -> Any:
    """Authenticate with Google and return a Drive v3 service object."""
    client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
    refresh_token = os.getenv("GOOGLE_REFRESH_TOKEN", "")

    if not all([client_id, client_secret, refresh_token]):
        log.error(
            "Missing Google OAuth credentials. "
            "Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN."
        )
        sys.exit(1)

    creds = Credentials(
        token=None,
        refresh_token=refresh_token,
        client_id=client_id,
        client_secret=client_secret,
        token_uri="https://oauth2.googleapis.com/token",
    )
    creds.refresh(Request())
    return build("drive", "v3", credentials=creds, cache_discovery=False)


def find_folder(
    service: Any, name: str, parent_id: str = "root"
) -> str | None:
    """Find a single folder by exact name under the given parent. Returns ID or None."""
    query = (
        f"name='{name}' and '{parent_id}' in parents "
        f"and mimeType='{GOOGLE_FOLDER_MIME}' and trashed=false"
    )
    result = (
        service.files()
        .list(q=query, spaces="drive", fields="files(id, name)", pageSize=1)
        .execute()
    )
    files = result.get("files", [])
    return files[0]["id"] if files else None


def resolve_folder_path(service: Any, path: str) -> str | None:
    """Navigate a slash-delimited path to a Drive folder ID. Returns None if any segment is missing."""
    segments = [s for s in path.strip("/").split("/") if s]
    parent_id = "root"
    for segment in segments:
        folder_id = find_folder(service, segment, parent_id)
        if not folder_id:
            return None
        parent_id = folder_id
    return parent_id


def ensure_folder_path(service: Any, path: str, dry_run: bool) -> str | None:
    """Navigate a folder path, creating missing segments. Returns the leaf folder ID."""
    segments = [s for s in path.strip("/").split("/") if s]
    parent_id = "root"
    for segment in segments:
        folder_id = find_folder(service, segment, parent_id)
        if folder_id:
            parent_id = folder_id
        elif dry_run:
            log.info("  [DRY RUN] Would create folder: %s (parent=%s)", segment, parent_id)
            # In dry-run mode we cannot continue resolving because the folder does not exist.
            return None
        else:
            metadata = {
                "name": segment,
                "mimeType": GOOGLE_FOLDER_MIME,
                "parents": [parent_id],
            }
            created = (
                service.files()
                .create(body=metadata, fields="id")
                .execute()
            )
            parent_id = created["id"]
            log.info("  Created folder: %s (id=%s)", segment, parent_id)
    return parent_id


def list_children(
    service: Any, parent_id: str, mime_filter: str | None = None
) -> list[dict[str, str]]:
    """List all non-trashed children (files and/or folders) under a parent."""
    query = f"'{parent_id}' in parents and trashed=false"
    if mime_filter:
        query += f" and mimeType='{mime_filter}'"

    items: list[dict[str, str]] = []
    page_token = None
    while True:
        result = (
            service.files()
            .list(
                q=query,
                spaces="drive",
                fields="nextPageToken, files(id, name, mimeType, parents)",
                pageSize=200,
                pageToken=page_token,
            )
            .execute()
        )
        items.extend(result.get("files", []))
        page_token = result.get("nextPageToken")
        if not page_token:
            break
    return items


def list_all_recursive(
    service: Any, folder_id: str, prefix: str = ""
) -> list[dict[str, Any]]:
    """Recursively list all files (not folders) with their subfolder name context."""
    results: list[dict[str, Any]] = []
    children = list_children(service, folder_id)
    for child in children:
        child_path = f"{prefix}/{child['name']}" if prefix else child["name"]
        if child.get("mimeType") == GOOGLE_FOLDER_MIME:
            results.extend(
                list_all_recursive(service, child["id"], child_path)
            )
        else:
            results.append(
                {
                    "id": child["id"],
                    "name": child["name"],
                    "mimeType": child.get("mimeType", ""),
                    "parents": child.get("parents", []),
                    "rel_path": child_path,
                }
            )
    return results


def move_file(
    service: Any,
    file_id: str,
    old_parent_id: str,
    new_parent_id: str,
    dry_run: bool,
    file_name: str = "",
) -> bool:
    """Move a file from old_parent to new_parent using addParents/removeParents."""
    label = f"'{file_name}' ({file_id})"
    if dry_run:
        log.info("  [DRY RUN] Would move %s", label)
        return True
    try:
        service.files().update(
            fileId=file_id,
            addParents=new_parent_id,
            removeParents=old_parent_id,
            fields="id, parents",
        ).execute()
        log.info("  Moved %s", label)
        return True
    except Exception as exc:
        log.error("  FAILED to move %s: %s", label, exc)
        return False


def trash_file(service: Any, file_id: str, dry_run: bool, label: str = "") -> bool:
    """Move a file to Drive trash."""
    if dry_run:
        log.info("  [DRY RUN] Would trash %s (%s)", label, file_id)
        return True
    try:
        service.files().update(fileId=file_id, body={"trashed": True}).execute()
        log.info("  Trashed %s (%s)", label, file_id)
        return True
    except Exception as exc:
        log.error("  FAILED to trash %s (%s): %s", label, file_id, exc)
        return False


def delete_empty_folder_tree(
    service: Any, folder_id: str, folder_name: str, dry_run: bool
) -> bool:
    """Recursively delete empty subfolders bottom-up, then the root folder."""
    sub_folders = list_children(service, folder_id, mime_filter=GOOGLE_FOLDER_MIME)
    for sf in sub_folders:
        delete_empty_folder_tree(service, sf["id"], sf["name"], dry_run)

    # Check if any children remain
    remaining = list_children(service, folder_id)
    if remaining:
        log.warning(
            "  Folder '%s' still has %d children — skipping deletion.",
            folder_name,
            len(remaining),
        )
        return False

    if dry_run:
        log.info("  [DRY RUN] Would delete empty folder '%s' (%s)", folder_name, folder_id)
        return True

    try:
        service.files().delete(fileId=folder_id).execute()
        log.info("  Deleted empty folder '%s' (%s)", folder_name, folder_id)
        return True
    except Exception as exc:
        log.error("  FAILED to delete folder '%s': %s", folder_name, exc)
        return False


# ---------------------------------------------------------------------------
# Database helper
# ---------------------------------------------------------------------------
def get_db_connection() -> pg8000.Connection:
    """Return a pg8000 connection to the AI OS database."""
    password = os.getenv("AI_OS_DB_PASSWORD", "")
    if not password:
        log.error("AI_OS_DB_PASSWORD is not set. Cannot connect to database.")
        sys.exit(1)

    return pg8000.connect(
        user=os.getenv("DB_USER", "ai_os_admin"),
        password=password,
        database=os.getenv("DB_NAME", "ai_os"),
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=int(os.getenv("DB_PORT", "5432")),
    )


# ---------------------------------------------------------------------------
# Phase 1 — Unify root
# ---------------------------------------------------------------------------
def _determine_target_path(subfolder_name: str) -> str:
    """Return the canonical Artifacts target path for a given old subfolder name."""
    if subfolder_name in FOLDER_MAP:
        return f"AI OS/Artifacts/{FOLDER_MAP[subfolder_name]}"

    # Handle BRAND_TEMPLATES sub-contexts
    if subfolder_name == "BRAND_TEMPLATES":
        return "AI OS/Artifacts/Brand-Templates"

    return f"AI OS/Artifacts/{DEFAULT_ARTIFACTS_SUBFOLDER}"


def run_phase1(service: Any, dry_run: bool, summary: MigrationSummary) -> None:
    """Phase 1: Move files from 'AI Operating System/' to 'AI OS/Artifacts/' subfolders."""
    log.info("=" * 70)
    log.info("PHASE 1 — Unify root: AI Operating System/ -> AI OS/Artifacts/")
    log.info("=" * 70)

    old_root_id = find_folder(service, "AI Operating System", "root")
    if not old_root_id:
        log.info("Folder 'AI Operating System' not found at Drive root. Phase 1 skipped.")
        return

    log.info("Found 'AI Operating System' folder (id=%s)", old_root_id)

    # List all immediate children (subfolders + loose files)
    children = list_children(service, old_root_id)
    sub_folders = [c for c in children if c.get("mimeType") == GOOGLE_FOLDER_MIME]
    loose_files = [c for c in children if c.get("mimeType") != GOOGLE_FOLDER_MIME]

    log.info(
        "Contents: %d subfolders, %d loose files",
        len(sub_folders),
        len(loose_files),
    )

    # --- Process each subfolder ---
    for sf in sub_folders:
        sf_name = sf["name"]
        sf_id = sf["id"]
        log.info("")
        log.info("--- Subfolder: %s ---", sf_name)

        # Decide the target Artifacts path
        if sf_name == "BRAND_TEMPLATES":
            # Handle BRAND_TEMPLATES specially — each sub-context gets its own subfolder
            brand_children = list_children(service, sf_id)
            brand_subfolders = [
                bc for bc in brand_children if bc.get("mimeType") == GOOGLE_FOLDER_MIME
            ]
            brand_loose = [
                bc for bc in brand_children if bc.get("mimeType") != GOOGLE_FOLDER_MIME
            ]

            for bsf in brand_subfolders:
                target_path = f"AI OS/Artifacts/Brand-Templates/{bsf['name']}"
                target_id = ensure_folder_path(service, target_path, dry_run)
                if not target_id and not dry_run:
                    summary.phase1_errors.append(
                        f"Could not create target folder: {target_path}"
                    )
                    continue

                # Move all files inside this brand subfolder
                brand_files = list_all_recursive(service, bsf["id"])
                for bf in brand_files:
                    # For nested files, move them to the flat target (simplify structure)
                    old_parent = bf["parents"][0] if bf.get("parents") else bsf["id"]
                    if target_id:
                        ok = move_file(
                            service, bf["id"], old_parent, target_id, dry_run, bf["name"]
                        )
                        if ok:
                            summary.phase1_moved.append(
                                f"{sf_name}/{bsf['name']}/{bf['rel_path']} -> {target_path}"
                            )
                        else:
                            summary.phase1_errors.append(
                                f"Failed: {sf_name}/{bsf['name']}/{bf['rel_path']}"
                            )
                    else:
                        # dry-run: still log
                        summary.phase1_moved.append(
                            f"[DRY RUN] {sf_name}/{bsf['name']}/{bf['rel_path']} -> {target_path}"
                        )

            # Move any loose files in BRAND_TEMPLATES/ itself
            if brand_loose:
                target_path = "AI OS/Artifacts/Brand-Templates"
                target_id = ensure_folder_path(service, target_path, dry_run)
                for bl in brand_loose:
                    old_parent = bl.get("parents", [sf_id])[0]
                    if target_id:
                        ok = move_file(
                            service, bl["id"], old_parent, target_id, dry_run, bl["name"]
                        )
                        if ok:
                            summary.phase1_moved.append(
                                f"{sf_name}/{bl['name']} -> {target_path}"
                            )
                        else:
                            summary.phase1_errors.append(f"Failed: {sf_name}/{bl['name']}")
                    else:
                        summary.phase1_moved.append(
                            f"[DRY RUN] {sf_name}/{bl['name']} -> {target_path}"
                        )
        else:
            # Standard subfolder mapping
            target_path = _determine_target_path(sf_name)
            target_id = ensure_folder_path(service, target_path, dry_run)

            all_files = list_all_recursive(service, sf_id)
            log.info("  %d files to move -> %s", len(all_files), target_path)

            for f in all_files:
                old_parent = f["parents"][0] if f.get("parents") else sf_id
                if target_id:
                    ok = move_file(
                        service, f["id"], old_parent, target_id, dry_run, f["name"]
                    )
                    if ok:
                        summary.phase1_moved.append(
                            f"{sf_name}/{f['rel_path']} -> {target_path}"
                        )
                    else:
                        summary.phase1_errors.append(f"Failed: {sf_name}/{f['rel_path']}")
                else:
                    summary.phase1_moved.append(
                        f"[DRY RUN] {sf_name}/{f['rel_path']} -> {target_path}"
                    )

    # --- Process loose files at old root level ---
    if loose_files:
        target_path = f"AI OS/Artifacts/{DEFAULT_ARTIFACTS_SUBFOLDER}"
        target_id = ensure_folder_path(service, target_path, dry_run)
        log.info("")
        log.info("--- %d loose files at root -> %s ---", len(loose_files), target_path)

        for lf in loose_files:
            old_parent = lf.get("parents", [old_root_id])[0]
            if target_id:
                ok = move_file(
                    service, lf["id"], old_parent, target_id, dry_run, lf["name"]
                )
                if ok:
                    summary.phase1_moved.append(f"{lf['name']} -> {target_path}")
                else:
                    summary.phase1_errors.append(f"Failed: {lf['name']}")
            else:
                summary.phase1_moved.append(f"[DRY RUN] {lf['name']} -> {target_path}")

    # --- Delete the empty old folder tree ---
    log.info("")
    log.info("--- Cleaning up empty 'AI Operating System/' tree ---")
    if delete_empty_folder_tree(service, old_root_id, "AI Operating System", dry_run):
        summary.phase1_folders_deleted.append("AI Operating System")


# ---------------------------------------------------------------------------
# Phase 2 — Deduplicate Knowledge files
# ---------------------------------------------------------------------------
def run_phase2(service: Any, dry_run: bool, summary: MigrationSummary) -> None:
    """Phase 2: Remove duplicate Knowledge/ files, keeping the version ingested into the DB."""
    log.info("")
    log.info("=" * 70)
    log.info("PHASE 2 — Deduplicate Knowledge files")
    log.info("=" * 70)

    conn: pg8000.Connection | None = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        for folder_path in KNOWLEDGE_SUBFOLDERS:
            log.info("")
            log.info("--- Scanning: %s ---", folder_path)

            folder_id = resolve_folder_path(service, folder_path)
            if not folder_id:
                log.warning("  Folder not found: %s — skipping.", folder_path)
                continue

            # List all files (not subfolders) in this folder
            files = list_children(service, folder_id)
            files = [f for f in files if f.get("mimeType") != GOOGLE_FOLDER_MIME]

            # Group by filename
            by_name: dict[str, list[dict[str, str]]] = {}
            for f in files:
                by_name.setdefault(f["name"], []).append(f)

            unique_count = sum(1 for v in by_name.values() if len(v) == 1)
            dup_groups = {k: v for k, v in by_name.items() if len(v) > 1}

            log.info(
                "  %d files total — %d unique, %d duplicate groups",
                len(files),
                unique_count,
                len(dup_groups),
            )

            if not dup_groups:
                continue

            for filename, copies in dup_groups.items():
                file_ids = [c["id"] for c in copies]
                log.info("  Duplicate: '%s' (%d copies)", filename, len(copies))

                # Query the knowledge_entries table to find the ingested version
                placeholders = ", ".join(["%s"] * len(file_ids))
                cursor.execute(
                    f"SELECT drive_file_id FROM knowledge_entries "
                    f"WHERE drive_file_id IN ({placeholders})",
                    file_ids,
                )
                ingested_rows = cursor.fetchall()
                ingested_ids = {row[0] for row in ingested_rows}

                if not ingested_ids:
                    # No version ingested — keep the first one, trash the rest
                    keep_id = file_ids[0]
                    trash_ids = file_ids[1:]
                    log.info(
                        "    No ingested version found. Keeping first: %s",
                        keep_id,
                    )
                elif len(ingested_ids) == 1:
                    keep_id = ingested_ids.pop()
                    trash_ids = [fid for fid in file_ids if fid != keep_id]
                    log.info("    Ingested version: %s — keeping.", keep_id)
                else:
                    # Multiple ingested versions (unusual) — keep the first ingested, trash duplicates
                    keep_id = sorted(ingested_ids)[0]
                    trash_ids = [fid for fid in file_ids if fid != keep_id]
                    log.warning(
                        "    Multiple ingested versions found (%s). Keeping %s.",
                        ingested_ids,
                        keep_id,
                    )

                summary.phase2_kept.append(f"{folder_path}/{filename} (id={keep_id})")

                for tid in trash_ids:
                    ok = trash_file(service, tid, dry_run, f"{folder_path}/{filename}")
                    if ok:
                        summary.phase2_trashed.append(
                            f"{folder_path}/{filename} (id={tid})"
                        )
                    else:
                        summary.phase2_errors.append(
                            f"Failed to trash: {folder_path}/{filename} (id={tid})"
                        )

    except pg8000.DatabaseError as exc:
        log.error("Database error in Phase 2: %s", exc)
        summary.phase2_errors.append(f"DB error: {exc}")
    except Exception as exc:
        log.error("Unexpected error in Phase 2: %s", exc)
        summary.phase2_errors.append(f"Error: {exc}")
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Phase 3 — Update artifacts table
# ---------------------------------------------------------------------------
def run_phase3(dry_run: bool, summary: MigrationSummary) -> None:
    """Phase 3: Update the artifacts DB table where paths reference the old root."""
    log.info("")
    log.info("=" * 70)
    log.info("PHASE 3 — Update artifacts table paths")
    log.info("=" * 70)

    conn: pg8000.Connection | None = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Find all rows referencing the old folder name
        cursor.execute(
            "SELECT id, url, file_path FROM artifacts "
            "WHERE url LIKE %s OR file_path LIKE %s",
            ("%AI Operating System%", "%AI Operating System%"),
        )
        rows = cursor.fetchall()

        if not rows:
            log.info("No artifacts rows reference 'AI Operating System'. Phase 3 skipped.")
            return

        log.info("Found %d artifacts row(s) to update.", len(rows))

        for row in rows:
            row_id, url, file_path = row[0], row[1], row[2]
            new_url = url.replace("AI Operating System", "AI OS/Artifacts") if url else url
            new_file_path = (
                file_path.replace("AI Operating System", "AI OS/Artifacts")
                if file_path
                else file_path
            )

            if dry_run:
                log.info(
                    "  [DRY RUN] Would update artifact id=%s:\n"
                    "    url: %s -> %s\n"
                    "    file_path: %s -> %s",
                    row_id,
                    url,
                    new_url,
                    file_path,
                    new_file_path,
                )
                summary.phase3_updated.append(f"[DRY RUN] id={row_id}")
            else:
                try:
                    cursor.execute(
                        "UPDATE artifacts SET url = %s, file_path = %s WHERE id = %s",
                        (new_url, new_file_path, row_id),
                    )
                    log.info("  Updated artifact id=%s", row_id)
                    summary.phase3_updated.append(f"id={row_id}")
                except Exception as exc:
                    log.error("  FAILED to update artifact id=%s: %s", row_id, exc)
                    summary.phase3_errors.append(f"id={row_id}: {exc}")

        if not dry_run:
            conn.commit()
            log.info("Committed %d artifact updates.", len(summary.phase3_updated))

    except pg8000.DatabaseError as exc:
        log.error("Database error in Phase 3: %s", exc)
        summary.phase3_errors.append(f"DB error: {exc}")
    except Exception as exc:
        log.error("Unexpected error in Phase 3: %s", exc)
        summary.phase3_errors.append(f"Error: {exc}")
    finally:
        if conn:
            try:
                conn.close()
            except Exception:
                pass


# ---------------------------------------------------------------------------
# Summary printer
# ---------------------------------------------------------------------------
def print_summary(summary: MigrationSummary, dry_run: bool) -> None:
    """Print a human-readable summary of all phases."""
    mode = "DRY RUN" if dry_run else "EXECUTED"

    log.info("")
    log.info("=" * 70)
    log.info("MIGRATION SUMMARY (%s)", mode)
    log.info("=" * 70)

    # Phase 1
    log.info("")
    log.info("Phase 1 — Unify Root:")
    log.info("  Files moved:       %d", len(summary.phase1_moved))
    log.info("  Folders deleted:   %d", len(summary.phase1_folders_deleted))
    log.info("  Errors:            %d", len(summary.phase1_errors))
    if summary.phase1_moved:
        log.info("  Moves:")
        for m in summary.phase1_moved:
            log.info("    %s", m)
    if summary.phase1_errors:
        log.info("  Errors:")
        for e in summary.phase1_errors:
            log.info("    %s", e)

    # Phase 2
    log.info("")
    log.info("Phase 2 — Deduplicate Knowledge:")
    log.info("  Files kept:        %d", len(summary.phase2_kept))
    log.info("  Duplicates trashed:%d", len(summary.phase2_trashed))
    log.info("  Errors:            %d", len(summary.phase2_errors))
    if summary.phase2_trashed:
        log.info("  Trashed:")
        for t in summary.phase2_trashed:
            log.info("    %s", t)
    if summary.phase2_errors:
        log.info("  Errors:")
        for e in summary.phase2_errors:
            log.info("    %s", e)

    # Phase 3
    log.info("")
    log.info("Phase 3 — Update Artifacts Table:")
    log.info("  Rows updated:      %d", len(summary.phase3_updated))
    log.info("  Errors:            %d", len(summary.phase3_errors))
    if summary.phase3_errors:
        log.info("  Errors:")
        for e in summary.phase3_errors:
            log.info("    %s", e)

    # Grand total
    total_actions = (
        len(summary.phase1_moved)
        + len(summary.phase1_folders_deleted)
        + len(summary.phase2_trashed)
        + len(summary.phase3_updated)
    )
    total_errors = (
        len(summary.phase1_errors)
        + len(summary.phase2_errors)
        + len(summary.phase3_errors)
    )

    log.info("")
    log.info("-" * 70)
    log.info("Total actions: %d  |  Total errors: %d", total_actions, total_errors)
    if dry_run:
        log.info("Run with --execute to apply these changes for real.")
    log.info("-" * 70)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main() -> None:
    parser = argparse.ArgumentParser(
        description="Google Drive structure migration: unify root + deduplicate Knowledge files.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=(
            "Examples:\n"
            "  python scripts/drive_structure_migration.py              # dry run (default)\n"
            "  python scripts/drive_structure_migration.py --execute    # execute for real\n"
            "  python scripts/drive_structure_migration.py --phase 2    # dry run Phase 2 only\n"
        ),
    )
    parser.add_argument(
        "--execute",
        action="store_true",
        default=False,
        help="Actually perform the migration. Without this flag, the script runs in dry-run mode.",
    )
    parser.add_argument(
        "--phase",
        type=int,
        choices=[1, 2, 3],
        default=None,
        help="Run only a specific phase (1, 2, or 3). Default: run all phases.",
    )
    args = parser.parse_args()

    dry_run = not args.execute
    run_phases = [args.phase] if args.phase else [1, 2, 3]

    load_dotenv()

    log.info("Drive Structure Migration")
    log.info("Mode: %s", "DRY RUN" if dry_run else "EXECUTE")
    log.info("Phases: %s", ", ".join(str(p) for p in run_phases))
    log.info("")

    summary = MigrationSummary()

    # Build Drive service (needed for Phases 1 and 2)
    service = None
    if 1 in run_phases or 2 in run_phases:
        log.info("Authenticating with Google Drive API...")
        service = build_drive_service()
        log.info("Authenticated successfully.")

    # Run phases
    if 1 in run_phases and service:
        run_phase1(service, dry_run, summary)

    if 2 in run_phases and service:
        run_phase2(service, dry_run, summary)

    if 3 in run_phases:
        run_phase3(dry_run, summary)

    # Print summary
    print_summary(summary, dry_run)

    # Exit with error code if any errors occurred
    total_errors = (
        len(summary.phase1_errors)
        + len(summary.phase2_errors)
        + len(summary.phase3_errors)
    )
    if total_errors > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
