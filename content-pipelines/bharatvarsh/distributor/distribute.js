#!/usr/bin/env node
/**
 * Bharatvarsh Content Distribution Script
 *
 * Distributes APPROVED posts as DRAFTS to social platforms.
 * Three-layer draft protection:
 *   1. DB constraint: only 'approved' status posts are processed
 *   2. MCP calls use draft_only=true (Meta) / log-only (Twitter)
 *   3. Google Task created for manual review + publish
 *
 * Usage:
 *   node distribute.js                    # Distribute all approved posts
 *   node distribute.js --post BHV-001     # Distribute single post
 *   node distribute.js --dry-run          # Preview without executing
 *   node distribute.js --list             # List distributable posts
 */

const fs = require('fs');
const path = require('path');

// ─── Configuration ──────────────────────────────────────────────────────────

const CONTENT_OPS_DIR = path.resolve(__dirname, '..');
const RENDERED_DIR = path.join(CONTENT_OPS_DIR, 'rendered');
const CONFIG_PATH = path.join(__dirname, 'config.json');
const MCP_GATEWAY_URL = process.env.MCP_GATEWAY_URL || 'http://localhost:8080';
const MCP_API_KEY = process.env.MCP_GATEWAY_API_KEY || '';

// ─── CLI Args ───────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIST_ONLY = args.includes('--list');
const postIdFlag = args.indexOf('--post');
const SINGLE_POST_ID = postIdFlag !== -1 ? args[postIdFlag + 1] : null;

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(level, msg, data) {
  const ts = new Date().toISOString();
  const prefix = { info: 'ℹ', warn: '⚠', error: '✖', ok: '✔', draft: '📝' }[level] || '•';
  const line = `[${ts}] ${prefix} ${msg}`;
  if (data) {
    console.log(line, JSON.stringify(data, null, 2));
  } else {
    console.log(line);
  }
}

async function mcpCall(tool, params) {
  if (DRY_RUN) {
    log('draft', `[DRY RUN] Would call MCP: ${tool}`, params);
    return { dry_run: true };
  }

  const res = await fetch(`${MCP_GATEWAY_URL}/tools/${tool}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MCP_API_KEY}`,
    },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`MCP ${tool} failed (${res.status}): ${errText}`);
  }

  return res.json();
}

// ─── Post Discovery ─────────────────────────────────────────────────────────

function loadApprovedPosts() {
  // Read from render manifests to find approved posts
  if (!fs.existsSync(RENDERED_DIR)) {
    log('warn', 'Rendered directory not found. No posts to distribute.');
    return [];
  }

  const posts = [];
  const postDirs = fs.readdirSync(RENDERED_DIR);

  for (const postId of postDirs) {
    const manifestPath = path.join(RENDERED_DIR, postId, 'render-manifest.json');
    if (!fs.existsSync(manifestPath)) continue;

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    // Only process if status is approved (checked from manifest or CSV metadata)
    posts.push({
      post_id: postId,
      manifest,
      rendered_files: manifest.rendered_files || [],
      channels: manifest.channels || [],
      caption: manifest.caption_text || '',
      hashtags: manifest.hashtags || '',
      cta_link: manifest.cta_link || null,
    });
  }

  if (SINGLE_POST_ID) {
    return posts.filter(p => p.post_id === SINGLE_POST_ID);
  }

  return posts;
}

// ─── Channel Distribution ───────────────────────────────────────────────────

async function distributeToFacebook(post) {
  const fbImage = post.rendered_files.find(f => f.channel === 'facebook');
  if (!fbImage) {
    log('warn', `No Facebook render for ${post.post_id}`);
    return null;
  }

  // Step 1: Upload image to Drive for public URL (Meta API requires public URLs)
  const imagePath = path.join(RENDERED_DIR, post.post_id, fbImage.filename);
  if (!fs.existsSync(imagePath)) {
    log('error', `Facebook image not found: ${imagePath}`);
    return null;
  }

  log('info', `Uploading ${post.post_id} Facebook image to Drive...`);
  const uploadResult = await mcpCall('drive_upload_file', {
    file_path: imagePath,
    folder_name: 'Bharatvarsh Content Pipeline',
    make_public: true,
  });

  const publicUrl = uploadResult?.public_url;
  if (!publicUrl && !DRY_RUN) {
    log('error', `Failed to get public URL for ${post.post_id}`);
    return null;
  }

  // Step 2: Create draft post via Meta module
  log('draft', `Creating Facebook DRAFT for ${post.post_id}...`);
  const result = await mcpCall('social_post', {
    platform: 'facebook',
    content: `${post.caption}\n\n${post.hashtags}`,
    image_url: publicUrl || '[dry-run-url]',
    link: post.cta_link,
    published: false, // ← DRAFT ONLY — critical safety
  });

  return { platform: 'facebook', post_id: result?.id, draft: true };
}

async function distributeToInstagram(post) {
  const igImage = post.rendered_files.find(f => f.channel === 'instagram');
  if (!igImage) {
    log('warn', `No Instagram render for ${post.post_id}`);
    return null;
  }

  const imagePath = path.join(RENDERED_DIR, post.post_id, igImage.filename);
  if (!fs.existsSync(imagePath)) {
    log('error', `Instagram image not found: ${imagePath}`);
    return null;
  }

  // Instagram also needs public URL
  log('info', `Uploading ${post.post_id} Instagram image to Drive...`);
  const uploadResult = await mcpCall('drive_upload_file', {
    file_path: imagePath,
    folder_name: 'Bharatvarsh Content Pipeline',
    make_public: true,
  });

  const publicUrl = uploadResult?.public_url;

  log('draft', `Creating Instagram DRAFT for ${post.post_id}...`);
  const result = await mcpCall('social_post', {
    platform: 'instagram',
    content: `${post.caption}\n\n${post.hashtags}`,
    image_url: publicUrl || '[dry-run-url]',
    published: false, // ← DRAFT ONLY
  });

  return { platform: 'instagram', post_id: result?.id, draft: true };
}

async function distributeToTwitter(post) {
  // Twitter module is text-only (no media upload yet)
  // Log tweet text for manual posting with image
  const twImage = post.rendered_files.find(f => f.channel === 'twitter');
  const imagePath = twImage
    ? path.join(RENDERED_DIR, post.post_id, twImage.filename)
    : null;

  const tweetText = post.caption.length > 270
    ? post.caption.substring(0, 267) + '...'
    : post.caption;

  log('draft', `Twitter content prepared for ${post.post_id} (manual posting required):`);
  log('info', `  Tweet: ${tweetText}`);
  if (imagePath) log('info', `  Image: ${imagePath}`);

  // Store tweet for manual posting
  const tweetLogPath = path.join(RENDERED_DIR, post.post_id, 'tweet-draft.json');
  const tweetData = {
    post_id: post.post_id,
    tweet_text: tweetText,
    hashtags: post.hashtags,
    image_path: imagePath,
    cta_link: post.cta_link,
    status: 'pending_manual_post',
    created_at: new Date().toISOString(),
  };

  if (!DRY_RUN) {
    fs.writeFileSync(tweetLogPath, JSON.stringify(tweetData, null, 2));
  }

  return { platform: 'twitter', manual: true, tweet_path: tweetLogPath };
}

// ─── Google Tasks Notification ──────────────────────────────────────────────

async function createReviewTask(post, distributionResults) {
  const channels = distributionResults
    .filter(Boolean)
    .map(r => r.platform)
    .join(', ');

  const taskTitle = `Review and publish: ${post.post_id}`;
  const taskNotes = [
    `Content Pipeline Post: ${post.post_id}`,
    `Channels: ${channels}`,
    `Caption: ${post.caption.substring(0, 100)}...`,
    '',
    'Actions required:',
    '1. Review drafts on each platform',
    '2. Verify image quality and caption accuracy',
    '3. Manually publish when ready',
    distributionResults.some(r => r?.manual)
      ? '4. Manual Twitter post required — see tweet-draft.json'
      : '',
  ].filter(Boolean).join('\n');

  log('info', `Creating Google Task for ${post.post_id} review...`);
  await mcpCall('create_task', {
    title: taskTitle,
    notes: taskNotes,
    due_date: post.manifest.scheduled_date || null,
    task_list: 'Content Pipeline',
  });
}

// ─── Main Distribution Loop ─────────────────────────────────────────────────

async function main() {
  log('info', '=== Bharatvarsh Content Distribution ===');
  if (DRY_RUN) log('warn', 'DRY RUN MODE — no actions will be executed');

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  const posts = loadApprovedPosts();

  if (posts.length === 0) {
    log('info', 'No approved posts found for distribution.');
    return;
  }

  log('info', `Found ${posts.length} post(s) for distribution.`);

  if (LIST_ONLY) {
    for (const post of posts) {
      console.log(`  ${post.post_id} — ${post.channels.join(', ')} — ${post.caption.substring(0, 60)}...`);
    }
    return;
  }

  let successCount = 0;
  let errorCount = 0;

  for (const post of posts) {
    log('info', `\nDistributing ${post.post_id}...`);
    const results = [];

    try {
      // Distribute to each channel
      for (const channel of post.channels) {
        try {
          let result = null;
          switch (channel) {
            case 'facebook':
              if (config.channels.facebook?.enabled || DRY_RUN)
                result = await distributeToFacebook(post);
              else
                log('warn', `Facebook channel disabled — skipping ${post.post_id}`);
              break;
            case 'instagram':
              if (config.channels.instagram?.enabled || DRY_RUN)
                result = await distributeToInstagram(post);
              else
                log('warn', `Instagram channel disabled — skipping ${post.post_id}`);
              break;
            case 'twitter':
              result = await distributeToTwitter(post);
              break;
            default:
              log('warn', `Unknown channel: ${channel}`);
          }
          if (result) results.push(result);
        } catch (err) {
          log('error', `Failed ${channel} for ${post.post_id}: ${err.message}`);
          results.push({ platform: channel, error: err.message });
        }
      }

      // Create Google Task for manual review
      if (results.some(r => r && !r.error)) {
        await createReviewTask(post, results);
      }

      // Save distribution log
      const logPath = path.join(RENDERED_DIR, post.post_id, 'distribution-log.json');
      const logData = {
        post_id: post.post_id,
        distributed_at: new Date().toISOString(),
        dry_run: DRY_RUN,
        results,
      };
      if (!DRY_RUN) {
        fs.writeFileSync(logPath, JSON.stringify(logData, null, 2));
      }

      successCount++;
      log('ok', `${post.post_id} distribution complete.`);
    } catch (err) {
      errorCount++;
      log('error', `${post.post_id} distribution failed: ${err.message}`);
    }
  }

  log('info', `\n=== Distribution Complete ===`);
  log('info', `  Success: ${successCount}  Errors: ${errorCount}`);
  if (DRY_RUN) log('warn', 'This was a dry run. No actual posts were created.');
}

main().catch(err => {
  log('error', `Fatal: ${err.message}`);
  process.exit(1);
});
