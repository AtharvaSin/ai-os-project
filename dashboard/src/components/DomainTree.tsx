'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, Target, ListTodo, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DomainWithCounts } from '@/lib/types';

interface DomainTreeProps {
  domains: DomainWithCounts[];
  onSelectDomain: (slug: string) => void;
  onAddDomain: (parentId: string) => void;
  selectedSlug: string | null;
}

const FALLBACK_COLORS = ['#7B68EE', '#4ECDC4', '#E8B931', '#FF6B6B'];

/** Returns the CSS color for a health score (0.00-1.00 scale) */
function healthScoreColor(score: number | null): string {
  if (score === null) return '#807d75';
  const pct = score * 100;
  if (pct >= 70) return '#4ECDC4';
  if (pct >= 40) return '#E8B931';
  return '#FF6B6B';
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'stable' | null }) {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-accent-teal" />;
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-accent-red" />;
  if (trend === 'stable') return <Minus className="h-3 w-3 text-text-muted" />;
  return null;
}

export function DomainTree({ domains, onSelectDomain, onAddDomain, selectedSlug }: DomainTreeProps) {
  // Group: level 0 = categories, level 1+ = domain cards under their parent
  const categories = useMemo(() => {
    const roots = domains.filter((d) => d.level === 0).sort((a, b) => a.sort_order - b.sort_order);
    return roots.map((cat) => ({
      ...cat,
      children: domains
        .filter((d) => d.parent_id === cat.id && d.level >= 1)
        .sort((a, b) => a.sort_order - b.sort_order),
    }));
  }, [domains]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCategory = (id: string) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (domains.length === 0) {
    return (
      <div className="card p-8 text-center">
        <Target className="h-8 w-8 text-text-muted mx-auto mb-2" />
        <p className="text-text-secondary text-sm">No domains configured yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((cat) => {
        const isCollapsed = collapsed[cat.id] ?? false;

        return (
          <div key={cat.id}>
            {/* Category header */}
            <div className="flex items-center justify-between mb-2">
              <button
                onClick={() => toggleCategory(cat.id)}
                className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                {isCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                <span className="text-xs font-mono uppercase tracking-wider">
                  {cat.name}
                </span>
                <span className="text-[10px] text-text-muted">
                  ({cat.children.length})
                </span>
              </button>
              <button
                onClick={() => onAddDomain(cat.id)}
                className="flex items-center gap-1 text-text-muted hover:text-accent-primary transition-colors text-xs"
                title={`Add sub-domain to ${cat.name}`}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Domain cards grid */}
            {!isCollapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {cat.children.map((domain, idx) => {
                  const badgeColor = domain.color_code || FALLBACK_COLORS[idx % FALLBACK_COLORS.length]!;
                  const isSelected = domain.slug === selectedSlug;
                  const scorePct = domain.health_score !== null ? Math.round(domain.health_score * 100) : null;
                  const barColor = healthScoreColor(domain.health_score);

                  return (
                    <button
                      key={domain.id}
                      onClick={() => onSelectDomain(domain.slug)}
                      className={cn(
                        'card-hover p-4 text-left w-full transition-all',
                        isSelected && 'ring-2 ring-accent-primary',
                      )}
                    >
                      {/* Domain number badge + name */}
                      <div className="flex items-center gap-2.5 mb-3">
                        <div
                          className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0"
                          style={{ backgroundColor: badgeColor }}
                        >
                          {domain.domain_number ?? domain.sort_order}
                        </div>
                        <span className="text-sm font-semibold text-text-primary truncate">
                          {domain.name}
                        </span>
                      </div>

                      {/* Health score bar */}
                      <div className="mb-2.5">
                        {scorePct !== null ? (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-hover overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${scorePct}%`, backgroundColor: barColor }}
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span
                                className="text-[11px] font-mono font-semibold"
                                style={{ color: barColor }}
                              >
                                {scorePct}%
                              </span>
                              <TrendIcon trend={domain.health_trend} />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-hover" />
                            <span className="text-[11px] font-mono text-text-muted">No data</span>
                          </div>
                        )}
                      </div>

                      {/* Stats line */}
                      <div className="flex items-center gap-3 text-[11px] text-text-secondary">
                        <span className="flex items-center gap-1">
                          <ListTodo className="h-3 w-3" />
                          {domain.active_tasks} active
                        </span>
                        {domain.overdue_tasks > 0 && (
                          <span className="flex items-center gap-1 text-accent-red">
                            <AlertTriangle className="h-3 w-3" />
                            {domain.overdue_tasks} overdue
                          </span>
                        )}
                        {domain.active_objectives > 0 && (
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-accent-gold" />
                            {domain.active_objectives} obj
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
