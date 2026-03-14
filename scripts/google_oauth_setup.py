"""Google OAuth setup script for AI OS MCP Gateway.

Run this ONCE locally to get a refresh token for the Gateway's Google API access.
The refresh token is long-lived and stored in GCP Secret Manager.

Prerequisites:
  1. Create OAuth consent screen in GCP Console:
     - Go to: APIs & Services > OAuth consent screen
     - User type: External (or Internal if using Workspace)
     - App name: "AI OS Gateway"
     - Scopes: Google Tasks API, Google Drive API, Google Calendar API
     - Test users: add your Google account email

  2. Create OAuth 2.0 credentials:
     - Go to: APIs & Services > Credentials > Create Credentials > OAuth 2.0 Client ID
     - Application type: Desktop app
     - Name: "AI OS Gateway Local Setup"
     - Download the JSON file

  3. Enable the 3 APIs in GCP Console:
     - Google Tasks API
     - Google Drive API
     - Google Calendar API

Usage:
  python scripts/google_oauth_setup.py --client-secrets path/to/client_secret.json
"""

import argparse
import json
import sys
from pathlib import Path


SCOPES = [
    "https://www.googleapis.com/auth/tasks",
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/calendar",
]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Obtain Google OAuth refresh token for AI OS MCP Gateway"
    )
    parser.add_argument(
        "--client-secrets",
        required=True,
        help="Path to the OAuth 2.0 client secrets JSON file downloaded from GCP Console",
    )
    parser.add_argument(
        "--store-in-secret-manager",
        action="store_true",
        help="Automatically store credentials in GCP Secret Manager",
    )
    args = parser.parse_args()

    secrets_path = Path(args.client_secrets)
    if not secrets_path.exists():
        print(f"Error: File not found: {secrets_path}")
        sys.exit(1)

    try:
        from google_auth_oauthlib.flow import InstalledAppFlow
    except ImportError:
        print("Error: Install google-auth-oauthlib first:")
        print("  pip install google-auth-oauthlib")
        sys.exit(1)

    # Run the OAuth consent flow — opens browser
    flow = InstalledAppFlow.from_client_secrets_file(str(secrets_path), scopes=SCOPES)
    creds = flow.run_local_server(port=8090, prompt="consent")

    # Extract the values we need
    with open(secrets_path) as f:
        client_config = json.load(f)

    # Handle both "installed" and "web" client types
    config_key = "installed" if "installed" in client_config else "web"
    client_id = client_config[config_key]["client_id"]
    client_secret = client_config[config_key]["client_secret"]
    refresh_token = creds.refresh_token

    if not refresh_token:
        print("Error: No refresh token received. Make sure prompt='consent' is set.")
        print("Try revoking access at https://myaccount.google.com/permissions and retry.")
        sys.exit(1)

    print("\n" + "=" * 60)
    print("OAuth setup complete! Here are your credentials:")
    print("=" * 60)
    print(f"\nGOOGLE_CLIENT_ID={client_id}")
    print(f"GOOGLE_CLIENT_SECRET={client_secret}")
    print(f"GOOGLE_REFRESH_TOKEN={refresh_token}")

    if args.store_in_secret_manager:
        _store_in_secret_manager(client_id, client_secret, refresh_token)
    else:
        print("\n" + "-" * 60)
        print("Next steps:")
        print("-" * 60)
        print("\n1. Store in GCP Secret Manager (run these commands):\n")
        print(f'   echo -n "{client_id}" | gcloud secrets create GOOGLE_CLIENT_ID \\')
        print("     --data-file=- --project=ai-operating-system-490208")
        print(f'\n   echo -n "{client_secret}" | gcloud secrets create GOOGLE_CLIENT_SECRET \\')
        print("     --data-file=- --project=ai-operating-system-490208")
        print(f'\n   echo -n "{refresh_token}" | gcloud secrets create GOOGLE_REFRESH_TOKEN \\')
        print("     --data-file=- --project=ai-operating-system-490208")
        print("\n2. Grant the Cloud Run service account access:\n")
        print("   for SECRET in GOOGLE_CLIENT_ID GOOGLE_CLIENT_SECRET GOOGLE_REFRESH_TOKEN; do")
        print("     gcloud secrets add-iam-policy-binding $SECRET \\")
        print("       --member=serviceAccount:ai-os-cloud-run@ai-operating-system-490208.iam.gserviceaccount.com \\")
        print("       --role=roles/secretmanager.secretAccessor \\")
        print("       --project=ai-operating-system-490208")
        print("   done")
        print("\n3. Add to your local .env file (for dev):\n")
        print(f"   GOOGLE_CLIENT_ID={client_id}")
        print(f"   GOOGLE_CLIENT_SECRET={client_secret}")
        print(f"   GOOGLE_REFRESH_TOKEN={refresh_token}")
        print("\n4. Redeploy the gateway (Cloud Build will pick up the new secrets).")
        print()


def _store_in_secret_manager(
    client_id: str, client_secret: str, refresh_token: str
) -> None:
    """Store credentials in GCP Secret Manager."""
    try:
        from google.cloud import secretmanager
    except ImportError:
        print("\nError: Install google-cloud-secret-manager:")
        print("  pip install google-cloud-secret-manager")
        sys.exit(1)

    client = secretmanager.SecretManagerServiceClient()
    project = "ai-operating-system-490208"

    secrets = {
        "GOOGLE_CLIENT_ID": client_id,
        "GOOGLE_CLIENT_SECRET": client_secret,
        "GOOGLE_REFRESH_TOKEN": refresh_token,
    }

    for name, value in secrets.items():
        secret_path = f"projects/{project}/secrets/{name}"
        try:
            # Try to create the secret
            client.create_secret(
                request={
                    "parent": f"projects/{project}",
                    "secret_id": name,
                    "secret": {"replication": {"automatic": {}}},
                }
            )
            print(f"\nCreated secret: {name}")
        except Exception:
            # Secret already exists — add a new version
            print(f"\nSecret {name} already exists, adding new version")

        # Add the secret version
        client.add_secret_version(
            request={
                "parent": secret_path,
                "payload": {"data": value.encode("utf-8")},
            }
        )
        print(f"  Stored value for {name}")

    # Grant access to the Cloud Run service account
    sa = f"serviceAccount:ai-os-cloud-run@{project}.iam.gserviceaccount.com"
    print(f"\nGranting Secret Accessor role to {sa}...")
    for name in secrets:
        secret_path = f"projects/{project}/secrets/{name}"
        policy = client.get_iam_policy(request={"resource": secret_path})

        binding_exists = any(
            b.role == "roles/secretmanager.secretAccessor" and sa in b.members
            for b in policy.bindings
        )
        if not binding_exists:
            policy.bindings.add(
                role="roles/secretmanager.secretAccessor", members=[sa]
            )
            client.set_iam_policy(
                request={"resource": secret_path, "policy": policy}
            )
            print(f"  Granted access for {name}")
        else:
            print(f"  Access already granted for {name}")

    print("\nAll secrets stored in Secret Manager!")
    print("Next: redeploy the gateway to pick up the new secrets.")


if __name__ == "__main__":
    main()
