import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSeoMeta } from '@unhead/react';
import { Play, Calendar, Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { parsePodcastXml } from '@/lib/podcastXmlParser';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import showsData from '../../public/shows.json';

interface Show {
  title: string;
  description: string;
  fountainlink: string;
  xlink: string;
  nostr: string;
  podcastXml: string;
}

interface Episode {
  title: string;
  description: string;
  audioUrl: string;
  pubDate: string;
  duration?: string;
  link?: string;
}

export default function PodcastPage() {
  const { slug } = useParams<{ slug: string }>();
  const { setCurrentSource } = useAudioPlayer();

  // Find the show based on the slug
  const show = (showsData as Show[]).find(
    s => s.title.toLowerCase().replace(/\s+/g, '-') === slug
  );

  // Fetch podcast data
  const { data: podcastData, isLoading, error } = useQuery({
    queryKey: ['podcast-episodes', show?.podcastXml],
    queryFn: async () => {
      if (!show?.podcastXml) return null;
      
      const response = await fetch(show.podcastXml);
      const xmlText = await response.text();
      return parsePodcastXml(xmlText);
    },
    enabled: !!show?.podcastXml,
    staleTime: 1800000, // 30 minutes
    retry: 1,
  });

  useSeoMeta({
    title: show ? `${show.title} - Good Morning Bitcoin` : 'Podcast - Good Morning Bitcoin',
    description: show?.description || 'Listen to Bitcoin podcast episodes',
  });

  const playEpisode = async (episode: Episode) => {
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
      artist: show?.title || 'Unknown Show',
      showTitle: show?.title || 'Unknown Show',
    });
  };

  if (!show) {
    return (
      <Layout>
        <Header />
        <div className="max-w-4xl mx-auto py-10 px-4">
          <Card>
            <CardContent className="py-12 px-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Podcast Not Found</h1>
              <p className="text-muted-foreground mb-6">
                The podcast you're looking for doesn't exist.
              </p>
              <Button asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (!show.podcastXml) {
    return (
      <Layout>
        <Header />
        <div className="max-w-4xl mx-auto py-10 px-4">
          <Card>
            <CardContent className="py-12 px-8 text-center">
              <h1 className="text-2xl font-bold mb-4">{show.title}</h1>
              <p className="text-muted-foreground mb-6">
                This podcast doesn't have an RSS feed configured yet.
              </p>
              {show.fountainlink && (
                <Button asChild className="mb-4">
                  <a href={show.fountainlink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Listen on Fountain
                  </a>
                </Button>
              )}
              <div className="pt-4">
                <Button asChild variant="outline">
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Home
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <Header />
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
          {/* Header skeleton */}
          <Card>
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Episodes skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !podcastData) {
    return (
      <Layout>
        <Header />
        <div className="max-w-4xl mx-auto py-10 px-4">
          <Card>
            <CardContent className="py-12 px-8 text-center">
              <h1 className="text-2xl font-bold mb-4">{show.title}</h1>
              <p className="text-muted-foreground mb-6">
                Failed to load podcast episodes. Please try again later.
              </p>
              <Button asChild>
                <Link to="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      <Header />
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        {/* Podcast Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              {podcastData.image ? (
                <img
                  src={podcastData.image}
                  alt={show.title}
                  className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-orange-700 dark:text-orange-300">
                    <div className="font-bold text-sm">{show.title}</div>
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Link>
                  </Button>
                </div>
                <CardTitle className="text-2xl mb-3">{show.title}</CardTitle>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  {podcastData.description || show.description}
                </p>
                <div className="flex gap-2">
                  {show.fountainlink && (
                    <Button asChild size="sm" variant="outline">
                      <a href={show.fountainlink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Fountain
                      </a>
                    </Button>
                  )}
                  {show.xlink && (
                    <Button asChild size="sm" variant="outline">
                      <a href={show.xlink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        X/Twitter
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Episodes List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Episodes</h2>
          {podcastData.episodes && podcastData.episodes.length > 0 ? (
            <div className="space-y-3">
              {podcastData.episodes.map((episode, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Button
                        size="icon"
                        variant="default"
                        onClick={() => playEpisode(episode)}
                        className="flex-shrink-0 bg-gmb-orange hover:bg-[#d55520]"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-2 line-clamp-2">
                          {episode.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {episode.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(episode.pubDate)}</span>
                          </div>
                          {episode.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{episode.duration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 px-8 text-center">
                <p className="text-muted-foreground">
                  No episodes found for this podcast.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}