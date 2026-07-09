#!/usr/bin/env node
/**
 * Prerender static pages, show pages, and episode stubs for social share previews.
 *
 * After the vite-react-ssg build, this script:
 *   1. Generates HTML stubs for static routes (/, /about, /shows, /community, /schedule)
 *   2. Reads public/shows.json and fetches each show's RSS feed
 *   3. Generates show pages and episode stubs with correct OG/Twitter meta tags
 *
 * Each stub is a minimal HTML file (~2-3KB) that loads the same JS bundle
 * so React hydrates the SPA normally. Only the <head> meta tags differ.
 *
 * Episode routes get the show artwork (not per-episode artwork).
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SITE_URL = 'https://goodmorningbitcoin.com';
const OG_DEFAULT_IMAGE = `${SITE_URL}/assets/img/og-default.jpg`;

// ─── Static route SEO data (mirrors <Seo> components in each page) ────────

const STATIC_ROUTES = [
  {
    path: '/',
    title: 'Bitcoin Radio - 24/7 Bitcoin Podcast & News Stream | Good Morning Bitcoin',
    description: 'The #1 24/7 Bitcoin radio station. Stream live Bitcoin podcasts, breaking Bitcoin news, and community discussions 24/7. Listen free on any device.',
    image: `${SITE_URL}/assets/img/og-default.jpg`,
  },
  {
    path: '/about',
    title: 'About - Good Morning Bitcoin Radio',
    description: 'Good Morning Bitcoin started as an in-game radio station in Rust on the Orange Bitcoin server. Now it is a 24/7 internet radio station streaming across the globe, including Nostr Radio.',
  },
  {
    path: '/shows',
    title: 'Bitcoin Podcast Directory - Shows | Good Morning Bitcoin Radio',
    description: 'Discover the best Bitcoin podcasts and shows featured on Good Morning Bitcoin Radio. Stream episodes from top Bitcoin podcasters, educators, and thought leaders in the Bitcoin space.',
  },
  {
    path: '/community',
    title: 'Community - Good Morning Bitcoin',
    description: 'Join the Good Morning Bitcoin community on Nostr. Discuss Bitcoin, podcasts, and connect with fellow Bitcoiners.',
  },
  {
    path: '/schedule',
    title: 'Schedule - Good Morning Bitcoin',
    description: "View the Good Morning Bitcoin radio schedule and see what's playing next on our 24/7 Bitcoin podcast stream.",
  },
];

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
  const channelMatch = xml.match(/<channel[\s\S]*?<itunes:image\s+href="([^"]+)"/i);
  if (channelMatch) return channelMatch[1];
  const urlMatch = xml.match(/<image>[\s\S]*?<url>([^<]+)<\/url>/i);
  if (urlMatch) return urlMatch[1].trim();
  return null;
}

function parseShowDescription(xml) {
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

function generateHtml({ title, description, image, url, jsFile, cssFile, robots }) {
  const ogImage = image || OG_DEFAULT_IMAGE;
  const safeTitle = escapeHtml(title);
  const safeDesc = escapeAttr(description);
  const safeUrl = escapeAttr(url);
  const safeImage = escapeAttr(ogImage);
  const robotsTag = robots ? `  <meta name="robots" content="${escapeAttr(robots)}">\n` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="content-security-policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-src 'self' https:; font-src 'self'; base-uri 'self'; manifest-src 'self'; connect-src 'self' blob: https: wss:; img-src 'self' data: blob: https:; media-src 'self' https:">
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}">
${robotsTag}  <meta property="og:type" content="website">
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

function writeRoute(pathSegments, html) {
  // Write both flat .html (for redirect-free serving) and directory/index.html
  const dir = join(DIST, ...pathSegments);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);

  // Also write flat .html file one level up
  const lastSegment = pathSegments[pathSegments.length - 1];
  const parentDir = pathSegments.slice(0, -1);
  const flatPath = join(DIST, ...parentDir, `${lastSegment}.html`);
  const flatDir = dirname(flatPath);
  if (existsSync(flatDir)) {
    writeFileSync(flatPath, html);
  }
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  const { jsFile, cssFile } = findJsAndCss();
  console.log(`[prerender] JS: ${jsFile}, CSS: ${cssFile || 'none'}`);

  let generated = 0;
  const allUrls = []; // Collect URLs for sitemap

  // ── Static routes ──
  console.log('\n[prerender] Static routes:');
  for (const route of STATIC_ROUTES) {
    const html = generateHtml({
      title: route.title,
      description: route.description,
      image: route.image,
      url: `${SITE_URL}${route.path}`,
      jsFile,
      cssFile,
    });
    if (route.path === '/') {
      // Don't overwrite the SSR'd index.html — it has the full app shell
      // with providers, error boundary, etc. Just keep it.
      console.log(`[prerender] ⏭  / (keeping SSR'd index.html)`);
    } else {
      const segments = route.path.split('/').filter(Boolean);
      writeRoute(segments, html);
      generated++;
      console.log(`[prerender] ✓ ${route.path}`);
    }
    allUrls.push(`${SITE_URL}${route.path}`);
  }

  // ── Show & episode routes ──
  console.log('\n[prerender] Show & episode routes:');
  const showsPath = join(ROOT, 'public', 'shows.json');
  const shows = JSON.parse(readFileSync(showsPath, 'utf-8'));

  // Fetch all RSS feeds in parallel with per-feed error isolation
  const feedResults = await Promise.allSettled(
    shows.map(async (show) => {
      const xml = await fetchWithTimeout(show.podcastXml);
      return {
        show,
        artwork: parseShowArtwork(xml),
        description: parseShowDescription(xml),
        episodes: parseEpisodes(xml),
      };
    })
  );

  for (const result of feedResults) {
    if (result.status === 'rejected') {
      console.warn(`[prerender] RSS fetch failed: ${result.reason?.message || result.reason}`);
      continue;
    }

    const { show, artwork, description: rssDesc, episodes } = result.value;
    const slug = slugify(show.title);
    const description = rssDesc || show.description || '';
    const showUrl = `${SITE_URL}/podcast/${encodeURIComponent(slug)}`;
    const showTitle = `${show.title} - Bitcoin Podcast | Good Morning Bitcoin Radio`;
    const showDesc = truncate(stripHtml(description), 160);

    // Show page
    const showHtml = generateHtml({
      title: showTitle,
      description: showDesc,
      image: artwork,
      url: showUrl,
      jsFile,
      cssFile,
    });
    writeRoute(['podcast', slug], showHtml);
    generated++;
    allUrls.push(showUrl);

    // Episode stubs (last 50)
    const recent = episodes.slice(0, 50);
    for (const ep of recent) {
      const epSlug = encodeURIComponent(ep.guid || slugify(ep.title));
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
      writeRoute(['podcast', slug, 'episode', epSlug], epHtml);
      generated++;
      allUrls.push(epUrl);
    }

    console.log(`[prerender] ✓ /podcast/${slug} ${artwork ? '(artwork)' : '(no artwork)'}${recent.length ? ` + ${recent.length} episodes` : ''}`);
  }

  // ── 404 page ──
  const notFoundHtml = generateHtml({
    title: 'Page Not Found - Good Morning Bitcoin',
    description: 'The page you are looking for does not exist.',
    url: `${SITE_URL}/404`,
    jsFile,
    cssFile,
    robots: 'noindex, follow',
  });
  writeFileSync(join(DIST, '404.html'), notFoundHtml);
  generated++;
  console.log(`\n[prerender] ✓ /404 (noindex)`);

  // ── Write URL list for sitemap generator ──
  writeFileSync(join(DIST, 'sitemap-urls.json'), JSON.stringify(allUrls, null, 2));
  console.log(`\n[prerender] Done: ${generated} pages generated, ${allUrls.length} URLs for sitemap`);
}

main().catch(err => {
  console.error('[prerender] Fatal error:', err);
  process.exit(1);
});
