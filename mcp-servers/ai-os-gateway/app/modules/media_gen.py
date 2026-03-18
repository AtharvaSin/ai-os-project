"""Visual Content Generation MCP tools for the AI OS Gateway.

Provides 5 tools for brand-consistent image generation and media management:
- generate_image: Brand-injected image generation via Google Gemini API
- edit_image: Modify existing images using Gemini conversational editing
- render_template: Render branded HTML templates to PNG via Playwright
- store_asset: Store manually created assets and log in media_assets table
- list_assets: Query generated/stored media with filters

Uses the Google Gemini Developer API (separate from Google AI Pro subscription).
Models: Imagen 4 Fast/Standard/Ultra, Gemini Flash (Nano Banana 2), Gemini Pro.
"""

from __future__ import annotations

import base64
import io
import json
import logging
import os
import time
import uuid
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import Any

from fastmcp import FastMCP

logger = logging.getLogger(__name__)

# ── Brand Context Configurations ──────────────────────────────────────────

BRAND_CONFIGS: dict[str, dict[str, Any]] = {
    "A": {
        "name": "AI OS",
        "accent": "#00D492",
        "bg_color": "#0F1419",
        "text_color": "#FFFFFF",
        "font_primary": "DM Sans",
        "font_mono": "JetBrains Mono",
        "style_direction": (
            "Dark, precise, technical aesthetic. Deep obsidian backgrounds (#0F1419, #1A1F2E). "
            "Emerald accent (#00D492). Geometric patterns, clean grid layouts, subtle glow effects. "
            "Futuristic but minimal. Circuit-like details. Digital precision."
        ),
        "negative_guidance": (
            "No film grain, no organic textures, no glassmorphism, no light backgrounds, "
            "no warm colors, no hand-drawn elements, no watercolor effects."
        ),
        "footer_text": "AI OS",
        "footer_tag": "atharvasingh.dev",
    },
    "B": {
        "name": "Bharatvarsh",
        "accent": "#F1C232",
        "bg_color": "#0A0A0A",
        "text_color": "#FFFFFF",
        "font_primary": "Bebas Neue",
        "font_mono": "JetBrains Mono",
        "style_direction": (
            "Dystopian-cinematic atmosphere. Dark obsidian with mustard/gold accents (#F1C232). "
            "Film noir lighting, tense shadows, surveillance aesthetics. "
            "Ancient Indian architecture fused with dystopian technology. "
            "Smoke, dust particles, dramatic rim lighting. Gritty, textured surfaces."
        ),
        "negative_guidance": (
            "No white or light backgrounds, no violet/purple, no clean corporate aesthetic, "
            "no bright cheerful colors, no minimalist flat design, no cartoon style."
        ),
        "footer_text": "Bharatvarsh",
        "footer_tag": "welcometobharatvarsh.com",
    },
    "C": {
        "name": "Portfolio",
        "accent": "#8B5CF6",
        "bg_color": "#FFFFFF",
        "text_color": "#1A1A2E",
        "font_primary": "Inter",
        "font_mono": "JetBrains Mono",
        "style_direction": (
            "Clean professional aesthetic. Light mode default with violet accent (#8B5CF6). "
            "Coral secondary (#EC4899). Modern, airy layouts. Soft gradients. "
            "Professional but approachable. Subtle depth with light shadows."
        ),
        "negative_guidance": (
            "No mustard/gold, no film grain, no surveillance textures, no dark dystopian elements, "
            "no heavy shadows, no gritty textures, no neon effects."
        ),
        "footer_text": "Atharva Singh",
        "footer_tag": "AI & Cloud Product",
    },
}

# ── Model Configuration ───────────────────────────────────────────────────

MODEL_CONFIGS: dict[str, dict[str, Any]] = {
    "imagen-fast": {
        "api_id": "imagen-4.0-fast-generate-001",
        "type": "imagen",
        "cost_per_image": 0.02,
        "requires_billing": True,
    },
    "imagen-standard": {
        "api_id": "imagen-4.0-generate-001",
        "type": "imagen",
        "cost_per_image": 0.04,
        "requires_billing": True,
    },
    "imagen-ultra": {
        "api_id": "imagen-4.0-ultra-generate-001",
        "type": "imagen",
        "cost_per_image": 0.06,
        "requires_billing": True,
    },
    "gemini-flash": {
        "api_id": "gemini-2.5-flash-image",
        "type": "gemini",
        "cost_per_image": 0.0,
    },
    "gemini-flash-preview": {
        "api_id": "gemini-3.1-flash-image-preview",
        "type": "gemini",
        "cost_per_image": 0.045,
    },
    "gemini-pro": {
        "api_id": "gemini-3-pro-image-preview",
        "type": "gemini",
        "cost_per_image": 0.134,
    },
}

# Auto model routing: content_type → model key
# Default to gemini-flash (free tier). Imagen requires billing.
AUTO_MODEL_MAP: dict[str, str] = {
    "social": "gemini-flash",
    "thumbnail": "gemini-flash",
    "hero": "gemini-flash",
    "banner": "gemini-flash",
    "og_image": "gemini-flash",
    "illustration": "gemini-flash-preview",
    "concept": "gemini-flash-preview",
    "story": "gemini-flash",
}

# Aspect ratio → Imagen aspect_ratio param
ASPECT_RATIOS: dict[str, str] = {
    "1:1": "1:1",
    "16:9": "16:9",
    "9:16": "9:16",
    "4:3": "4:3",
    "3:4": "3:4",
}

# Template dimensions
TEMPLATE_DIMENSIONS: dict[str, tuple[int, int]] = {
    "social_post_square": (1080, 1080),
    "social_post_landscape": (1200, 628),
    "youtube_thumbnail": (1280, 720),
    "banner_wide": (1920, 480),
    "story": (1080, 1920),
    "og_image": (1200, 630),
}

# Path to HTML templates
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"


def _serialize(value: Any) -> Any:
    """Convert asyncpg-native types to JSON-safe Python types."""
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            if isinstance(parsed, (dict, list)):
                return parsed
        except (json.JSONDecodeError, TypeError, ValueError):
            pass
        return value
    if isinstance(value, dict):
        return {k: _serialize(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_serialize(v) for v in value]
    return value


def _row_to_dict(record) -> dict[str, Any]:
    """Convert an asyncpg Record to a JSON-safe dict."""
    return {k: _serialize(v) for k, v in dict(record).items()}


def _get_gemini_client():
    """Get an authenticated Google Generative AI client."""
    from app.config import get_gemini_api_key

    api_key = get_gemini_api_key()
    if not api_key:
        return None

    from google import genai
    return genai.Client(api_key=api_key)


def _build_brand_prompt(
    user_prompt: str,
    brand_context: str,
    content_type: str,
) -> str:
    """Construct a brand-enhanced prompt from user prompt + brand config."""
    config = BRAND_CONFIGS.get(brand_context, BRAND_CONFIGS["A"])

    enhanced = (
        f"{user_prompt}\n\n"
        f"Style direction: {config['style_direction']}\n"
        f"Primary accent color: {config['accent']}. "
        f"Background tone: {config['bg_color']}. "
        f"Content type: {content_type}.\n"
        f"Avoid: {config['negative_guidance']}"
    )
    return enhanced


def _resolve_model(model: str, content_type: str) -> dict[str, Any]:
    """Resolve model selection — auto-route or explicit."""
    if model == "auto":
        model_key = AUTO_MODEL_MAP.get(content_type, "imagen-fast")
    else:
        model_key = model

    if model_key not in MODEL_CONFIGS:
        model_key = "imagen-fast"

    return MODEL_CONFIGS[model_key]


async def _upload_image_to_drive(
    image_bytes: bytes,
    filename: str,
    brand_context: str,
    get_pool,
) -> dict[str, Any]:
    """Upload generated image to Drive under AI OS/MEDIA_ASSETS/{brand_context}/."""
    from app.auth.google_oauth import get_service, run_google_api
    from app.modules.drive_write import _find_or_create_folder

    service = get_service("drive", "v3")
    if not service:
        raise RuntimeError("Google Drive OAuth not configured")

    # Navigate: AI OS → MEDIA_ASSETS → {A|B|C}
    brand_name = BRAND_CONFIGS.get(brand_context, {}).get("name", "AI OS")
    root_id = await _find_or_create_folder(service, "AI OS")
    media_id = await _find_or_create_folder(service, "MEDIA_ASSETS", root_id)
    brand_folder_id = await _find_or_create_folder(service, brand_name, media_id)

    from googleapiclient.http import MediaIoBaseUpload

    media = MediaIoBaseUpload(
        io.BytesIO(image_bytes),
        mimetype="image/png",
        resumable=len(image_bytes) > 256 * 1024,
    )
    file_metadata = {
        "name": filename,
        "parents": [brand_folder_id],
    }
    uploaded = await run_google_api(
        service.files().create(
            body=file_metadata,
            media_body=media,
            fields="id, name, webViewLink, mimeType, size",
        ).execute
    )

    return {
        "drive_file_id": uploaded["id"],
        "drive_url": uploaded.get("webViewLink", ""),
        "drive_folder_id": brand_folder_id,
        "file_size_bytes": int(uploaded.get("size", len(image_bytes))),
    }


async def _store_media_record(
    pool,
    *,
    brand_context: str,
    asset_type: str,
    source: str,
    model_used: str | None,
    prompt_used: str | None,
    original_prompt: str | None,
    content_type: str | None,
    aspect_ratio: str | None,
    dimensions: str | None,
    file_format: str = "png",
    file_size_bytes: int | None,
    drive_file_id: str | None,
    drive_url: str | None,
    drive_folder_id: str | None,
    template_name: str | None = None,
    domain_slug: str | None = None,
    tags: list[str] | None = None,
    metadata: dict | None = None,
) -> dict[str, Any]:
    """Insert a record into media_assets and return it."""
    async with pool.acquire() as conn:
        domain_id = None
        if domain_slug:
            row = await conn.fetchrow(
                "SELECT id FROM life_domains WHERE slug = $1", domain_slug
            )
            if row:
                domain_id = row["id"]

        record = await conn.fetchrow(
            "INSERT INTO media_assets "
            "(brand_context, asset_type, source, model_used, prompt_used, "
            "original_prompt, content_type, aspect_ratio, dimensions, file_format, "
            "file_size_bytes, drive_file_id, drive_url, drive_folder_id, "
            "template_name, domain_id, tags, metadata) "
            "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb) "
            "RETURNING *",
            brand_context,
            asset_type,
            source,
            model_used,
            prompt_used,
            original_prompt,
            content_type,
            aspect_ratio,
            dimensions,
            file_format,
            file_size_bytes,
            drive_file_id,
            drive_url,
            drive_folder_id,
            template_name,
            domain_id,
            tags or [],
            json.dumps(metadata or {}),
        )
        return _row_to_dict(record)


def register_tools(mcp: FastMCP, get_pool) -> None:
    """Register all Visual Content Generation tools on the given FastMCP instance."""

    # ── 1. generate_image ──────────────────────────────────────────────

    @mcp.tool(description=(
        "Generate a brand-consistent image using the Google Gemini API. "
        "Claude constructs the prompt with brand injection — pass the creative direction, not raw API params. "
        "prompt: what to generate (creative description). "
        "brand_context: 'A' (AI OS — emerald/dark), 'B' (Bharatvarsh — mustard/dystopian), 'C' (Portfolio — violet/clean). Default 'A'. "
        "content_type: 'social'|'thumbnail'|'hero'|'illustration'|'concept'|'banner'|'og_image'|'story'. Drives auto model selection. Default 'social'. "
        "aspect_ratio: '1:1'|'16:9'|'9:16'|'4:3'|'3:4'. Default '1:1'. "
        "model: 'auto'|'gemini-flash'|'gemini-flash-preview'|'gemini-pro'|'imagen-fast'|'imagen-standard'|'imagen-ultra' (imagen requires billing). Default 'auto' (uses gemini-flash, free tier). "
        "domain: optional life_domains slug to tag the asset. "
        "tags: optional list of tags for filtering. "
        "Generated images are uploaded to AI OS/MEDIA_ASSETS/{brand_name}/ and logged in media_assets table. "
        "Example: generate_image(prompt='Futuristic dashboard interface with glowing emerald data streams', brand_context='A', content_type='social'). "
        "Returns: {id, brand_context, asset_type, model_used, dimensions, drive_url, drive_file_id, cost_estimate, _meta}."
    ))
    async def generate_image(
        prompt: str,
        brand_context: str = "A",
        content_type: str = "social",
        aspect_ratio: str = "1:1",
        model: str = "auto",
        domain: str | None = None,
        tags: list[str] | None = None,
    ) -> str:
        if brand_context not in BRAND_CONFIGS:
            return json.dumps({"error": f"Invalid brand_context: {brand_context}. Use A, B, or C."})

        client = _get_gemini_client()
        if not client:
            return json.dumps({"error": "GEMINI_API_KEY not configured. Store it in Secret Manager."})

        t_start = time.monotonic()

        # Build brand-enhanced prompt
        enhanced_prompt = _build_brand_prompt(prompt, brand_context, content_type)
        model_config = _resolve_model(model, content_type)
        model_api_id = model_config["api_id"]
        model_type = model_config["type"]

        try:
            image_bytes: bytes | None = None

            if model_type == "imagen":
                # Imagen 4 — image generation API
                from google.genai import types

                imagen_config = types.GenerateImagesConfig(
                    number_of_images=1,
                    aspect_ratio=ASPECT_RATIOS.get(aspect_ratio, "1:1"),
                )

                response = client.models.generate_images(
                    model=model_api_id,
                    prompt=enhanced_prompt,
                    config=imagen_config,
                )

                if response.generated_images:
                    image_bytes = response.generated_images[0].image.image_bytes
                else:
                    return json.dumps({
                        "error": "No image generated — prompt may have been filtered.",
                        "model": model_api_id,
                    })

            else:
                # Gemini — multimodal content generation with image output
                from google.genai import types

                response = client.models.generate_content(
                    model=model_api_id,
                    contents=enhanced_prompt,
                    config=types.GenerateContentConfig(
                        response_modalities=["IMAGE", "TEXT"],
                    ),
                )

                # Extract image from response parts
                for part in response.candidates[0].content.parts:
                    if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                        image_bytes = part.inline_data.data
                        break

                if not image_bytes:
                    return json.dumps({
                        "error": "No image in response — model returned text only.",
                        "model": model_api_id,
                    })

            t_gen = time.monotonic()
            logger.info(
                "generate_image: %s generated in %.1fms (%d bytes)",
                model_api_id, (t_gen - t_start) * 1000, len(image_bytes),
            )

            # Upload to Drive
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            brand_name = BRAND_CONFIGS[brand_context]["name"].lower().replace(" ", "_")
            filename = f"{brand_name}_{content_type}_{timestamp}.png"

            drive_result = await _upload_image_to_drive(
                image_bytes, filename, brand_context, get_pool
            )

            # Store in media_assets table
            pool = get_pool()
            record = await _store_media_record(
                pool,
                brand_context=brand_context,
                asset_type=content_type,
                source="generated",
                model_used=model_api_id,
                prompt_used=enhanced_prompt,
                original_prompt=prompt,
                content_type=content_type,
                aspect_ratio=aspect_ratio,
                dimensions=None,  # Raw generation — dimensions vary by model
                file_format="png",
                file_size_bytes=drive_result["file_size_bytes"],
                drive_file_id=drive_result["drive_file_id"],
                drive_url=drive_result["drive_url"],
                drive_folder_id=drive_result["drive_folder_id"],
                domain_slug=domain,
                tags=tags,
                metadata={"generation_time_ms": round((t_gen - t_start) * 1000)},
            )

            record["cost_estimate"] = f"${model_config['cost_per_image']:.3f}"
            record["_meta"] = {
                "action": "generated",
                "related_tools": ["edit_image", "render_template", "list_assets"],
            }
            return json.dumps(record)

        except Exception as exc:
            logger.exception("generate_image failed: %s", exc)
            return json.dumps({"error": f"Image generation failed: {exc}"})

    # ── 2. edit_image ──────────────────────────────────────────────────

    @mcp.tool(description=(
        "Edit an existing image using Gemini conversational editing (Nano Banana 2). "
        "Provide a source image (by Drive file ID) and an edit instruction. "
        "The model modifies the image according to the instruction. "
        "source_drive_file_id: Drive file ID of the source image. "
        "edit_instruction: what to change (e.g., 'make the background darker', 'add a golden glow effect'). "
        "brand_context: 'A'|'B'|'C' for brand-consistent editing. Default 'A'. "
        "domain: optional life_domains slug. tags: optional list of tags. "
        "Example: edit_image(source_drive_file_id='1abc...', edit_instruction='Add a subtle emerald glow around the edges', brand_context='A'). "
        "Returns: {id, brand_context, source, model_used, drive_url, drive_file_id, _meta}."
    ))
    async def edit_image(
        source_drive_file_id: str,
        edit_instruction: str,
        brand_context: str = "A",
        domain: str | None = None,
        tags: list[str] | None = None,
    ) -> str:
        if brand_context not in BRAND_CONFIGS:
            return json.dumps({"error": f"Invalid brand_context: {brand_context}. Use A, B, or C."})

        client = _get_gemini_client()
        if not client:
            return json.dumps({"error": "GEMINI_API_KEY not configured."})

        try:
            # Download source image from Drive
            from app.auth.google_oauth import get_service, run_google_api

            service = get_service("drive", "v3")
            if not service:
                return json.dumps({"error": "Google Drive OAuth not configured."})

            source_bytes = await run_google_api(
                service.files().get_media(fileId=source_drive_file_id).execute
            )

            if not source_bytes:
                return json.dumps({"error": f"Could not download image: {source_drive_file_id}"})

            # Build brand-aware edit instruction
            config = BRAND_CONFIGS.get(brand_context, BRAND_CONFIGS["A"])
            enhanced_instruction = (
                f"{edit_instruction}\n"
                f"Maintain brand consistency: accent color {config['accent']}, "
                f"style: {config['style_direction'][:100]}"
            )

            # Use Gemini Flash for editing
            from google.genai import types

            response = client.models.generate_content(
                model="gemini-2.5-flash-image",
                contents=[
                    types.Content(
                        parts=[
                            types.Part.from_bytes(data=source_bytes, mime_type="image/png"),
                            types.Part.from_text(text=enhanced_instruction),
                        ]
                    ),
                ],
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                ),
            )

            # Extract edited image
            edited_bytes = None
            for part in response.candidates[0].content.parts:
                if part.inline_data and part.inline_data.mime_type.startswith("image/"):
                    edited_bytes = part.inline_data.data
                    break

            if not edited_bytes:
                return json.dumps({"error": "Edit failed — no image in response."})

            # Upload edited image to Drive
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            brand_name = BRAND_CONFIGS[brand_context]["name"].lower().replace(" ", "_")
            filename = f"{brand_name}_edited_{timestamp}.png"

            drive_result = await _upload_image_to_drive(
                edited_bytes, filename, brand_context, get_pool
            )

            # Store in media_assets
            pool = get_pool()
            record = await _store_media_record(
                pool,
                brand_context=brand_context,
                asset_type="edited",
                source="edited",
                model_used="gemini-2.5-flash-image",
                prompt_used=enhanced_instruction,
                original_prompt=edit_instruction,
                content_type=None,
                aspect_ratio=None,
                dimensions=None,
                file_format="png",
                file_size_bytes=drive_result["file_size_bytes"],
                drive_file_id=drive_result["drive_file_id"],
                drive_url=drive_result["drive_url"],
                drive_folder_id=drive_result["drive_folder_id"],
                domain_slug=domain,
                tags=tags,
                metadata={"source_file_id": source_drive_file_id},
            )

            record["_meta"] = {
                "action": "edited",
                "related_tools": ["generate_image", "list_assets"],
            }
            return json.dumps(record)

        except Exception as exc:
            logger.exception("edit_image failed: %s", exc)
            return json.dumps({"error": f"Image editing failed: {exc}"})

    # ── 3. render_template ─────────────────────────────────────────────

    @mcp.tool(description=(
        "Render a branded HTML template to a PNG image using Playwright. "
        "template_name: 'social_post_square' (1080x1080), 'social_post_landscape' (1200x628), "
        "'youtube_thumbnail' (1280x720), 'banner_wide' (1920x480), "
        "'story' (1080x1920), 'og_image' (1200x630). "
        "Variables are injected into the template. Required: title. "
        "Optional: subtitle, bg_image_url (Drive or public URL for background), "
        "accent_color (override brand default), footer_text, footer_tag, "
        "badge_text (thumbnail only), bg_opacity (0-1, default varies). "
        "brand_context: 'A'|'B'|'C' — sets default colors and fonts. Default 'A'. "
        "domain: optional life_domains slug. tags: optional list of tags. "
        "Example: render_template(template_name='social_post_square', title='The Future of AI Agents', "
        "subtitle='Building intelligence that builds itself', brand_context='A'). "
        "Returns: {id, template_name, dimensions, drive_url, drive_file_id, _meta}."
    ))
    async def render_template(
        template_name: str,
        title: str,
        subtitle: str = "",
        bg_image_url: str = "",
        accent_color: str | None = None,
        footer_text: str | None = None,
        footer_tag: str | None = None,
        badge_text: str = "",
        bg_opacity: str = "0.4",
        brand_context: str = "A",
        domain: str | None = None,
        tags: list[str] | None = None,
    ) -> str:
        if template_name not in TEMPLATE_DIMENSIONS:
            return json.dumps({
                "error": f"Unknown template: {template_name}",
                "available": list(TEMPLATE_DIMENSIONS.keys()),
            })

        if brand_context not in BRAND_CONFIGS:
            return json.dumps({"error": f"Invalid brand_context: {brand_context}. Use A, B, or C."})

        # Load HTML template
        template_path = TEMPLATES_DIR / f"{template_name}.html"
        if not template_path.exists():
            return json.dumps({"error": f"Template file not found: {template_name}.html"})

        html_content = template_path.read_text(encoding="utf-8")

        # Resolve brand defaults
        brand = BRAND_CONFIGS[brand_context]
        resolved_accent = accent_color or brand["accent"]
        resolved_footer_text = footer_text or brand["footer_text"]
        resolved_footer_tag = footer_tag or brand["footer_tag"]

        # Inject variables
        replacements = {
            "{{title}}": title,
            "{{subtitle}}": subtitle,
            "{{bg_image_url}}": bg_image_url,
            "{{accent_color}}": resolved_accent,
            "{{footer_text}}": resolved_footer_text,
            "{{footer_tag}}": resolved_footer_tag,
            "{{badge_text}}": badge_text,
            "{{bg_opacity}}": bg_opacity,
        }
        for placeholder, value in replacements.items():
            html_content = html_content.replace(placeholder, value)

        # Set CSS variables for brand context
        css_vars = (
            f"--bg-color: {brand['bg_color']}; "
            f"--text-color: {brand['text_color']}; "
            f"--accent-color: {resolved_accent}; "
            f"--font-primary: '{brand['font_primary']}', sans-serif; "
            f"--font-mono: '{brand['font_mono']}', monospace;"
        )
        html_content = html_content.replace(
            "<body",
            f'<body style="{css_vars}"',
            1,
        )

        # Render with Playwright
        width, height = TEMPLATE_DIMENSIONS[template_name]

        try:
            from playwright.async_api import async_playwright
        except ImportError:
            return json.dumps({
                "error": "Playwright not installed. Install with: pip install playwright && playwright install chromium",
            })

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(
                    headless=True,
                    args=["--no-sandbox", "--disable-dev-shm-usage"],
                )
                page = await browser.new_page(
                    viewport={"width": width, "height": height},
                    device_scale_factor=1,
                )
                await page.set_content(html_content, wait_until="networkidle")
                screenshot_bytes = await page.screenshot(
                    type="png",
                    clip={"x": 0, "y": 0, "width": width, "height": height},
                )
                await browser.close()

        except Exception as exc:
            logger.exception("Playwright render failed: %s", exc)
            return json.dumps({"error": f"Template rendering failed: {exc}"})

        # Upload to Drive
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        brand_name = BRAND_CONFIGS[brand_context]["name"].lower().replace(" ", "_")
        filename = f"{brand_name}_{template_name}_{timestamp}.png"

        try:
            drive_result = await _upload_image_to_drive(
                screenshot_bytes, filename, brand_context, get_pool
            )
        except Exception as exc:
            return json.dumps({"error": f"Drive upload failed: {exc}"})

        # Store in media_assets
        pool = get_pool()
        record = await _store_media_record(
            pool,
            brand_context=brand_context,
            asset_type=template_name.split("_")[0],  # social, youtube, banner
            source="template",
            model_used=None,
            prompt_used=None,
            original_prompt=None,
            content_type=template_name,
            aspect_ratio=None,
            dimensions=f"{width}x{height}",
            file_format="png",
            file_size_bytes=drive_result["file_size_bytes"],
            drive_file_id=drive_result["drive_file_id"],
            drive_url=drive_result["drive_url"],
            drive_folder_id=drive_result["drive_folder_id"],
            template_name=template_name,
            domain_slug=domain,
            tags=tags,
            metadata={
                "title": title,
                "subtitle": subtitle,
                "bg_image_url": bg_image_url,
                "accent_color": resolved_accent,
            },
        )

        record["_meta"] = {
            "action": "rendered",
            "related_tools": ["generate_image", "list_assets"],
        }
        return json.dumps(record)

    # ── 4. store_asset ─────────────────────────────────────────────────

    @mcp.tool(description=(
        "Store a manually created asset (video, graphic, animation) in the media_assets database. "
        "Use this to catalogue assets that were created outside the OS (DaVinci Resolve, Canva, etc.) "
        "but are already uploaded to Google Drive. "
        "drive_file_id: the Google Drive file ID of the existing asset. "
        "brand_context: 'A'|'B'|'C'. asset_type: 'video'|'animation'|'graphic'|'social'|'thumbnail'|etc. "
        "description: what the asset is. "
        "drive_url: optional web view URL. domain: optional life_domains slug. tags: optional list. "
        "file_format: 'mp4'|'png'|'jpg'|'gif'|'svg'|'webp'. Default 'png'. "
        "dimensions: optional e.g. '1920x1080'. "
        "Example: store_asset(drive_file_id='1abc...', brand_context='B', asset_type='video', "
        "description='Bharatvarsh teaser trailer v1', file_format='mp4', tags=['marketing', 'teaser']). "
        "Returns: {id, brand_context, asset_type, source, drive_file_id, _meta}."
    ))
    async def store_asset(
        drive_file_id: str,
        brand_context: str,
        asset_type: str,
        description: str = "",
        drive_url: str | None = None,
        domain: str | None = None,
        tags: list[str] | None = None,
        file_format: str = "png",
        dimensions: str | None = None,
    ) -> str:
        if brand_context not in BRAND_CONFIGS:
            return json.dumps({"error": f"Invalid brand_context: {brand_context}. Use A, B, or C."})

        try:
            # Get file metadata from Drive if URL not provided
            resolved_url = drive_url
            file_size = None

            if not resolved_url:
                try:
                    from app.auth.google_oauth import get_service, run_google_api

                    service = get_service("drive", "v3")
                    if service:
                        file_info = await run_google_api(
                            service.files().get(
                                fileId=drive_file_id,
                                fields="id, webViewLink, size",
                            ).execute
                        )
                        resolved_url = file_info.get("webViewLink", "")
                        file_size = int(file_info.get("size", 0)) or None
                except Exception:
                    pass

            pool = get_pool()
            record = await _store_media_record(
                pool,
                brand_context=brand_context,
                asset_type=asset_type,
                source="manual",
                model_used=None,
                prompt_used=None,
                original_prompt=None,
                content_type=None,
                aspect_ratio=None,
                dimensions=dimensions,
                file_format=file_format,
                file_size_bytes=file_size,
                drive_file_id=drive_file_id,
                drive_url=resolved_url,
                drive_folder_id=None,
                domain_slug=domain,
                tags=tags,
                metadata={"description": description},
            )

            record["_meta"] = {
                "action": "stored",
                "related_tools": ["list_assets", "edit_image"],
            }
            return json.dumps(record)

        except Exception as exc:
            return json.dumps({"error": f"Failed to store asset: {exc}"})

    # ── 5. list_assets ─────────────────────────────────────────────────

    @mcp.tool(description=(
        "Query generated and stored media assets with flexible filtering. "
        "brand_context: filter by 'A', 'B', or 'C'. "
        "asset_type: filter by type (social, thumbnail, hero, illustration, video, etc.). "
        "source: filter by 'generated'|'manual'|'template'|'edited'. "
        "content_type: filter by content category. "
        "domain: filter by life_domains slug. "
        "tags: filter by tags (assets must have ALL specified tags). "
        "limit: max results (default 20, max 50). "
        "Returns assets sorted by most recent first with drive URLs for preview. "
        "Example: list_assets(brand_context='B', asset_type='social', limit=10). "
        "Returns: {assets: [{id, brand_context, asset_type, source, dimensions, drive_url, tags, created_at}], count, filters, _meta}."
    ))
    async def list_assets(
        brand_context: str | None = None,
        asset_type: str | None = None,
        source: str | None = None,
        content_type: str | None = None,
        domain: str | None = None,
        tags: list[str] | None = None,
        limit: int = 20,
    ) -> str:
        pool = get_pool()
        try:
            async with pool.acquire() as conn:
                conditions: list[str] = []
                params: list[Any] = []
                idx = 1

                if brand_context:
                    conditions.append(f"m.brand_context = ${idx}")
                    params.append(brand_context)
                    idx += 1

                if asset_type:
                    conditions.append(f"m.asset_type = ${idx}")
                    params.append(asset_type)
                    idx += 1

                if source:
                    conditions.append(f"m.source = ${idx}")
                    params.append(source)
                    idx += 1

                if content_type:
                    conditions.append(f"m.content_type = ${idx}")
                    params.append(content_type)
                    idx += 1

                if domain:
                    conditions.append(f"d.slug = ${idx}")
                    params.append(domain)
                    idx += 1

                if tags:
                    conditions.append(f"m.tags @> ${idx}")
                    params.append(tags)
                    idx += 1

                where = (" WHERE " + " AND ".join(conditions)) if conditions else ""
                safe_limit = min(limit, 50)
                params.append(safe_limit)

                sql = (
                    f"SELECT m.id, m.brand_context, m.asset_type, m.source, "
                    f"m.model_used, m.content_type, m.dimensions, m.file_format, "
                    f"m.file_size_bytes, m.drive_url, m.drive_file_id, "
                    f"m.template_name, m.tags, m.original_prompt, m.created_at, "
                    f"d.name AS domain_name, d.slug AS domain_slug "
                    f"FROM media_assets m "
                    f"LEFT JOIN life_domains d ON m.domain_id = d.id"
                    f"{where} "
                    f"ORDER BY m.created_at DESC "
                    f"LIMIT ${idx}"
                )

                rows = await conn.fetch(sql, *params)
                assets = [_row_to_dict(r) for r in rows]

                return json.dumps({
                    "assets": assets,
                    "count": len(assets),
                    "filters": {
                        "brand_context": brand_context,
                        "asset_type": asset_type,
                        "source": source,
                        "content_type": content_type,
                        "domain": domain,
                        "tags": tags,
                    },
                    "_meta": {
                        "related_tools": [
                            "generate_image", "edit_image",
                            "render_template", "store_asset",
                        ],
                    },
                })

        except Exception as exc:
            return json.dumps({"error": f"Failed to list assets: {exc}"})
