import { NextResponse } from 'next/server';
import { queryOne, query } from '@/lib/db';
import type { ContentPost } from '@/lib/types';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import { getContentPipelineRoot } from '@/lib/pipeline-paths';

export const dynamic = 'force-dynamic';

/**
 * Wraps child_process.exec in a Promise for async/await usage.
 * Resolves with { stdout, stderr }, rejects on non-zero exit.
 */
function execAsync(
  command: string,
  options: { cwd?: string; timeout?: number },
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

/** POST /api/content-pipeline/[postId]/render — Trigger render-post.js */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;

  try {
    // Verify post exists
    const current = await queryOne<ContentPost>(
      `SELECT * FROM content_posts WHERE post_id = $1`,
      [postId],
    );

    if (!current) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (!current.source_image_path) {
      return NextResponse.json(
        { error: 'Cannot render: no source image uploaded yet' },
        { status: 400 },
      );
    }

    const oldStatus = current.status;
    const contentOpsDir = getContentPipelineRoot();

    // Execute render-post.js in the content pipeline directory
    const { stdout, stderr } = await execAsync(
      `node render-post.js --post ${postId}`,
      { cwd: contentOpsDir, timeout: 120_000 },
    );

    if (stderr) {
      console.error('[api/content-pipeline/[postId]/render] stderr:', stderr);
    }

    // Read render manifest from filesystem (render-post.js writes it to rendered/{postId}/render-manifest.json)
    let manifest: Record<string, unknown> = {};
    const manifestPath = path.join(contentOpsDir, 'rendered', postId, 'render-manifest.json');
    try {
      manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch {
      // Fallback: store stdout as raw output for debugging
      manifest = { raw_output: stdout.trim() };
    }

    // Update DB: set render_manifest and advance status
    const updated = await queryOne<ContentPost>(
      `UPDATE content_posts
       SET render_manifest = $1::jsonb, status = 'rendered'::content_post_status
       WHERE post_id = $2
       RETURNING *`,
      [JSON.stringify(manifest), postId],
    );

    // Insert audit log entry
    await query(
      `INSERT INTO content_pipeline_log (post_id, action, old_status, new_status, details, performed_by)
       VALUES ($1, $2, $3::content_post_status, 'rendered'::content_post_status, $4::jsonb, $5)`,
      [
        postId,
        'render',
        oldStatus,
        JSON.stringify({
          manifest,
          stderr: stderr || null,
        }),
        'dashboard',
      ],
    );

    return NextResponse.json({
      success: true,
      manifest,
      post: updated,
    });
  } catch (err) {
    // On render failure, log it but also record the error in the audit trail
    console.error('[api/content-pipeline/[postId]/render] POST Error:', err);

    try {
      await query(
        `INSERT INTO content_pipeline_log (post_id, action, old_status, new_status, details, performed_by)
         VALUES ($1, 'error', NULL, 'failed'::content_post_status, $2::jsonb, 'dashboard')`,
        [
          postId,
          JSON.stringify({ error: String(err), stage: 'render' }),
        ],
      );
    } catch {
      // Best-effort audit logging — don't mask the original error
    }

    return NextResponse.json({ error: 'Render failed' }, { status: 500 });
  }
}
