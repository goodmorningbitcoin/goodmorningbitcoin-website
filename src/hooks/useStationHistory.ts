import { useQuery } from '@tanstack/react-query';

interface HistoryItem {
  sh_id?: number;
  played_at: number;
  duration: number;
  playlist: string;
  streamer: string;
  is_request?: boolean;
  listeners_start?: number;
  listeners_end?: number;
  delta_total: number;
  is_visible?: boolean;
  song: {
    text: string;
    artist: string;
    title: string;
    album: string;
    genre: string;
    isrc: string;
    lyrics?: string;
    id: string;
    art: string;
    custom_fields: Record<string, unknown>;
  };
}

interface _StationHistoryResponse {
  data: HistoryItem[];
  links: {
    self: string;
  };
  meta: {
    total: number;
  };
}

interface RawHistoryItem {
  sh_id?: number;
  played_at?: number;
  duration?: number;
  playlist?: string;
  streamer?: string;
  is_request?: boolean;
  listeners_start?: number;
  listeners_end?: number;
  delta_total?: number;
  is_visible?: boolean;
  song?: {
    text?: string;
    artist?: string;
    title?: string;
    album?: string;
    genre?: string;
    isrc?: string;
    lyrics?: string;
    id?: string;
    art?: string;
    custom_fields?: Record<string, unknown>;
  };
}

export function useStationHistory(limit: number = 10) {
  return useQuery({
    queryKey: ['station-history', limit],
    queryFn: async () => {
      // console.log('Fetching station history via nowplaying endpoint...');
      // Use the main nowplaying endpoint which includes song_history
      const response = await fetch(`https://radio.goodmorningbitcoin.com/api/nowplaying`);
      // console.log('Nowplaying response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Nowplaying error:', errorText);
        throw new Error(`Failed to fetch station data: ${response.status}`);
      }
      
      const data = await response.json();
      // console.log('Nowplaying data structure:', data);
      
      // The nowplaying endpoint returns an array of stations
      // For station 1, we need to get the first station's data
      const stationData = Array.isArray(data) ? data[0] : data;
      // console.log('Station data:', stationData);
      
      // Extract song history from the station data
      if (stationData && stationData.song_history && Array.isArray(stationData.song_history)) {
        // console.log('Using real song history:', stationData.song_history);
        
        // Convert song_history format to match the expected history format from the API docs
        const history = stationData.song_history.slice(0, limit).map((historyItem: RawHistoryItem, index: number) => ({
          sh_id: historyItem.sh_id || index,
          is_request: historyItem.is_request || false,
          listeners_start: historyItem.listeners_start || 0,
          listeners_end: historyItem.listeners_end || 0,
          is_visible: historyItem.is_visible !== false, // Default to true
          song: {
            text: historyItem.song?.text || `${historyItem.song?.artist || 'Unknown Artist'} - ${historyItem.song?.title || 'Unknown Title'}`,
            artist: historyItem.song?.artist || 'Unknown Artist',
            title: historyItem.song?.title || 'Unknown Title',
            album: historyItem.song?.album || '',
            genre: historyItem.song?.genre || '',
            isrc: historyItem.song?.isrc || '',
            lyrics: historyItem.song?.lyrics || '',
            id: historyItem.song?.id || `history-${index}`,
            art: historyItem.song?.art || '',
            custom_fields: historyItem.song?.custom_fields || {},
          },
          streamer: historyItem.streamer || '',
          playlist: historyItem.playlist || '',
          duration: historyItem.duration || 0,
          played_at: historyItem.played_at || (Date.now() / 1000 - (index * 3600)),
          delta_total: historyItem.delta_total || 0,
        }));
        
        return history;
      }
      
      // console.log('No song_history found, returning empty array');
      return [];
    },
    staleTime: 60000, // 1 minute
    refetchInterval: 120000, // Refresh every 2 minutes
    retry: 3,
  });
}