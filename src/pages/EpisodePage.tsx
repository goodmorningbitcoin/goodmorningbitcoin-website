import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSeoMeta, useHead } from '@unhead/react';
import { Play, Calendar, Clock, ExternalLink, ArrowLeft, Share2 } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { parsePodcastXml } from '@/lib/podcastXmlParser';
import { usePodcastPlayer } from '@/hooks/usePodcastPlayer';
import { useToast } from '@/hooks/useToast';
import showsData from '../../public/shows.json';

interface Show {
  title: string;
  description: string;
  fountainlink: string;
  xlink: string;
  nostr: string;
  podcastXml: string;
}

export default function EpisodePage() {
  const { slug, episodeId } = useParams<{ slug: string; episodeId: string }>();
  const { playEpisode } = usePodcastPlayer();
  const { toast } = useToast();

  const show = (showsData as Show[]).find(
    s => s.title.toLowerCase().replace(/\s+/g, '-') === decodeURIComponent(slug || '')
  );

  const { data: podcastData, isLoading, error } = useQuery({
    queryKey: ['podcast-episodes', show?.podcastXml],
    queryFn: async () => {
      if (!show?.podcastXml) return null;
      const response = await fetch(show.podcastXml);
      const xmlText = await response.text();
      return parsePodcastXml(xmlText);
    },
    enabled: !!show?.podcastXml,
    staleTime: 1800000,
    retry: 1,
  });

  // Find the episode by index (episodeId is the numeric index)
  const episodeIndex = episodeId ? parseInt(episodeId, 10) : -1;
  const episode = podcastData?.episodes?.[episodeIndex];

  const stripHtml = (html: string): string => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').trim();
  };

  const shareUrl = `https://goodmorningbitcoin.com/podcast/${slug}/episode/${episodeId}`;

  useSeoMeta({
    title: episode
      ? `${episode.title} - ${show?.title} | Good Morning Bitcoin Radio`
      : 'Episode - Good Morning Bitcoin Radio',
    description: episode
      ? stripHtml(episode.description).substring(0, 160)
      : 'Listen to this Bitcoin podcast episode on Good Morning Bitcoin Radio.',
    ogTitle: episode?.title || 'Bitcoin Podcast Episode',
    ogDescription: episode ? stripHtml(episode.description).substring(0, 160) : undefined,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    twitterTitle: episode?.title,
    twitterDescription: episode ? stripHtml(episode.description).substring(0, 120) : undefined,
  });

  useHead({
    link: [{ rel: 'canonical', href: shareUrl }],
  });

  const handlePlay = () => {
    if (show && episode) {
      playEpisode(show, episode);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: episode?.title || 'Good Morning Bitcoin',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link copied!', description: 'Episode URL copied to clipboard.' });
      }
    } catch {
      // User cancelled share — ignore
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
              <p className="text-muted-foreground mb-6">The podcast you're looking for doesn't exist.</p>
              <Button asChild>
                <Link to="/shows">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Browse Shows
                </Link>
              </Button>
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
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      </Layout>
    );
  }

  if (error || !podcastData || !episode) {
    return (
      <Layout>
        <Header />
        <div className="max-w-4xl mx-auto py-10 px-4">
          <Card>
            <CardContent className="py-12 px-8 text-center">
              <h1 className="text-2xl font-bold mb-4">Episode Not Found</h1>
              <p className="text-muted-foreground mb-6">
                This episode may have been removed from the podcast feed.
              </p>
              <div className="flex gap-2 justify-center">
                <Button asChild>
                  <Link to={`/podcast/${slug}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to {show.title}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Header />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "PodcastEpisode",
            "name": episode.title,
            "description": stripHtml(episode.description),
            "datePublished": episode.pubDate,
            "duration": episode.duration,
            "url": shareUrl,
            "associatedMedia": {
              "@type": "AudioObject",
              "contentUrl": episode.audioUrl,
              "encodingFormat": "audio/mpeg",
            },
            "partOfSeries": {
              "@type": "PodcastSeries",
              "name": show.title,
              "url": `https://goodmorningbitcoin.com/podcast/${slug}`,
            },
          }, null, 2),
        }}
      />

      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6">
        {/* Back + breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <Button asChild size="sm" variant="ghost">
            <Link to="/shows">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Shows
            </Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <Button asChild size="sm" variant="ghost">
            <Link to={`/podcast/${slug}`}>{show.title}</Link>
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground truncate">Episode</span>
        </div>

        {/* Episode Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              {podcastData.image ? (
                <img
                  src={podcastData.image}
                  alt={`${show.title} podcast artwork`}
                  className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                  loading="eager"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 rounded-lg flex items-center justify-center">
                  <div className="text-center text-orange-700 dark:text-orange-300">
                    <div className="font-bold text-sm">{show.title}</div>
                  </div>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl md:text-2xl mb-3">{episode.title}</CardTitle>
                <Link to={`/podcast/${slug}`} className="text-orange-600 dark:text-orange-400 hover:underline text-sm font-medium">
                  {show.title}
                </Link>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(episode.pubDate)}
                  </div>
                  {episode.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {episode.duration}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Play + Share buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handlePlay}
                className="bg-gmb-orange hover:bg-[#d55520]"
              >
                <Play className="h-4 w-4 mr-2" />
                Play Episode
              </Button>
              <Button onClick={handleShare} variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>

            {/* Full description rendered as HTML */}
            <div className="prose prose-sm dark:prose-invert max-w-none pt-4 border-t">
              <div dangerouslySetInnerHTML={{ __html: episode.description }} />
            </div>
          </CardContent>
        </Card>

        {/* More episodes link */}
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to={`/podcast/${slug}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              All {show.title} Episodes
            </Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
