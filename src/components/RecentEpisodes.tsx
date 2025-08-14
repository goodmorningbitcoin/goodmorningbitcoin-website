import { Clock, Play, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useStationHistory } from '@/hooks/useStationHistory';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { parsePodcastXml } from '@/lib/podcastXmlParser';
import showsData from '../../public/shows.json';

export function RecentEpisodes() {
  const { data: history, isLoading, error } = useStationHistory(10);
  const { setCurrentSource } = useAudioPlayer();

  const playEpisode = async (item: typeof history[0]) => {
    try {
      // Try to find a matching show based on the episode title or artist
      const shows = showsData as Array<{
        title: string;
        description: string;
        fountainlink: string;
        xlink: string;
        nostr: string;
        podcastXml: string;
      }>;

      // Look for a show that matches the artist/album name
      const matchingShow = shows.find(show => {
        const showTitle = show.title.toLowerCase();
        const episodeArtist = (item.song.artist || '').toLowerCase();
        const episodeAlbum = (item.song.album || '').toLowerCase();
        
        return episodeArtist.includes(showTitle) || 
               showTitle.includes(episodeArtist) ||
               episodeAlbum.includes(showTitle) ||
               showTitle.includes(episodeAlbum);
      });

      if (matchingShow && matchingShow.podcastXml) {
        // Fetch RSS feed directly
        const response = await fetch(matchingShow.podcastXml);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const xmlText = await response.text();
        const podcastData = parsePodcastXml(xmlText);
        
        if (podcastData && podcastData.episodes && podcastData.episodes.length > 0) {
          // Try to find the specific episode that matches the title
          let episode = podcastData.episodes.find(ep => 
            ep.title.toLowerCase().includes(item.song.title.toLowerCase()) ||
            item.song.title.toLowerCase().includes(ep.title.toLowerCase())
          );
          
          // If no exact match, use the latest episode
          if (!episode) {
            episode = podcastData.episodes[0];
          }
          
          if (episode && episode.audioUrl) {
            // For complex tracking URLs, try to resolve to final URL first
            let finalAudioUrl = episode.audioUrl;
            
            // If the URL contains multiple redirects/tracking, try to get the final URL
            if (episode.audioUrl.includes('podtrac.com') || episode.audioUrl.includes('op3.dev')) {
              try {
                // Make a HEAD request to follow redirects and get the final URL
                const headResponse = await fetch(episode.audioUrl, { method: 'HEAD' });
                if (headResponse.ok) {
                  finalAudioUrl = headResponse.url;
                }
              } catch (error) {
                console.log('Could not resolve final URL, using original:', error);
              }
            }
            
            // Use CORS proxy for the audio file
            const AUDIO_PROXY = 'https://corsproxy.io/?';
            const proxiedAudioUrl = `${AUDIO_PROXY}${encodeURIComponent(finalAudioUrl)}`;
            
            setCurrentSource({
              type: 'podcast',
              url: proxiedAudioUrl,
              title: episode.title,
              artist: matchingShow.title,
              showTitle: matchingShow.title,
            });
            return;
          }
        }
      }
      
      // Fallback to radio stream if no matching episode found
      setCurrentSource({
        type: 'radio',
        url: 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3',
        title: item.song.title || 'Good Morning Bitcoin Radio',
        artist: item.song.artist || 'Live Stream',
      });
    } catch (error) {
      console.error('Error playing episode:', error);
      
      // Fallback to radio stream on error
      setCurrentSource({
        type: 'radio',
        url: 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3',
        title: item.song.title || 'Good Morning Bitcoin Radio',
        artist: item.song.artist || 'Live Stream',
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl-bold">Recent Episodes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl-bold">Recent Episodes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Failed to load recent episodes. {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Check the browser console for more details.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!history || history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl-bold">Recent Episodes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No recent episodes available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl-bold">Recent Episodes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {history.map((item, index) => (
          <div key={`${item.played_at}-${index}`} className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
              {item.song.art ? (
                <img 
                  src={item.song.art} 
                  alt={item.song.title}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <Music className="h-5 w-5 text-gray-500" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">
                {item.song.title || 'Unknown Title'}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-2">
                <span className="truncate">{item.song.artist || 'Unknown Artist'}</span>
                <span>•</span>
                <Clock className="h-3 w-3" />
                <span>{formatDate(item.played_at)}</span>
                {item.duration > 0 && (
                  <>
                    <span>•</span>
                    <span>{formatDuration(item.duration)}</span>
                  </>
                )}
              </div>
            </div>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={() => playEpisode(item)}
              className="opacity-0 group-hover:opacity-100 transition-opacity bg-gmb-orange/10 hover:bg-gmb-orange/20"
            >
              <Play className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}