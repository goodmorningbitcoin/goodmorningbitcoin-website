import { useSeo, breadcrumbSchema, useJsonLd } from '@/lib/useSeo';
import { Link } from 'react-router-dom';
import { Radio, Heart, ExternalLink, Play, Users } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import showsData from '../../public/shows.json';

interface Show {
  title: string;
  description: string;
  fountainlink: string;
  xlink: string;
  nostr: string;
  podcastXml: string;
}

export default function About() {
  const shows = showsData as Show[];
  const { setCurrentSource, togglePlay, currentSource, isPlaying } = useAudioPlayer();

  useSeo({
    title: 'About - Good Morning Bitcoin Radio',
    description: 'Good Morning Bitcoin started as an in-game radio station in Rust on the Orange Bitcoin server. Now it is a 24/7 internet radio station streaming across the globe, including Nostr Radio.',
    path: '/about',
    keywords: 'good morning bitcoin, bitcoin radio, rust game radio, orange bitcoin server, nostr radio, bitcoin community, bitcoin podcast station',
  });

  useJsonLd([
    breadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'About', path: '/about' },
    ]),
  ]);

  const handlePlayRadio = () => {
    if (currentSource?.type !== 'radio') {
      setCurrentSource({
        type: 'radio',
        url: 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3',
        title: 'Good Morning Bitcoin Radio',
        artist: 'Live Stream',
      });
    } else {
      togglePlay();
    }
  };

  return (
    <Layout>
      <Header />

      {/* Hero */}
      <section className="bg-background py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-3">
              About Good Morning Bitcoin
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              From in-game radio to 24/7 Bitcoin broadcast
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-orange-500 to-orange-400 mx-auto mt-4 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* Origin Story */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Radio className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold">How It Started</h2>
            </div>

            <div className="space-y-4 text-muted-foreground">
              <p>
                Good Morning Bitcoin began as a radio station inside the game <strong className="text-foreground">Rust</strong> on the{' '}
                <a href="https://orangem.art" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 font-semibold hover:underline">
                  Orange Bitcoin server
                </a>. The mission was simple: give gamers a way to
                learn about Bitcoin while they played. Players could tune in to curated Bitcoin podcasts and educational content
                streamed directly through the in-game radio, turning mining and raiding time into learning time.
              </p>
              <p>
                What started as an experiment in reaching gamers where they already were has grown into something much bigger.
                Today, Good Morning Bitcoin is a full <strong className="text-foreground">24/7 internet radio station</strong> streaming
                curated Bitcoin podcasts, news, and community discussions around the clock.
              </p>
              <p>
                The station is now listed across a number of internet radio directories, including
                <a href="https://nostr.blue/naddr1qqjxzdrxv5cxxvfk943r2drz956rzve495urxwtr95unjcmp8pjxzepkxccnjq3qn35s0hnjukw675njzqargeym7l9qzpg2dr6q9924yr798kafwvxsxpqqqpaq2va54sn" target="_blank" rel="noopener noreferrer" className="text-orange-600 dark:text-orange-400 font-semibold hover:underline">
                  {' '}Nostr Radio
                </a>, making it accessible to listeners worldwide through any
                radio app, browser, or Nostr client. No ads. No sponsors. Just pure Bitcoin signal.
              </p>
            </div>

            {/* Rust radio image */}
            <div className="mt-8 rounded-xl overflow-hidden shadow-lg">
              <img
                src="/assets/img/rust-radio.jpg"
                alt="In-game radio in Rust on the Orange Bitcoin server"
                className="w-full object-cover"
                loading="lazy"
              />
              <p className="text-xs text-muted-foreground text-center pt-2 pb-1">
                The in-game radio that started it all — Rust on the Orange Bitcoin server
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Thank You to Podcasters */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <Heart className="h-6 w-6 text-orange-500" />
            <h2 className="text-2xl md:text-3xl font-bold">Thank You to the Podcasters</h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Good Morning Bitcoin would not exist without the incredible podcasters who generously share their content
            to be part of the station. These are the voices of the Bitcoin community.{' '}
            <span className="text-orange-600 dark:text-orange-400 font-semibold">Thank you to all of them.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {shows.map((show) => {
            const slug = show.title.toLowerCase().replace(/\s+/g, '-');
            return (
              <Link
                key={show.title}
                to={`/podcast/${encodeURIComponent(slug)}`}
                className="group flex flex-col items-center text-center p-4 bg-white dark:bg-gray-900 rounded-xl border hover:border-orange-400 hover:shadow-md transition-all"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900 dark:to-orange-800 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <Radio className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-sm font-medium leading-tight">{show.title}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            );
          })}
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold">Our Mission</h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Spread Bitcoin knowledge to as many people as possible — starting with gamers and growing to anyone
                with an internet connection. The station runs 24/7 with zero ads and zero corporate sponsors. It is
                powered entirely by the Bitcoin community and the podcasters who donate their content.
              </p>
              <p>
                Whether you are building in Rust, commuting to work, or falling down the Bitcoin rabbit hole for the
                first time, Good Morning Bitcoin is here to be your soundtrack.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Call to Action */}
      <section className="max-w-4xl mx-auto px-4 py-8 pb-16">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-center text-white shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Start Listening</h2>
          <p className="text-white/80 mb-6">24/7 Bitcoin radio, streaming now.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handlePlayRadio}
              size="lg"
              className="bg-white text-orange-600 hover:bg-white/90 font-semibold px-8"
            >
              <Play className="h-5 w-5 mr-2" />
              {isPlaying && currentSource?.type === 'radio' ? 'Listening Live' : 'Play Radio'}
            </Button>
            <Button
              asChild
              size="lg"
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold px-8"
            >
              <Link to="/shows">
                <Users className="h-5 w-5 mr-2" />
                Browse Shows
              </Link>
            </Button>
          </div>
        </div>
      </section>

    </Layout>
  );
}
