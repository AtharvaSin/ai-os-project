import { NextResponse, type NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import type { ContentPost, ContentPostStatus } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** GET /api/content-pipeline/[postId] — Single post detail */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;

    const post = await queryOne<ContentPost>(
      `SELECT * FROM content_posts WHERE post_id = $1`,
      [postId],
    );

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (err) {
    console.error('[api/content-pipeline/[postId]] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 });
  }
}

/** Allowed fields for PATCH updates */
interface PatchBody {
  status?: ContentPostStatus;
  caption_text?: string;
  visual_direction?: string;
  art_prompt?: Record<string, unknown>;
  model_routing?: string;
  source_image_path?: string;
  render_manifest?: Record<string, unknown>;
  style_overrides?: Record<string, unknown>;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  hook?: string;
  hashtags?: string;
  cta_type?: string;
  cta_link?: string;
  target_audience?: string;
  channels?: string[];
  social_post_ids?: Record<string, string>;
}

/** PATCH /api/content-pipeline/[postId] — Update post fields */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;
    const body = (await req.json()) as PatchBody;

    // Fetch current post for audit trail
    const current = await queryOne<ContentPost>(
      `SELECT * FROM content_posts WHERE post_id = $1`,
      [postId],
    );

    if (!current) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    // JSONB fields need JSON.stringify
    const jsonbFields = ['art_prompt', 'render_manifest', 'style_overrides', 'social_post_ids'] as const;
    // Text/varchar fields
    const textFields = [
      'status', 'caption_text', 'visual_direction', 'model_routing',
      'source_image_path', 'scheduled_date', 'scheduled_time', 'hook',
      'hashtags', 'cta_type', 'cta_link', 'target_audience',
    ] as const;

    for (const field of textFields) {
      if (body[field] !== undefined) {
        if (field === 'status') {
          sets.push(`${field} = $${idx++}::content_post_status`);
        } else {
          sets.push(`${field} = $${idx++}`);
        }
        values.push(body[field]);
      }
    }

    for (const field of jsonbFields) {
      if (body[field] !== undefined) {
        sets.push(`${field} = $${idx++}::jsonb`);
        values.push(JSON.stringify(body[field]));
      }
    }

    if (body.channels !== undefined) {
      sets.push(`channels = $${idx++}`);
      values.push(body.channels);
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(postId);
    const updated = await queryOne<ContentPost>(
      `UPDATE content_posts SET ${sets.join(', ')} WHERE post_id = $${idx} RETURNING *`,
      values,
    );

    // Insert audit log entry
    const oldStatus = current.status;
    const newStatus = body.status ?? current.status;
    const changedFields = Object.keys(body);

    await query(
      `INSERT INTO content_pipeline_log (post_id, action, old_status, new_status, details, performed_by)
       VALUES ($1, $2, $3::content_post_status, $4::content_post_status, $5::jsonb, $6)`,
      [
        postId,
        body.status ? 'status_change' : 'field_update',
        oldStatus,
        newStatus,
        JSON.stringify({ changed_fields: changedFields }),
        'dashboard',
      ],
    );

    return NextResponse.json({ post: updated });
  } catch (err) {
    console.error('[api/content-pipeline/[postId]] PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 });
  }
}
