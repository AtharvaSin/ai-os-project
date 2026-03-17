import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import type { DomainWithCounts, DomainTreeNode } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Build a tree from a flat list of domains using parent_id relationships.
 * Assumes rows are sorted by path + sort_order so parents appear before children.
 */
function buildTree(rows: DomainWithCounts[]): DomainTreeNode[] {
  const nodeMap = new Map<string, DomainTreeNode>();
  const roots: DomainTreeNode[] = [];

  for (const row of rows) {
    const node: DomainTreeNode = { ...row, children: [] };
    nodeMap.set(node.id, node);

    if (node.parent_id && nodeMap.has(node.parent_id)) {
      nodeMap.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function GET() {
  try {
    const rows = await query<DomainWithCounts>(
      `SELECT d.*,
        (SELECT COUNT(*) FROM tasks t WHERE t.domain_id = d.id AND t.status NOT IN ('done','cancelled'))::int AS active_tasks,
        (SELECT COUNT(*) FROM domain_context_items ci WHERE ci.domain_id = d.id AND ci.item_type = 'objective' AND ci.status = 'active')::int AS active_objectives,
        (SELECT COUNT(*) FROM domain_context_items ci WHERE ci.domain_id = d.id AND ci.item_type = 'automation' AND ci.status = 'active')::int AS active_automations
       FROM life_domains d
       WHERE d.status = 'active'
       ORDER BY d.path, d.sort_order`,
    );

    const tree = buildTree(rows);

    return NextResponse.json({ data: tree });
  } catch (err) {
    console.error('[api/domains] GET Error:', err);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}
