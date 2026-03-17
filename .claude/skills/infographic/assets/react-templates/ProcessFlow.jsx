import { useState } from "react";

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
  accent: '#00D492',       // accent-primary from BRAND_IDENTITY.md
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
  const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');`;

  return (
    <>
      <style>{`
        ${FONTS}
        .flow-wrap {
          background: ${TOKENS.bgBase};
          font-family: 'DM Sans', sans-serif;
          padding: 24px;
        }
        .flow-title {
          font-size: 18px;
          font-weight: 800;
          color: ${TOKENS.textPrimary};
          margin-bottom: 24px;
          letter-spacing: -0.01em;
        }
        .flow-steps {
          display: flex;
          flex-direction: ${direction === 'horizontal' ? 'row' : 'column'};
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
          color: var(--step-accent, ${TOKENS.textMuted});
          width: 36px;
          height: 36px;
          border: 1px solid var(--step-accent, ${TOKENS.border});
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
          background: ${TOKENS.border};
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
          color: ${TOKENS.textPrimary};
          margin-bottom: 3px;
        }
        .flow-step-desc {
          font-size: 12px;
          color: ${TOKENS.textSecondary};
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
      `}</style>
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
