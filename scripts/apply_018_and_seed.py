"""Apply migration 018 (social_accounts tables) and seed Meta credentials."""
import asyncio
import json

import asyncpg

DB_CONFIG = {
    "host": "localhost",
    "port": 15432,
    "database": "ai_os",
    "user": "ai_os_admin",
    "password": "ai_os_admin_clearance",
}

MIGRATION_SQL = """
-- Check if tables already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'social_accounts') THEN

        -- Social accounts: OAuth token storage
        CREATE TABLE social_accounts (
            id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            platform        TEXT NOT NULL,
            account_name    TEXT NOT NULL,
            account_id      TEXT,
            access_token    TEXT NOT NULL,
            refresh_token   TEXT,
            token_expires_at TIMESTAMPTZ,
            scopes          TEXT[],
            is_active       BOOLEAN NOT NULL DEFAULT TRUE,
            metadata        JSONB DEFAULT '{}'::JSONB,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX idx_social_accounts_platform ON social_accounts(platform);
        CREATE INDEX idx_social_accounts_active ON social_accounts(is_active);
        CREATE UNIQUE INDEX idx_social_accounts_platform_account ON social_accounts(platform, account_id);

        CREATE TRIGGER social_accounts_updated_at
            BEFORE UPDATE ON social_accounts
            FOR EACH ROW
            EXECUTE FUNCTION moddatetime(updated_at);

        RAISE NOTICE 'Created social_accounts table';
    ELSE
        RAISE NOTICE 'social_accounts already exists, skipping';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'social_post_log') THEN

        -- Social post log: tracks every post attempt
        CREATE TABLE social_post_log (
            id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            account_id      UUID REFERENCES social_accounts(id) ON DELETE SET NULL,
            platform        TEXT NOT NULL,
            content_preview TEXT,
            content_type    TEXT NOT NULL DEFAULT 'post',
            external_post_id TEXT,
            external_url    TEXT,
            status          TEXT NOT NULL DEFAULT 'draft',
            campaign_post_id UUID,
            error_message   TEXT,
            metadata        JSONB DEFAULT '{}'::JSONB,
            published_at    TIMESTAMPTZ,
            created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        CREATE INDEX idx_social_post_log_account ON social_post_log(account_id);
        CREATE INDEX idx_social_post_log_platform ON social_post_log(platform);
        CREATE INDEX idx_social_post_log_status ON social_post_log(status);
        CREATE INDEX idx_social_post_log_published ON social_post_log(published_at DESC);

        CREATE TRIGGER social_post_log_updated_at
            BEFORE UPDATE ON social_post_log
            FOR EACH ROW
            EXECUTE FUNCTION moddatetime(updated_at);

        RAISE NOTICE 'Created social_post_log table';
    ELSE
        RAISE NOTICE 'social_post_log already exists, skipping';
    END IF;
END $$;
"""

# Permanent Page Access Token (never expires)
FB_PAGE_TOKEN = "EAAM4eqbG2ZCUBQ33O1yr4s4q3CLFCsgGGkhFDyEyUweXEzKJ1bFxADtqVy1Pq1MuUPOzVgZBCuXQ4cIVP6Mg0LMWjVwPx8MXA9eWw2SbF8OjD1eahGIYETKnaRITGr4FtnE9ZBgxwjrgcAvlAEWURqk7z6RZAMldOgcKjdD0mRlqnfrypDlN5Ng9dZBRfvhXOJRYZC"

# Instagram token (60-day expiry)
IG_TOKEN = "IGAAUMAP4VqeFBZAGEwVk5NSHNrek9LQjE0SDZA6MWRwWm1QM2NVaU92aGpMTIBzU193N1JuWVdicXlQUjZAaa2ZABN1BpclZABOE9pRnM5U3NCLVBNUVVSRkJQU05nLUpnYzhxNlYwbUhZAdmt5V3pFS0xtWEdhS2tIMFBOa0l0dUczWQZDZD"


async def main():
    print("=" * 60)
    print("Step 1: Apply Migration 018")
    print("=" * 60)

    conn = await asyncpg.connect(**DB_CONFIG)

    try:
        # Apply migration
        await conn.execute(MIGRATION_SQL)
        print("Migration 018 applied successfully.")

        # Verify tables exist
        tables = await conn.fetch(
            "SELECT tablename FROM pg_tables WHERE tablename IN ('social_accounts', 'social_post_log')"
        )
        print(f"Tables found: {[r['tablename'] for r in tables]}")

        print("\n" + "=" * 60)
        print("Step 2: Seed Social Accounts")
        print("=" * 60)

        # Check if accounts already exist
        existing = await conn.fetchval(
            "SELECT COUNT(*) FROM social_accounts WHERE platform IN ('facebook', 'instagram')"
        )
        if existing > 0:
            print(f"Found {existing} existing accounts. Updating tokens...")
            # Update Facebook
            await conn.execute(
                "UPDATE social_accounts SET access_token = $1, updated_at = NOW() "
                "WHERE platform = 'facebook' AND is_active = TRUE",
                FB_PAGE_TOKEN,
            )
            # Update Instagram
            await conn.execute(
                "UPDATE social_accounts SET access_token = $1, updated_at = NOW() "
                "WHERE platform = 'instagram' AND is_active = TRUE",
                IG_TOKEN,
            )
            print("Tokens updated.")
        else:
            # Insert Facebook Page account
            fb_metadata = json.dumps({
                "page_name": "Welcome to Bharatvarsh",
                "page_id": "986741974533444",
                "ig_business_account_id": "17841440825662864",
            })
            await conn.execute(
                "INSERT INTO social_accounts "
                "(platform, account_name, account_id, access_token, token_expires_at, scopes, is_active, metadata) "
                "VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)",
                "facebook",
                "Welcome to Bharatvarsh",
                "986741974533444",
                FB_PAGE_TOKEN,
                None,  # permanent token — never expires
                ["pages_manage_posts", "pages_read_engagement", "pages_show_list",
                 "instagram_basic", "instagram_content_publish"],
                True,
                fb_metadata,
            )
            print("Inserted Facebook Page account (permanent token).")

            # Insert Instagram account
            ig_metadata = json.dumps({
                "ig_user_id": "17841440825662864",
                "username": "welcometobharatvarsh",
                "linked_page_id": "986741974533444",
            })
            await conn.execute(
                "INSERT INTO social_accounts "
                "(platform, account_name, account_id, access_token, token_expires_at, scopes, is_active, metadata) "
                "VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)",
                "instagram",
                "welcometobharatvarsh",
                "17841440825662864",
                IG_TOKEN,
                None,  # will set proper expiry later
                ["instagram_basic", "instagram_content_publish"],
                True,
                ig_metadata,
            )
            print("Inserted Instagram account.")

        # Verify
        print("\nVerification:")
        accounts = await conn.fetch(
            "SELECT platform, account_name, account_id, is_active, "
            "CASE WHEN token_expires_at IS NULL THEN 'NEVER' ELSE token_expires_at::text END as expires, "
            "array_to_string(scopes, ', ') as scope_list "
            "FROM social_accounts ORDER BY platform"
        )
        for a in accounts:
            print(f"  {a['platform']:12} | {a['account_name']:30} | ID: {a['account_id'][:20]}... | Active: {a['is_active']} | Expires: {a['expires']}")

        # Count tables
        table_count = await conn.fetchval(
            "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public'"
        )
        print(f"\nTotal tables in ai_os: {table_count}")

    except Exception as e:
        print(f"ERROR: {e}")
        raise
    finally:
        await conn.close()

    print("\n" + "=" * 60)
    print("Steps 1 & 2 COMPLETE")
    print("=" * 60)


asyncio.run(main())
