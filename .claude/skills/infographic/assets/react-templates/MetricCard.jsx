import { useState } from "react";

// Context A: AI OS System — Metric Card
// Usage: <MetricCard value="34" label="MCP Tools" sublabel="7 modules" trend="+12 this sprint" />
//
// TOKENS — accent_primary from BRAND_IDENTITY.md
const TOKENS = {
  bgBase: '#0d0d14',
  bgSurface: '#12121e',
  bgElevated: '#1a1a2e',
  border: '#1f1f35',
  accent: '#00D492',       // accent-primary from BRAND_IDENTITY.md
  textPrimary: '#EEEAE4',
  textSecondary: '#A09D95',
  textMuted: '#606060',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;600&family=Instrument+Serif&display=swap');
`;

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
      <style>{`
        ${FONTS}
        .metric-card {
          background: ${TOKENS.bgSurface};
          border: 1px solid ${TOKENS.border};
          border-radius: 8px;
          padding: 20px 24px;
          font-family: 'DM Sans', sans-serif;
          min-width: 180px;
          position: relative;
          transition: border-color 0.2s;
        }
        .metric-card:hover {
          border-color: ${accent}40;
        }
        .metric-number-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: ${accent};
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .metric-value {
          font-family: 'JetBrains Mono', monospace;
          font-size: 40px;
          font-weight: 600;
          color: ${TOKENS.textPrimary};
          line-height: 1;
          margin-bottom: 6px;
        }
        .metric-label {
          font-size: 13px;
          font-weight: 600;
          color: ${TOKENS.textSecondary};
          margin-bottom: 4px;
        }
        .metric-sublabel {
          font-size: 11px;
          color: ${TOKENS.textMuted};
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
          color: ${TOKENS.accent};
          background: rgba(255,107,107,0.1);
        }
      `}</style>
      <div className="metric-card">
        {number && <div className="metric-number-label">{number} —</div>}
        <div className="metric-value">{value}</div>
        <div className="metric-label">{label}</div>
        {sublabel && <div className="metric-sublabel">{sublabel}</div>}
        {trend && (
          <span className={`metric-trend ${trendPositive ? 'positive' : 'negative'}`}>
            {trend}
          </span>
        )}
      </div>
    </>
  );
}
