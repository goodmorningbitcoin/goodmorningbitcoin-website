import { useQuery } from '@tanstack/react-query';
import { NRelay1 } from '@nostrify/nostrify';
import { CITADEL_WIRE_PUBKEY, CITADEL_WIRE_RSS } from '@/lib/constants';
import { parseCitadelWireStories, type CitadelWireStory } from '@/lib/citadelWireParser';

interface NostrPost {
  content: string;
  created_at: number;
  id: string;
}

export function useCitadelWire(limit = 5) {
  return useQuery<CitadelWireStory[]>({
    queryKey: ['citadel-wire', limit],
    queryFn: async ({ signal }) => {
      let posts: NostrPost[] = [];

      // Try Nostr first — query Primal directly (Citadel Wire posts there)
      try {
        const relay = new NRelay1('wss://relay.primal.net');
        const events = await relay.query(
          [{ kinds: [1], authors: [CITADEL_WIRE_PUBKEY], limit }],
          { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) },
        );

        if (events.length > 0) {
          posts = events.map((e) => ({
            content: e.content,
            created_at: e.created_at,
            id: e.id,
          }));
        }
      } catch {
        // Fall through to RSS
      }

      // RSS fallback (no count param — rss2json requires paid key for it)
      if (posts.length === 0) {
        const response = await fetch(
          `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(CITADEL_WIRE_RSS)}`
        );
        if (!response.ok) throw new Error('Failed to fetch Citadel Wire');
        const data = await response.json();
        if (data.status !== 'ok') throw new Error('Citadel Wire feed error');

        posts = (data.items || []).slice(0, limit).map((item: {
          description?: string;
          pubDate: string;
          guid: string;
          link: string;
        }) => ({
          content: (item.description || '')
            .replace(/<[^>]+>/g, '')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/<br\s*\/?>/gi, '\n'),
          created_at: new Date(item.pubDate).getTime() / 1000,
          id: item.guid,
        }));
      }

      // Flatten all posts into individual stories, newest first
      const stories: CitadelWireStory[] = [];
      for (const post of posts) {
        const postStories = parseCitadelWireStories(
          post.content,
          post.created_at,
          `https://citadelwire.com/posts/${post.id}`,
          post.id,
        );
        stories.push(...postStories);
      }

      return stories;
    },
    staleTime: 300000, // 5 minutes
    retry: 2,
  });
}
