#!/usr/bin/env node
/**
 * Bharatvarsh Content Pipeline — Post Distributor
 *
 * Distributes a single APPROVED post to its configured social channels.
 *   - Facebook: unpublished draft via Graph API (published=false)
 *   - Instagram: scheduled media container via Graph API (published=false)
 *   - Twitter/X: live tweet via OAuth 1.0a
 *
 * Usage:
 *   node distributor/distribute-post.js --post BHV-20260406-001
 *
 * Environment variables (set by the dashboard API route or loaded from .env.local):
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 *   META_PAGE_ACCESS_TOKEN  (used for both Facebook + Instagram — must have
 *                            pages_manage_posts + instagram_content_publish)
 *   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
 *
 * Output:
 *   All log lines are prefixed with [LOG] so the calling API route can
 *   identify the final JSON result line (the last non-empty line).
 *
 *   Final stdout line (no prefix): JSON {success, post_id, results}
 */

'use strict';

const crypto = require('crypto');
const https = require('https');
const http = require('http');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const { Pool } = require('pg');

// ─── Paths ───────────────────────────────────────────────────────────────────
// __dirname is distributor/ — go one level up for the pipeline root
const PIPELINE_ROOT = path.resolve(__dirname, '..');
const RENDERED_DIR = path.join(PIPELINE_ROOT, 'rendered');

// ─── CLI Args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const postFlag = args.indexOf('--post');
const POST_ID = postFlag !== -1 ? args[postFlag + 1] : null;

if (!POST_ID) {
  console.error('[LOG] Error: --post <post_id> argument is required.');
  process.exit(1);
}

// ─── Logging (prefix [LOG] so API route can strip log lines) ─────────────────
/**
 * Log a message to stderr (or stdout with [LOG] prefix).
 * The API route reads the LAST non-empty stdout line as the JSON result.
 * All other output uses [LOG] prefix so it can be skipped.
 * @param {string} level
 * @param {string} msg
 * @param {unknown} [data]
 */
function log(level, msg, data) {
  const ts = new Date().toISOString();
  const line = data
    ? `[LOG] [${ts}] [${level.toUpperCase()}] ${msg} ${JSON.stringify(data)}`
    : `[LOG] [${ts}] [${level.toUpperCase()}] ${msg}`;
  process.stdout.write(line + '\n');
}

// ─── HTTP helpers (node built-in — no axios/node-fetch needed) ──────────────
/**
 * Make an HTTPS/HTTP request and return parsed JSON.
 * @param {string} urlStr
 * @param {'GET'|'POST'|'DELETE'} method
 * @param {Record<string, string>} headers
 * @param {string|null} body
 * @returns {Promise<unknown>}
 */
function httpRequest(urlStr, method, headers, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const lib = url.protocol === 'https:' ? https : http;
    const bodyBuf = body ? Buffer.from(body, 'utf-8') : null;

    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        ...headers,
        ...(bodyBuf
          ? { 'Content-Length': String(bodyBuf.length) }
          : {}),
      },
    };

    const req = lib.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf-8');
        try {
          const parsed = JSON.parse(raw);
          if (res.statusCode && res.statusCode >= 400) {
            reject(
              new Error(
                `HTTP ${res.statusCode} from ${urlStr}: ${JSON.stringify(parsed)}`,
              ),
            );
          } else {
            resolve(parsed);
          }
        } catch {
          reject(new Error(`Non-JSON response from ${urlStr}: ${raw}`));
        }
      });
    });

    req.on('error', reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

// ─── OAuth 1.0a (mirrors x_twitter.py logic) ─────────────────────────────────
/**
 * Percent-encode a string per RFC 3986 (OAuth spec).
 * @param {string} s
 * @returns {string}
 */
function rfc3986Encode(s) {
  return encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
}

/**
 * Generate an OAuth 1.0a HMAC-SHA1 signature.
 * @param {'GET'|'POST'} method
 * @param {string} baseUrl - URL without query string
 * @param {Record<string, string>} allParams - OAuth params + any query/body params
 * @param {string} consumerSecret
 * @param {string} tokenSecret
 * @returns {string} Base64-encoded signature
 */
function buildOauthSignature(method, baseUrl, allParams, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(allParams)
    .sort()
    .map((k) => `${rfc3986Encode(k)}=${rfc3986Encode(allParams[k])}`)
    .join('&');

  const signingBase = [
    method.toUpperCase(),
    rfc3986Encode(baseUrl),
    rfc3986Encode(sortedParams),
  ].join('&');

  const signingKey = `${rfc3986Encode(consumerSecret)}&${rfc3986Encode(tokenSecret)}`;

  return crypto
    .createHmac('sha1', signingKey)
    .update(signingBase)
    .digest('base64');
}

/**
 * Build the Authorization header value for an OAuth 1.0a request.
 * @param {'GET'|'POST'} method
 * @param {string} url
 * @param {string} apiKey
 * @param {string} apiSecret
 * @param {string} accessToken
 * @param {string} accessTokenSecret
 * @returns {string} OAuth header string
 */
function buildOauthHeader(method, url, apiKey, apiSecret, accessToken, accessTokenSecret) {
  const oauthParams = {
    oauth_consumer_key: apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(Math.floor(Date.now() / 1000)),
    oauth_token: accessToken,
    oauth_version: '1.0',
  };

  const signature = buildOauthSignature(
    method,
    url,
    oauthParams,
    apiSecret,
    accessTokenSecret,
  );

  oauthParams['oauth_signature'] = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${rfc3986Encode(k)}="${rfc3986Encode(oauthParams[k])}"`)
    .join(', ');

  return `OAuth ${headerParts}`;
}

// ─── Meta Account ID Resolution ──────────────────────────────────────────────
/**
 * Resolve the Facebook Page ID and linked Instagram Business Account ID.
 * Uses GET /me?fields=id,name,instagram_business_account with the Page Access
 * Token — with a PAT, /me refers to the Page itself, so no /me/accounts needed.
 * @param {string} pageAccessToken  Page Access Token (not a User Access Token)
 * @returns {Promise<{ pageId: string; igAccountId: string | null }>}
 */
async function resolveMetaIds(pageAccessToken) {
  log('info', 'Resolving Meta Page ID via /me?fields=id,name,instagram_business_account...');
  const data = /** @type {any} */ (
    await httpRequest(
      `https://graph.facebook.com/v19.0/me?fields=id,name,instagram_business_account&access_token=${encodeURIComponent(pageAccessToken)}`,
      'GET',
      { 'Accept': 'application/json' },
      null,
    )
  );

  if (!data || !data.id) {
    throw new Error(
      `Failed to resolve Meta Page ID. Response: ${JSON.stringify(data)}`,
    );
  }

  const pageId = data.id;
  const igAccountId = data.instagram_business_account
    ? data.instagram_business_account.id
    : null;

  log('info', `Resolved Page ID: ${pageId} ("${data.name}"), IG Account ID: ${igAccountId ?? 'none'}`);
  return { pageId, igAccountId };
}

// ─── Channel Distributors ────────────────────────────────────────────────────
/**
 * Upload a PNG to GCS and return the public URL.
 * @param {string} localPath - Absolute path to the PNG file
 * @param {string} postId
 * @param {string} filename - e.g. 'instagram_1x1.png'
 * @param {string} bucketName
 * @returns {Promise<string>} Public GCS URL
 */
async function uploadToGcs(localPath, postId, filename, bucketName) {
  log('info', `Uploading ${filename} to GCS bucket ${bucketName}...`);
  const storage = new Storage();
  const bucket = storage.bucket(bucketName);
  const destination = `${postId}/${filename}`;

  await bucket.upload(localPath, {
    destination,
    metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' },
    // No per-object ACL — bucket uses uniform IAM (allUsers objectViewer)
  });

  const publicUrl = `https://storage.googleapis.com/${bucketName}/${destination}`;
  log('info', `GCS upload complete: ${publicUrl}`);
  return publicUrl;
}

/**
 * Distribute to Instagram via the Content Publishing API.
 * Instagram has no native API scheduling — posts go live immediately when
 * Distribute is clicked (you control timing by when you approve + distribute).
 * Flow: upload image to GCS → create media container → poll until FINISHED → publish.
 *
 * Uses META_PAGE_ACCESS_TOKEN (works for business-linked IG accounts).
 * Requires instagram_content_publish permission + app in live mode (or IG account whitelisted).
 *
 * @param {string} postId
 * @param {string} captionText
 * @param {string} igUserId   Instagram Business Account ID
 * @param {string} pageAccessToken  Page Access Token (must have instagram_content_publish)
 * @returns {Promise<{media_id: string, permalink: string, gcs_url: string}>}
 */
async function distributeToInstagram(postId, captionText, igUserId, pageAccessToken) {
  log('info', `[instagram] Starting distribution for ${postId}`);

  // 1. Locate rendered file
  const imagePath = path.join(RENDERED_DIR, postId, 'instagram_1x1.png');
  const fs = require('fs');
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Instagram render not found at: ${imagePath}`);
  }

  // 2. Upload to GCS
  const bucketName = process.env.GCS_BUCKET || 'bhv-content-assets';
  const gcsUrl = await uploadToGcs(imagePath, postId, 'instagram_1x1.png', bucketName);

  // 3. Create media container
  log('info', `[instagram] Creating media container for ${postId}...`);
  const containerBody = new URLSearchParams({
    image_url: gcsUrl,
    caption: captionText,
    access_token: pageAccessToken,
  }).toString();

  const containerResp = /** @type {any} */ (
    await httpRequest(
      `https://graph.facebook.com/v19.0/${igUserId}/media`,
      'POST',
      { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      containerBody,
    )
  );

  if (!containerResp.id) {
    throw new Error(`IG container creation failed: ${JSON.stringify(containerResp)}`);
  }

  const containerId = containerResp.id;
  log('info', `[instagram] Container created: ${containerId} — polling status...`);

  // 4. Poll container status until FINISHED (max 10 attempts, 3s apart)
  let attempts = 0;
  while (attempts < 10) {
    await new Promise((r) => setTimeout(r, 3000));
    const statusResp = /** @type {any} */ (
      await httpRequest(
        `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${encodeURIComponent(pageAccessToken)}`,
        'GET',
        { 'Accept': 'application/json' },
        null,
      )
    );
    log('info', `[instagram] Container status: ${statusResp.status_code} (attempt ${attempts + 1})`);
    if (statusResp.status_code === 'FINISHED') break;
    if (statusResp.status_code === 'ERROR') {
      throw new Error(`IG container processing failed: ${JSON.stringify(statusResp)}`);
    }
    attempts++;
  }

  // 5. Publish the container
  log('info', `[instagram] Publishing container ${containerId}...`);
  const publishBody = new URLSearchParams({
    creation_id: containerId,
    access_token: pageAccessToken,
  }).toString();

  const publishResp = /** @type {any} */ (
    await httpRequest(
      `https://graph.facebook.com/v19.0/${igUserId}/media_publish`,
      'POST',
      { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      publishBody,
    )
  );

  if (!publishResp.id) {
    throw new Error(`IG media_publish failed: ${JSON.stringify(publishResp)}`);
  }

  log('info', `[instagram] Published media ID: ${publishResp.id}`);
  return {
    media_id: publishResp.id,
    permalink: `https://www.instagram.com/p/${publishResp.id}/`,
    gcs_url: gcsUrl,
  };
}

/**
 * Distribute to Facebook as a scheduled photo post (20 days out).
 * Uploads the rendered facebook_1.91x1.png to GCS then uses the
 * Photos API (POST /{page-id}/photos) so the image is included.
 * Shows under the "Scheduled" tab in Meta Business Suite.
 * @param {string} postId
 * @param {string} captionText
 * @param {string} pageId
 * @param {string} pageAccessToken
 * @returns {Promise<{post_id: string, scheduled_at: string, gcs_url: string}>}
 */
async function distributeToFacebook(postId, captionText, pageId, pageAccessToken) {
  log('info', `[facebook] Starting distribution for ${postId}`);

  // Locate rendered file
  const fs = require('fs');
  const imagePath = path.join(RENDERED_DIR, postId, 'facebook_1.91x1.png');
  if (!fs.existsSync(imagePath)) {
    throw new Error(`Facebook render not found at: ${imagePath}`);
  }

  // Upload to GCS
  const bucketName = process.env.GCS_BUCKET || 'bhv-content-assets';
  const gcsUrl = await uploadToGcs(imagePath, postId, 'facebook_1.91x1.png', bucketName);

  // Schedule 20 days from now (page has ~29-day max scheduling limit)
  const scheduledEpoch = Math.floor(Date.now() / 1000) + 20 * 24 * 60 * 60;
  const scheduledAt = new Date(scheduledEpoch * 1000).toISOString();

  log('info', `[facebook] Uploading photo as unpublished object for ${postId}...`);

  // Step 1: Upload photo as unpublished (no caption, no schedule yet) — returns photo_id
  const uploadBody = new URLSearchParams({
    url: gcsUrl,
    published: 'false',
    access_token: pageAccessToken,
  }).toString();

  const uploadResp = /** @type {any} */ (
    await httpRequest(
      `https://graph.facebook.com/v19.0/${pageId}/photos`,
      'POST',
      { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      uploadBody,
    )
  );

  if (!uploadResp.id) {
    throw new Error(`Facebook photo upload failed: ${JSON.stringify(uploadResp)}`);
  }

  const photoId = uploadResp.id;
  log('info', `[facebook] Photo uploaded (id: ${photoId}), creating scheduled feed post at ${scheduledAt}...`);

  // Step 2: Create scheduled feed post with attached_media — this appears in Business Suite Scheduled tab
  const feedBody = new URLSearchParams({
    message: captionText,
    published: 'false',
    scheduled_publish_time: String(scheduledEpoch),
    attached_media: JSON.stringify([{ media_fbid: photoId }]),
    access_token: pageAccessToken,
  }).toString();

  const feedResp = /** @type {any} */ (
    await httpRequest(
      `https://graph.facebook.com/v19.0/${pageId}/feed`,
      'POST',
      { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
      feedBody,
    )
  );

  if (!feedResp.id) {
    throw new Error(`Facebook scheduled feed post failed: ${JSON.stringify(feedResp)}`);
  }

  log('info', `[facebook] Scheduled feed post created: ${feedResp.id}, publishes at ${scheduledAt}`);
  return {
    post_id: feedResp.id,
    scheduled_at: scheduledAt,
    gcs_url: gcsUrl,
  };
}

/**
 * Post a live tweet via OAuth 1.0a to Twitter API v2.
 * @param {string} postId
 * @param {string} captionText
 * @returns {Promise<{tweet_id: string, tweet_url: string}>}
 */
async function distributeToTwitter(postId, captionText) {
  log('info', `[twitter] Posting tweet for ${postId}...`);

  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error(
      'Twitter OAuth credentials not set. Required: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET',
    );
  }

  const tweetText = captionText.substring(0, 280);
  const tweetUrl = 'https://api.twitter.com/2/tweets';
  const jsonBody = JSON.stringify({ text: tweetText });

  const oauthHeader = buildOauthHeader(
    'POST',
    tweetUrl,
    apiKey,
    apiSecret,
    accessToken,
    accessTokenSecret,
  );

  const tweetResp = /** @type {any} */ (
    await httpRequest(
      tweetUrl,
      'POST',
      {
        'Authorization': oauthHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      jsonBody,
    )
  );

  const tweetId = tweetResp && tweetResp.data && tweetResp.data.id;
  if (!tweetId) {
    throw new Error(`Tweet failed: ${JSON.stringify(tweetResp)}`);
  }

  log('info', `[twitter] Tweet posted: ${tweetId}`);
  return {
    tweet_id: tweetId,
    tweet_url: `https://x.com/i/web/status/${tweetId}`,
  };
}

// ─── Database helpers ────────────────────────────────────────────────────────
/**
 * Build a pg Pool from environment variables.
 * Defaults to port 5434 for local dev (Docker compose exposes postgres there).
 * @returns {Pool}
 */
function createDbPool() {
  return new Pool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    database: process.env.DB_NAME || 'ai_os',
    user: process.env.DB_USER || 'ai_os_admin',
    password: process.env.DB_PASSWORD || '',
    ssl: false,
  });
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  log('info', `=== Bharatvarsh distribute-post.js — post: ${POST_ID} ===`);

  const pool = createDbPool();

  try {
    // 1. Fetch post from DB
    log('info', 'Fetching post from database...');
    const postResult = await pool.query(
      `SELECT post_id, status, channels, caption_text, source_image_path, render_manifest
       FROM content_posts
       WHERE post_id = $1`,
      [POST_ID],
    );

    if (postResult.rowCount === 0) {
      throw new Error(`Post not found: ${POST_ID}`);
    }

    const post = postResult.rows[0];
    log('info', `Post found: status=${post.status}, channels=${JSON.stringify(post.channels)}`);

    // 2. Validate
    if (post.status !== 'approved') {
      throw new Error(
        `Post ${POST_ID} is not in 'approved' status (current: ${post.status}). Distribution aborted.`,
      );
    }

    if (!post.source_image_path) {
      throw new Error(`Post ${POST_ID} has no source_image_path. Cannot distribute.`);
    }

    const manifest = post.render_manifest;
    if (!manifest || !manifest.renders || manifest.renders.length === 0) {
      throw new Error(`Post ${POST_ID} has no render manifest. Run render first.`);
    }

    const channels = Array.isArray(post.channels) ? post.channels : [];
    if (channels.length === 0) {
      throw new Error(`Post ${POST_ID} has no channels configured.`);
    }

    const captionText = post.caption_text || '';

    // 3. Resolve Meta account IDs (only if needed)
    let pageId = null;
    let igUserId = null;

    const needsMeta =
      channels.includes('facebook') || channels.includes('instagram');

    // Meta resolution — non-fatal: if it fails, Meta channels are marked skipped
    let metaResolutionError = null;
    if (needsMeta) {
      const pageToken = process.env.META_PAGE_ACCESS_TOKEN;

      if (!pageToken) {
        metaResolutionError = 'META_PAGE_ACCESS_TOKEN env var not set.';
        log('warn', metaResolutionError + ' Meta channels will be skipped.');
      } else {
        try {
          const metaIds = await resolveMetaIds(pageToken);
          pageId = metaIds.pageId;
          igUserId = metaIds.igAccountId;
        } catch (err) {
          metaResolutionError = `Failed to resolve Meta IDs: ${err.message}`;
          log('warn', metaResolutionError + ' Meta channels will be skipped.');
        }
      }
    }

    // 4. Distribute to each channel (errors per-channel don't stop others)
    const results = {};

    for (const channel of channels) {
      try {
        log('info', `Processing channel: ${channel}`);

        switch (channel) {
          case 'instagram': {
            if (metaResolutionError) {
              log('warn', `Skipping instagram — Meta not configured: ${metaResolutionError}`);
              results.instagram = { skipped: true, reason: metaResolutionError };
              break;
            }
            results.instagram = await distributeToInstagram(
              POST_ID,
              captionText,
              igUserId,
              process.env.META_PAGE_ACCESS_TOKEN,
            );
            break;
          }

          case 'facebook': {
            if (metaResolutionError) {
              log('warn', `Skipping facebook — Meta not configured: ${metaResolutionError}`);
              results.facebook = { skipped: true, reason: metaResolutionError };
              break;
            }
            results.facebook = await distributeToFacebook(
              POST_ID,
              captionText,
              pageId,
              process.env.META_PAGE_ACCESS_TOKEN,
            );
            break;
          }

          case 'twitter': {
            results.twitter = await distributeToTwitter(POST_ID, captionText);
            break;
          }

          default:
            log('warn', `Unknown channel "${channel}" — skipping.`);
        }
      } catch (channelErr) {
        log('error', `Channel ${channel} failed: ${channelErr.message}`);
        results[channel] = { error: channelErr.message };
      }
    }

    // 5. Update DB: status → scheduled, persist social_post_ids
    log('info', 'Updating database status to scheduled...');
    await pool.query(
      `UPDATE content_posts
       SET status = 'scheduled'::content_post_status,
           social_post_ids = $1::jsonb
       WHERE post_id = $2`,
      [JSON.stringify(results), POST_ID],
    );

    // 6. Insert pipeline audit log
    log('info', 'Inserting pipeline audit log entry...');
    await pool.query(
      `INSERT INTO content_pipeline_log
         (post_id, action, old_status, new_status, details, performed_by)
       VALUES ($1, $2, $3::content_post_status, $4::content_post_status, $5::jsonb, $6)`,
      [
        POST_ID,
        'distribute',
        'approved',
        'scheduled',
        JSON.stringify(results),
        'dashboard',
      ],
    );

    log('info', `Distribution complete for ${POST_ID}.`);

    // 7. Final JSON output — this must be the LAST line printed to stdout
    const output = {
      success: true,
      post_id: POST_ID,
      results,
    };

    process.stdout.write(JSON.stringify(output) + '\n');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  log('error', `Fatal error: ${err.message}`);
  // Still emit a structured JSON result so the API route gets a parseable response
  process.stdout.write(
    JSON.stringify({ success: false, post_id: POST_ID, error: err.message }) + '\n',
  );
  process.exit(1);
});
