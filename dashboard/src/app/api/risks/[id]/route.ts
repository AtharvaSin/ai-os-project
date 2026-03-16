import { NextResponse, type NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const resolution_note = body.resolution_note ?? null;

    const updated = await queryOne<Record<string, unknown>>(
      `UPDATE risk_alerts
       SET is_resolved = true, resolved_at = NOW(), resolution_note = $2
       WHERE id = $1
       RETURNING *`,
      [id, resolution_note],
    );

    if (!updated) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('[api/risks/[id]] PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to resolve alert' }, { status: 500 });
  }
}
