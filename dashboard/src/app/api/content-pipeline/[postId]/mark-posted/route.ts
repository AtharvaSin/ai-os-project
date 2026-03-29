import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import type { ContentPost } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/content-pipeline/[postId]/mark-posted
 * Manually marks an approved post as published (human confirms they've posted it).
 * Sets status → published and records published_at timestamp.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;

    const current = await queryOne<ContentPost>(
      `SELECT * FROM content_posts WHERE post_id = $1`,
      [postId],
    );

    if (!current) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (current.status === 'published') {
      return NextResponse.json({ error: 'Post is already published' }, { status: 400 });
    }

    if (current.status !== 'approved' && current.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Post must be approved before marking as posted (current: ${current.status})` },
        { status: 400 },
      );
    }

    const oldStatus = current.status;

    const updated = await queryOne<ContentPost>(
      `UPDATE content_posts
       SET status = 'published'::content_post_status, published_at = NOW()
       WHERE post_id = $1
       RETURNING *`,
      [postId],
    );

    await query(
      `INSERT INTO content_pipeline_log (post_id, action, old_status, new_status, details, performed_by)
       VALUES ($1, $2, $3::content_post_status, 'published'::content_post_status, $4::jsonb, $5)`,
      [
        postId,
        'mark_posted',
        oldStatus,
        JSON.stringify({ channels: current.channels, published_at: updated?.published_at }),
        'atharva',
      ],
    );

    return NextResponse.json({ success: true, published_at: updated?.published_at, post: updated });
  } catch (err) {
    console.error('[api/content-pipeline/[postId]/mark-posted] POST Error:', err);
    return NextResponse.json({ error: 'Failed to mark as posted' }, { status: 500 });
  }
}
