#!/usr/bin/env tsx
/**
 * render — Render a composition from the video-production system
 *
 * Usage: npm run render -- <composition-id> [--preview] [--format landscape|vertical|square]
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

function main(): void {
  const args = process.argv.slice(2);
  const compId = args[0];
  const isPreview = args.includes('--preview');

  if (!compId) {
    console.error('Usage: npm run render -- <composition-id> [--preview] [--output path]');
    process.exit(1);
  }

  // Read workspace state for output path
  const currentFile = path.join(ROOT, 'workspace/current.json');
  const current = JSON.parse(fs.readFileSync(currentFile, 'utf-8'));

  const outputDir = isPreview
    ? path.join(ROOT, 'workspace/active/renders/preview')
    : path.join(ROOT, 'workspace/active/renders/final');

  fs.mkdirSync(outputDir, { recursive: true });

  const outputFile = path.join(outputDir, `${compId}.mp4`);

  const quality = isPreview ? '--quality 60' : '--codec h264 --crf 18 --pixel-format yuv420p';

  const cmd = `npx remotion render ${compId} "${outputFile}" ${quality}`;

  console.log(`\n  Rendering: ${compId}`);
  console.log(`  Output:    ${outputFile}`);
  console.log(`  Quality:   ${isPreview ? 'preview' : 'production'}\n`);

  try {
    execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
    console.log(`\n  Render complete: ${outputFile}`);
  } catch (error) {
    console.error('\n  Render failed!');
    process.exit(1);
  }
}

main();
