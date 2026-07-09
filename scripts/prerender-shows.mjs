#!/usr/bin/env node
/**
 * Prerender show/episode HTML stubs for social share previews.
 *
 * After the vite-react-ssg build, this script:
 *   1. Reads public/shows.json (35 shows)
 *   2. Fetches each show's RSS feed (no CORS in Node)
 *   3. Extracts show artwork + description from <itunes:image> / <description>
 *   4. Generates minimal HTML per route with correct OG/Twitter meta tags
 *
 * Files generated:
 *   dist/podcast/{slug}/index.html          — show page (show artwork)
 *   dist/podcast/{slug}/episode/            — catch-all redirects to show page
 *
 * The HTML is a minimal stub that loads the same JS bundle so React
 * hydrates the SPA normally. Only the <head> meta tags differ.
 *
 * Episode routes get the same show artwork (no per-episode pre-render).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SITE_URL = 'https://goodmorningbitcoin.com';

// ─── Helpers ──────────────────────────────────────────────

function slugify(title) {
  return title.toLowerCase().replace(/\s+/g, '-');
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  return String(str ?? '').replace(/"/g, '&quot;');
}

function stripHtml(str) {
  return String(str ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(str, max = 160) {
  const s = String(str ?? '');
  if (s.length <= max) return s;
  return s.substring(0, max - 3).trimEnd() + '...';
}

// ─── RSS fetch ────────────────────────────────────────────

async function fetchWithTimeout(url, ms = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'GoodMorningBitcoin-Prerender/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function parseShowArtwork(xml) {
  // Channel-level <itunes:image href="...">
  const channelMatch = xml.match(/<channel[\s\S]*?<itunes:image\s+href="([^"]+)"/i);
  if (channelMatch) return channelMatch[1];

  // Fallback: <image><url>...</url></image>
  const urlMatch = xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i);
  if (urlMatch) return urlMatch[1].trim();

  return null;
}

function parseShowDescription(xml) {
  // <itunes:summary> is usually the best
  const summaryMatch = xml.match(/<channel[\s\S]*?<itunes:summary>([\s\S]*?)<\/itunes:summary>/i);
  if (summaryMatch) return stripHtml(summaryMatch[1]);

  const descMatch = xml.match(/<channel[\s\S]*?<description>([\s\S]*?)<\/description>/i);
  if (descMatch) return stripHtml(descMatch[1]);

  return '';
}

function parseEpisodes(xml) {
  const episodes = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const item = match[1];
    const guidMatch = item.match(/<guid[^>]*>([^<]+)<\/guid>/i);
    const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/i);
    const guid = guidMatch ? guidMatch[1].trim() : null;
    const title = titleMatch ? stripHtml(titleMatch[1]) : null;
    if (guid && title) {
      episodes.push({ guid, title });
    }
  }
  return episodes;
}

// ─── HTML stub generation ─────────────────────────────────

function findJsAndCss() {
  const assetsDir = join(DIST, 'assets');
  if (!existsSync(assetsDir)) {
    throw new Error('dist/assets not found — run the build first');
  }
  let jsFile = null, cssFile = null;
  for (const f of readdirSync(assetsDir)) {
    if (f.endsWith('.js') && f.startsWith('app-')) jsFile = `/assets/${f}`;
    if (f.endsWith('.css') && f.startsWith('app-')) cssFile = `/assets/${f}`;
  }
  if (!jsFile) throw new Error('Could not find main JS bundle in dist/assets');
  return { jsFile, cssFile };
}

function generateHtml({ title, description, image, url, jsFile, cssFile }) {
  const ogImage = image || `${SITE_URL}/assets/img/og-default.jpg`;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeAttr(description);
  const safeUrl = escapeAttr(url);
  const safeImage = escapeAttr(ogImage);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="content-security-policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src 'self' https:; font-src 'self'; base-uri 'self'; manifest-src 'self'; connect-src 'self' blob: https: wss:; img-src 'self' data: blob: https:; media-src 'self' https:">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
  <meta name="robots" content="index, follow">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:site_name" content="Good Morning Bitcoin Radio">
  <meta property="og:url" content="${safeUrl}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">
  <link rel="manifest" href="/manifest.webmanifest">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="alternate icon" href="/favicon.ico">
  <script type="module" crossorigin src="${jsFile}"></script>
  <link rel="stylesheet" crossorigin href="${cssFile}">
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  const showsPath = join(ROOT, 'public', 'shows.json');
  const shows = JSON.parse(readFileSync(showsPath, 'utf-8'));
  const { jsFile, cssFile } = findJsAndCss();

  console.log(`[prerender] ${shows.length} shows, JS: ${jsFile}, CSS: ${cssFile || 'none'}`);

  let generated = 0;
  let failed = 0;

  for (const show of shows) {
    const slug = slugify(show.title);
    const showDir = join(DIST, 'podcast', slug);

    let artwork = null;
    let description = show.description || '';
    let episodes = [];

    // Fetch RSS feed once for artwork, description, and episodes
    try {
      const xml = await fetchWithTimeout(show.podcastXml);
      artwork = parseShowArtwork(xml);
      const rssDesc = parseShowDescription(xml);
      if (rssDesc) description = rssDesc;
      episodes = parseEpisodes(xml);
    } catch (err) {
      console.warn(`[prerender] RSS fetch failed for "${show.title}": ${err.message}`);
    }

    const showUrl = `${SITE_URL}/podcast/${encodeURIComponent(slug)}`;
    const showTitle = `${show.title} - Bitcoin Podcast | Good Morning Bitcoin Radio`;
    const showDesc = truncate(stripHtml(description), 160);

    const html = generateHtml({
      title: showTitle,
      description: showDesc,
      image: artwork,
      url: showUrl,
      jsFile,
      cssFile,
    });

    mkdirSync(showDir, { recursive: true });
    writeFileSync(join(showDir, 'index.html'), html);
    // Also write a flat .html file so the bare URL (no trailing slash)
    // is served as 200 instead of 301-redirecting to the directory.
    // Some link-preview crawlers (Signal) don't follow redirects.
    writeFileSync(join(DIST, 'podcast', `${slug}.html`), html);
    generated++;

    // Generate episode stubs for the most recent N episodes.
    // Episode links shared in messaging apps will get the show artwork.
    // Older episodes fall back to the SPA shell (404.html) — still functional,
    // just generic OG tags.
    const recent = episodes.slice(0, 50);

    for (const ep of recent) {
      const epSlug = encodeURIComponent(ep.guid || slugify(ep.title));
      const epDir = join(showDir, 'episode', epSlug);
      const epUrl = `${SITE_URL}/podcast/${encodeURIComponent(slug)}/episode/${epSlug}`;
      const epTitle = `${ep.title} - ${show.title} | Good Morning Bitcoin Radio`;
      const epHtml = generateHtml({
        title: epTitle,
        description: showDesc,
        image: artwork,
        url: epUrl,
        jsFile,
        cssFile,
      });
      mkdirSync(epDir, { recursive: true });
      writeFileSync(join(epDir, 'index.html'), epHtml);
      // Flat file for redirect-free serving
      writeFileSync(join(showDir, 'episode', `${epSlug}.html`), epHtml);
      generated++;
    }

    console.log(`[prerender] ✓ /podcast/${slug} ${artwork ? '(artwork)' : '(no artwork)'}${recent.length ? ` + ${recent.length} episodes` : ''}`);
  }

  console.log(`\n[prerender] Done: ${generated} show pages generated, ${failed} failed`);
}

main().catch(err => {
  console.error('[prerender] Fatal error:', err);
  process.exit(1);
});
