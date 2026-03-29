#!/usr/bin/env tsx
/**
 * new-video — Initialize a new video workspace
 *
 * Usage: npm run new-video -- --project bharatvarsh --id bhv-reel-001
 *        npm run new-video -- --new-project
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const WORKSPACE = path.join(ROOT, 'workspace');
const CURRENT_FILE = path.join(WORKSPACE, 'current.json');

interface WorkspaceState {
  status: string;
  projectId: string | null;
  videoId: string | null;
  phase: string | null;
  startedAt: string | null;
}

function readCurrentState(): WorkspaceState {
  const raw = fs.readFileSync(CURRENT_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeCurrentState(state: WorkspaceState): void {
  fs.writeFileSync(CURRENT_FILE, JSON.stringify(state, null, 2));
}

function ensureDirectories(): void {
  const dirs = [
    'workspace/active/assets/images',
    'workspace/active/assets/audio',
    'workspace/active/components',
    'workspace/active/renders/preview',
    'workspace/active/renders/final',
  ];
  for (const dir of dirs) {
    fs.mkdirSync(path.join(ROOT, dir), { recursive: true });
  }
}

function main(): void {
  const args = process.argv.slice(2);
  const projectIdx = args.indexOf('--project');
  const idIdx = args.indexOf('--id');
  const isNewProject = args.includes('--new-project');

  if (isNewProject) {
    console.log('To create a new project:');
    console.log('1. Copy projects/_template/project.yaml to projects/{your-id}/project.yaml');
    console.log('2. Fill in your brand details');
    console.log('3. Create src/projects/{your-id}/ with tokens.ts and overrides.ts');
    console.log('4. Run this command again with --project {your-id}');
    process.exit(0);
  }

  const projectId = projectIdx >= 0 ? args[projectIdx + 1] : null;
  const videoId = idIdx >= 0 ? args[idIdx + 1] : null;

  if (!projectId) {
    console.error('Usage: npm run new-video -- --project <project-id> [--id <video-id>]');
    console.error('Available projects:');
    const projectsDir = path.join(ROOT, 'projects');
    const dirs = fs.readdirSync(projectsDir).filter(
      d => d !== '_template' && fs.existsSync(path.join(projectsDir, d, 'project.yaml'))
    );
    dirs.forEach(d => console.error(`  - ${d}`));
    process.exit(1);
  }

  // Check project exists
  const projectYaml = path.join(ROOT, 'projects', projectId, 'project.yaml');
  if (!fs.existsSync(projectYaml)) {
    console.error(`Project "${projectId}" not found. Expected: ${projectYaml}`);
    process.exit(1);
  }

  // Check for active video
  const current = readCurrentState();
  if (current.status === 'active') {
    console.error(`Active video exists: ${current.projectId}/${current.videoId} (phase: ${current.phase})`);
    console.error('Archive it first, or use --force to override.');
    if (!args.includes('--force')) process.exit(1);
  }

  // Generate video ID if not provided
  const finalVideoId = videoId || `${projectId}-${Date.now()}`;

  // Initialize workspace
  ensureDirectories();

  // Write brief template
  const briefPath = path.join(ROOT, 'workspace/active/brief.md');
  if (!fs.existsSync(briefPath)) {
    fs.writeFileSync(briefPath, `# Video Brief\n\n**Project:** ${projectId}\n**Video ID:** ${finalVideoId}\n**Date:** ${new Date().toISOString().split('T')[0]}\n\n## Topic\n\n\n## Visual Requirements\n\n\n## Audio Requirements\n\n\n## Notes\n\n`);
  }

  // Write asset manifest
  const manifestPath = path.join(ROOT, 'workspace/active/assets/manifest.json');
  if (!fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, JSON.stringify({ videoId: finalVideoId, projectId, assets: [] }, null, 2));
  }

  // Update workspace state
  writeCurrentState({
    status: 'active',
    projectId,
    videoId: finalVideoId,
    phase: 'brief',
    startedAt: new Date().toISOString(),
  });

  console.log(`\n  Video workspace initialized!\n`);
  console.log(`  Project:  ${projectId}`);
  console.log(`  Video ID: ${finalVideoId}`);
  console.log(`  Phase:    brief`);
  console.log(`\n  Next steps:`);
  console.log(`  1. Edit workspace/active/brief.md`);
  console.log(`  2. Add assets to workspace/active/assets/`);
  console.log(`  3. Build compositions in workspace/active/components/`);
  console.log(`  4. Run npm run dev to preview`);
}

main();
