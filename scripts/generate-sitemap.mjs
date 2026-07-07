/**
 * Build-time sitemap generator.
 *
 * This script runs during the CI build step (before vite build) to
 * generate a static sitemap.xml in the public/ directory.
 *
 * Usage: node --input-type=module -e "$(cat scripts/generate-sitemap.mjs)"
 * or:  npx tsx scripts/generate-sitemap.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const BASE_URL = 'https://goodmorningbitcoin.com';
const currentDate = new Date().toISOString().split('T')[0];

// Load shows.json
const showsPath = resolve(root, 'public/shows.json');
const shows = JSON.parse(readFileSync(showsPath, 'utf-8'));

// Static pages
const staticPages = [
  { url: '/', lastmod: currentDate, changefreq: 'daily', priority: '1.0' },
  { url: '/shows', lastmod: currentDate, changefreq: 'daily', priority: '0.9' },
  { url: '/about', lastmod: currentDate, changefreq: 'monthly', priority: '0.7' },
  { url: '/schedule', lastmod: currentDate, changefreq: 'weekly', priority: '0.6' },
  { url: '/community', lastmod: currentDate, changefreq: 'weekly', priority: '0.8' },
];

// Dynamic podcast pages
const podcastPages = shows
  .filter(show => show.podcastXml)
  .map(show => ({
    url: `/podcast/${encodeURIComponent(show.title.toLowerCase().replace(/\s+/g, '-'))}`,
    lastmod: currentDate,
    changefreq: 'weekly',
    priority: '0.8',
  }));

const allPages = [...staticPages, ...podcastPages];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const outputPath = resolve(root, 'public/sitemap.xml');
writeFileSync(outputPath, xml, 'utf-8');
console.log(`Generated sitemap with ${allPages.length} URLs → ${outputPath}`);
