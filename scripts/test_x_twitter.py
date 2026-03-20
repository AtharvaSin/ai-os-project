"""Test X/Twitter API connectivity and posting."""
import asyncio
import json
import os
import sys

# Set credentials
os.environ["X_API_KEY"] = "6pNUx6W0KAKRczALO8YzYUKln"
os.environ["X_API_SECRET"] = "fP1fQjH36XJCIs0cTOu9ILPztZGuKLpkzjtlgBz177u2iyA5t4"
os.environ["X_ACCESS_TOKEN"] = "2034971377145716736-Xk5klaA2NJ6cf7HaAQti5z6jXkUdFA"
os.environ["X_ACCESS_TOKEN_SECRET"] = "FwyO5AVYVJbwD1qqnYnYJX5oqlaTh2nq4wr3dYy8QDS9S"
os.environ["X_BEARER_TOKEN"] = "AAAAAAAAAAAAAAAAAAAAAAPer8QEAAAAcB7USM0wR8QZCPnSffHuU%2FpZvfg%3DUXJmtkl2tNcW4rQlkhLsdBhboEjwtgGwJQ4U4fMHDN6BP28sxd"

# Add gateway to path
sys.path.insert(0, "mcp-servers/ai-os-gateway")

from app.modules.x_twitter import (
    _build_oauth_header,
    _generate_oauth_signature,
)

import httpx

_X_API_V2 = "https://api.x.com/2"


async def test_user_lookup():
    """Test 1: Bearer token user lookup."""
    print("\n[Test 1] Bearer Token — User Lookup (@bharatvarshHQ)")
    bearer = os.environ["X_BEARER_TOKEN"]
    headers = {"Authorization": f"Bearer {bearer}"}

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"{_X_API_V2}/users/by/username/bharatvarshHQ",
            headers=headers,
        )
        data = resp.json()
        if "data" in data:
            print(f"  User ID: {data['data']['id']}")
            print(f"  Name: {data['data']['name']}")
            print(f"  Username: {data['data']['username']}")
            print("  PASS")
            return True
        else:
            print(f"  FAIL: {data}")
            return False


async def test_oauth_signature():
    """Test 2: OAuth 1.0a signature generation."""
    print("\n[Test 2] OAuth 1.0a Signature Generation")
    try:
        header = _build_oauth_header(
            method="POST",
            url=f"{_X_API_V2}/tweets",
            consumer_key=os.environ["X_API_KEY"],
            consumer_secret=os.environ["X_API_SECRET"],
            access_token=os.environ["X_ACCESS_TOKEN"],
            token_secret=os.environ["X_ACCESS_TOKEN_SECRET"],
        )
        assert header.startswith("OAuth ")
        assert "oauth_signature" in header
        print(f"  Header preview: {header[:80]}...")
        print("  PASS")
        return True
    except Exception as e:
        print(f"  FAIL: {e}")
        return False


async def test_post_tweet():
    """Test 3: Post a test tweet."""
    print("\n[Test 3] Post Test Tweet via OAuth 1.0a")

    url = f"{_X_API_V2}/tweets"
    body = {"text": "First transmission from the Bharatvarsh AI Command Center. Systems online. #Bharatvarsh #AI"}

    auth_header = _build_oauth_header(
        method="POST",
        url=url,
        consumer_key=os.environ["X_API_KEY"],
        consumer_secret=os.environ["X_API_SECRET"],
        access_token=os.environ["X_ACCESS_TOKEN"],
        token_secret=os.environ["X_ACCESS_TOKEN_SECRET"],
    )

    headers = {
        "Authorization": auth_header,
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, headers=headers, json=body)
        data = resp.json()

        if resp.status_code == 201 and "data" in data:
            tweet_id = data["data"]["id"]
            tweet_url = f"https://x.com/bharatvarshHQ/status/{tweet_id}"
            print(f"  Tweet ID: {tweet_id}")
            print(f"  URL: {tweet_url}")
            print(f"  Text: {data['data'].get('text', body['text'])}")
            print("  PASS")
            return True, tweet_id
        else:
            print(f"  Status: {resp.status_code}")
            print(f"  Response: {json.dumps(data, indent=2)}")
            print("  FAIL")
            return False, None


async def main():
    print("=" * 60)
    print("X/Twitter API Integration Tests")
    print("=" * 60)

    results = []

    # Test 1: User lookup
    r1 = await test_user_lookup()
    results.append(("Bearer Token Lookup", r1))

    # Test 2: OAuth signature
    r2 = await test_oauth_signature()
    results.append(("OAuth Signature", r2))

    # Test 3: Post tweet
    r3, tweet_id = await test_post_tweet()
    results.append(("Post Tweet", r3))

    # Summary
    print("\n" + "=" * 60)
    print("Results:")
    for name, passed in results:
        status = "PASS" if passed else "FAIL"
        print(f"  {name:30} {status}")
    print("=" * 60)

    passed_count = sum(1 for _, p in results if p)
    print(f"\n{passed_count}/{len(results)} tests passed")

    if tweet_id:
        print(f"\nTest tweet URL: https://x.com/bharatvarshHQ/status/{tweet_id}")
        print("Review and delete if needed.")


asyncio.run(main())
