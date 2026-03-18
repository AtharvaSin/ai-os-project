'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { DomainWithCounts } from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface RadialLifeGraphProps {
  domains: DomainWithCounts[];
  selectedSlug: string | null;
  onSelectDomain: (slug: string) => void;
}

interface GNode {
  id: string;
  slug: string;
  type: 'root' | 'category' | 'domain';
  label: string;
  domainNumber?: string;
  x: number;
  y: number;
  r: number;
  color: string;
  activeTasks: number;
  overdueTasks: number;
  activeObjectives: number;
  healthScore: number | null;
}

interface GLink {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CATEGORY_PALETTE: Record<string, string> = {
  private_affairs: '#FF6B9D',
  personal_projects: '#7B68EE',
  work: '#4ECDC4',
};

const DOMAIN_PALETTES: Record<string, string[]> = {
  private_affairs: ['#FF8A80', '#FF80AB', '#EA80FC', '#B388FF'],
  personal_projects: ['#B39DDB', '#9FA8DA', '#90CAF9', '#81D4FA'],
  work: ['#80CBC4', '#80DEEA', '#84FFFF', '#A7FFEB'],
};

const FALLBACK = ['#7B68EE', '#4ECDC4', '#E8B931', '#FF6B6B'];

const R_CAT = 210;   // center → category distance
const R_DOM = 155;    // category → domain distance
const NODE_R_ROOT = 62;
const NODE_R_CAT = 44;
const NODE_R_DOM = 34;

/* ------------------------------------------------------------------ */
/*  Layout                                                             */
/* ------------------------------------------------------------------ */

function buildGraph(domains: DomainWithCounts[]): { nodes: GNode[]; links: GLink[] } {
  const nodes: GNode[] = [];
  const links: GLink[] = [];

  // Root
  nodes.push({
    id: '__root__', slug: '__root__', type: 'root',
    label: 'Life Graph', x: 0, y: 0, r: NODE_R_ROOT,
    color: '#7B68EE', activeTasks: 0, overdueTasks: 0,
    activeObjectives: 0, healthScore: null,
  });

  const cats = domains
    .filter(d => d.level === 0)
    .sort((a, b) => a.sort_order - b.sort_order);

  cats.forEach((cat, ci) => {
    const a = -Math.PI / 2 + (ci * 2 * Math.PI) / cats.length;
    const cx = R_CAT * Math.cos(a);
    const cy = R_CAT * Math.sin(a);
    const slug = cat.slug.toLowerCase().replace(/\s+/g, '_');
    const color = CATEGORY_PALETTE[slug] || FALLBACK[ci % FALLBACK.length]!;

    nodes.push({
      id: cat.id, slug: cat.slug, type: 'category',
      label: cat.name, x: cx, y: cy, r: NODE_R_CAT,
      color, activeTasks: cat.active_tasks, overdueTasks: cat.overdue_tasks,
      activeObjectives: cat.active_objectives, healthScore: cat.health_score,
    });
    links.push({ x1: 0, y1: 0, x2: cx, y2: cy, color });

    // Children
    const kids = domains
      .filter(d => d.parent_id === cat.id && d.level >= 1)
      .sort((a2, b2) => a2.sort_order - b2.sort_order);

    if (!kids.length) return;
    const arc = Math.min(kids.length * 0.65, Math.PI * 0.85);
    const start = a - arc / 2;
    const step = kids.length > 1 ? arc / (kids.length - 1) : 0;
    const pal = DOMAIN_PALETTES[slug] || FALLBACK;

    kids.forEach((dom, di) => {
      const da = kids.length === 1 ? a : start + di * step;
      const dx = cx + R_DOM * Math.cos(da);
      const dy = cy + R_DOM * Math.sin(da);
      const dc = dom.color_code || pal[di % pal.length]!;

      nodes.push({
        id: dom.id, slug: dom.slug, type: 'domain',
        label: dom.name, domainNumber: dom.domain_number ?? undefined,
        x: dx, y: dy, r: NODE_R_DOM, color: dc,
        activeTasks: dom.active_tasks, overdueTasks: dom.overdue_tasks,
        activeObjectives: dom.active_objectives, healthScore: dom.health_score,
      });
      links.push({ x1: cx, y1: cy, x2: dx, y2: dy, color: dc });
    });
  });

  return { nodes, links };
}

/* ------------------------------------------------------------------ */
/*  Text helpers                                                       */
/* ------------------------------------------------------------------ */

function splitLabel(text: string, max: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) { lines.push(cur); cur = w; }
    else { cur = cur ? cur + ' ' + w : w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function RadialLifeGraph({ domains, selectedSlug, onSelectDomain }: RadialLifeGraphProps) {
  const { nodes, links } = useMemo(() => buildGraph(domains), [domains]);
  const [hovered, setHovered] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [vb, setVb] = useState({ x: -520, y: -460, w: 1040, h: 920 });

  // Mouse-wheel zoom (non-passive)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const f = e.deltaY > 0 ? 1.08 : 0.92;
      setVb(p => {
        const nw = p.w * f, nh = p.h * f;
        return { x: p.x - (nw - p.w) / 2, y: p.y - (nh - p.h) / 2, w: nw, h: nh };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Pan
  const panRef = useRef<{ sx: number; sy: number; vx: number; vy: number } | null>(null);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    panRef.current = { sx: e.clientX, sy: e.clientY, vx: vb.x, vy: vb.y };
  }, [vb.x, vb.y]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!panRef.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const dx = (e.clientX - panRef.current.sx) * (vb.w / rect.width);
    const dy = (e.clientY - panRef.current.sy) * (vb.h / rect.height);
    setVb(p => ({ ...p, x: panRef.current!.vx - dx, y: panRef.current!.vy - dy }));
  }, [vb.w, vb.h]);

  const onPointerUp = useCallback(() => { panRef.current = null; }, []);

  const resetView = useCallback(() => setVb({ x: -520, y: -460, w: 1040, h: 920 }), []);

  if (!domains.length) {
    return <div className="card p-8 text-center text-text-secondary text-sm">No domains configured</div>;
  }

  return (
    <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #111122 0%, #0a0a12 70%)', minHeight: 560 }}>
      <svg
        ref={svgRef}
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className="w-full select-none"
        style={{ height: '100%', minHeight: 560, cursor: panRef.current ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <defs>
          <filter id="lg-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
          <filter id="lg-glow-lg" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="16" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
          <radialGradient id="lg-root-grad" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#9B8AFB" />
            <stop offset="100%" stopColor="#4ECDC4" />
          </radialGradient>
        </defs>

        {/* Subtle orbit rings */}
        <circle cx={0} cy={0} r={R_CAT} fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.04" strokeDasharray="4 6" />
        <circle cx={0} cy={0} r={R_CAT + R_DOM} fill="none" stroke="#ffffff" strokeWidth="0.4" opacity="0.025" strokeDasharray="3 8" />

        {/* Links */}
        {links.map((l, i) => (
          <motion.path
            key={`l${i}`}
            d={`M${l.x1},${l.y1} L${l.x2},${l.y2}`}
            stroke={l.color}
            strokeWidth="1.5"
            fill="none"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.18 }}
            transition={{ duration: 0.7, delay: 0.2 + i * 0.04, ease: 'easeOut' }}
          />
        ))}

        {/* Domain nodes */}
        {nodes.filter(n => n.type === 'domain').map((n, i) => {
          const sel = n.slug === selectedSlug;
          const hov = n.id === hovered;
          const lines = splitLabel(n.label, 10);
          return (
            <motion.g
              key={n.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ x: n.x, y: n.y, scale: hov ? 1.14 : 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 220, damping: 22, delay: 0.45 + i * 0.04 }}
              onClick={(e) => { e.stopPropagation(); onSelectDomain(n.slug); }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              {/* Selection ring */}
              {sel && (
                <motion.circle r={n.r + 7} fill="none" stroke="#7B68EE" strokeWidth="2.5"
                  initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 0.9 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                />
              )}
              {/* Glow */}
              <circle r={n.r + 6} fill={n.color} opacity={hov ? 0.22 : 0.08} filter="url(#lg-glow)" />
              {/* Body */}
              <circle r={n.r} fill={n.color} opacity="0.88" />
              {/* Highlight */}
              <circle cx={-n.r * 0.22} cy={-n.r * 0.22} r={n.r * 0.28} fill="white" opacity="0.1" />
              {/* Label */}
              {lines.map((line, li) => (
                <text key={li} y={(li - (lines.length - 1) / 2) * 12 + 1}
                  textAnchor="middle" fill="white" fontSize="9.5" fontWeight="600"
                  style={{ fontFamily: 'var(--font-body)', pointerEvents: 'none' }}>
                  {line}
                </text>
              ))}
              {/* Domain number badge */}
              {n.domainNumber && (
                <g transform={`translate(0, ${-n.r - 12})`}>
                  <circle r="10" fill="#12121e" stroke={n.color} strokeWidth="1.5" />
                  <text y="3.5" textAnchor="middle" fill={n.color} fontSize="8" fontWeight="700"
                    style={{ fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}>
                    {n.domainNumber}
                  </text>
                </g>
              )}
              {/* Active tasks badge */}
              {n.activeTasks > 0 && (
                <g transform={`translate(${n.r * 0.65}, ${n.r * 0.65})`}>
                  <circle r="9" fill={n.overdueTasks > 0 ? '#FF6B6B' : '#4ECDC4'} />
                  <text y="3.5" textAnchor="middle" fill="white" fontSize="8" fontWeight="700"
                    style={{ pointerEvents: 'none' }}>{n.activeTasks}</text>
                </g>
              )}
            </motion.g>
          );
        })}

        {/* Category nodes */}
        {nodes.filter(n => n.type === 'category').map((n, i) => {
          const hov = n.id === hovered;
          const lines = splitLabel(n.label, 9);
          return (
            <motion.g
              key={n.id}
              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
              animate={{ x: n.x, y: n.y, scale: hov ? 1.08 : 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.25 + i * 0.08 }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'default' }}
            >
              <circle r={n.r + 10} fill={n.color} opacity={hov ? 0.16 : 0.06} filter="url(#lg-glow)" />
              <circle r={n.r} fill={n.color} opacity="0.92" />
              <circle cx={-n.r * 0.2} cy={-n.r * 0.2} r={n.r * 0.32} fill="white" opacity="0.1" />
              {lines.map((line, li) => (
                <text key={li} y={(li - (lines.length - 1) / 2) * 14 + 1}
                  textAnchor="middle" fill="white" fontSize="12" fontWeight="700"
                  style={{ fontFamily: 'var(--font-body)', pointerEvents: 'none' }}>
                  {line}
                </text>
              ))}
            </motion.g>
          );
        })}

        {/* Root node */}
        {nodes.filter(n => n.type === 'root').map(n => (
          <motion.g
            key={n.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.05 }}
          >
            <circle r={n.r + 20} fill="#7B68EE" opacity="0.06" filter="url(#lg-glow-lg)" />
            <circle r={n.r} fill="url(#lg-root-grad)" filter="url(#lg-glow)" />
            <circle cx={-14} cy={-14} r={n.r * 0.38} fill="white" opacity="0.07" />
            <text y={-6} textAnchor="middle" fill="white" fontSize="16" fontWeight="800"
              style={{ fontFamily: 'var(--font-body)', pointerEvents: 'none' }}>Life</text>
            <text y={14} textAnchor="middle" fill="white" fontSize="14" fontWeight="500" opacity="0.85"
              style={{ fontFamily: 'var(--font-body)', pointerEvents: 'none' }}>Graph</text>
          </motion.g>
        ))}
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button onClick={() => setVb(p => ({ x: p.x + p.w * 0.05, y: p.y + p.h * 0.05, w: p.w * 0.9, h: p.h * 0.9 }))}
          className="w-7 h-7 rounded bg-[#16162a]/80 border border-[#2a2a40] text-text-secondary hover:text-text-primary flex items-center justify-center text-sm backdrop-blur-sm">+</button>
        <button onClick={() => setVb(p => ({ x: p.x - p.w * 0.05, y: p.y - p.h * 0.05, w: p.w * 1.1, h: p.h * 1.1 }))}
          className="w-7 h-7 rounded bg-[#16162a]/80 border border-[#2a2a40] text-text-secondary hover:text-text-primary flex items-center justify-center text-sm backdrop-blur-sm">&minus;</button>
        <button onClick={resetView}
          className="w-7 h-7 rounded bg-[#16162a]/80 border border-[#2a2a40] text-text-secondary hover:text-text-primary flex items-center justify-center text-[10px] backdrop-blur-sm">&#x27F2;</button>
      </div>
    </div>
  );
}
