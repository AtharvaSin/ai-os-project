import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import type { ContentPost } from '@/lib/types';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

/** POST /api/content-pipeline/[postId]/upload — Image upload (multipart form data) */
export async function POST(
  req: Request,
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

    // Read file from multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided. Send as "file" field in form data.' }, { status: 400 });
    }

    // Determine output path: content-ops/assets/{postId}/final.png
    const assetsDir = path.join(process.cwd(), '..', 'content-ops', 'assets', postId);
    await mkdir(assetsDir, { recursive: true });

    const filePath = path.join(assetsDir, 'final.png');
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const oldStatus = current.status;

    // Update DB: set source_image_path and advance status
    const updated = await queryOne<ContentPost>(
      `UPDATE content_posts
       SET source_image_path = $1, status = 'image_uploaded'::content_post_status
       WHERE post_id = $2
       RETURNING *`,
      [filePath, postId],
    );

    // Insert audit log entry
    await query(
      `INSERT INTO content_pipeline_log (post_id, action, old_status, new_status, details, performed_by)
       VALUES ($1, $2, $3::content_post_status, 'image_uploaded'::content_post_status, $4::jsonb, $5)`,
      [
        postId,
        'image_upload',
        oldStatus,
        JSON.stringify({
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          saved_path: filePath,
        }),
        'dashboard',
      ],
    );

    return NextResponse.json({
      success: true,
      path: filePath,
      post: updated,
    });
  } catch (err) {
    console.error('[api/content-pipeline/[postId]/upload] POST Error:', err);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
