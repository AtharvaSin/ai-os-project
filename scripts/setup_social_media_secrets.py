"""
Social Media Connector — Token Exchange + GCP Secret Setup
Exchanges short-lived Meta tokens for long-lived ones,
then creates GCP secrets.
"""
import json
import subprocess
import urllib.request
import urllib.parse
import sys

# ====== CREDENTIALS ======
META_APP_ID = "906524365347829"
META_APP_SECRET = "42666ffa6913e185e2c67645286b40de"
LONG_LIVED_USER_TOKEN = "EAAM4eqbG2ZCUBQ2Xy0lWMNemZAfKsXZBepXUmP8PZAOLBl5ZBApX8yxxTEjFgmuZB95D5corcbDvrmysobeZBhEdggZAS68mVgBB0jyWNDMJZCLmZCSXDUlK04ptLi1qr9ewOtEUCsVW19fcTYzMkZAsiS1ZAcvitFDzxWYrmNIt0aKQmxUnOO3OpnrVoTGZBu3sv2kfe"
PAGE_ID = "986741974533444"
IG_TOKEN = "IGAAUMAP4VqeFBZAGEwVk5NSHNrek9LQjE0SDZA6MWRwWm1QM2NVaU92aGpMTIBzU193N1JuWVdicXlQUjZAaa2ZABN1BpclZABOE9pRnM5U3NCLVBNUVVSRkJQU05nLUpnYzhxNlYwbUhZAdmt5V3pFS0xtWEdhS2tIMFBOa0l0dUczWQZDZD"
GCP_PROJECT = "ai-operating-system-490208"
SERVICE_ACCOUNT = "ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com"


def fetch_json(url: str) -> dict:
    """Fetch JSON from a URL."""
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())


def get_permanent_page_token() -> str:
    """Get permanent Page Access Token using long-lived User Token."""
    print("\n[1/5] Getting permanent Page Access Token...")
    url = (
        f"https://graph.facebook.com/v25.0/{PAGE_ID}"
        f"?fields=access_token,name"
        f"&access_token={LONG_LIVED_USER_TOKEN}"
    )
    data = fetch_json(url)
    token = data.get("access_token", "")
    name = data.get("name", "")
    print(f"  Page: {name}")
    print(f"  Token length: {len(token)} chars")
    print(f"  Token preview: {token[:30]}...{token[-10:]}")
    return token


def debug_token(token: str, label: str) -> None:
    """Debug a token to check its expiry."""
    print(f"\n  Debugging {label}...")
    url = (
        f"https://graph.facebook.com/v25.0/debug_token"
        f"?input_token={token}"
        f"&access_token={META_APP_ID}|{META_APP_SECRET}"
    )
    try:
        data = fetch_json(url)
        info = data.get("data", {})
        expires = info.get("expires_at", 0)
        is_valid = info.get("is_valid", False)
        scopes = info.get("scopes", [])
        if expires == 0:
            print(f"  Expires: NEVER (permanent)")
        else:
            import datetime
            exp_dt = datetime.datetime.fromtimestamp(expires)
            print(f"  Expires: {exp_dt.isoformat()}")
        print(f"  Valid: {is_valid}")
        print(f"  Scopes: {', '.join(scopes)}")
    except Exception as e:
        print(f"  Debug failed: {e}")


def create_secret(name: str, value: str) -> bool:
    """Create a GCP secret and grant service account access."""
    print(f"\n  Creating secret: {name}...")

    # Check if secret already exists
    check = subprocess.run(
        ["gcloud", "secrets", "describe", name, f"--project={GCP_PROJECT}"],
        capture_output=True, text=True
    )
    if check.returncode == 0:
        # Secret exists — add new version
        print(f"  Secret {name} exists, adding new version...")
        proc = subprocess.run(
            ["gcloud", "secrets", "versions", "add", name,
             f"--project={GCP_PROJECT}", "--data-file=-"],
            input=value, capture_output=True, text=True
        )
    else:
        # Create new secret
        proc = subprocess.run(
            ["gcloud", "secrets", "create", name,
             f"--project={GCP_PROJECT}",
             "--replication-policy=automatic",
             "--data-file=-"],
            input=value, capture_output=True, text=True
        )

    if proc.returncode != 0:
        print(f"  ERROR: {proc.stderr.strip()}")
        return False

    print(f"  Secret {name} created/updated.")

    # Grant access to service account
    grant = subprocess.run(
        ["gcloud", "secrets", "add-iam-policy-binding", name,
         f"--member=serviceAccount:{SERVICE_ACCOUNT}",
         "--role=roles/secretmanager.secretAccessor",
         f"--project={GCP_PROJECT}"],
        capture_output=True, text=True
    )
    if grant.returncode == 0:
        print(f"  Granted access to {SERVICE_ACCOUNT.split('@')[0]}")
    else:
        print(f"  Grant warning: {grant.stderr.strip()[:100]}")

    return True


def main():
    print("=" * 60)
    print("AI OS — Social Media Connector Setup")
    print("=" * 60)

    # Step 1: Get permanent Page token
    try:
        page_token = get_permanent_page_token()
    except Exception as e:
        print(f"  ERROR getting page token: {e}")
        print("  Falling back to short-lived token from Graph API Explorer")
        page_token = input("  Paste your Page Access Token: ").strip()

    # Step 2: Debug tokens
    print("\n[2/5] Verifying tokens...")
    debug_token(page_token, "Page Token")

    # Step 3: Create GCP secrets
    print("\n[3/5] Creating GCP secrets...")
    secrets = {
        "META_APP_ID": META_APP_ID,
        "META_APP_SECRET": META_APP_SECRET,
        "META_PAGE_ACCESS_TOKEN": page_token,
        "META_IG_USER_TOKEN": IG_TOKEN,
    }

    results = {}
    for name, value in secrets.items():
        results[name] = create_secret(name, value)

    # Step 4: Verify
    print("\n[4/5] Verifying secrets...")
    verify = subprocess.run(
        ["gcloud", "secrets", "list", f"--project={GCP_PROJECT}",
         "--filter=name:META_ OR name:LINKEDIN_",
         "--format=table(name,createTime)"],
        capture_output=True, text=True
    )
    if verify.returncode == 0:
        print(verify.stdout)
    else:
        # List all and filter manually
        verify2 = subprocess.run(
            ["gcloud", "secrets", "list", f"--project={GCP_PROJECT}",
             "--format=table(name,createTime)"],
            capture_output=True, text=True
        )
        print(verify2.stdout)

    # Step 5: Summary
    print("\n[5/5] Summary")
    print("=" * 60)
    for name, ok in results.items():
        status = "CREATED" if ok else "FAILED"
        print(f"  {name}: {status}")

    print(f"\n  Page Token permanent: check debug output above")
    print(f"  Instagram Token: 60-day expiry (refresh before expiry)")
    print(f"\n  Next steps:")
    print(f"    1. Apply migration 018 to Cloud SQL")
    print(f"    2. Seed social_accounts table")
    print(f"    3. Deploy updated Gateway")
    print("=" * 60)


if __name__ == "__main__":
    main()
