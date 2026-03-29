import { NextResponse, type NextRequest } from 'next/server';
import { queryOne, execute, query } from '@/lib/db';
import type { ContentPost } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** POST /api/content-pipeline/[postId]/finalize-content
 *  Transitions a post from `planned` → `prompt_ready`.
 *  The user has reviewed all content fields and is ready to move to image generation.
 */
export async function POST(
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

    if (post.status !== 'planned') {
      return NextResponse.json(
        { error: `Post must be in 'planned' status (currently '${post.status}')` },
        { status: 400 },
      );
    }

    await execute(
      `UPDATE content_posts
       SET status = 'prompt_ready'::content_post_status, updated_at = NOW()
       WHERE post_id = $1`,
      [postId],
    );

    await query(
      `INSERT INTO content_pipeline_log
         (post_id, action, old_status, new_status, details, performed_by)
       VALUES ($1, $2, $3::content_post_status, $4::content_post_status, $5::jsonb, $6)`,
      [
        postId,
        'finalize_content',
        'planned',
        'prompt_ready',
        JSON.stringify({ note: 'Content brief reviewed and finalised by user' }),
        'dashboard',
      ],
    );

    const updated = await queryOne<ContentPost>(
      `SELECT * FROM content_posts WHERE post_id = $1`,
      [postId],
    );

    return NextResponse.json({ success: true, post: updated });
  } catch (err) {
    console.error('[api/content-pipeline/[postId]/finalize-content] POST Error:', err);
    return NextResponse.json({ error: 'Failed to finalise content' }, { status: 500 });
  }
}
