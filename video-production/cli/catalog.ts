#!/usr/bin/env tsx
/**
 * catalog — List all components and compositions in the video-production system
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

function listFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(fullPath, ext));
    } else if (entry.name.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  return files;
}

function main(): void {
  console.log('\n  === VIDEO PRODUCTION SYSTEM — COMPONENT CATALOG ===\n');

  // Common library
  console.log('  COMMON LIBRARY (src/common/)');
  console.log('  ─────────────────────────────');
  const categories = ['animations', 'effects', 'transitions', 'typography', 'layout', 'data-viz', 'media'];
  for (const cat of categories) {
    const dir = path.join(ROOT, 'src/common', cat);
    const files = listFiles(dir, '.tsx');
    if (files.length > 0) {
      console.log(`\n  ${cat}/`);
      files.forEach(f => {
        const name = path.basename(f, '.tsx');
        console.log(`    - ${name}`);
      });
    }
  }

  // Projects
  const projectsDir = path.join(ROOT, 'src/projects');
  if (fs.existsSync(projectsDir)) {
    const projects = fs.readdirSync(projectsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const proj of projects) {
      const projDir = path.join(projectsDir, proj);
      const components = listFiles(projDir, '.tsx');
      if (components.length > 0) {
        console.log(`\n  PROJECT: ${proj.toUpperCase()} (src/projects/${proj}/)`);
        console.log('  ─────────────────────────────');
        components.forEach(f => {
          const rel = path.relative(projDir, f);
          const name = path.basename(f, '.tsx');
          const dir = path.dirname(rel);
          console.log(`    ${dir !== '.' ? dir + '/' : ''}${name}`);
        });
      }
    }
  }

  // Workspace
  const wsDir = path.join(ROOT, 'workspace/active/components');
  const wsFiles = listFiles(wsDir, '.tsx');
  if (wsFiles.length > 0) {
    console.log('\n  WORKSPACE (workspace/active/components/)');
    console.log('  ─────────────────────────────');
    wsFiles.forEach(f => console.log(`    - ${path.basename(f, '.tsx')}`));
  }

  // Total count
  const allCommon = categories.flatMap(c => listFiles(path.join(ROOT, 'src/common', c), '.tsx'));
  console.log(`\n  Total: ${allCommon.length} common + ${listFiles(projectsDir, '.tsx').length} project-specific`);
  console.log('');
}

main();
