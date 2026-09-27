/**
 * Stable episode URL slug.
 *
 * Rules (must stay in sync with the copy in scripts/prerender-shows.mjs):
 *  - GUID is a single UUID → use it (all existing UUID-slug URLs stay identical)
 *  - GUID contains one or more UUIDs (podhome remints as UUID-AUUID-B) → first UUID,
 *    which restores the episode's original URL
 *  - GUID is another opaque safe token → use it
 *  - GUID is URL-shaped or missing → title slug (EpisodePage matches this fallback)
 */
export function episodeSlug(guid: string | undefined, title: string): string {
  if (guid) {
    const uuids = guid.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
    );
    if (uuids && uuids.length > 0) return uuids[0];
    if (/^[0-9A-Za-z][0-9A-Za-z._-]*$/.test(guid)) return guid;
  }
  return title
    .toLowerCase()
    .replace(/[/\\]+/g, ' ')
    .replace(/\s+/g, '-');
}
