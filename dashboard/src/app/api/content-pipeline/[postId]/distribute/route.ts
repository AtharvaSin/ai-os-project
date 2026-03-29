import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import type { ContentPost } from '@/lib/types';
import { exec } from 'child_process';
import path from 'path';
import { getContentPipelineRoot } from '@/lib/pipeline-paths';

export const dynamic = 'force-dynamic';

/**
 * Wraps child_process.exec in a Promise for async/await usage.
 * Resolves with { stdout, stderr }, rejects on non-zero exit.
 */
function execAsync(
  command: string,
  options: {
    cwd?: string;
    timeout?: number;
    env?: NodeJS.ProcessEnv;
  },
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

/**
 * Parse the JSON result from distribute-post.js stdout.
 * The script prefixes all log lines with [LOG] and emits the final JSON
 * result as the last non-empty line without a prefix.
 */
function parseDistributorOutput(stdout: string): Record<string, unknown> {
  const lines = stdout
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('[LOG]'));

  if (lines.length === 0) {
    return { raw_output: stdout.trim() };
  }

  const lastLine = lines.at(-1);
  if (!lastLine) {
    return { raw_output: stdout.trim() };
  }
  try {
    return JSON.parse(lastLine) as Record<string, unknown>;
  } catch {
    return { raw_output: stdout.trim() };
  }
}

/** POST /api/content-pipeline/[postId]/distribute — Trigger distribute-post.js */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ postId: string }> },
) {
  const { postId } = await params;

  try {
    // Verify post exists and is in 'approved' status
    const current = await queryOne<ContentPost>(
      `SELECT * FROM content_posts WHERE post_id = $1`,
      [postId],
    );

    if (!current) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (current.status !== 'approved') {
      return NextResponse.json(
        {
          error: `Post is not in 'approved' status (current: ${current.status}). Only approved posts can be distributed.`,
        },
        { status: 400 },
      );
    }

    const contentOpsDir = getContentPipelineRoot();

    // Pass social credentials from process.env through to the child process.
    // Cloud Run receives these via --set-secrets in cloudbuild.yaml.
    // Locally they come from .env.local (Next.js loads them into process.env).
    const childEnv: NodeJS.ProcessEnv = {
      ...process.env,
      // Database
      DB_HOST: process.env.DB_HOST ?? '',
      DB_PORT: process.env.DB_PORT ?? '5434',
      DB_NAME: process.env.DB_NAME ?? 'ai_os',
      DB_USER: process.env.DB_USER ?? 'ai_os_admin',
      DB_PASSWORD: process.env.DB_PASSWORD ?? '',
      // Meta
      META_PAGE_ACCESS_TOKEN: process.env.META_PAGE_ACCESS_TOKEN ?? '',
      META_IG_USER_TOKEN: process.env.META_IG_USER_TOKEN ?? '',
      // GCS
      GCS_BUCKET: process.env.GCS_BUCKET ?? 'bhv-content-assets',
      // X / Twitter
      X_API_KEY: process.env.X_API_KEY ?? '',
      X_API_SECRET: process.env.X_API_SECRET ?? '',
      X_ACCESS_TOKEN: process.env.X_ACCESS_TOKEN ?? '',
      X_ACCESS_TOKEN_SECRET: process.env.X_ACCESS_TOKEN_SECRET ?? '',
    };

    const { stdout, stderr } = await execAsync(
      `node distributor/distribute-post.js --post ${postId}`,
      { cwd: contentOpsDir, timeout: 120_000, env: childEnv },
    );

    if (stderr) {
      console.error('[api/content-pipeline/[postId]/distribute] stderr:', stderr);
    }

    const result = parseDistributorOutput(stdout);

    if (result.success === false) {
      return NextResponse.json(
        {
          error: (result.error as string | undefined) ?? 'Distribution failed',
          detail: result,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/content-pipeline/[postId]/distribute] POST Error:', err);
    return NextResponse.json(
      { error: 'Distribution failed', detail: String(err) },
      { status: 500 },
    );
  }
}
