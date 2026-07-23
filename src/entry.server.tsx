// Polyfills MUST run before any other import so that window/document/
// localStorage exist before modules like @remix-run/router cache them.
import './lib/ssr-polyfills';

import { ViteReactSSG } from 'vite-react-ssg/single-page';
import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import NostrProvider from '@/components/NostrProvider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { NostrLoginProvider } from '@nostrify/react/login';
import { AppProvider } from '@/components/AppProvider';
import { NWCProvider } from '@/contexts/NWCContext';
import { AppConfig } from '@/contexts/AppContext';
import { AudioPlayerProvider } from '@/contexts/AudioPlayerContext';
import { ScrollToTop } from '@/components/ScrollToTop';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import Index from '@/pages/Index';
const About = lazy(() => import('@/pages/About'));
const Shows = lazy(() => import('@/pages/Shows'));
const Community = lazy(() => import('@/pages/Community'));
const Schedule = lazy(() => import('@/pages/Schedule'));
const PodcastPage = lazy(() => import('@/pages/PodcastPage'));
const EpisodePage = lazy(() => import('@/pages/EpisodePage'));
const NIP19Page = lazy(() => import('@/pages/NIP19Page').then(m => ({ default: m.NIP19Page })));
const NotFound = lazy(() => import('@/pages/NotFound'));

function PageSkeleton() {
  return (
    <div className="min-h-screen p-8">
      <Skeleton className="h-12 w-64 mb-4" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-3/4 mb-2" />
      <Skeleton className="h-6 w-1/2" />
    </div>
  );
}

const defaultConfig: AppConfig = {
  theme: 'light',
  relayUrl: 'wss://relay.primal.net',
};

const presetRelays = [
  { url: 'wss://ditto.pub/relay', name: 'Ditto' },
  { url: 'wss://relay.damus.io', name: 'Damus' },
  { url: 'wss://relay.primal.net', name: 'Primal' },
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000,
      gcTime: 5 * 60 * 1000,
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx client errors — they won't fix themselves
        const err = error as { status?: number; response?: { status?: number } };
        const status = err?.status ?? err?.response?.status ?? 0;
        if (status >= 400 && status < 500) return false;
        // Retry up to 2 times for transient failures with exponential backoff
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

function AppRoutes() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/shows" element={<Shows />} />
          <Route path="/community" element={<Community />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/podcast/:slug" element={<PodcastPage />} />
          <Route path="/podcast/:slug/episode/:episodeId" element={<EpisodePage />} />
          <Route path="/:nip19" element={<NIP19Page />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <AppProvider storageKey="nostr:app-config" defaultConfig={defaultConfig} presetRelays={presetRelays}>
        <QueryClientProvider client={queryClient}>
          <NostrLoginProvider storageKey="nostr:login">
            <NostrProvider>
              <NWCProvider>
                <AudioPlayerProvider>
                  <TooltipProvider>
                    <Toaster />
                    {children}
                  </TooltipProvider>
                </AudioPlayerProvider>
              </NWCProvider>
            </NostrProvider>
          </NostrLoginProvider>
        </QueryClientProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}

/**
 * Single-page SSG app.
 *
 * StaticRouter during SSR (no browser history API).
 * BrowserRouter on the client for SPA navigation.
 *
 * Detection: our SSR polyfill's document.querySelector always returns null.
 * On the real client, document.querySelector('html') returns the <html> element.
 */
function SsgApp() {
  const isSSR = typeof document !== 'undefined' && document.querySelector('html') === null;

  if (isSSR) {
    return (
      <Providers>
        <StaticRouter location="/">
          <AppRoutes />
        </StaticRouter>
      </Providers>
    );
  }

  return (
    <Providers>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </Providers>
  );
}

export const createRoot = ViteReactSSG(
  <SsgApp />,
  () => {},
);
