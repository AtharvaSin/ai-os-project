---
description: "Quick-render a branded visual asset. Usage: /asr-visual-studio:render [brief]. Examples: /asr-visual-studio:render YouTube thumbnail for Bharatvarsh chapter reveal | /asr-visual-studio:render Instagram social pack for AI OS sprint update | /asr-visual-studio:render 10s promo video for Bharatvarsh with uploaded character art"
---

Quick-render a visual asset from a one-line brief.

## Parse the Brief

Analyze `$ARGUMENTS` to extract:

1. **Asset type** — detect from keywords:
   - Video keywords: "video", "animation", "clip", "trailer", "motion", "promo video"
   - Pack keywords: "pack", "all platforms", "social pack", "content pack"
   - Image keywords (default): "thumbnail", "banner", "poster", "card", "image", "graphic"

2. **Brand context** — infer from topic:
   - Bharatvarsh / novel / lore / fiction / chapter → **B**
   - AI OS / tech / dashboard / system / sprint → **A**
   - Professional / portfolio / career / LinkedIn → **C**
   - If explicit: "context A", "brand A", etc. → use specified

3. **Platform** — detect target platform:
   - "YouTube" → youtube_thumbnail preset
   - "Instagram" / "IG" → instagram_feed preset
   - "Story" / "Reel" → instagram_story preset
   - "LinkedIn" → linkedin_post preset
   - "Twitter" / "X" → twitter_post preset
   - "Banner" → banner_wide preset
   - No platform specified → social_post_square preset

4. **Duration** (video only) — detect seconds: "10s", "15 seconds", etc.

5. **Referenced files** — check the working directory for images/videos the user may have mentioned or uploaded.

## Route to Skill

Based on detected asset type:
- Video/animation/clip → invoke `create-video` skill
- Pack/all platforms → invoke `create-social-pack` skill
- Everything else → invoke `create-image` skill

## Execution Rules

- **Don't ask clarifying questions** unless the brief is genuinely ambiguous (can't determine asset type OR brand context)
- Infer reasonable defaults and note them in the render log
- If user says "with the uploaded image" — check working folder for recent image files
- Always apply brand context — never render unbranded
- Deliver output with render-log.md documenting decisions made
