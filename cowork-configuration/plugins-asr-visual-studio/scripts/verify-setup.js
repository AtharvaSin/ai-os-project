#!/usr/bin/env node
/**
 * ASR Visual Studio — Setup Verification
 *
 * Quick pre-flight check. Run this first to verify everything is ready.
 * Run: node scripts/verify-setup.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const engineDir = path.join(__dirname, '..', 'engine');
const DIVIDER = '─'.repeat(50);

console.log(`\n${DIVIDER}`);
console.log('  ASR Visual Studio — Setup Verification');
console.log(DIVIDER);

let issues = 0;

// 1. Node.js
console.log(`\n  Node.js:    ${process.version}`);
const major = parseInt(process.version.slice(1));
if (major < 18) { console.log('  ⚠  Node 18+ required'); issues++; }
else { console.log('  ✓  Version OK'); }

// 2. Chrome
const { findSystemChrome } = require(path.join(engineDir, 'renderer.js'));
const chrome = findSystemChrome();
if (chrome) {
  console.log(`\n  Chrome:     ${chrome}`);
  console.log('  ✓  Found — image rendering ready');
} else {
  console.log('\n  Chrome:     NOT FOUND');
  console.log('  ✗  Install Google Chrome or set CHROME_PATH');
  console.log('       Windows: Usually at C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
  console.log('       macOS:   Usually at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
  console.log('       Linux:   sudo apt install google-chrome-stable');
  issues++;
}

// 3. FFmpeg
try {
  const ffmpegVersion = execSync('ffmpeg -version', { encoding: 'utf8' }).split('\n')[0];
  console.log(`\n  FFmpeg:     ${ffmpegVersion}`);
  console.log('  ✓  Found — video rendering ready');
} catch {
  console.log('\n  FFmpeg:     NOT FOUND');
  console.log('  ⚠  Video rendering unavailable. Install:');
  console.log('       Windows: choco install ffmpeg  OR  winget install ffmpeg');
  console.log('       macOS:   brew install ffmpeg');
  console.log('       Linux:   sudo apt install ffmpeg');
  issues++;
}

// 4. Puppeteer
try {
  require.resolve('puppeteer');
  console.log('\n  Puppeteer:  Installed');
  console.log('  ✓  Ready');
} catch {
  console.log('\n  Puppeteer:  NOT installed');
  console.log('  ℹ  Will auto-install on first render (npm install puppeteer)');
}

// 5. Engine modules
console.log('');
const modules = ['renderer.js', 'video-renderer.js', 'mcp-bridge.js'];
for (const m of modules) {
  const p = path.join(engineDir, m);
  if (fs.existsSync(p)) {
    console.log(`  ✓  engine/${m}`);
  } else {
    console.log(`  ✗  engine/${m} — MISSING`);
    issues++;
  }
}

// 6. Skills
const skillsDir = path.join(__dirname, '..', 'skills');
const skills = ['create-image', 'create-video', 'create-social-pack'];
for (const s of skills) {
  const p = path.join(skillsDir, s, 'SKILL.md');
  if (fs.existsSync(p)) {
    console.log(`  ✓  skills/${s}/SKILL.md`);
  } else {
    console.log(`  ✗  skills/${s}/SKILL.md — MISSING`);
    issues++;
  }
}

// Summary
console.log(`\n${DIVIDER}`);
if (issues === 0) {
  console.log('  ✓  ALL CHECKS PASSED — Ready to render!');
  console.log('  Next: node scripts/test-suite.js');
} else {
  console.log(`  ⚠  ${issues} issue(s) found — see above for fixes`);
}
console.log(`${DIVIDER}\n`);
