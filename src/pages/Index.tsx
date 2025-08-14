import { useSeoMeta } from '@unhead/react';
import { Play, Radio, Music, Users } from 'lucide-react';
import { WebSiteSchema } from '@/components/WebSiteSchema';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/Header';
import { FeaturedShow } from '@/components/FeaturedShow';
import { BitcoinNewsBrief } from '@/components/BitcoinNewsBrief';
import { Bitcoin101 } from '@/components/Bitcoin101';
import { EmailSignup } from '@/components/EmailSignup';
import { NetworkStats } from '@/components/NetworkStats';
import { RecentEpisodes } from '@/components/RecentEpisodes';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useNowPlaying } from '@/hooks/useNowPlaying';
import { LiveChat } from '@/components/LiveChat';

export default function Index() {
  const { setCurrentSource, togglePlay, currentSource, isPlaying } = useAudioPlayer();
  const { data: nowPlaying } = useNowPlaying();
  
  useSeoMeta({
    title: 'Good Morning Bitcoin Radio - 24/7 Bitcoin Podcast & News Stream',
    description: 'Listen to Good Morning Bitcoin Radio - the premier 24/7 Bitcoin radio station streaming curated podcasts, breaking news, and community discussions. Join thousands of Bitcoiners worldwide for the voice of Bitcoin, every morning.',
    keywords: 'bitcoin radio, good morning bitcoin, bitcoin podcast, bitcoin news, cryptocurrency radio, bitcoin stream, bitcoin community, bitcoin 247, btc radio, bitcoin audio',
    ogTitle: 'Good Morning Bitcoin Radio - 24/7 Bitcoin Podcast & News Stream',
    ogDescription: 'Listen to Good Morning Bitcoin Radio - the premier 24/7 Bitcoin radio station streaming curated podcasts, breaking news, and community discussions.',
    ogType: 'website',
    ogSiteName: 'Good Morning Bitcoin Radio',
    twitterCard: 'summary_large_image',
    twitterTitle: 'Good Morning Bitcoin Radio - 24/7 Bitcoin Stream',
    twitterDescription: 'The voice of Bitcoin, every morning. Join thousands listening to 24/7 Bitcoin radio.',
  });

  const handlePlayRadio = () => {
    // Set radio source if not already set
    if (currentSource?.type !== 'radio') {
      setCurrentSource({
        type: 'radio',
        url: 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3',
        title: 'Good Morning Bitcoin Radio',
        artist: 'Live Stream',
      });
    } else {
      // If already on radio, just toggle play
      togglePlay();
    }
  };

  return (
    <Layout>
      {/* WebSite Schema for homepage */}
      <WebSiteSchema />
      
      <Header />
      
      {/* Hero/Now Playing Section */}
      <section className="bg-background py-12" itemScope itemType="https://schema.org/RadioStation">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel - Now Playing (2/3) */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border">
                <meta itemProp="description" content="24/7 Bitcoin radio station streaming curated podcasts, news, and community discussions" />
                <meta itemProp="genre" content="Bitcoin, Cryptocurrency, Finance, Technology" />
                <meta itemProp="broadcastAffiliateOf" content="Good Morning Bitcoin" />
                
                {/* Brand Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-3" itemProp="name">
                    Good Morning Bitcoin
                  </h1>
                  <p className="text-xl md:text-2xl text-muted-foreground font-medium">
                    The Voice of Bitcoin, Every Morning
                  </p>
                  <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mt-4 rounded-full"></div>
                </div>

                {/* Now Playing Card */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 mb-6">
                  <div className="flex items-center gap-6">
                    {/* Artwork */}
                    <div className="relative">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl flex-shrink-0 overflow-hidden shadow-lg">
                        {currentSource?.type === 'radio' && nowPlaying?.now_playing.song.art ? (
                          <img 
                            src={nowPlaying.now_playing.song.art}
                            alt={`${nowPlaying.now_playing.song.title} artwork`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-gradient-to-br from-orange-200 to-orange-300 dark:from-orange-800 dark:to-orange-900 rounded-xl flex items-center justify-center ${
                          currentSource?.type === 'radio' && nowPlaying?.now_playing.song.art ? 'hidden' : ''
                        }`}>
                          {currentSource?.type === 'radio' ? (
                            <Radio className="h-8 w-8 md:h-10 md:w-10 text-orange-600 dark:text-orange-400" />
                          ) : currentSource?.type === 'podcast' ? (
                            <Music className="h-8 w-8 md:h-10 md:w-10 text-orange-600 dark:text-orange-400" />
                          ) : (
                            <Radio className="h-8 w-8 md:h-10 md:w-10 text-orange-600 dark:text-orange-400" />
                          )}
                        </div>
                      </div>
                      {/* Live indicator overlay */}
                      {currentSource?.type === 'radio' && nowPlaying && (
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                          LIVE
                        </div>
                      )}
                    </div>
                    
                    {/* Now Playing Info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-1">
                        Now Playing
                      </div>
                      <h3 className="text-lg md:text-xl font-bold text-foreground mb-1 line-clamp-1">
                        {currentSource?.type === 'radio' && nowPlaying?.now_playing.song.title
                          ? nowPlaying.now_playing.song.title
                          : currentSource?.type === 'podcast' && currentSource?.title
                          ? currentSource.title
                          : 'Live Bitcoin Radio'}
                      </h3>
                      <p className="text-sm md:text-base text-muted-foreground line-clamp-1">
                        {currentSource?.type === 'radio' && nowPlaying?.now_playing.song.artist && nowPlaying?.now_playing.song.album
                          ? `${nowPlaying.now_playing.song.artist} • ${nowPlaying.now_playing.song.album}`
                          : currentSource?.type === 'radio' && nowPlaying?.now_playing.song.artist
                          ? nowPlaying.now_playing.song.artist
                          : currentSource?.type === 'podcast' && currentSource?.artist
                          ? currentSource.artist
                          : 'Streaming live from the Bitcoin community'}
                      </p>
                      {currentSource?.type === 'radio' && nowPlaying && (
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {nowPlaying.listeners.current} listening
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CTA Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-foreground mb-1">
                      Join Bitcoiners listening worldwide
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        Streaming 24/7
                      </span>
                      <span>•</span>
                      <span>No ads</span>
                      <span>•</span>
                      <span>Pure Bitcoin signal</span>
                    </p>
                  </div>
                  <Button 
                    onClick={handlePlayRadio}
                    size="lg"
                    className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-105"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    {isPlaying && currentSource?.type === 'radio' ? 'Listening Live' : 'Start Listening Now'}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Right Panel - Live Chat (1/3) */}
            <div className="lg:col-span-1">
              <LiveChat />
            </div>
          </div>
        </div>
      </section>

      {/* Bitcoin Network Stats */}
      <section className="max-w-6xl mx-auto px-4">
        <NetworkStats />
      </section>

      {/* Main Content Grid */}
      <main className="max-w-6xl mx-auto pt-10 pb-10 px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Featured Show */}
        <section className="md:col-span-1 flex">
          <FeaturedShow />
        </section>

        {/* Bitcoin News Brief */}
        <section className="md:col-span-1 flex">
          <BitcoinNewsBrief />
        </section>

        {/* Bitcoin 101 + Email Signup */}
        <div className="md:col-span-1 flex flex-col space-y-6">
          <Bitcoin101 />
          <EmailSignup />
        </div>

        {/* Network Stats */}
        <section className="md:col-span-3">
          <NetworkStats />
        </section>

        {/* Recent Episodes */}
        <section className="md:col-span-3">
          <RecentEpisodes />
        </section>
      </main>
    </Layout>
  );
}