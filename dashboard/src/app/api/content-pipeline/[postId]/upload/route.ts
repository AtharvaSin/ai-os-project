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

    const buffer = Buffer.from(await file.arrayBuffer());

    // Store image as base64 in DB for persistence (Cloud Run filesystem is ephemeral)
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/png';
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    // Also write to /tmp for rendering within the same container lifecycle
    const assetsDir = path.join('/tmp', 'content-pipeline', 'assets', postId);
    await mkdir(assetsDir, { recursive: true });
    const filePath = path.join(assetsDir, `final${path.extname(file.name) || '.png'}`);
    await writeFile(filePath, buffer);

    const oldStatus = current.status;

    // Update DB: set source_image_path (tmp path) and store base64 in render_manifest
    const updated = await queryOne<ContentPost>(
      `UPDATE content_posts
       SET source_image_path = $1,
           status = 'image_uploaded'::content_post_status,
           render_manifest = COALESCE(render_manifest, '{}'::jsonb) || jsonb_build_object(
             'source_image_base64', $3,
             'source_file_name', $4,
             'source_mime_type', $5,
             'source_file_size', $6,
             'uploaded_at', now()::text
           )
       WHERE post_id = $2
       RETURNING *`,
      [filePath, postId, dataUri, file.name, mimeType, file.size],
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
          mime_type: mimeType,
          tmp_path: filePath,
          stored_in_db: true,
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
