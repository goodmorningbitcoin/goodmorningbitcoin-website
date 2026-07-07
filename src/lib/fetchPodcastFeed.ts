import { parsePodcastXml } from '@/lib/podcastXmlParser';
import type { PodcastMetadata } from '@/lib/podcastXmlParser';

/**
 * CORS proxy for podcast RSS feeds that don't send
 * Access-Control-Allow-Origin headers.
 *
 * Known feeds that need this:
 * - Spreaker (www.spreaker.com)
 * - bitcoin-takeover.com
 * - podhome.fm / serve.podhome.fm
 *
 * Feeds that work without a proxy (Anchor.fm, Castos, etc.) hit the
 * direct URL first for speed.
 *
 * Strategy: try direct fetch first. If it fails, race multiple free
 * CORS proxies and use whichever responds first.
 */

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy/?quest=${url}`,
];

const XML_MARKER = /<\?xml|<rss/i;

/**
 * Fetch a podcast RSS feed and parse it. Tries the direct URL first,
 * then races CORS proxies if the browser blocks the request.
 */
export async function fetchPodcastFeed(
  xmlUrl: string,
  options?: { signal?: AbortSignal }
): Promise<PodcastMetadata | null> {
  // Try direct fetch first (fast path for CORS-friendly feeds)
  try {
    const response = await fetch(xmlUrl, { signal: options?.signal });
    if (response.ok) {
      const xmlText = await response.text();
      if (XML_MARKER.test(xmlText)) {
        return parsePodcastXml(xmlText);
      }
    }
  } catch {
    // Network/CORS error — fall through to proxy
  }

  // Race all proxies concurrently — first valid response wins
  const proxyPromises = CORS_PROXIES.map(proxy => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    return fetch(proxy(xmlUrl), { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.text();
      })
      .then(text => {
        clearTimeout(timeout);
        if (XML_MARKER.test(text)) return text;
        throw new Error('Not XML');
      })
      .catch(err => {
        clearTimeout(timeout);
        throw err;
      });
  });

  try {
    // First-success race — resolves with the fastest valid response
    const xmlText = await firstSuccess(proxyPromises);
    return parsePodcastXml(xmlText);
  } catch {
    // All proxies failed
    throw new Error(`Unable to fetch podcast feed: ${xmlUrl}`);
  }
}

/**
 * Resolve with the first successful promise, rejecting only if all fail.
 * Minimal polyfill for Promise.any (requires ES2021).
 */
function firstSuccess<T>(promises: Promise<T>[]): Promise<T> {
  return new Promise((resolve, reject) => {
    let remaining = promises.length;
    const errors: unknown[] = [];
    promises.forEach((p, i) => {
      p.then(resolve).catch(err => {
        errors[i] = err;
        if (--remaining === 0) reject(new Error('All proxies failed'));
      });
    });
  });
}
