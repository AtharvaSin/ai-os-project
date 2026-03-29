import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { getContentPipelineRoot } from '@/lib/pipeline-paths';

export const dynamic = 'force-dynamic';

/**
 * GET /api/content-pipeline/[postId]/asset/[filename]
 * Serves a rendered PNG asset from the local pipeline rendered directory.
 * Used by PostingKitPanel for image preview and download.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ postId: string; filename: string }> },
) {
  const { postId, filename } = await params;

  // Sanitize inputs — prevent path traversal
  if (!/^[A-Za-z0-9\-_]+$/.test(postId) || !/^[A-Za-z0-9\-_.]+\.png$/.test(filename)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  const filePath = path.join(getContentPipelineRoot(), 'rendered', postId, filename);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
