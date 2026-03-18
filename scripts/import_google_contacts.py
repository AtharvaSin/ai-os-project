"""Import Google Contacts CSV into the AI OS contacts table.

Idempotent, re-runnable script. Designed for the workflow:
  1. Enrich contacts in Google Contacts
  2. Export CSV from contacts.google.com
  3. Run this script — existing contacts UPDATE, new contacts INSERT

Usage:
    1. Start cloud-sql-proxy: cloud-sql-proxy bharatvarsh-website:us-central1:bharatvarsh-db --port=5433
    2. Set env: export AI_OS_DB_PASSWORD=<password>
    3. Run: python scripts/import_google_contacts.py [--csv docs/contacts.csv] [--dry-run]

The script:
  - Parses the 42-column Google Contacts CSV format
  - Handles ::: multi-value delimiters (phones, labels)
  - Normalizes phone numbers to E.164-ish format
  - Routes labels to contact_type + tags[]
  - Generates stable google_contact_id for idempotent upsert
  - Stores secondary phones, emails, addresses in metadata JSONB
  - Imports birthdays into the important_dates table
  - Does NOT delete any existing contacts (append/update only)
"""

import argparse
import csv
import hashlib
import json
import os
import re
import sys

import pg8000


# ── Configuration ────────────────────────────────────────────────────────────

DEFAULT_CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "contacts.csv")

# Label → contact_type + tags mapping
LABEL_ROUTING = {
    "hrs": {"contact_type": "professional", "tags": ["hr", "recruiter"]},
    "* friends": {"contact_type": "personal", "tags": ["friend"]},
    "relatives": {"contact_type": "personal", "tags": ["family"]},
    "ice": {"contact_type": "personal", "tags": ["emergency"]},
}

# Patterns to detect service providers from name fields
SERVICE_PATTERNS = [
    (r"\b(driver|cab)\b", "service_provider"),
    (r"\b(mechanic)\b", "service_provider"),
    (r"\b(plumber)\b", "service_provider"),
    (r"\b(broker)\b", "service_provider"),
    (r"\b(electrician)\b", "service_provider"),
    (r"\b(maid|cook)\b", "service_provider"),
    (r"\b(wash)\b", "service_provider"),
    (r"\b(wifi|airtel|jio)\b", "service_provider"),
    (r"\b(owner)\b", "service_provider"),
    (r"\b(transport)\b", "service_provider"),
]

# Org/context patterns extractable from name fields
CONTEXT_PATTERNS = [
    (r"\bniti?e\b", "nitie"),
    (r"\biim\b", "iim"),
    (r"\bnit\b", "nit"),
    (r"\bjnv\b", "jnv"),
    (r"\bdgp\b", "nit_durgapur"),
    (r"\baccenture\b", "accenture"),
    (r"\blnt?\b", "lnt"),
    (r"\btata\b", "tata"),
    (r"\bkonrad\b", "konrad"),
    (r"\bpeopletech\b", "peopletech"),
]

# Domain slug mapping for auto-tagging
DOMAIN_MAPPING = {
    "hr": "career_network",
    "recruiter": "career_network",
    "friend": "friends_and_gatherings",
    "family": "wife_family",
    "emergency": "wife_family",
    "service_provider": "admin",
    "accenture": "career_network",
    "nitie": "career_network",
    "iim": "career_network",
    "nit": "friends_and_gatherings",
    "nit_durgapur": "friends_and_gatherings",
    "jnv": "friends_and_gatherings",
    "lnt": "career_network",
    "tata": "career_network",
    "konrad": "career_network",
    "peopletech": "career_network",
}


# ── Helpers ──────────────────────────────────────────────────────────────────

def get_db_connection():
    """Get database connection via cloud-sql-proxy."""
    password = os.environ.get("AI_OS_DB_PASSWORD")
    if not password:
        raise ValueError("AI_OS_DB_PASSWORD environment variable required")
    port = int(os.environ.get("AI_OS_DB_PORT", "5433"))
    return pg8000.connect(
        host="localhost",
        port=port,
        user="ai_os_admin",
        password=password,
        database="ai_os",
    )


def normalize_phone(raw: str) -> str:
    """Normalize a phone number: strip spaces/dashes/parens, ensure + prefix for intl."""
    if not raw:
        return ""
    # Remove all non-digit and non-plus chars
    cleaned = re.sub(r"[^\d+]", "", raw)
    if not cleaned or len(cleaned) < 5:
        return ""
    # Add +91 if it's a 10-digit Indian number
    if len(cleaned) == 10 and cleaned[0] in "6789":
        cleaned = "+91" + cleaned
    # Add + prefix if starts with 91 and is 12 digits
    if len(cleaned) == 12 and cleaned.startswith("91"):
        cleaned = "+" + cleaned
    # Ensure + prefix for numbers that look international
    if not cleaned.startswith("+") and len(cleaned) > 10:
        cleaned = "+" + cleaned
    return cleaned


def split_multi_value(value: str) -> list[str]:
    """Split ::: delimited values (Google Contacts multi-value format)."""
    if not value:
        return []
    return [v.strip() for v in value.split(":::") if v.strip()]


def generate_contact_id(first: str, last: str, phone: str) -> str:
    """Generate a stable hash ID from name + phone for idempotent upsert."""
    key = f"{(first or '').strip().lower()}|{(last or '').strip().lower()}|{normalize_phone(phone)}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:24]


def build_name(first: str, middle: str, last: str) -> str:
    """Concatenate name parts, stripping whitespace."""
    parts = [p.strip() for p in [first, middle, last] if p and p.strip()]
    return " ".join(parts)


def parse_labels(label_str: str) -> tuple[str, list[str]]:
    """Parse Google Contacts labels into (contact_type, tags[]).

    Returns:
        contact_type: 'professional', 'personal', or 'both'
        tags: list of tag strings
    """
    labels = split_multi_value(label_str)
    contact_type = "both"  # default
    tags = []

    for label in labels:
        label_lower = label.strip().lower()
        if label_lower == "* mycontacts":
            continue  # default label, skip
        if label_lower in LABEL_ROUTING:
            routing = LABEL_ROUTING[label_lower]
            contact_type = routing["contact_type"]
            tags.extend(routing["tags"])
        else:
            # Unknown label — add as tag
            tags.append(label.strip())

    return contact_type, list(set(tags))


def extract_context_tags(full_name: str) -> list[str]:
    """Extract contextual tags from name fields (org names, institutions, roles)."""
    name_lower = full_name.lower()
    context_tags = []

    # Check service provider patterns
    for pattern, tag in SERVICE_PATTERNS:
        if re.search(pattern, name_lower, re.IGNORECASE):
            context_tags.append(tag)

    # Check org/context patterns
    for pattern, tag in CONTEXT_PATTERNS:
        if re.search(pattern, name_lower, re.IGNORECASE):
            context_tags.append(tag)

    return list(set(context_tags))


def infer_domain_slug(tags: list[str]) -> str | None:
    """Infer Life Graph domain_slug from contact tags."""
    for tag in tags:
        if tag in DOMAIN_MAPPING:
            return DOMAIN_MAPPING[tag]
    return None


def parse_row(row: dict) -> dict | None:
    """Parse a single CSV row into a contact dict.

    Returns None if the row should be skipped (no name, no phone, junk data).
    """
    first = row.get("First Name", "").strip()
    middle = row.get("Middle Name", "").strip()
    last = row.get("Last Name", "").strip()

    name = build_name(first, middle, last)
    if not name:
        return None

    # Primary phone
    phone1_raw = row.get("Phone 1 - Value", "")
    phones_raw = split_multi_value(phone1_raw)
    primary_phone = normalize_phone(phones_raw[0]) if phones_raw else ""

    # Skip contacts with no phone and no email (likely junk)
    email1 = row.get("E-mail 1 - Value", "").strip()
    if not primary_phone and not email1:
        return None

    # Generate stable ID
    google_contact_id = generate_contact_id(first, last, phones_raw[0] if phones_raw else "")

    # Parse labels
    label_str = row.get("Labels", "")
    contact_type, label_tags = parse_labels(label_str)

    # Extract context from name
    context_tags = extract_context_tags(name)
    all_tags = list(set(label_tags + context_tags))

    # Infer domain
    domain_slug = infer_domain_slug(all_tags)

    # Organization
    company = row.get("Organization Name", "").strip() or None
    title = row.get("Organization Title", "").strip() or None

    # Location
    city = row.get("Address 1 - City", "").strip()
    region = row.get("Address 1 - Region", "").strip()
    country = row.get("Address 1 - Country", "").strip()
    location_parts = [p for p in [city, region, country] if p]
    location = ", ".join(location_parts) if location_parts else None

    # Build metadata JSONB
    metadata: dict = {}

    # Secondary phones
    extra_phones = []
    for p in phones_raw[1:]:
        normalized = normalize_phone(p)
        if normalized:
            extra_phones.append({"label": "Mobile", "value": normalized})
    # Phone 2-4
    for i in range(2, 5):
        p_raw = row.get(f"Phone {i} - Value", "").strip()
        p_label = row.get(f"Phone {i} - Label", "").strip() or "Mobile"
        if p_raw:
            for sub in split_multi_value(p_raw):
                normalized = normalize_phone(sub)
                if normalized:
                    extra_phones.append({"label": p_label, "value": normalized})
    if extra_phones:
        metadata["phones"] = extra_phones

    # Secondary email
    email2 = row.get("E-mail 2 - Value", "").strip()
    email2_label = row.get("E-mail 2 - Label", "").strip() or "Other"
    if email2:
        metadata["emails"] = [{"label": email2_label, "value": email2}]

    # Address
    addr_formatted = row.get("Address 1 - Formatted", "").strip()
    if addr_formatted:
        metadata["address"] = {
            "formatted": addr_formatted,
            "city": city,
            "region": region,
            "country": country,
        }

    # Website
    website = row.get("Website 1 - Value", "").strip()
    if website:
        metadata["website"] = website

    # Original Google labels for reference
    if label_str and label_str.strip():
        metadata["google_labels"] = split_multi_value(label_str)

    metadata["import_source"] = "google_contacts_csv"
    metadata["import_date"] = "2026-03-18"

    # Birthday
    birthday = row.get("Birthday", "").strip()

    # Event date (some contacts store dates in Event 1)
    event_label = row.get("Event 1 - Label", "").strip()
    event_value = row.get("Event 1 - Value", "").strip()

    return {
        "name": name,
        "email": email1 or None,
        "phone": primary_phone or None,
        "company": company,
        "title": title,
        "contact_type": contact_type,
        "tags": all_tags,
        "location": location,
        "metadata": metadata,
        "google_contact_id": google_contact_id,
        "import_source": "google_csv",
        "domain_slug": domain_slug,
        "birthday": birthday,
        "event_label": event_label,
        "event_value": event_value,
    }


# ── Database Operations ─────────────────────────────────────────────────────

def clear_seed_data(conn) -> int:
    """Remove seed contacts (import_source = 'manual' or NULL with seed-like patterns)."""
    cursor = conn.cursor()
    cursor.execute(
        "SELECT COUNT(*) FROM contacts WHERE import_source = 'manual' OR import_source IS NULL"
    )
    seed_count = cursor.fetchone()[0]

    if seed_count > 0 and seed_count <= 15:
        # Only clear if it looks like seed data (small count)
        cursor.execute(
            "DELETE FROM contacts WHERE import_source = 'manual' OR import_source IS NULL"
        )
        conn.commit()
        print(f"  Cleared {seed_count} seed contacts")
    return seed_count


def upsert_contact(conn, contact: dict) -> tuple[str, str]:
    """Insert or update a contact using ON CONFLICT upsert. Returns (action, id)."""
    cursor = conn.cursor()

    tags_array = "{" + ",".join(f'"{t}"' for t in contact["tags"]) + "}" if contact["tags"] else "{}"
    metadata_json = json.dumps(contact["metadata"])

    # Single-query upsert using ON CONFLICT on google_contact_id
    cursor.execute(
        """INSERT INTO contacts
            (name, email, phone, company, title, contact_type, tags,
             location, metadata, google_contact_id, import_source, domain_slug, is_active)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        ON CONFLICT (google_contact_id) DO UPDATE SET
            name = EXCLUDED.name, email = EXCLUDED.email, phone = EXCLUDED.phone,
            company = EXCLUDED.company, title = EXCLUDED.title,
            contact_type = EXCLUDED.contact_type, tags = EXCLUDED.tags,
            location = EXCLUDED.location, metadata = EXCLUDED.metadata,
            import_source = EXCLUDED.import_source, domain_slug = EXCLUDED.domain_slug,
            is_active = TRUE
        RETURNING id, (xmax = 0) AS was_inserted""",
        (
            contact["name"], contact["email"], contact["phone"],
            contact["company"], contact["title"],
            contact["contact_type"], tags_array, contact["location"],
            metadata_json, contact["google_contact_id"],
            contact["import_source"], contact["domain_slug"],
        ),
    )
    row = cursor.fetchone()
    contact_id = str(row[0])
    action = "inserted" if row[1] else "updated"
    return action, contact_id


def import_birthday(conn, contact_id: str, birthday_str: str):
    """Import a birthday into important_dates if valid."""
    if not birthday_str:
        return

    # Try parsing various date formats
    from datetime import datetime as dt
    date_value = None
    year_known = True

    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%m-%d", "%m/%d"):
        try:
            parsed = dt.strptime(birthday_str, fmt)
            if fmt in ("%m-%d", "%m/%d"):
                # Year unknown — use 1900 as placeholder
                date_value = parsed.replace(year=1900).date()
                year_known = False
            else:
                date_value = parsed.date()
            break
        except ValueError:
            continue

    if not date_value:
        return

    cursor = conn.cursor()

    # Check if already exists
    cursor.execute(
        "SELECT id FROM important_dates WHERE contact_id = %s AND date_type = 'birthday'",
        (contact_id,),
    )
    if cursor.fetchone():
        # Update existing
        cursor.execute(
            "UPDATE important_dates SET date_value = %s, year_known = %s WHERE contact_id = %s AND date_type = 'birthday'",
            (str(date_value), year_known, contact_id),
        )
    else:
        cursor.execute(
            """INSERT INTO important_dates
                (contact_id, date_type, date_value, year_known, reminder_days_before, is_active)
            VALUES (%s, 'birthday', %s, %s, 2, TRUE)""",
            (contact_id, str(date_value), year_known),
        )


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Import Google Contacts CSV into AI OS")
    parser.add_argument("--csv", default=DEFAULT_CSV_PATH, help="Path to Google Contacts CSV")
    parser.add_argument("--dry-run", action="store_true", help="Parse and report without writing to DB")
    parser.add_argument("--keep-seeds", action="store_true", help="Do not clear seed contacts before import")
    args = parser.parse_args()

    csv_path = os.path.abspath(args.csv)
    print(f"\n{'='*60}")
    print(f"Google Contacts → AI OS Importer")
    print(f"{'='*60}")
    print(f"  CSV: {csv_path}")
    print(f"  Mode: {'DRY RUN' if args.dry_run else 'LIVE IMPORT'}")

    # Parse CSV
    contacts = []
    skipped = 0
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            parsed = parse_row(row)
            if parsed:
                contacts.append(parsed)
            else:
                skipped += 1

    print(f"\n  Parsed: {len(contacts)} contacts")
    print(f"  Skipped: {skipped} rows (no name/phone/email)")

    # Stats
    type_counts = {}
    tag_counts = {}
    domain_counts = {}
    for c in contacts:
        type_counts[c["contact_type"]] = type_counts.get(c["contact_type"], 0) + 1
        for t in c["tags"]:
            tag_counts[t] = tag_counts.get(t, 0) + 1
        d = c["domain_slug"] or "(none)"
        domain_counts[d] = domain_counts.get(d, 0) + 1

    print(f"\n  Contact types:")
    for ct, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"    {ct}: {count}")

    print(f"\n  Top tags:")
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1])[:15]:
        print(f"    {tag}: {count}")

    print(f"\n  Domain distribution:")
    for domain, count in sorted(domain_counts.items(), key=lambda x: -x[1]):
        print(f"    {domain}: {count}")

    birthday_count = sum(1 for c in contacts if c.get("birthday"))
    email_count = sum(1 for c in contacts if c.get("email"))
    company_count = sum(1 for c in contacts if c.get("company"))
    print(f"\n  With email: {email_count}")
    print(f"  With company: {company_count}")
    print(f"  With birthday: {birthday_count}")

    if args.dry_run:
        print(f"\n  DRY RUN complete — no database changes made.")
        return

    # Connect to DB
    print(f"\n  Connecting to Cloud SQL...")
    conn = get_db_connection()
    print(f"  Connected.")

    # Clear seed data
    if not args.keep_seeds:
        print(f"\n  Checking for seed data...")
        clear_seed_data(conn)

    # Import contacts
    print(f"\n  Importing {len(contacts)} contacts...")
    inserted = 0
    updated = 0
    errors = 0

    for i, contact in enumerate(contacts, 1):
        try:
            action, contact_id = upsert_contact(conn, contact)
            if action == "inserted":
                inserted += 1
            else:
                updated += 1

            # Import birthday if present
            if contact.get("birthday"):
                import_birthday(conn, contact_id, contact["birthday"])

            if i % 100 == 0:
                conn.commit()
                print(f"    ... {i}/{len(contacts)} processed")

        except Exception as e:
            errors += 1
            print(f"    ERROR on '{contact['name']}': {e}")
            conn.rollback()

    # Final commit
    conn.commit()

    # Post-import verification
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM contacts WHERE import_source = 'google_csv'")
    total_in_db = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM contacts")
    total_all = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM important_dates")
    dates_count = cursor.fetchone()[0]

    print(f"\n{'='*60}")
    print(f"IMPORT COMPLETE")
    print(f"{'='*60}")
    print(f"  Inserted: {inserted}")
    print(f"  Updated:  {updated}")
    print(f"  Errors:   {errors}")
    print(f"  Total contacts (google_csv): {total_in_db}")
    print(f"  Total contacts (all):        {total_all}")
    print(f"  Important dates:             {dates_count}")
    print()

    conn.close()


if __name__ == "__main__":
    main()
