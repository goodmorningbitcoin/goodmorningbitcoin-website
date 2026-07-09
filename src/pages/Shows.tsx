import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalLink, Twitter, Search, Play, Eye } from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { fetchPodcastFeed } from '@/lib/fetchPodcastFeed';
import { Seo, JsonLd, breadcrumbSchema } from '@/lib/useSeo';
import showsData from '../../public/shows.json';

interface Show {
  title: string;
  description: string;
  fountainlink: string;
  xlink: string;
  nostr: string;
  podcastXml: string;
}

export default function Shows() {
  const shows = showsData as Show[];

  const [searchTerm, setSearchTerm] = useState('');
  const [showImages, setShowImages] = useState<Record<string, string>>({});
  const { setCurrentSource } = useAudioPlayer();

  // Fetch show images from RSS feeds
  useEffect(() => {
    let cancelled = false;
    const shows = showsData as Show[];

    // Update images individually as each resolves so fast feeds
    // don't wait on slow proxy-fallback feeds
    shows.forEach(async (show) => {
      if (!show.podcastXml) return;
      try {
        const podcastData = await fetchPodcastFeed(show.podcastXml);
        if (cancelled) return;
        if (podcastData?.image) {
          setShowImages(prev => ({ ...prev, [show.title]: podcastData.image! }));
        }
      } catch {
        // Feed failed — leave placeholder
      }
    });

    return () => { cancelled = true; };
  }, []);

  const filteredShows = (showsData as Show[]).filter(show =>
    show.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    show.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const playLatestEpisode = async (show: Show) => {
    if (!show.podcastXml) {
      console.warn('No podcast XML available for', show.title);
      return;
    }
    
    try {
      const podcastData = await fetchPodcastFeed(show.podcastXml);
      
      if (podcastData && podcastData.episodes && podcastData.episodes.length > 0) {
        // Get the latest episode (first in the array)
        const latestEpisode = podcastData.episodes[0];
        
        // For complex tracking URLs, try to resolve to final URL first
        let finalAudioUrl = latestEpisode.audioUrl;
        
        // If the URL contains multiple redirects/tracking, try to get the final URL
        if (latestEpisode.audioUrl.includes('podtrac.com') || latestEpisode.audioUrl.includes('op3.dev')) {
          try {
            // Make a HEAD request to follow redirects and get the final URL
            const headResponse = await fetch(latestEpisode.audioUrl, { method: 'HEAD' });
            if (headResponse.ok) {
              finalAudioUrl = headResponse.url;
            }
          } catch (error) {
          }
        }
        
        setCurrentSource({
          type: 'podcast',
          url: finalAudioUrl,
          title: latestEpisode.title,
          artist: show.title,
          showTitle: show.title,
          valueBlock: podcastData.valueBlock as unknown as Record<string, unknown>,
        });
      } else {
        console.warn('No episodes found in podcast feed for', show.title);
        // Fallback to radio stream
        setCurrentSource({
          type: 'radio',
          url: 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3',
          title: 'Good Morning Bitcoin Radio',
          artist: 'Live Stream',
        });
      }
    } catch (error) {
      console.error('Error fetching podcast feed for', show.title, error);
      // Fallback to radio stream
      setCurrentSource({
        type: 'radio',
        url: 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3',
        title: 'Good Morning Bitcoin Radio',
        artist: 'Live Stream',
      });
    }
  };

  return (
    <Layout>
      <Seo
        title="Bitcoin Podcast Directory - Shows | Good Morning Bitcoin Radio"
        description="Discover the best Bitcoin podcasts and shows featured on Good Morning Bitcoin Radio. Stream episodes from top Bitcoin podcasters, educators, and thought leaders in the Bitcoin space."
        path="/shows"
        keywords="bitcoin podcasts, bitcoin shows, bitcoin podcast directory, bitcoin radio shows, btc podcasts, bitcoin content, bitcoin education, good morning bitcoin shows"
      />
      <JsonLd
        schemas={[
          breadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Shows', path: '/shows' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Bitcoin Podcast Directory',
            numberOfItems: shows.length,
            itemListElement: shows.map((show, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'PodcastSeries',
                name: show.title,
                description: show.description,
                url: `https://goodmorningbitcoin.com/podcast/${encodeURIComponent(show.title.toLowerCase().replace(/\s+/g, '-'))}`,
              },
            })),
          },
        ]}
      />
      <Header />
      
      {/* Hero Header Section */}
      <section className="bg-background py-12" itemScope itemType="https://schema.org/CollectionPage">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border">
            <meta itemProp="description" content="Directory of Bitcoin podcasts and shows featured on Good Morning Bitcoin Radio" />
            
            {/* Brand Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-3" itemProp="name">
                Bitcoin Podcast Directory
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                Discover the Voice of Bitcoin Community
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mt-4 rounded-full"></div>
            </div>

            {/* Description and Search */}
            <div className="max-w-3xl mx-auto text-center mb-8">
              <p className="text-lg text-muted-foreground mb-6">
                Stream episodes from top Bitcoin podcasters, educators, and thought leaders. 
                Support your favorite shows with Lightning zaps and discover new voices in the Bitcoin space.
              </p>
              
              <div className="relative max-w-md mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search Bitcoin podcasts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 text-base"
                />
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex justify-center items-center gap-8 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                {(showsData as Show[]).length} Bitcoin Podcasts
              </span>
              <span>•</span>
              <span>Updated Daily</span>
              <span>•</span>
              <span>Lightning Enabled</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredShows.map((show) => (
              <Card key={show.title} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16 rounded-lg">
                      {showImages[show.title] && (
                        <AvatarImage 
                          src={showImages[show.title]} 
                          alt={show.title}
                          className="rounded-lg object-cover"
                        />
                      )}
                      <AvatarFallback className="rounded-lg bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 text-orange-700 dark:text-orange-300">
                        {show.title.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2 mb-1">{show.title}</CardTitle>
                      
                      {/* Social buttons below title */}
                      <div className="flex gap-2">
                        {show.fountainlink && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <a href={show.fountainlink} target="_blank" rel="noopener noreferrer" title="Fountain">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        
                        {show.xlink && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="h-8 w-8 p-0"
                          >
                            <a href={show.xlink} target="_blank" rel="noopener noreferrer" title="Twitter/X">
                              <Twitter className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {show.description}
                  </p>
                  
                  {/* Action buttons */}
                  <div className="flex gap-2 mb-4">
                    {show.podcastXml && (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => playLatestEpisode(show)}
                          className="bg-orange-500 hover:bg-orange-600 flex-1"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Play Latest
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="flex-1"
                        >
                          <Link to={`/podcast/${encodeURIComponent(show.title.toLowerCase().replace(/\s+/g, '-'))}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            View Show
                          </Link>
                        </Button>
                      </>
                    )}
                  </div>
                  
                  {!show.nostr && !show.podcastXml && (
                    <Badge variant="secondary" className="text-xs">
                      Coming Soon
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredShows.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No shows found matching "{searchTerm}"
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
