import { useCallback } from 'react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { fetchPodcastFeed } from '@/lib/fetchPodcastFeed';
import { RADIO_SOURCE } from '@/lib/constants';
import type { PodcastMetadata, Episode } from '@/lib/podcastXmlParser';
import showsData from '../../public/shows.json';

export interface Show {
  title: string;
  description: string;
  fountainlink: string;
  xlink: string;
  nostr: string;
  podcastXml: string;
}

/**
 * Shared hook for podcast playback logic.
 *
 * Previously this logic (fetch RSS → parse XML → resolve redirects →
 * setCurrentSource) was duplicated across Shows.tsx, PodcastPage.tsx,
 * and RecentEpisodes.tsx.
 */
export function usePodcastPlayer() {
  const { setCurrentSource } = useAudioPlayer();

  /**
   * Resolve redirect-heavy tracking URLs (podtrac, op3.dev) to the
   * final audio CDN URL. Returns the original on failure.
   */
  const resolveAudioUrl = useCallback(async (audioUrl: string): Promise<string> => {
    if (!audioUrl.includes('podtrac.com') && !audioUrl.includes('op3.dev')) {
      return audioUrl;
    }
    try {
      const headResponse = await fetch(audioUrl, { method: 'HEAD' });
      if (headResponse.ok) {
        return headResponse.url;
      }
    } catch {
      // Ignore — use original URL
    }
    return audioUrl;
  }, []);

  /**
   * Fetch and parse a podcast RSS feed.
   */
  const fetchPodcastData = useCallback(async (xmlUrl: string): Promise<PodcastMetadata | null> => {
    return fetchPodcastFeed(xmlUrl);
  }, []);

  /**
   * Play a specific episode from a show's RSS feed.
   */
  const playEpisode = useCallback(async (show: Show, episode: Episode) => {
    const finalAudioUrl = await resolveAudioUrl(episode.audioUrl);

    const podcastData = await fetchPodcastData(show.podcastXml).catch(() => null);

    setCurrentSource({
      type: 'podcast',
      url: finalAudioUrl,
      title: episode.title,
      artist: show.title,
      showTitle: show.title,
      valueBlock: podcastData?.valueBlock as unknown as Record<string, unknown>,
    });
  }, [setCurrentSource, resolveAudioUrl, fetchPodcastData]);

  /**
   * Play the latest episode from a show's RSS feed.
   */
  const playLatestEpisode = useCallback(async (show: Show) => {
    if (!show.podcastXml) return;

    try {
      const podcastData = await fetchPodcastData(show.podcastXml);

      if (podcastData?.episodes?.length) {
        const latestEpisode = podcastData.episodes[0];
        const finalAudioUrl = await resolveAudioUrl(latestEpisode.audioUrl);

        setCurrentSource({
          type: 'podcast',
          url: finalAudioUrl,
          title: latestEpisode.title,
          artist: show.title,
          showTitle: show.title,
          valueBlock: podcastData.valueBlock as unknown as Record<string, unknown>,
        });
      } else {
        setCurrentSource(RADIO_SOURCE);
      }
    } catch {
      setCurrentSource(RADIO_SOURCE);
    }
  }, [setCurrentSource, resolveAudioUrl, fetchPodcastData]);

  /**
   * Play an episode matching a song title from the station history.
   * Falls back to radio stream if no match is found.
   */
  const playBySongTitle = useCallback(async (songTitle: string, songArtist: string) => {
    const shows = showsData as Show[];

    const matchingShow = shows.find(show => {
      const showTitle = show.title.toLowerCase();
      const artist = songArtist.toLowerCase();
      return artist.includes(showTitle) || showTitle.includes(artist);
    });

    if (matchingShow?.podcastXml) {
      try {
        const podcastData = await fetchPodcastData(matchingShow.podcastXml);
        if (podcastData?.episodes?.length) {
          const episode = podcastData.episodes.find(ep =>
            ep.title.toLowerCase().includes(songTitle.toLowerCase()) ||
            songTitle.toLowerCase().includes(ep.title.toLowerCase())
          ) || podcastData.episodes[0];

          if (episode?.audioUrl) {
            const finalAudioUrl = await resolveAudioUrl(episode.audioUrl);
            setCurrentSource({
              type: 'podcast',
              url: finalAudioUrl,
              title: episode.title,
              artist: matchingShow.title,
              showTitle: matchingShow.title,
            });
            return;
          }
        }
      } catch {
        // Fall through to radio
      }
    }

    setCurrentSource({
      ...RADIO_SOURCE,
      title: songTitle || RADIO_SOURCE.title,
      artist: songArtist || RADIO_SOURCE.artist,
    });
  }, [setCurrentSource, resolveAudioUrl, fetchPodcastData]);

  /**
   * Switch back to the live radio stream.
   */
  const switchToRadio = useCallback(() => {
    setCurrentSource(RADIO_SOURCE);
  }, [setCurrentSource]);

  return {
    playEpisode,
    playLatestEpisode,
    playBySongTitle,
    switchToRadio,
    fetchPodcastData,
  };
}
