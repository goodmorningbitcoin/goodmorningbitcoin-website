import { useQuery } from '@tanstack/react-query';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { parsePodcastXml } from '@/lib/podcastXmlParser';
import type { ValueBlock } from '@/lib/podcastXmlParser';

/**
 * Hook to extract value block information from the currently playing audio source.
 * 
 * For radio: Checks the nowPlaying metadata for the show XML (in the 'text' field)
 * and fetches the podcast RSS to extract value block information.
 * 
 * For podcasts: Uses the value block from the current podcast source or fetches
 * it from the RSS feed if not already available.
 */
export function useValueBlock() {
  const { currentSource } = useAudioPlayer();
  const { data: nowPlaying } = useNowPlaying();

  return useQuery({
    queryKey: ['valueBlock', currentSource?.type, currentSource?.url, nowPlaying?.now_playing.song.text],
    queryFn: async ({ signal }): Promise<ValueBlock | null> => {
      // Debug logging
      console.log('useValueBlock: Checking for value block, source type:', currentSource?.type);

      if (!currentSource) {
        console.log('useValueBlock: No current source');
        return null;
      }

      // For podcast sources, check if value block is already available
      if (currentSource.type === 'podcast') {
        if (currentSource.valueBlock) {
          const vb = currentSource.valueBlock as unknown as ValueBlock;
          console.log('useValueBlock: Found value block in podcast source with', vb?.recipients?.length, 'recipients');
          return currentSource.valueBlock as unknown as ValueBlock;
        }
        console.log('useValueBlock: No value block in podcast source');
        return null;
      }

      // For radio sources, check nowPlaying metadata for podcast XML URL
      if (currentSource.type === 'radio') {
        // Check multiple possible fields for the RSS URL
        const possibleFields = [
          nowPlaying?.now_playing.song.text,
          nowPlaying?.now_playing.song.custom_fields?.comment,
          nowPlaying?.now_playing.song.custom_fields?.description,
          nowPlaying?.now_playing.song.custom_fields?.source,
          nowPlaying?.now_playing.song.custom_fields?.rss,
          nowPlaying?.now_playing.song.custom_fields?.feed
        ];

        console.log('useValueBlock: Radio source, checking possible fields for RSS URL:', possibleFields);
        
        let podcastXmlUrl: string | null = null;
        
        for (const field of possibleFields) {
          if (field && typeof field === 'string') {
            const trimmed = field.trim();
            console.log('useValueBlock: Checking field:', trimmed);
            
            // Check if it contains a Source: URL pattern
            const sourceMatch = trimmed.match(/Source:\s*(https?:\/\/[^\s\n]+)/i);
            if (sourceMatch) {
              console.log('useValueBlock: Found Source URL pattern:', sourceMatch[1]);
              podcastXmlUrl = sourceMatch[1] as string;
              break;
            }
            
            // Check if it's directly a URL
            if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
              console.log('useValueBlock: Found direct URL:', trimmed);
              podcastXmlUrl = trimmed as string;
              break;
            }
          }
        }

        if (!podcastXmlUrl) {
          console.log('useValueBlock: No RSS URL found in any field');
          return null;
        }
        
        console.log('useValueBlock: Using RSS URL:', podcastXmlUrl);

        try {
          // Fetch the podcast RSS feed
          const response = await fetch(podcastXmlUrl, { signal });
          if (!response.ok) {
            console.warn('Failed to fetch podcast RSS for value block:', response.status);
            return null;
          }

          const xmlText = await response.text();
          const podcastData = parsePodcastXml(xmlText);
          
          return podcastData?.valueBlock || null;
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error; // Re-throw abort errors
          }
          console.warn('Error fetching podcast RSS for value block:', error);
          return null;
        }
      } else {
        console.log('useValueBlock: Radio source but no RSS URL found in any field');
      }

      console.log('useValueBlock: No value block found, returning null');
      return null;
    },
    enabled: !!currentSource && (
      // Enable for podcasts with potential value blocks
      (currentSource.type === 'podcast') ||
      // Enable for radio when we have potential podcast XML URL
      (currentSource.type === 'radio' && !!nowPlaying?.now_playing.song.text)
    ),
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    retry: 1, // Only retry once for failed requests
  });
}