import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import type { ContentPost } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** POST /api/content-pipeline/[postId]/approve — Approve post for scheduling */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;

    // Verify post exists
    const current = await queryOne<ContentPost>(
      `SELECT * FROM content_posts WHERE post_id = $1`,
      [postId],
    );

    if (!current) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (current.status === 'approved' || current.status === 'scheduled' || current.status === 'published') {
      return NextResponse.json(
        { error: `Post is already ${current.status}` },
        { status: 400 },
      );
    }

    const oldStatus = current.status;

    // Update DB: set approved status and timestamp
    const updated = await queryOne<ContentPost>(
      `UPDATE content_posts
       SET status = 'approved'::content_post_status, approved_at = NOW()
       WHERE post_id = $1
       RETURNING *`,
      [postId],
    );

    // Insert audit log entry
    await query(
      `INSERT INTO content_pipeline_log (post_id, action, old_status, new_status, details, performed_by)
       VALUES ($1, $2, $3::content_post_status, 'approved'::content_post_status, $4::jsonb, $5)`,
      [
        postId,
        'approve',
        oldStatus,
        JSON.stringify({
          approved_at: updated?.approved_at,
          topic: current.topic,
          channels: current.channels,
          scheduled_date: current.scheduled_date,
        }),
        'atharva',
      ],
    );

    // TODO: Create a Google Task via MCP gateway for scheduling follow-up
    // Intent: POST to MCP gateway create_task endpoint with:
    //   title: `Schedule post ${postId}: ${current.topic}`
    //   due_date: current.scheduled_date
    //   notes: `Approved at ${updated?.approved_at}. Channels: ${current.channels.join(', ')}`
    console.info(
      `[content-pipeline] Post ${postId} approved. Google Task creation pending MCP integration.`,
    );

    return NextResponse.json({
      success: true,
      approved_at: updated?.approved_at,
      post: updated,
    });
  } catch (err) {
    console.error('[api/content-pipeline/[postId]/approve] POST Error:', err);
    return NextResponse.json({ error: 'Failed to approve post' }, { status: 500 });
  }
}
