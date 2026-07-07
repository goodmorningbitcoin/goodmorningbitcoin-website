import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Twitter } from 'lucide-react';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { useCurrentShowValue } from '@/hooks/useCurrentShowValue';
import { ValueSplitZapButton } from '@/components/ValueSplitZapButton';
import showsData from '../../public/shows.json';

interface Show {
  title: string;
  description: string;
  fountainlink: string;
  xlink: string;
  nostr: string;
  podcastXml: string;
}

export function CurrentShow() {
  const { data: nowPlaying, isLoading } = useNowPlaying();
  const { metadata, valueBlock, hasValueSplits } = useCurrentShowValue();

  const currentShow = useMemo(() => {
    if (!nowPlaying) return null;
    
    // First try to use metadata from podcast XML
    if (metadata?.title) {
      const matchingShow = (showsData as Show[]).find(show => 
        show.title.toLowerCase() === metadata.title?.toLowerCase()
      );
      if (matchingShow) return matchingShow;
    }
    
    // Fallback to matching by song/artist
    const songTitle = nowPlaying.now_playing.song.title?.toLowerCase() || '';
    const artist = nowPlaying.now_playing.song.artist?.toLowerCase() || '';
    
    return (showsData as Show[]).find(show => {
      const showTitle = show.title.toLowerCase();
      return songTitle.includes(showTitle) || artist.includes(showTitle);
    });
  }, [nowPlaying, metadata]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Now Playing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Skeleton className="h-20 w-20 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentShow) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Good Morning Bitcoin</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {metadata?.description || 'Welcome to Good Morning Bitcoin - Your daily dose of Bitcoin news and podcasts!'}
            </p>
            
            <div className="flex gap-2 flex-wrap">
              <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900">
                24/7 Bitcoin Content
              </Badge>
              
              {hasValueSplits && (
                <Badge variant="secondary" className="text-xs">
                  ⚡ Podcasting 2.0 Enabled
                </Badge>
              )}
            </div>

            {hasValueSplits && valueBlock && (
              <ValueSplitZapButton
                valueBlock={valueBlock}
                showTitle={metadata?.title || 'Good Morning Bitcoin'}
              />
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Now Playing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Avatar className="h-20 w-20 rounded-lg">
              <AvatarImage src={undefined} alt={currentShow.title} />
              <AvatarFallback className="rounded-lg">
                {currentShow.title.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">
                {metadata?.title || currentShow.title}
              </h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {metadata?.description || currentShow.description}
              </p>
              
              {hasValueSplits && (
                <div className="mb-3">
                  <Badge variant="secondary" className="text-xs">
                    ⚡ Podcasting 2.0 Enabled
                  </Badge>
                </div>
              )}
              
              <div className="flex gap-2 flex-wrap">
                {hasValueSplits && valueBlock && (
                  <ValueSplitZapButton
                    valueBlock={valueBlock}
                    showTitle={metadata?.title || currentShow.title}
                  />
                )}
                
                {currentShow.fountainlink && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a href={currentShow.fountainlink} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Fountain
                    </a>
                  </Button>
                )}
                
                {currentShow.xlink && (
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                  >
                    <a href={currentShow.xlink} target="_blank" rel="noopener noreferrer">
                      <Twitter className="h-4 w-4 mr-1" />
                      Twitter
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}