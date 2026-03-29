/**
 * SafeArea — Platform-safe margins wrapper
 */

import React from 'react';
import { AbsoluteFill } from 'remotion';

interface SafeAreaProps {
  children: React.ReactNode;
  /** Margin percentage (default: 5%) */
  margin?: number;
}

export const SafeArea: React.FC<SafeAreaProps> = ({ children, margin = 5 }) => {
  return (
    <AbsoluteFill
      style={{
        padding: `${margin}%`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
