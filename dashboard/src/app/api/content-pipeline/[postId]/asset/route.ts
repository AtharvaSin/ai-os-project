import { NextResponse, type NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import type { ContentPost } from '@/lib/types';
import { readFile } from 'fs/promises';
import { extname } from 'path';

export const dynamic = 'force-dynamic';

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

/** GET /api/content-pipeline/[postId]/asset — Serve the source image */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
) {
  try {
    const { postId } = await params;

    const post = await queryOne<ContentPost>(
      `SELECT source_image_path FROM content_posts WHERE post_id = $1`,
      [postId],
    );

    if (!post?.source_image_path) {
      return NextResponse.json({ error: 'No image found' }, { status: 404 });
    }

    const filePath = post.source_image_path;
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_MAP[ext] ?? 'application/octet-stream';

    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, must-revalidate',
      },
    });
  } catch (err) {
    console.error('[api/content-pipeline/[postId]/asset] Error:', err);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
