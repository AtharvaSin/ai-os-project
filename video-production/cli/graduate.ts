#!/usr/bin/env tsx
/**
 * graduate — Promote workspace components to common or project library
 *
 * Usage: npm run graduate -- <component-name> --to common|project [--category effects|typography|layout|data-viz|media]
 */

import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');

function main(): void {
  const args = process.argv.slice(2);
  const componentName = args[0];
  const toIdx = args.indexOf('--to');
  const categoryIdx = args.indexOf('--category');

  if (!componentName || toIdx < 0) {
    // List available components in workspace
    const componentsDir = path.join(ROOT, 'workspace/active/components');
    if (fs.existsSync(componentsDir)) {
      const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
      if (files.length > 0) {
        console.log('\n  Components in workspace:\n');
        files.forEach(f => console.log(`    - ${f.replace('.tsx', '')}`));
        console.log('\n  Usage: npm run graduate -- <name> --to common --category typography');
      } else {
        console.log('  No components in workspace/active/components/');
      }
    } else {
      console.log('  No active workspace.');
    }
    process.exit(0);
  }

  const destination = args[toIdx + 1]; // 'common' or 'project'
  const category = categoryIdx >= 0 ? args[categoryIdx + 1] : 'media';

  const sourceFile = path.join(ROOT, 'workspace/active/components', `${componentName}.tsx`);
  if (!fs.existsSync(sourceFile)) {
    console.error(`Component not found: ${sourceFile}`);
    process.exit(1);
  }

  let targetDir: string;
  if (destination === 'common') {
    targetDir = path.join(ROOT, 'src/common', category);
  } else {
    // Read current project from workspace state
    const current = JSON.parse(fs.readFileSync(path.join(ROOT, 'workspace/current.json'), 'utf-8'));
    if (!current.projectId) {
      console.error('No active project. Use --to common instead.');
      process.exit(1);
    }
    targetDir = path.join(ROOT, 'src/projects', current.projectId, 'components');
  }

  fs.mkdirSync(targetDir, { recursive: true });
  const targetFile = path.join(targetDir, `${componentName}.tsx`);

  fs.copyFileSync(sourceFile, targetFile);

  // Log graduation
  const logFile = path.join(ROOT, 'docs/GRADUATION_LOG.md');
  const entry = `\n- **${componentName}** → \`${destination}/${category}\` (${new Date().toISOString().split('T')[0]})\n`;

  if (fs.existsSync(logFile)) {
    fs.appendFileSync(logFile, entry);
  } else {
    fs.writeFileSync(logFile, `# Component Graduation Log\n${entry}`);
  }

  console.log(`\n  Graduated: ${componentName}`);
  console.log(`  From:      workspace/active/components/${componentName}.tsx`);
  console.log(`  To:        ${path.relative(ROOT, targetFile)}`);
  console.log(`  Logged to: docs/GRADUATION_LOG.md`);
}

main();
