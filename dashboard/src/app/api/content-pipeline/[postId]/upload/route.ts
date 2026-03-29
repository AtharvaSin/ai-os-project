import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import type { ContentPost } from '@/lib/types';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getContentPipelineRoot } from '@/lib/pipeline-paths';

export const dynamic = 'force-dynamic';

/** Normalise a slide/frame filename to zero-padded form. */
function normalisedFilename(originalName: string): string {
  // Slide: slide_01, slide_1, slide_001, etc. → slide_NN.png
  const slideMatch = originalName.match(/slide[_-]?(\d+)/i);
  if (slideMatch?.[1]) {
    const n = parseInt(slideMatch[1], 10);
    return `slide_${String(n).padStart(2, '0')}.png`;
  }
  // Frame: frame_01, frame_1, etc. → frame_NN.png
  const frameMatch = originalName.match(/frame[_-]?(\d+)/i);
  if (frameMatch?.[1]) {
    const n = parseInt(frameMatch[1], 10);
    return `frame_${String(n).padStart(2, '0')}.png`;
  }
  return 'final.png';
}

/** POST /api/content-pipeline/[postId]/upload — Image upload (multipart form data)
 *
 * Supports two modes:
 * 1. Single file:   send as `file` field
 * 2. Multi-file:    send as `file_0`, `file_1`, ... with `filename_0`, `filename_1`, ...
 *
 * Multi-file is used for carousel and animation modes.
 */
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

    const formData = await req.formData();

    // Detect mode: multi-file sends file_0, file_1, ...
    const isMulti = formData.has('file_0');

    const assetsDir = path.join(
      getContentPipelineRoot(),
      'assets',
      postId,
    );
    await mkdir(assetsDir, { recursive: true });

    const savedFiles: { original: string; saved: string; size: number }[] = [];

    if (isMulti) {
      let i = 0;
      while (formData.has(`file_${i}`)) {
        const file = formData.get(`file_${i}`) as File | null;
        const originalName = (formData.get(`filename_${i}`) as string | null) ?? file?.name ?? '';

        if (!file) {
          i++;
          continue;
        }

        const savedName = normalisedFilename(originalName);
        const filePath = path.join(assetsDir, savedName);
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(filePath, buffer);

        savedFiles.push({ original: originalName, saved: savedName, size: file.size });
        i++;
      }

      if (savedFiles.length === 0) {
        return NextResponse.json(
          { error: 'No valid files provided in multi-file upload.' },
          { status: 400 },
        );
      }
    } else {
      // Single file mode
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json(
          { error: 'No file provided. Send as "file" field in form data.' },
          { status: 400 },
        );
      }

      const filePath = path.join(assetsDir, 'final.png');
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      savedFiles.push({ original: file.name, saved: 'final.png', size: file.size });
    }

    const oldStatus = current.status;
    const primaryPath = path.join(assetsDir, savedFiles[0]?.saved ?? 'final.png');

    // Update DB: set source_image_path to the primary file and advance status
    const updated = await queryOne<ContentPost>(
      `UPDATE content_posts
       SET source_image_path = $1, status = 'image_uploaded'::content_post_status
       WHERE post_id = $2
       RETURNING *`,
      [primaryPath, postId],
    );

    // Insert audit log entry listing all saved files
    await query(
      `INSERT INTO content_pipeline_log (post_id, action, old_status, new_status, details, performed_by)
       VALUES ($1, $2, $3::content_post_status, 'image_uploaded'::content_post_status, $4::jsonb, $5)`,
      [
        postId,
        'image_upload',
        oldStatus,
        JSON.stringify({
          file_count: savedFiles.length,
          files: savedFiles,
          assets_dir: assetsDir,
        }),
        'dashboard',
      ],
    );

    return NextResponse.json({
      success: true,
      file_count: savedFiles.length,
      files: savedFiles,
      post: updated,
    });
  } catch (err) {
    console.error('[api/content-pipeline/[postId]/upload] POST Error:', err);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
