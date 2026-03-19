#!/usr/bin/env node
/**
 * ASR Visual Studio — Video Rendering Engine
 *
 * Generates video content using:
 *  - FFmpeg for compositing, transitions, overlays, text animation
 *  - Canvas/Sharp frame-by-frame for animated graphics
 *  - Puppeteer screenshot sequences for HTML-animated content
 *
 * Designed for fire-and-forget operation. No Remotion dependency
 * (avoids heavy React scaffolding). Pure FFmpeg + frame generation.
 *
 * Usage:
 *   node video-renderer.js --type text-reveal --brand B --title "BHARATVARSH" --duration 10 --output ./output/
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');
const { BRAND_TOKENS, PRESETS, buildBrandedHTML, generateFontImports, findSystemChrome } = require('./renderer.js');

// ── Video Presets ────────────────────────────────────────────────────
const VIDEO_PRESETS = {
  landscape_16x9: { width: 1920, height: 1080, label: '16:9 Landscape (YouTube)' },
  portrait_9x16:  { width: 1080, height: 1920, label: '9:16 Portrait (Reels/Stories)' },
  square_1x1:     { width: 1080, height: 1080, label: '1:1 Square (Instagram Feed)' },
  cinematic:      { width: 1920, height: 817,  label: '2.35:1 Cinematic (Letterbox)' }
};

// ── Video Types ──────────────────────────────────────────────────────
const VIDEO_TYPES = {
  text_reveal: {
    description: 'Animated text reveal with brand styling',
    defaultDuration: 8,
    defaultFps: 30
  },
  ken_burns: {
    description: 'Slow zoom/pan on a static image with text overlay',
    defaultDuration: 10,
    defaultFps: 30
  },
  slideshow: {
    description: 'Multi-image slideshow with transitions',
    defaultDuration: 15,
    defaultFps: 30
  },
  title_card: {
    description: 'Simple branded title card with subtle animation',
    defaultDuration: 5,
    defaultFps: 30
  },
  promo_clip: {
    description: 'Promotional clip with text, images, and effects',
    defaultDuration: 15,
    defaultFps: 30
  }
};

// ── Check FFmpeg availability ────────────────────────────────────────
function checkFFmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

// ── Frame Generator: Text Reveal ─────────────────────────────────────
async function generateTextRevealFrames({ brandContext, title, subtitle, width, height, fps, duration, outputDir }) {
  const tokens = BRAND_TOKENS[brandContext];
  const totalFrames = fps * duration;
  const framesDir = path.join(outputDir, '_frames');
  fs.mkdirSync(framesDir, { recursive: true });

  let puppeteer;
  try { puppeteer = require('puppeteer'); }
  catch { execSync('npm install puppeteer', { stdio: 'inherit' }); puppeteer = require('puppeteer'); }

  const launchOpts = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };
  const systemChrome = findSystemChrome();
  if (systemChrome) launchOpts.executablePath = systemChrome;

  const browser = await puppeteer.launch(launchOpts);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    for (let frame = 0; frame < totalFrames; frame++) {
      const progress = frame / totalFrames;

      // Animation phases
      const titleOpacity = Math.min(1, progress * 4);        // Fade in 0-25%
      const titleY = Math.max(0, 30 * (1 - progress * 4));   // Slide up
      const subtitleOpacity = Math.max(0, Math.min(1, (progress - 0.3) * 4)); // Fade in 30-55%
      const barWidth = Math.min(80, progress * 200);          // Accent bar grows
      const grainSeed = frame; // Animate grain

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        ${generateFontImports(brandContext)}
        * { margin:0; padding:0; box-sizing:border-box; }
        body { width:${width}px; height:${height}px; overflow:hidden;
               font-family:${tokens.fontPrimary}; background:${tokens.bgGradient};
               color:${tokens.textColor}; display:flex; align-items:center; justify-content:center; }
        .center { text-align:center; padding:60px; }
        .bar { width:${barWidth}px; height:4px; background:${tokens.accentColor};
               margin:0 auto 30px; border-radius:2px; transition:none; }
        .title { font-size:${Math.round(width * 0.06)}px; font-weight:800; line-height:1.1;
                 opacity:${titleOpacity}; transform:translateY(${titleY}px);
                 ${tokens.effects.letterSpacing ? `letter-spacing:${tokens.effects.letterSpacing}; text-transform:uppercase;` : ''} }
        .subtitle { font-size:${Math.round(width * 0.025)}px; font-weight:400; margin-top:20px;
                    opacity:${subtitleOpacity}; color:${tokens.textMuted}; }
        ${tokens.effects.glow ? `.title { text-shadow: 0 0 30px ${tokens.accentColor}40; }` : ''}
      </style></head><body>
        <div class="center">
          <div class="bar"></div>
          <div class="title">${title}</div>
          ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        </div>
        ${tokens.effects.grain ? `<div style="position:absolute;inset:0;z-index:99;pointer-events:none;opacity:${tokens.effects.grainOpacity || 0.08};mix-blend-mode:overlay;">
          <svg width="100%" height="100%"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="${grainSeed}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg>
        </div>` : ''}
        ${tokens.effects.vignette ? `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);pointer-events:none;z-index:98;"></div>` : ''}
      </body></html>`;

      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      if (frame === 0) {
        await page.evaluate(() => document.fonts.ready);
        await new Promise(r => setTimeout(r, 500));
      }
      const framePath = path.join(framesDir, `frame_${String(frame).padStart(5, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });

      if (frame % 30 === 0) console.log(`  Frame ${frame}/${totalFrames} (${Math.round(progress * 100)}%)`);
    }

    return framesDir;
  } finally {
    await browser.close();
  }
}

// ── Frame Generator: Ken Burns (zoom/pan on image) ───────────────────
async function generateKenBurnsFrames({ brandContext, imagePath, title, width, height, fps, duration, outputDir }) {
  const tokens = BRAND_TOKENS[brandContext];
  const totalFrames = fps * duration;
  const framesDir = path.join(outputDir, '_frames');
  fs.mkdirSync(framesDir, { recursive: true });

  let puppeteer;
  try { puppeteer = require('puppeteer'); }
  catch { execSync('npm install puppeteer', { stdio: 'inherit' }); puppeteer = require('puppeteer'); }

  const launchOpts = {
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  };
  const systemChrome = findSystemChrome();
  if (systemChrome) launchOpts.executablePath = systemChrome;

  const browser = await puppeteer.launch(launchOpts);

  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });

    // Convert image to data URL if local file
    let imgSrc = imagePath;
    if (fs.existsSync(imagePath)) {
      const buf = fs.readFileSync(imagePath);
      const ext = path.extname(imagePath).slice(1);
      imgSrc = `data:image/${ext};base64,${buf.toString('base64')}`;
    }

    for (let frame = 0; frame < totalFrames; frame++) {
      const progress = frame / totalFrames;
      const scale = 1.0 + (progress * 0.15); // Slow zoom from 100% to 115%
      const panX = progress * -20; // Slow pan left
      const titleOpacity = progress > 0.2 ? Math.min(1, (progress - 0.2) * 3) : 0;

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
        ${generateFontImports(brandContext)}
        * { margin:0; padding:0; box-sizing:border-box; }
        body { width:${width}px; height:${height}px; overflow:hidden; position:relative; background:#000; }
        .bg { position:absolute; inset:-10%; width:120%; height:120%;
              background-image:url('${imgSrc}'); background-size:cover; background-position:center;
              transform:scale(${scale}) translateX(${panX}px); }
        .overlay { position:absolute; inset:0; background:linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.85) 100%); z-index:1; }
        .content { position:absolute; bottom:60px; left:60px; z-index:2; opacity:${titleOpacity}; }
        .title { font-family:${tokens.fontPrimary}; font-size:${Math.round(width * 0.045)}px; font-weight:800;
                 color:${tokens.textColor}; ${tokens.effects.letterSpacing ? `letter-spacing:${tokens.effects.letterSpacing}; text-transform:uppercase;` : ''} }
        .bar { width:60px; height:3px; background:${tokens.accentColor}; margin-bottom:20px; }
      </style></head><body>
        <div class="bg"></div>
        <div class="overlay"></div>
        <div class="content"><div class="bar"></div><div class="title">${title || ''}</div></div>
        ${tokens.effects.grain ? `<div style="position:absolute;inset:0;z-index:99;pointer-events:none;opacity:${tokens.effects.grainOpacity || 0.08};mix-blend-mode:overlay;"><svg width="100%" height="100%"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" seed="${frame}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#g)"/></svg></div>` : ''}
        ${tokens.effects.vignette ? `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.6) 100%);z-index:98;"></div>` : ''}
      </body></html>`;

      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      if (frame === 0) {
        await page.evaluate(() => document.fonts.ready);
        await new Promise(r => setTimeout(r, 800));
      }
      const framePath = path.join(framesDir, `frame_${String(frame).padStart(5, '0')}.png`);
      await page.screenshot({ path: framePath, type: 'png' });
      if (frame % 30 === 0) console.log(`  Frame ${frame}/${totalFrames} (${Math.round(progress * 100)}%)`);
    }

    return framesDir;
  } finally {
    await browser.close();
  }
}

// ── FFmpeg Frames-to-Video Assembly ──────────────────────────────────
function assembleVideo(framesDir, outputPath, { fps = 30, codec = 'libx264', quality = 23 }) {
  const cmd = `ffmpeg -y -framerate ${fps} -i "${framesDir}/frame_%05d.png" -c:v ${codec} -pix_fmt yuv420p -crf ${quality} -preset medium "${outputPath}"`;
  console.log(`  Assembling video: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
  const stats = fs.statSync(outputPath);
  return { success: true, path: outputPath, size: stats.size };
}

// ── FFmpeg Ken Burns (single-command, faster) ────────────────────────
function ffmpegKenBurns(imagePath, outputPath, { width, height, duration, fps = 30 }) {
  const cmd = `ffmpeg -y -loop 1 -i "${imagePath}" -vf "scale=8000:-1,zoompan=z='min(zoom+0.001,1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${duration * fps}:s=${width}x${height}:fps=${fps}" -c:v libx264 -t ${duration} -pix_fmt yuv420p "${outputPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  return { success: true, path: outputPath, size: fs.statSync(outputPath).size };
}

// ── Add Text Overlay via FFmpeg ──────────────────────────────────────
function addTextOverlay(inputPath, outputPath, { text, fontFile, fontSize, fontColor, x, y, fadeIn = 0, fadeOut = 0 }) {
  let drawtext = `drawtext=text='${text.replace(/'/g, "'\\''")}':fontsize=${fontSize}:fontcolor=${fontColor}:x=${x}:y=${y}`;
  if (fontFile) drawtext += `:fontfile='${fontFile}'`;
  if (fadeIn > 0) drawtext += `:alpha='if(lt(t,${fadeIn}),t/${fadeIn},1)'`;

  const cmd = `ffmpeg -y -i "${inputPath}" -vf "${drawtext}" -c:v libx264 -crf 23 -pix_fmt yuv420p "${outputPath}"`;
  execSync(cmd, { stdio: 'inherit' });
  return { success: true, path: outputPath, size: fs.statSync(outputPath).size };
}

// ── Cleanup Frames ───────────────────────────────────────────────────
function cleanupFrames(framesDir) {
  if (fs.existsSync(framesDir)) {
    fs.rmSync(framesDir, { recursive: true, force: true });
  }
}

// ── Exports ──────────────────────────────────────────────────────────
module.exports = {
  VIDEO_PRESETS,
  VIDEO_TYPES,
  checkFFmpeg,
  generateTextRevealFrames,
  generateKenBurnsFrames,
  assembleVideo,
  ffmpegKenBurns,
  addTextOverlay,
  cleanupFrames
};

if (require.main === module) {
  console.log('ASR Visual Studio — Video Renderer v1.0');
  console.log('FFmpeg available:', checkFFmpeg());
  console.log('Video types:', Object.keys(VIDEO_TYPES).join(', '));
  console.log('Video presets:', Object.keys(VIDEO_PRESETS).join(', '));
}
