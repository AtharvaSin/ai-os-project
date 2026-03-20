# post-to-social

Publish content to LinkedIn, Facebook, and Instagram via AI OS MCP Gateway social connectors. Orchestrates the full workflow: content validation, platform formatting, posting, logging, and campaign tracking.

## When to Use
Use when user says: "post this to LinkedIn", "publish to Instagram", "share on Facebook", "post to social", "cross-post", "publish content", or wants to push generated content to any connected social platform.

## Connectors Required
- MCP Gateway tools: `post_to_linkedin`, `post_to_facebook`, `post_to_instagram`, `get_linkedin_metrics`, `get_meta_metrics`, `list_linkedin_posts`, `list_meta_posts`, `get_linkedin_profile`
- Supporting tools: `query_db`, `insert_record`, `update_record`, `send_telegram_message`
- Channel knowledge: `search_knowledge` (sub_domain='social-channels') — loads channel profile for format specs, handle, and destination context

## Workflow

### Step 1 — Load Channel Profile & Content Validation

**Load channel knowledge** before validating:
- **`search_knowledge`** — Search for the channel profile for the target platform:
  ```
  search_knowledge(query="{platform} channel profile", sub_domain="social-channels", limit=1)
  ```
- If a channel profile exists, extract: `channel_handle`, `channel_url`, `content_pillars`, and platform-specific format specs
- Use the channel handle when confirming the post destination to the user
- **Fallback:** If no channel profile exists, proceed with default validation. Publishing still works without a registered channel.

**Validate content** meets platform constraints:

| Platform   | Max Length | Media Required | Notes |
|-----------|-----------|----------------|-------|
| LinkedIn  | 3000 chars | No            | Supports text-only, link, article, image |
| Facebook  | 63,206 chars | No          | Text-only OK, link preview auto-generated |
| Instagram | 2200 chars | **Yes** (image_url required) | No text-only posts, 30 hashtag max |

If content exceeds limits, truncate with "..." and warn the user.
If posting to Instagram without an image, stop and ask the user for one.

### Step 2 — Platform Formatting
Adapt content per platform voice:
- **LinkedIn**: Professional tone. Structure with line breaks. Add relevant hashtags (3-5). No emojis in first line.
- **Facebook**: Conversational. Shorter paragraphs. Can include emojis. Add link if relevant.
- **Instagram**: Visual-first caption. Hashtags at the end (up to 30). Include call-to-action.

### Step 3 — Post
Call the appropriate MCP tool(s):

```
# LinkedIn
post_to_linkedin(content="...", visibility="PUBLIC")

# Facebook
post_to_facebook(message="...", link="https://...")

# Instagram (image required)
post_to_instagram(caption="...", image_url="https://publicly-accessible-image.jpg")
```

If a `campaign_post_id` exists (from `/content-gen` or `/social-post`), pass it to link the post to the campaign tracking system.

### Step 4 — Cross-Post (Optional)
If user says "cross-post" or "post everywhere", post to all configured platforms with platform-adapted content. Call tools in sequence (not parallel) to avoid rate limits.

### Step 5 — Confirm & Log
After posting:
1. Report the result to the user with post URL(s)
2. Send a Telegram notification via `send_telegram_message`:
   ```
   Published to {platform}: "{content_preview...}" — {post_url}
   ```
3. If linked to a campaign, the MCP tool automatically updates `campaign_posts` status to `published`

### Step 6 — Metrics Check (Optional)
If user asks "how did it do?" or "check metrics" after posting:
- LinkedIn: `get_linkedin_metrics(post_id="...")`
- Facebook/Instagram: `get_meta_metrics(post_id="...", platform="facebook|instagram")`

Report: likes, comments, shares, impressions, reach.

## Error Handling
- **No account configured**: Tell user to add credentials to `social_accounts` table via `insert_record`
- **Token expired**: The OAuth manager auto-refreshes. If refresh fails, tell user to re-authenticate
- **API rate limit**: Wait and retry once. If still failing, save as draft and notify
- **Instagram no image**: Stop and ask user for a publicly accessible image URL

## Campaign Integration
If content was generated via `/content-gen` or `/social-post`:
1. Check `campaign_posts` for the draft record
2. Pass its `id` as `campaign_post_id` to the posting tool
3. The tool updates the record with `external_post_id`, `published_at`, and `status: published`

If no campaign exists, the post is still logged in `social_post_log` for audit.

## Examples

**Single platform:**
```
User: Post this to LinkedIn: "Excited to announce our latest AI infrastructure milestone..."
→ Validate length (OK) → post_to_linkedin(content="...") → Report URL → Telegram notify
```

**Cross-post:**
```
User: Cross-post this announcement to LinkedIn and Facebook
→ Adapt for LinkedIn → post_to_linkedin(...) → Adapt for Facebook → post_to_facebook(...) → Report both URLs
```

**From campaign:**
```
User: Publish the draft LinkedIn post from the AI OS launch campaign
→ query_db to find campaign_post with status='draft' → post_to_linkedin(content=..., campaign_post_id=...) → campaign_posts updated
```
