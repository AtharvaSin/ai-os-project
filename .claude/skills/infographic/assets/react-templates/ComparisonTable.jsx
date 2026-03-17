import { useState } from "react";

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
  accent: '#00D492',       // accent-primary from BRAND_IDENTITY.md
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
  const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');`;

  return (
    <>
      <style>{`
        ${FONTS}
        .cmp-wrap {
          background: ${TOKENS.bgBase};
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
          border-radius: 8px;
        }
        .cmp-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          font-weight: 600;
          color: ${TOKENS.accent};
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 16px;
        }
        .cmp-table {
          width: 100%;
          border-collapse: collapse;
        }
        .cmp-table th {
          background: ${TOKENS.bgElevated};
          color: ${TOKENS.textPrimary};
          font-size: 12px;
          font-weight: 700;
          text-align: left;
          padding: 10px 14px;
          border-bottom: 1px solid ${TOKENS.border};
          white-space: nowrap;
        }
        .cmp-table th.highlighted {
          color: ${TOKENS.accent};
          border-bottom: 2px solid ${TOKENS.accent};
        }
        .cmp-table td {
          padding: 9px 14px;
          font-size: 13px;
          color: ${TOKENS.textSecondary};
          border-bottom: 1px solid ${TOKENS.border}80;
          vertical-align: middle;
        }
        .cmp-table td.row-label {
          color: ${TOKENS.textPrimary};
          font-weight: 600;
          font-size: 12px;
          white-space: nowrap;
        }
        .cmp-table td.highlighted {
          color: ${TOKENS.textPrimary};
          background: ${TOKENS.bgElevated};
          border-left: 2px solid ${TOKENS.accent};
        }
        .cmp-table tr:last-child td {
          border-bottom: none;
        }
        .cmp-table tr:hover td {
          background: ${TOKENS.bgSurface};
        }
      `}</style>
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
