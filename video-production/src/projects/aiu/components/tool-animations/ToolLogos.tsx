/**
 * ToolLogos — Accurate SVG logo components for AI tool animations.
 *
 * Each logo is an inline SVG rendering a faithful recreation of the actual
 * brand mark. Used across the tool animation scenes in the AI&U video pipeline.
 *
 * Logos: CopilotLogo (interlocking ribbons), CopilotStudioLogo (stacked cards),
 * GeminiLogo (4-pointed sparkle), ChatGPTLogo (hexagonal knot),
 * N8NLogo (text), ZapierLogo (Z bolt).
 */

import React from 'react';

interface LogoProps {
  size?: number;
}

// ── Microsoft Copilot — Two interlocking gradient ribbons ────

export const CopilotLogo: React.FC<LogoProps> = ({ size = 120 }) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={`copilot-left-${id}`}
          x1="0.3"
          y1="0"
          x2="0.2"
          y2="1"
        >
          <stop offset="0%" stopColor="#4B8BF4" />
          <stop offset="45%" stopColor="#4CB748" />
          <stop offset="100%" stopColor="#E8C846" />
        </linearGradient>
        <linearGradient
          id={`copilot-right-${id}`}
          x1="0.7"
          y1="0"
          x2="0.8"
          y2="1"
        >
          <stop offset="0%" stopColor="#00B4E6" />
          <stop offset="50%" stopColor="#C543B0" />
          <stop offset="100%" stopColor="#F2955E" />
        </linearGradient>
      </defs>
      {/* Left ribbon piece — flows from blue (top) through green to yellow (bottom-left).
          Goes OVER at top-center, UNDER at bottom-center. */}
      <path
        d={[
          'M 18 10',
          'C 18 6, 22 4, 26 4',
          'L 42 4',
          'C 46 4, 50 7, 50 12',
          'L 50 38',
          'C 50 42, 47 46, 43 46',
          'L 12 46',
          'C 8 46, 4 50, 4 54',
          'L 4 58',
          'C 4 62, 8 66, 12 66',
          'L 43 66',
          'C 47 66, 50 69, 50 73',
          'L 50 90',
          'C 50 94, 46 96, 42 96',
          'L 18 96',
          'C 14 96, 10 93, 10 89',
          'L 10 12',
          'C 10 8, 13 6, 18 10',
          'Z',
        ].join(' ')}
        fill={`url(#copilot-left-${id})`}
      />
      {/* Right ribbon piece — flows from cyan (top-right) through pink to orange (bottom).
          Complements the left piece, creating the woven center gap. */}
      <path
        d={[
          'M 82 10',
          'C 82 6, 78 4, 74 4',
          'L 58 4',
          'C 54 4, 50 7, 50 12',
          'L 50 34',
          'C 50 30, 53 27, 57 27',
          'L 88 27',
          'C 92 27, 96 31, 96 35',
          'L 96 42',
          'C 96 46, 92 50, 88 50',
          'L 57 50',
          'C 53 50, 50 53, 50 57',
          'L 50 90',
          'C 50 94, 54 96, 58 96',
          'L 82 96',
          'C 86 96, 90 93, 90 89',
          'L 90 12',
          'C 90 8, 87 6, 82 10',
          'Z',
        ].join(' ')}
        fill={`url(#copilot-right-${id})`}
      />
    </svg>
  );
};

// ── Copilot Studio — Three stacked rounded-rectangle cards ───

export const CopilotStudioLogo: React.FC<LogoProps> = ({ size = 120 }) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={`studio-top-${id}`}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#3BD5C2" />
          <stop offset="100%" stopColor="#7AE6AD" />
        </linearGradient>
      </defs>
      {/* Bottom-right card — dark blue, largest */}
      <rect
        x="38"
        y="48"
        width="56"
        height="34"
        rx="8"
        fill="#0078D4"
        transform="rotate(-5 66 65)"
      />
      {/* Middle card — medium teal */}
      <rect
        x="20"
        y="33"
        width="56"
        height="34"
        rx="8"
        fill="#00A5B8"
        transform="rotate(-5 48 50)"
      />
      {/* Top-left card — mint gradient, smallest visual weight */}
      <rect
        x="4"
        y="18"
        width="56"
        height="34"
        rx="8"
        fill={`url(#studio-top-${id})`}
        transform="rotate(-5 32 35)"
      />
    </svg>
  );
};

// ── Google Gemini — Vertically elongated 4-pointed sparkle ───

export const GeminiLogo: React.FC<LogoProps> = ({ size = 120 }) => {
  const id = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 140"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={`gemini-grad-${id}`}
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop offset="0%" stopColor="#8E44AD" />
          <stop offset="100%" stopColor="#4285F4" />
        </linearGradient>
      </defs>
      {/* 4-pointed star with concave sides, taller than wide.
          Control points pulled toward center (50,70) for concavity. */}
      <path
        d={[
          'M 50 0',
          'C 52 28, 54 50, 72 70',
          'C 54 90, 52 112, 50 140',
          'C 48 112, 46 90, 28 70',
          'C 46 50, 48 28, 50 0',
          'Z',
        ].join(' ')}
        fill={`url(#gemini-grad-${id})`}
      />
    </svg>
  );
};

// ── ChatGPT / OpenAI — Hexagonal knot (6 interwoven arcs) ───

export const ChatGPTLogo: React.FC<LogoProps> = ({ size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 41 41"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Official OpenAI hexagonal knot path — 6 curved thick strokes
        forming a Celtic-knot-like hexagonal flower pattern. */}
    <path
      d="M37.532 16.87a9.963 9.963 0 0 0-.856-8.184 10.078 10.078 0 0 0-10.855-4.835A9.964 9.964 0 0 0 18.306.5a10.079 10.079 0 0 0-9.614 6.977 9.967 9.967 0 0 0-6.664 4.834 10.08 10.08 0 0 0 1.24 11.817 9.965 9.965 0 0 0 .856 8.185 10.079 10.079 0 0 0 10.855 4.835 9.965 9.965 0 0 0 7.516 3.35 10.078 10.078 0 0 0 9.617-6.981 9.967 9.967 0 0 0 6.663-4.834 10.079 10.079 0 0 0-1.243-11.813ZM22.498 37.886a7.474 7.474 0 0 1-4.799-1.735c.061-.033.168-.091.237-.134l7.964-4.6a1.294 1.294 0 0 0 .655-1.134V19.054l3.366 1.944a.12.12 0 0 1 .066.092v9.299a7.505 7.505 0 0 1-7.49 7.496ZM6.392 31.006a7.471 7.471 0 0 1-.894-5.023c.06.036.162.099.237.141l7.964 4.6a1.297 1.297 0 0 0 1.308 0l9.724-5.614v3.888a.12.12 0 0 1-.048.103l-8.051 4.649a7.504 7.504 0 0 1-10.24-2.744ZM4.297 13.62A7.469 7.469 0 0 1 8.2 10.333c0 .068-.004.19-.004.274v9.201a1.294 1.294 0 0 0 .654 1.132l9.723 5.614-3.366 1.944a.12.12 0 0 1-.114.012L7.04 23.856a7.504 7.504 0 0 1-2.744-10.237Zm27.658 6.437-9.724-5.615 3.367-1.943a.121.121 0 0 1 .113-.012l8.051 4.649a7.498 7.498 0 0 1-1.158 13.528v-9.476a1.293 1.293 0 0 0-.649-1.131Zm3.35-5.043c-.059-.037-.162-.099-.236-.141l-7.965-4.6a1.298 1.298 0 0 0-1.308 0l-9.723 5.614v-3.888a.12.12 0 0 1 .048-.103l8.05-4.645a7.497 7.497 0 0 1 11.135 7.763Zm-21.063 6.929-3.367-1.944a.12.12 0 0 1-.065-.092v-9.299a7.497 7.497 0 0 1 12.293-5.756 1.42 1.42 0 0 0-.236.134l-7.965 4.6a1.294 1.294 0 0 0-.654 1.132l-.006 11.225Zm1.829-3.943 4.33-2.501 4.332 2.5v5l-4.331 2.5-4.331-2.5V18Z"
      fill="#343541"
    />
  </svg>
);

// ── N8N — Bold orange text logo ─────────────────────────────

export const N8NLogo: React.FC<LogoProps> = ({ size = 120 }) => {
  const fontSize = size * 0.38;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <text
        x="50"
        y="56"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#FF6D5A"
        fontWeight={800}
        fontSize={fontSize}
        fontFamily="Arial, sans-serif"
        letterSpacing={-1}
      >
        n8n
      </text>
    </svg>
  );
};

// ── Zapier — Z-shaped lightning bolt ─────────────────────────

export const ZapierLogo: React.FC<LogoProps> = ({ size = 120 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M28 20 L72 20 L42 50 L68 50 L30 82 L40 54 L20 54 Z"
      fill="#FF4F00"
    />
  </svg>
);
