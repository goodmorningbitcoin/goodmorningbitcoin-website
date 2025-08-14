import { useSeoMeta } from '@unhead/react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Calendar, Radio, Play } from 'lucide-react';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import showsData from '../../public/shows.json';

interface Show {
  title: string;
  imgsrc: string;
  description: string;
  fountainlink: string;
  xlink: string;
  nostr: string;
  podcastXml: string;
}

export default function Schedule() {
  useSeoMeta({
    title: 'Schedule - Good Morning Bitcoin',
    description: 'View the Good Morning Bitcoin radio schedule and see what\'s playing next.',
  });

  const { data: nowPlaying } = useNowPlaying();
  const { setCurrentSource } = useAudioPlayer();

  // Mock schedule data - in a real implementation, this would come from your scheduling system
  const scheduleItems = [
    {
      time: '06:00 - 08:00 UTC',
      title: 'Bitcoin Audible',
      host: 'Guy Swann',
      description: 'The Best in Bitcoin made Audible',
      isLive: true,
    },
    {
      time: '08:00 - 10:00 UTC',
      title: 'TFTC: A Bitcoin Podcast',
      host: 'Marty Bent',
      description: 'Bitcoin discussion with interesting people',
      isLive: false,
    },
    {
      time: '10:00 - 12:00 UTC',
      title: 'Citadel Dispatch',
      host: 'Matt Odell',
      description: 'Bitcoin and freedom tech discussion',
      isLive: false,
    },
    {
      time: '12:00 - 14:00 UTC',
      title: 'Simply Bitcoin',
      host: 'Simply Bitcoin Team',
      description: 'Daily Bitcoin news and analysis',
      isLive: false,
    },
    {
      time: '14:00 - 16:00 UTC',
      title: 'Bitcoin Rapid-Fire',
      host: 'John Vallis',
      description: 'Quick-fire Bitcoin insights and interviews',
      isLive: false,
    },
    {
      time: '16:00 - 18:00 UTC',
      title: 'Stephan Livera Podcast',
      host: 'Stephan Livera',
      description: 'Austrian Economics and Bitcoin education',
      isLive: false,
    },
  ];

  const switchToRadio = () => {
    setCurrentSource({
      type: 'radio',
      url: 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3',
      title: 'Good Morning Bitcoin Radio',
      artist: 'Live Stream',
    });
  };

  const currentTime = new Date().toLocaleTimeString('en-US', {
    timeZone: 'UTC',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">Radio Schedule</h1>
            <p className="text-muted-foreground mb-6">
              See what's currently playing and what's coming up next on Good Morning Bitcoin.
            </p>
            
            <div className="flex items-center gap-4 mb-6">
              <Badge variant="outline" className="px-3 py-1">
                <Clock className="h-4 w-4 mr-2" />
                Current UTC Time: {currentTime}
              </Badge>
              
              {nowPlaying && (
                <Badge variant="default" className="px-3 py-1 bg-green-600">
                  <Radio className="h-4 w-4 mr-2" />
                  {nowPlaying.listeners.current} listeners
                </Badge>
              )}
            </div>
          </div>

          {/* Now Playing */}
          {nowPlaying && (
            <Card className="mb-8 border-2 border-orange-500 bg-orange-50 dark:bg-orange-950">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></div>
                    <span>NOW PLAYING</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500 rounded-full">
                    <Radio className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {nowPlaying.now_playing.song.title || 'Good Morning Bitcoin'}
                    </h3>
                    <p className="text-muted-foreground">
                      {nowPlaying.now_playing.song.artist || 'Live Stream'}
                    </p>
                  </div>
                  <Button
                    onClick={switchToRadio}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Listen Live
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Schedule */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Calendar className="h-6 w-6" />
              Daily Schedule (UTC)
            </h2>
            
            {scheduleItems.map((item, index) => {
              const show = (showsData as Show[]).find(s => s.title === item.title);
              
              return (
                <Card key={index} className={item.isLive ? 'border-2 border-green-500' : ''}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-24">
                        <div className="text-sm font-medium text-muted-foreground mb-1">
                          {item.time.split(' - ')[0]}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          to
                        </div>
                        <div className="text-sm font-medium text-muted-foreground">
                          {item.time.split(' - ')[1]}
                        </div>
                      </div>
                      
                      <Avatar className="h-12 w-12 rounded-lg">
                        <AvatarImage src={show?.imgsrc} alt={item.title} />
                        <AvatarFallback className="rounded-lg">
                          {item.title.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{item.title}</h3>
                          {item.isLive && (
                            <Badge variant="default" className="bg-green-600">
                              LIVE
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">
                          Hosted by {item.host}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                      
                      {item.isLive && (
                        <Button
                          onClick={switchToRadio}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Listen
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Schedule Note */}
          <Card className="mt-8 border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                <strong>Note:</strong> This is a 24/7 continuous stream. Shows repeat throughout the day. 
                Times are approximate and may vary based on episode length and live content.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}