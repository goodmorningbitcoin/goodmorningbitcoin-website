import { parsePodcastXml } from '@/lib/podcastXmlParser';
import type { PodcastMetadata } from '@/lib/podcastXmlParser';

/**
 * CORS proxy fallback for podcast RSS feeds that don't send
 * Access-Control-Allow-Origin headers.
 *
 * Known feeds that need this:
 * - Spreaker (www.spreaker.com)
 * - bitcoin-takeover.com
 * - podhome.fm / serve.podhome.fm (replaces anchor.fm redirects)
 *
 * Feeds that work without a proxy (Anchor.fm, Castos, etc.) hit the
 * direct URL first for speed.
 */
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
];

/**
 * Fetch a podcast RSS feed and parse it. Tries the direct URL first,
 * then falls back through CORS proxies if the browser blocks the request.
 */
export async function fetchPodcastFeed(
  xmlUrl: string,
  options?: { signal?: AbortSignal }
): Promise<PodcastMetadata | null> {
  // Try direct fetch first
  try {
    const response = await fetch(xmlUrl, { signal: options?.signal });
    if (response.ok) {
      const xmlText = await response.text();
      // Sanity check — make sure we got XML, not an error page
      if (xmlText.includes('<rss') || xmlText.includes('<?xml')) {
        return parsePodcastXml(xmlText);
      }
    }
  } catch {
    // Network/CORS error — fall through to proxy
  }

  // Fall back through CORS proxies
  for (const proxy of CORS_PROXIES) {
    try {
      const response = await fetch(proxy(xmlUrl), { signal: options?.signal });
      if (!response.ok) continue;

      const xmlText = await response.text();
      if (xmlText.includes('<rss') || xmlText.includes('<?xml')) {
        return parsePodcastXml(xmlText);
      }
    } catch {
      // This proxy failed — try the next one
    }
  }

  throw new Error(`Unable to fetch podcast feed: ${xmlUrl}`);
}
