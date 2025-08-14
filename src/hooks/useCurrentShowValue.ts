import { useMemo } from 'react';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { parsePodcastXml, type ValueBlock, type PodcastMetadata } from '@/lib/podcastXmlParser';

export interface CurrentShowData {
  metadata: PodcastMetadata | null;
  valueBlock: ValueBlock | null;
  hasValueSplits: boolean;
}

export function useCurrentShowValue(): CurrentShowData {
  const { data: nowPlaying } = useNowPlaying();

  const showData = useMemo(() => {
    if (!nowPlaying?.now_playing?.song?.text) {
      return {
        metadata: null,
        valueBlock: null,
        hasValueSplits: false,
      };
    }

    // The podcast XML is in the comment/text field
    const podcastXml = nowPlaying.now_playing.song.text;
    const metadata = parsePodcastXml(podcastXml);

    return {
      metadata,
      valueBlock: metadata?.valueBlock || null,
      hasValueSplits: Boolean(metadata?.valueBlock?.recipients?.length),
    };
  }, [nowPlaying]);

  return showData;
}