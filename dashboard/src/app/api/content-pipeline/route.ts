import { NextResponse, type NextRequest } from 'next/server';
import { query, execute } from '@/lib/db';
import type { ContentPost, ContentPostStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** GET /api/content-pipeline — List all content posts with optional filters */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const status = searchParams.get('status');
    const pillar = searchParams.get('pillar');
    const campaign = searchParams.get('campaign');

    const conditions: string[] = [];
    const params: unknown[] = [];
    let idx = 1;

    if (status) {
      conditions.push(`cp.status = $${idx++}::content_post_status`);
      params.push(status);
    }
    if (pillar) {
      conditions.push(`cp.content_pillar = $${idx++}`);
      params.push(pillar);
    }
    if (campaign) {
      conditions.push(`cp.campaign = $${idx++}`);
      params.push(campaign);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const posts = await query<ContentPost>(
      `SELECT * FROM content_posts cp
       ${where}
       ORDER BY cp.scheduled_date ASC NULLS LAST, cp.post_id ASC`,
      params,
    );

    // Summary: totals by status and by pillar
    const statusRows = await query<{ status: ContentPostStatus; count: number }>(
      `SELECT status, COUNT(*)::int AS count FROM content_posts GROUP BY status`,
    );
    const pillarRows = await query<{ content_pillar: string; count: number }>(
      `SELECT content_pillar, COUNT(*)::int AS count FROM content_posts GROUP BY content_pillar`,
    );

    const by_status: Record<string, number> = {};
    for (const row of statusRows) {
      by_status[row.status] = row.count;
    }

    const by_pillar: Record<string, number> = {};
    for (const row of pillarRows) {
      by_pillar[row.content_pillar] = row.count;
    }

    return NextResponse.json({
      posts,
      summary: {
        total: posts.length,
        by_status,
        by_pillar,
      },
    });
  } catch (err) {
    console.error('[api/content-pipeline] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch content posts' }, { status: 500 });
  }
}

/** POST /api/content-pipeline — Bulk upsert posts from CSV sync */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const posts = body.posts as Record<string, unknown>[];

    if (!Array.isArray(posts) || posts.length === 0) {
      return NextResponse.json({ error: 'posts array is required and must not be empty' }, { status: 400 });
    }

    let synced = 0;

    for (const post of posts) {
      const count = await execute(
        `INSERT INTO content_posts (
           post_id, campaign, content_pillar, topic, hook, lore_refs,
           classified_status, channels, caption_text, visual_direction,
           art_prompt, model_routing, source_image_path, render_manifest,
           style_overrides, scheduled_date, scheduled_time, target_audience,
           hashtags, cta_type, cta_link, status
         ) VALUES (
           $1, $2, $3, $4, $5, $6,
           $7, $8, $9, $10,
           $11, $12, $13, $14,
           $15, $16, $17, $18,
           $19, $20, $21, $22
         )
         ON CONFLICT (post_id) DO UPDATE SET
           campaign = EXCLUDED.campaign,
           content_pillar = EXCLUDED.content_pillar,
           topic = EXCLUDED.topic,
           hook = EXCLUDED.hook,
           lore_refs = EXCLUDED.lore_refs,
           classified_status = EXCLUDED.classified_status,
           channels = EXCLUDED.channels,
           caption_text = EXCLUDED.caption_text,
           visual_direction = EXCLUDED.visual_direction,
           art_prompt = EXCLUDED.art_prompt,
           model_routing = EXCLUDED.model_routing,
           source_image_path = COALESCE(content_posts.source_image_path, EXCLUDED.source_image_path),
           render_manifest = COALESCE(content_posts.render_manifest, EXCLUDED.render_manifest),
           style_overrides = EXCLUDED.style_overrides,
           scheduled_date = EXCLUDED.scheduled_date,
           scheduled_time = EXCLUDED.scheduled_time,
           target_audience = EXCLUDED.target_audience,
           hashtags = EXCLUDED.hashtags,
           cta_type = EXCLUDED.cta_type,
           cta_link = EXCLUDED.cta_link`,
        [
          post.post_id,
          post.campaign,
          post.content_pillar,
          post.topic,
          post.hook ?? null,
          post.lore_refs ?? null,
          post.classified_status ?? null,
          post.channels ?? ['instagram'],
          post.caption_text ?? null,
          post.visual_direction ?? null,
          post.art_prompt ? JSON.stringify(post.art_prompt) : null,
          post.model_routing ?? null,
          post.source_image_path ?? null,
          post.render_manifest ? JSON.stringify(post.render_manifest) : null,
          post.style_overrides ? JSON.stringify(post.style_overrides) : null,
          post.scheduled_date ?? null,
          post.scheduled_time ?? null,
          post.target_audience ?? null,
          post.hashtags ?? null,
          post.cta_type ?? null,
          post.cta_link ?? null,
          post.status ?? 'planned',
        ],
      );
      synced += count;
    }

    return NextResponse.json({ synced }, { status: 200 });
  } catch (err) {
    console.error('[api/content-pipeline] POST Error:', err);
    return NextResponse.json({ error: 'Failed to sync content posts' }, { status: 500 });
  }
}
