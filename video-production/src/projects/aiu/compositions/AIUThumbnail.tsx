/**
 * AIUThumbnail — Thumbnail Composition Router (1280x720 still)
 *
 * Reads getInputProps() conforming to AIUThumbnailInput and renders
 * the correct thumbnail template: BigPromise, BeforeAfter, or WorkflowDiagram.
 *
 * Designed to be rendered as a single-frame still image via:
 *   npx remotion still AIUThumbnail --props='...' --output=thumb.png
 */

import React from 'react';
import { AbsoluteFill, getInputProps } from 'remotion';
import { BigPromise } from '../thumbnails/BigPromise';
import { BeforeAfter } from '../thumbnails/BeforeAfter';
import { WorkflowDiagram } from '../thumbnails/WorkflowDiagram';
import { COLORS, DIMENSIONS } from '../constants';
import { FONT_FAMILY } from '../utils/fonts';
import type { ThumbnailTemplate } from '../types';

// ── Input Shape ─────────────────────────────────────────────

interface AIUThumbnailInput {
  /** Which thumbnail template to render */
  template: ThumbnailTemplate;
  /** Primary text / claim */
  text: string;
  /** Face image for BigPromise template */
  faceImage?: string;
  /** Before state image for BeforeAfter template */
  beforeImage?: string;
  /** After state image for BeforeAfter template */
  afterImage?: string;
  /** Node labels for WorkflowDiagram template */
  diagramNodes?: string[];
  /** Content pillar (1-3) */
  pillar: 1 | 2 | 3;
}

// ── Component ───────────────────────────────────────────────

export const AIUThumbnail: React.FC = () => {
  const props = getInputProps() as unknown as AIUThumbnailInput;
  const { template, text, faceImage, beforeImage, afterImage, diagramNodes, pillar } = props;

  switch (template) {
    case 'big_promise':
      return (
        <BigPromise
          text={text}
          faceImage={faceImage}
          pillar={pillar}
        />
      );

    case 'before_after':
      return (
        <BeforeAfter
          text={text}
          beforeImage={beforeImage}
          afterImage={afterImage}
          pillar={pillar}
        />
      );

    case 'workflow_diagram':
      return (
        <WorkflowDiagram
          diagramNodes={diagramNodes ?? ['Step 1', 'Step 2', 'Step 3']}
          text={text}
          pillar={pillar}
        />
      );

    default: {
      // Fallback for unknown template — render an error card
      const _exhaustive: never = template;
      return (
        <AbsoluteFill
          style={{
            width: DIMENSIONS.thumbnail.width,
            height: DIMENSIONS.thumbnail.height,
            backgroundColor: COLORS.bg.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontFamily: FONT_FAMILY.display,
              fontSize: 32,
              color: COLORS.status.error,
            }}
          >
            Unknown template: {String(_exhaustive)}
          </div>
        </AbsoluteFill>
      );
    }
  }
};
