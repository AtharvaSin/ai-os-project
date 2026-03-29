import { NextResponse } from 'next/server';
import { readFile, readdir } from 'fs/promises';
import path from 'path';
import { getContentPipelineRoot } from '@/lib/pipeline-paths';

export const dynamic = 'force-dynamic';

/**
 * GET /api/content-pipeline/[postId]/renders/[channel]
 *   ?slide=N   (optional, 1-indexed — for carousel renders)
 *
 * Serves a rendered PNG image for the given post + channel.
 * For carousel: looks for {channel}_slide_{NN}.png
 * For single:   looks for any {channel}_*.png that is not a slide/frame variant
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ postId: string; channel: string }> },
) {
  try {
    const { postId, channel } = await params;
    const { searchParams } = new URL(req.url);
    const slideParam = searchParams.get('slide');

    const renderDir = path.join(
      getContentPipelineRoot(),
      'rendered',
      postId,
    );

    let files: string[];
    try {
      files = await readdir(renderDir);
    } catch {
      return NextResponse.json({ error: 'No renders found for this post' }, { status: 404 });
    }

    let targetFile: string | undefined;

    if (slideParam !== null) {
      // Carousel mode: look for {channel}_slide_{NN}.png
      const slideNum = parseInt(slideParam, 10);
      const padded = String(slideNum).padStart(2, '0');
      const candidates = [
        `${channel}_slide_${padded}.png`,
        `${channel}_slide_0${slideNum}.png`,
      ];
      targetFile = candidates.find((c) => files.includes(c));
    } else {
      // Single / main render: {channel}_*.png that is NOT a slide or frame variant
      targetFile = files.find(
        (f) =>
          f.startsWith(`${channel}_`) &&
          !f.includes('_slide_') &&
          !f.includes('_frame_') &&
          f.endsWith('.png'),
      );
    }

    if (!targetFile) {
      return NextResponse.json({ error: 'Render not found' }, { status: 404 });
    }

    const filePath = path.join(renderDir, targetFile);
    const buffer = await readFile(filePath);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Length': String(buffer.length),
      },
    });
  } catch (err) {
    console.error('[api/content-pipeline/[postId]/renders/[channel]] GET Error:', err);
    return NextResponse.json({ error: 'Failed to serve render' }, { status: 500 });
  }
}
