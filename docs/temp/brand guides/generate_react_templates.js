/**
 * generate_react_templates.js
 * Generates React infographic component templates for Context A (AI OS System).
 * These are base components that the infographic skill references.
 *
 * Usage:
 *   node generate_react_templates.js --output ../skills/infographic/assets/react-templates/
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const outputIdx = args.indexOf('--output');
const OUTPUT_DIR = outputIdx >= 0 ? args[outputIdx + 1] : '../skills/infographic/assets/react-templates/';

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ─────────────────────────────────────────────────
// MetricCard.jsx — KPI summary card
// ─────────────────────────────────────────────────
const MetricCard = `import { useState } from "react";

// Context A: AI OS System — Metric Card
// Usage: <MetricCard value="34" label="MCP Tools" sublabel="7 modules" trend="+12 this sprint" />
// 
// TOKENS — update accent_primary from BRAND_IDENTITY.md after Wibify extraction
const TOKENS = {
  bgBase: '#0d0d14',
  bgSurface: '#12121e',
  bgElevated: '#1a1a2e',
  border: '#1f1f35',
  accent: '#00E5CC',       // ← UPDATE: accent-primary from BRAND_IDENTITY.md
  textPrimary: '#EEEAE4',
  textSecondary: '#A09D95',
  textMuted: '#606060',
};

const FONTS = \`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&family=Instrument+Serif&display=swap');
\`;

export default function MetricCard({
  value,
  label,
  sublabel,
  trend,
  trendPositive = true,
  number,        // Optional section number (e.g., "01")
  accent = TOKENS.accent,
}) {
  return (
    <>
      <style>{\`
        \${FONTS}
        .metric-card {
          background: \${TOKENS.bgSurface};
          border: 1px solid \${TOKENS.border};
          border-radius: 8px;
          padding: 20px 24px;
          font-family: 'DM Sans', sans-serif;
          min-width: 180px;
          position: relative;
          transition: border-color 0.2s;
        }
        .metric-card:hover {
          border-color: \${accent}40;
        }
        .metric-number-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: \${accent};
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .metric-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 40px;
          font-weight: 600;
          color: \${TOKENS.textPrimary};
          line-height: 1;
          margin-bottom: 6px;
        }
        .metric-label {
          font-size: 13px;
          font-weight: 600;
          color: \${TOKENS.textSecondary};
          margin-bottom: 4px;
        }
        .metric-sublabel {
          font-size: 11px;
          color: \${TOKENS.textMuted};
          margin-bottom: 8px;
        }
        .metric-trend {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 3px;
          display: inline-block;
        }
        .metric-trend.positive {
          color: #4ECDC4;
          background: rgba(78,205,196,0.1);
        }
        .metric-trend.negative {
          color: \${TOKENS.accent};
          background: rgba(255,107,107,0.1);
        }
      \`}</style>
      <div className="metric-card">
        {number && <div className="metric-number-label">{number} —</div>}
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
        {sublabel && <div className="metric-sublabel">{sublabel}</div>}
        {trend && (
          <span className={\`metric-trend \${trendPositive ? 'positive' : 'negative'}\`}>
            {trend}
          </span>
        )}
      </div>
    </>
  );
}
`;

// ─────────────────────────────────────────────────
// ComparisonTable.jsx — Side-by-side comparison
// ─────────────────────────────────────────────────
const ComparisonTable = `import { useState } from "react";

// Context A: AI OS System — Comparison Table
// Usage:
// <ComparisonTable
//   title="01 — Tech Stack Comparison"
//   headers={["Criterion", "Option A", "Option B", "Option C"]}
//   rows={[
//     ["Performance", "★★★★★", "★★★☆☆", "★★★★☆"],
//     ["Cost", "Low", "Medium", "High"],
//   ]}
//   highlightCol={1}  // 1-based index of the recommended column
// />

const TOKENS = {
  bgBase: '#0d0d14',
  bgSurface: '#12121e',
  bgElevated: '#1a1a2e',
  border: '#1f1f35',
  accent: '#00E5CC',       // ← UPDATE from BRAND_IDENTITY.md
  textPrimary: '#EEEAE4',
  textSecondary: '#A09D95',
  textMuted: '#606060',
};

export default function ComparisonTable({
  title,
  headers = [],
  rows = [],
  highlightCol = null,
}) {
  const FONTS = \`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');\`;
  
  return (
    <>
      <style>{\`
        \${FONTS}
        .cmp-wrap { 
          background: \${TOKENS.bgBase};
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
          border-radius: 8px;
        }
        .cmp-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: \${TOKENS.accent};
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .cmp-table {
          width: 100%;
          border-collapse: collapse;
        }
        .cmp-table th {
          background: \${TOKENS.bgElevated};
          color: \${TOKENS.textPrimary};
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          padding: 10px 14px;
          border-bottom: 1px solid \${TOKENS.border};
          white-space: nowrap;
        }
        .cmp-table th.highlighted {
          color: \${TOKENS.accent};
          border-bottom: 2px solid \${TOKENS.accent};
        }
        .cmp-table td {
          padding: 9px 14px;
          font-size: 13px;
          color: \${TOKENS.textSecondary};
          border-bottom: 1px solid \${TOKENS.border}80;
          vertical-align: middle;
        }
        .cmp-table td.row-label {
          color: \${TOKENS.textPrimary};
          font-weight: 600;
          font-size: 12px;
          white-space: nowrap;
        }
        .cmp-table td.highlighted {
          color: \${TOKENS.textPrimary};
          background: \${TOKENS.bgElevated};
          border-left: 2px solid \${TOKENS.accent};
        }
        .cmp-table tr:last-child td {
          border-bottom: none;
        }
        .cmp-table tr:hover td {
          background: \${TOKENS.bgSurface};
        }
      \`}</style>
      <div className="cmp-wrap">
        {title && <div className="cmp-title">{title}</div>}
        <table className="cmp-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className={i === highlightCol ? 'highlighted' : ''}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} 
                      className={[
                        ci === 0 ? 'row-label' : '',
                        ci === highlightCol ? 'highlighted' : ''
                      ].join(' ')}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
`;

// ─────────────────────────────────────────────────
// ProcessFlow.jsx — Numbered step flow
// ─────────────────────────────────────────────────
const ProcessFlow = `import { useState } from "react";

// Context A: AI OS System — Process Flow
// Usage:
// <ProcessFlow
//   title="Build Pipeline"
//   steps={[
//     { num: "01", title: "Extract Tokens", desc: "Playwright → JSON", status: "done" },
//     { num: "02", title: "Build Skills", desc: "3 SKILL.md files", status: "active" },
//     { num: "03", title: "Deploy", desc: "Git push → auto-sync", status: "pending" },
//   ]}
// />

const TOKENS = {
  bgBase: '#0d0d14',
  bgSurface: '#12121e',
  bgElevated: '#1a1a2e',
  border: '#1f1f35',
  accent: '#00E5CC',       // ← UPDATE from BRAND_IDENTITY.md
  success: '#4ECDC4',
  warning: '#E8B931',
  danger: '#FF6B6B',
  textPrimary: '#EEEAE4',
  textSecondary: '#A09D95',
  textMuted: '#606060',
};

const STATUS_CONFIG = {
  done:    { color: TOKENS.success, label: 'DONE' },
  active:  { color: TOKENS.accent,  label: 'ACTIVE' },
  pending: { color: TOKENS.textMuted, label: 'PENDING' },
  blocked: { color: TOKENS.danger,  label: 'BLOCKED' },
};

export default function ProcessFlow({ title, steps = [], direction = 'vertical' }) {
  const FONTS = \`@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');\`;
  
  return (
    <>
      <style>{\`
        \${FONTS}
        .flow-wrap {
          background: \${TOKENS.bgBase};
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
        }
        .flow-title {
          font-size: 18px;
          font-weight: 800;
          color: \${TOKENS.textPrimary};
          margin-bottom: 24px;
          letter-spacing: -0.01em;
        }
        .flow-steps {
          display: flex;
          flex-direction: \${direction === 'horizontal' ? 'row' : 'column'};
          gap: 0;
        }
        .flow-step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          position: relative;
          padding-bottom: 24px;
        }
        .flow-step:last-child {
          padding-bottom: 0;
        }
        .flow-step-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 40px;
        }
        .flow-num {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: var(--step-accent, \${TOKENS.textMuted});
          width: 36px;
          height: 36px;
          border: 1px solid var(--step-accent, \${TOKENS.border});
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .flow-connector {
          width: 1px;
          flex: 1;
          min-height: 16px;
          background: \${TOKENS.border};
          margin: 4px 0;
        }
        .flow-step:last-child .flow-connector {
          display: none;
        }
        .flow-content {
          padding-top: 6px;
          flex: 1;
        }
        .flow-step-title {
          font-size: 14px;
          font-weight: 700;
          color: \${TOKENS.textPrimary};
          margin-bottom: 3px;
        }
        .flow-step-desc {
          font-size: 12px;
          color: \${TOKENS.textSecondary};
        }
        .flow-step-status {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          font-weight: 600;
          letter-spacing: 0.1em;
          padding: 2px 6px;
          border-radius: 2px;
          display: inline-block;
          margin-top: 6px;
        }
      \`}</style>
      <div className="flow-wrap">
        {title && <div className="flow-title">{title}</div>}
        <div className="flow-steps">
          {steps.map((step, i) => {
            const status = STATUS_CONFIG[step.status || 'pending'];
            return (
              <div key={i} className="flow-step"
                   style={{ '--step-accent': status.color }}>
                <div className="flow-step-left">
                  <div className="flow-num">{step.num || String(i + 1).padStart(2, '0')}</div>
                  <div className="flow-connector" />
                </div>
                <div className="flow-content">
                  <div className="flow-step-title">{step.title}</div>
                  {step.desc && <div className="flow-step-desc">{step.desc}</div>}
                  <span className="flow-step-status"
                        style={{ color: status.color, background: status.color + '15' }}>
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
`;

// ─────────────────────────────────────────────────
// Write all templates
// ─────────────────────────────────────────────────
const templates = {
  'MetricCard.jsx': MetricCard,
  'ComparisonTable.jsx': ComparisonTable,
  'ProcessFlow.jsx': ProcessFlow,
};

for (const [filename, content] of Object.entries(templates)) {
  const outputPath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(outputPath, content);
  console.log(`✅ Written: ${outputPath}`);
}

console.log(`\nGenerated ${Object.keys(templates).length} React template components.`);
console.log('Additional templates (ArchDiagram, TimelineView) can be added following the same pattern.');
console.log('\nTo use in a Claude.ai artifact: inline the component code directly.');
console.log('To use in Claude Code: import from this directory.');
