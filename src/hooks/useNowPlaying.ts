import { useQuery } from '@tanstack/react-query';

interface NowPlayingData {
  now_playing: {
    song: {
      title: string;
      artist: string;
      album: string;
      art: string;
      text?: string; // This is where the podcast XML will be
      custom_fields: Record<string, string>;
    };
    playlist: string;
    duration: number;
    elapsed: number;
  };
  station: {
    name: string;
    description: string;
    url: string;
    listen_url: string;
    public_player_url: string;
  };
  listeners: {
    current: number;
    unique: number;
    total: number;
  };
  live: {
    is_live: boolean;
    streamer_name: string;
  };
}

export function useNowPlaying() {
  return useQuery({
    queryKey: ['nowplaying'],
    queryFn: async () => {
      const response = await fetch('https://radio.goodmorningbitcoin.com/api/nowplaying/1');
      if (!response.ok) {
        throw new Error('Failed to fetch now playing data');
      }
      return response.json() as Promise<NowPlayingData>;
    },
    refetchInterval: 15000, // Refresh every 15 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  });
}