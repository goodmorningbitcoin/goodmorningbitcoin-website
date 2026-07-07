import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Headphones } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { parsePodcastXml } from '@/lib/podcastXmlParser';
import { fetchPodcastFeed } from '@/lib/fetchPodcastFeed';
import showsData from '../../public/shows.json';

interface Show {
  title: string;
  description: string;
  fountainlink: string;
  xlink: string;
  nostr: string;
  podcastXml: string;
}

export function FeaturedShow() {
  const featuredShow = useMemo(() => {
    const shows = showsData as Show[];
    return shows[Math.floor(Math.random() * shows.length)];
  }, []);

  // Fetch podcast data if XML is available
  const { data: podcastData, isLoading: isPodcastLoading } = useQuery({
    queryKey: ['podcast-data', featuredShow?.podcastXml],
    queryFn: async () => {
      if (!featuredShow?.podcastXml) return null;
      return fetchPodcastFeed(featuredShow.podcastXml);
    },
    enabled: !!featuredShow?.podcastXml,
    staleTime: 1800000, // 30 minutes
    retry: 1,
  });

  const isLoading = !featuredShow || (featuredShow.podcastXml && isPodcastLoading);
  const albumArtwork = podcastData?.image;

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl-bold">Featured Show</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <Skeleton className="w-full h-40 rounded" />
          <Skeleton className="h-6 w-3/4" />
          <div className="flex-1">
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!featuredShow) {
    return null;
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl-bold">Featured Show</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        {albumArtwork ? (
          <img 
            src={albumArtwork} 
            alt={featuredShow.title}
            className="w-full h-40 object-cover rounded"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-40 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded flex items-center justify-center">
            <div className="text-center text-orange-700 dark:text-orange-300">
              <div className="font-bold text-lg">{featuredShow.title}</div>
              <div className="text-sm opacity-75">Podcast Artwork</div>
            </div>
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-2">{featuredShow.title}</h3>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {featuredShow.description}
          </p>
        </div>
        <div className="mt-4">
          <Button asChild size="sm" className="w-full bg-gmb-orange hover:bg-[#d55520]">
            <Link to={`/podcast/${encodeURIComponent(featuredShow.title.toLowerCase().replace(/\s+/g, '-'))}`}>
              <Headphones className="h-4 w-4 mr-2" />
              Listen
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}