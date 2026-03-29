/**
 * overlayRenderer — Maps GraphicOverlay types to their React components.
 *
 * Centralised helper used by FacecamScene and ScreenRecScene to render
 * the correct graphic overlay component (StatCard, TextPunch, etc.)
 * based on the overlay.type discriminator from the input JSON.
 */

import React from 'react';
import type { PillarNumber } from '../constants';
import type { GraphicOverlay } from '../types';
import { StatCard } from '../components/StatCard';
import { TextPunch } from '../components/TextPunch';
import { ComparisonChart } from '../components/ComparisonChart';
import { ProcessFlow } from '../components/ProcessFlow';
import { CodeBlock } from '../components/CodeBlock';
import { BRollDrop } from '../components/BRollDrop';
import { KeyTermCard } from '../components/KeyTermCard';

/**
 * Safely extract a typed value from the overlay props bag.
 * Uses `unknown` as the intermediate type to satisfy strict TS.
 */
function typed<T>(props: Record<string, unknown>): T {
  return props as unknown as T;
}

/**
 * Render the correct overlay component for a given GraphicOverlay definition.
 *
 * @param overlay - The overlay specification from the input JSON
 * @param pillar  - Active content pillar (accent color source)
 * @returns A React element for the overlay, or null if the type is unknown
 */
export function renderOverlay(
  overlay: GraphicOverlay,
  pillar: PillarNumber,
): React.ReactNode {
  const p = overlay.props;

  switch (overlay.type) {
    case 'stat_card': {
      const t = typed<{ value: string; label: string; source?: string }>(p);
      return (
        <StatCard
          value={t.value ?? ''}
          label={t.label ?? ''}
          source={t.source}
          pillar={pillar}
        />
      );
    }

    case 'text_punch': {
      const t = typed<{ text: string }>(p);
      return <TextPunch text={t.text ?? ''} pillar={pillar} />;
    }

    case 'comparison': {
      const t = typed<{
        items: { label: string; value: number; color?: string }[];
        type: 'bars' | 'cards';
      }>(p);
      return (
        <ComparisonChart
          items={t.items ?? []}
          type={t.type ?? 'bars'}
          pillar={pillar}
        />
      );
    }

    case 'process_flow': {
      const t = typed<{
        nodes: { label: string; icon?: string }[];
        activeIndex?: number;
      }>(p);
      return (
        <ProcessFlow
          nodes={t.nodes ?? []}
          activeIndex={t.activeIndex}
          pillar={pillar}
        />
      );
    }

    case 'code_block': {
      const t = typed<{
        code: string;
        language: string;
        fileName?: string;
        highlightLines?: number[];
      }>(p);
      return (
        <CodeBlock
          code={t.code ?? ''}
          language={t.language ?? 'text'}
          fileName={t.fileName}
          highlightLines={t.highlightLines}
          pillar={pillar}
        />
      );
    }

    case 'meme_drop': {
      const t = typed<{ imageSrc: string; caption?: string }>(p);
      return <BRollDrop imageSrc={t.imageSrc ?? ''} caption={t.caption} />;
    }

    case 'key_term_card': {
      const t = typed<{
        term: string;
        note: string;
        position?: 'top-right' | 'top-left';
        category?: string;
        holdFrames?: number;
      }>(p);
      return (
        <KeyTermCard
          term={t.term ?? ''}
          note={t.note ?? ''}
          pillar={pillar}
          position={t.position ?? 'top-right'}
          category={t.category}
          holdFrames={t.holdFrames}
        />
      );
    }

    case 'checklist':
      // ChecklistCard component is planned but not yet implemented.
      // Return null to avoid runtime errors; overlay will be invisible.
      return null;

    default: {
      // Exhaustive check — if a new OverlayType is added to types.ts
      // but not handled here, TypeScript will flag it at compile time.
      const _exhaustive: never = overlay.type;
      return _exhaustive;
    }
  }
}
