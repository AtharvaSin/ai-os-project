#!/usr/bin/env node
/**
 * Bharatvarsh Post Renderer — Caption Formatter
 *
 * Generates platform-specific caption text files from post CSV data.
 *
 * Usage:
 *   node format_captions.js \
 *     --post-id "BHV-20260406-001" \
 *     --caption-text "Full caption body..." \
 *     --hook "Short hook line" \
 *     --hashtags "#Bharatvarsh #NoReligion ..." \
 *     --cta-link "https://welcometobharatvarsh.com" \
 *     --platforms "instagram,twitter,linkedin,facebook" \
 *     --scheduled-date "06-04-2026" \
 *     --scheduled-time "10:00" \
 *     --campaign "arc1-welcome-to-bharatvarsh" \
 *     --content-channel "declassified_report" \
 *     --lore-refs "Bible:World:ReligionBanned,Bible:Locations:..." \
 *     --output-dir "./output/"
 */

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i].replace(/^--/, '').replace(/-/g, '_');
    args[key] = argv[i + 1];
  }
  return args;
}

function formatInstagramCaption(data) {
  const { captionText, hashtags, ctaLink } = data;

  // Instagram: full caption, CTA with link-in-bio, dot separators, then hashtags
  return `${captionText}

\u{1F4D6} welcometobharatvarsh.com \u2014 link in bio.

\u00B7
\u00B7
\u00B7

${hashtags}`;
}

function formatTwitterCaption(data) {
  const { hook, hashtags, ctaLink } = data;

  // Twitter: max 280 chars. Use hook + 2-3 hashtags + link
  const hashtagList = hashtags.split(/\s+/).slice(0, 3).join(' ');

  // Build tweet and check length
  let tweet = `${hook}

${hashtagList}`;

  if (ctaLink) {
    tweet += `\n\n${ctaLink}`;
  }

  // Truncate if over 280
  if (tweet.length > 280) {
    const availableForHook = 280 - hashtagList.length - (ctaLink ? ctaLink.length + 4 : 0) - 4;
    const truncatedHook = hook.slice(0, availableForHook - 3) + '...';
    tweet = `${truncatedHook}

${hashtagList}`;
    if (ctaLink) tweet += `\n\n${ctaLink}`;
  }

  return tweet;
}

function formatLinkedInCaption(data) {
  const { captionText, hashtags, ctaLink } = data;

  // LinkedIn: full text, professional tone, 3-5 hashtags
  const hashtagList = hashtags.split(/\s+/).slice(0, 5).join(' ');

  return `${captionText}

${ctaLink ? ctaLink : ''}

${hashtagList}`;
}

function formatFacebookCaption(data) {
  const { captionText, hashtags, ctaLink } = data;

  // Facebook: conversational, fewer hashtags
  const hashtagList = hashtags.split(/\s+/).slice(0, 5).join(' ');

  return `${captionText}

${ctaLink ? `\u{1F517} ${ctaLink}` : ''}

${hashtagList}`;
}

function main() {
  const args = parseArgs();

  const postId = args.post_id || 'BHV-UNKNOWN';
  const captionText = args.caption_text || '';
  const hook = args.hook || captionText.slice(0, 120);
  const hashtags = args.hashtags || '';
  const ctaLink = args.cta_link || '';
  const platforms = (args.platforms || 'instagram').split(',').map(p => p.trim());
  const scheduledDate = args.scheduled_date || '';
  const scheduledTime = args.scheduled_time || '';
  const campaign = args.campaign || '';
  const contentChannel = args.content_channel || '';
  const loreRefs = args.lore_refs || '';
  const outputDir = args.output_dir || './output';

  fs.mkdirSync(outputDir, { recursive: true });

  const data = { captionText, hook, hashtags, ctaLink };

  const formatters = {
    instagram: formatInstagramCaption,
    twitter: formatTwitterCaption,
    linkedin: formatLinkedInCaption,
    facebook: formatFacebookCaption
  };

  const results = {};

  // Generate per-platform caption files
  for (const platform of platforms) {
    const formatter = formatters[platform];
    if (!formatter) {
      console.warn(`  Warning: No formatter for platform "${platform}", skipping`);
      continue;
    }

    const caption = formatter(data);
    const fileName = `${postId}_${platform}_caption.txt`;
    const filePath = path.join(outputDir, fileName);

    // Add metadata header
    const fullContent = `POST ID: ${postId}
CAMPAIGN: ${campaign}
PLATFORM: ${platform.charAt(0).toUpperCase() + platform.slice(1)}
CONTENT CHANNEL: ${contentChannel}
SCHEDULE: ${scheduledDate} · ${scheduledTime}
LORE REFS: ${loreRefs}
STATUS: RENDERED

${'='.repeat(52)}
${platform.toUpperCase()} CAPTION
${'='.repeat(52)}

${caption}

${'='.repeat(52)}
HOOK (first 125 chars)
${'='.repeat(52)}

${captionText.slice(0, 125)}...
`;

    fs.writeFileSync(filePath, fullContent);
    results[platform] = { path: filePath, charCount: caption.length };
    console.log(`  ✓ ${platform} caption: ${fileName} (${caption.length} chars)`);
  }

  // Generate combined file
  const combinedPath = path.join(outputDir, `${postId}_all_captions.txt`);
  let combined = `${'='.repeat(60)}
POST PACKAGE: ${postId}
CAMPAIGN: ${campaign}
GENERATED: ${new Date().toISOString()}
${'='.repeat(60)}

`;

  for (const platform of platforms) {
    if (!results[platform]) continue;
    const content = fs.readFileSync(results[platform].path, 'utf8');
    combined += `\n${'─'.repeat(60)}\n${platform.toUpperCase()}\n${'─'.repeat(60)}\n\n${content}\n`;
  }

  fs.writeFileSync(combinedPath, combined);
  console.log(`  ✓ Combined: ${postId}_all_captions.txt`);

  // Write summary JSON
  const summary = {
    postId,
    campaign,
    platforms: Object.fromEntries(
      Object.entries(results).map(([p, r]) => [p, { charCount: r.charCount }])
    )
  };
  fs.writeFileSync(
    path.join(outputDir, 'caption_summary.json'),
    JSON.stringify(summary, null, 2)
  );
}

main();
