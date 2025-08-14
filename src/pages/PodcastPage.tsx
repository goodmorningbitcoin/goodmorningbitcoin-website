import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSeoMeta, useHead } from '@unhead/react';
import { Play, Calendar, Clock, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { parsePodcastXml } from '@/lib/podcastXmlParser';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { generateBreadcrumbSchema } from '@/lib/seoUtils';
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

  // Enhanced SEO metadata that updates with dynamic content
  useSeoMeta({
    title: show 
      ? `${show.title} - Bitcoin Podcast Episodes | Good Morning Bitcoin Radio`
      : 'Bitcoin Podcast - Good Morning Bitcoin Radio',
    description: show
      ? `Listen to ${show.title} episodes on Good Morning Bitcoin Radio. ${show.description} Stream Bitcoin podcasts with Lightning support and zap your favorite creators.`
      : 'Listen to Bitcoin podcast episodes on Good Morning Bitcoin Radio',
    keywords: show
      ? `${show.title}, bitcoin podcast, ${show.title.toLowerCase()}, bitcoin episodes, cryptocurrency podcast, bitcoin radio, lightning zaps, ${show.title} episodes`
      : 'bitcoin podcast, cryptocurrency podcast, bitcoin radio',
    
    // Open Graph tags
    ogTitle: show 
      ? `${show.title} - Bitcoin Podcast Episodes`
      : 'Bitcoin Podcast Episodes',
    ogDescription: show
      ? `Listen to ${show.title} on Good Morning Bitcoin Radio. ${show.description.substring(0, 160)}...`
      : 'Listen to Bitcoin podcast episodes',
    ogType: 'website',
    ogSiteName: 'Good Morning Bitcoin Radio',
    ogUrl: `https://goodmorningbitcoin.com/podcast/${slug}`,
    ogImage: podcastData?.image || 'https://goodmorningbitcoin.com/og-podcast.jpg', // Fallback OG image
    
    // Twitter Card tags
    twitterCard: 'summary_large_image',
    twitterTitle: show 
      ? `${show.title} - Bitcoin Podcast Episodes`
      : 'Bitcoin Podcast Episodes',
    twitterDescription: show
      ? `Listen to ${show.title} episodes. ${show.description.substring(0, 120)}...`
      : 'Listen to Bitcoin podcast episodes',
    twitterImage: podcastData?.image || 'https://goodmorningbitcoin.com/twitter-podcast.jpg',
    
    // Additional SEO tags  
    robots: 'index,follow',
  });

  // Add canonical link
  useHead({
    link: [
      {
        rel: 'canonical',
        href: `https://goodmorningbitcoin.com/podcast/${slug}`
      }
    ]
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
      valueBlock: podcastData?.valueBlock as unknown as Record<string, unknown>,
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

  // Generate JSON-LD structured data for SEO
  const generateStructuredData = () => {
    if (!show || !podcastData) return null;

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "PodcastSeries",
      "name": show.title,
      "description": podcastData.description || show.description,
      "url": `https://goodmorningbitcoin.com/podcast/${slug}`,
      "image": podcastData.image,
      "author": {
        "@type": "Person",
        "name": show.title
      },
      "publisher": {
        "@type": "Organization",
        "name": "Good Morning Bitcoin Radio",
        "url": "https://goodmorningbitcoin.com"
      },
      "genre": ["Bitcoin", "Cryptocurrency", "Technology", "Finance"],
      "inLanguage": "en-US",
      "associatedMedia": podcastData.episodes?.slice(0, 5).map((episode, index) => ({
        "@type": "PodcastEpisode",
        "name": episode.title,
        "description": episode.description,
        "url": `https://goodmorningbitcoin.com/podcast/${slug}#episode-${index}`,
        "datePublished": episode.pubDate,
        "duration": episode.duration,
        "associatedMedia": {
          "@type": "AudioObject",
          "contentUrl": episode.audioUrl,
          "encodingFormat": "audio/mpeg"
        },
        "partOfSeries": {
          "@type": "PodcastSeries",
          "name": show.title,
          "url": `https://goodmorningbitcoin.com/podcast/${slug}`
        }
      })),
      "mainEntity": {
        "@type": "WebPage",
        "name": `${show.title} - Bitcoin Podcast Episodes`,
        "url": `https://goodmorningbitcoin.com/podcast/${slug}`,
        "description": `Listen to ${show.title} episodes on Good Morning Bitcoin Radio`,
        "isPartOf": {
          "@type": "WebSite",
          "name": "Good Morning Bitcoin Radio",
          "url": "https://goodmorningbitcoin.com"
        }
      }
    };

    return structuredData;
  };

  return (
    <Layout>
      <Header />
      
      {/* JSON-LD Structured Data */}
      {show && podcastData && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateStructuredData(), null, 2)
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(generateBreadcrumbSchema(show.title, slug || ''), null, 2)
            }}
          />
        </>
      )}
      
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-6" itemScope itemType="https://schema.org/PodcastSeries">
        {/* Podcast Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              {podcastData.image ? (
                <img
                  src={podcastData.image}
                  alt={`${show.title} podcast artwork`}
                  className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                  itemProp="image"
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
                <div className="flex items-center gap-2 mb-2">
                  <Button asChild size="sm" variant="outline">
                    <Link to="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Link>
                  </Button>
                </div>
                <CardTitle className="text-2xl mb-3" itemProp="name">
                  <h1 className="m-0 p-0 text-inherit font-inherit">{show.title}</h1>
                </CardTitle>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4" itemProp="description">
                  {podcastData.description || show.description}
                </p>
                
                {/* Hidden SEO metadata */}
                <div className="sr-only">
                  <meta itemProp="url" content={`https://goodmorningbitcoin.com/podcast/${slug}`} />
                  <meta itemProp="genre" content="Bitcoin" />
                  <meta itemProp="genre" content="Cryptocurrency" />
                  <meta itemProp="inLanguage" content="en-US" />
                  <span itemProp="publisher" itemScope itemType="https://schema.org/Organization">
                    <meta itemProp="name" content="Good Morning Bitcoin Radio" />
                    <meta itemProp="url" content="https://goodmorningbitcoin.com" />
                  </span>
                </div>
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
            <div className="space-y-3" itemProp="episode">
              {podcastData.episodes.map((episode, index) => (
                <Card 
                  key={index} 
                  className="hover:shadow-md transition-shadow" 
                  itemScope 
                  itemType="https://schema.org/PodcastEpisode"
                  id={`episode-${index}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Button
                        size="icon"
                        variant="default"
                        onClick={() => playEpisode(episode)}
                        className="flex-shrink-0 bg-gmb-orange hover:bg-[#d55520]"
                        aria-label={`Play ${episode.title}`}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-2 line-clamp-2" itemProp="name">
                          {episode.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3" itemProp="description">
                          {episode.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <time itemProp="datePublished" dateTime={new Date(episode.pubDate).toISOString()}>
                              {formatDate(episode.pubDate)}
                            </time>
                          </div>
                          {episode.duration && (
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span itemProp="duration" content={episode.duration}>
                                {episode.duration}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Hidden episode metadata */}
                        <div className="sr-only">
                          <meta itemProp="url" content={`https://goodmorningbitcoin.com/podcast/${slug}#episode-${index}`} />
                          <span itemProp="associatedMedia" itemScope itemType="https://schema.org/AudioObject">
                            <meta itemProp="contentUrl" content={episode.audioUrl} />
                            <meta itemProp="encodingFormat" content="audio/mpeg" />
                          </span>
                          <span itemProp="partOfSeries" itemScope itemType="https://schema.org/PodcastSeries">
                            <meta itemProp="name" content={show.title} />
                            <meta itemProp="url" content={`https://goodmorningbitcoin.com/podcast/${slug}`} />
                          </span>
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