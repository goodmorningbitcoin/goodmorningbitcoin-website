// SSR-safe polyfills — must run before any provider imports.
// During vite-react-ssg build (no jsdom/mock), localStorage and
// window are undefined. Providers that access localStorage (NostrLogin,
// AppProvider, useLocalStorage) crash without these stubs.
const g = globalThis as Record<string, unknown>;
if (!g.localStorage) {
  const store = new Map<string, string>();
  g.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, String(value)); },
    removeItem: (key: string) => { store.delete(key); },
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() { return store.size; },
  };
}
if (!g.sessionStorage) {
  g.sessionStorage = g.localStorage;
}
if (!g.window) {
  // Minimal window stub for components that access window.* during render
  // (LoginDialog reads window.webln, etc.)
  g.window = {
    localStorage: g.localStorage,
    sessionStorage: g.sessionStorage,
    matchMedia: () => ({
      matches: false,
      media: '',
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
    addEventListener: () => {},
    removeEventListener: () => {},
    innerWidth: 1024,
    innerHeight: 768,
    location: { href: 'http://localhost:8080', pathname: '/', search: '', hash: '' },
    navigator: { userAgent: 'node' },
  };
}
// vite-react-ssg's client init code references document at module top level.
// Without mock:true it's undefined in pure Node SSR.
if (!g.document) {
  g.document = {
    querySelector: () => null,
    getElementById: () => null,
    createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {} }),
    addEventListener: () => {},
    removeEventListener: () => {},
    body: { appendChild: () => {}, insertBefore: () => {} },
    head: { appendChild: () => {} },
    readyState: 'complete',
    documentElement: { setAttribute: () => {}, getAttribute: () => null },
  };
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!g.matchMedia) {
  g.matchMedia = (g.window as any).matchMedia;
}

import { ViteReactSSG as ViteSSG } from 'vite-react-ssg';
import { Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy } from 'react';
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

// Eagerly load the homepage for fast initial render
import Index from '@/pages/Index';

// Lazy-load all other routes
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
  relayUrl: 'wss://relay.nostr.band',
};

const presetRelays = [
  { url: 'wss://ditto.pub/relay', name: 'Ditto' },
  { url: 'wss://relay.nostr.band', name: 'Nostr.Band' },
  { url: 'wss://relay.damus.io', name: 'Damus' },
  { url: 'wss://relay.primal.net', name: 'Primal' },
];

// During SSR (vite-react-ssg build), create QueryClient per request.
// On client, create a stable singleton.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000,
      gcTime: 5 * 60 * 1000,
      // Never retry during SSR — failed queries should just render
      // their skeleton/loading state, not crash the build
      retry: false,
    },
  },
});

/**
 * Root layout route — wraps all pages in the provider stack.
 * HelmetProvider is added by vite-react-ssg externally, so we start
 * with ErrorBoundary here.
 */
function RootLayout() {
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
                    <ScrollToTop />
                    <Suspense fallback={<PageSkeleton />}>
                      <Outlet />
                    </Suspense>
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

export const createRoot = ViteSSG(
  {
    routes: [
      {
        path: '/',
        element: <RootLayout />,
        children: [
          { index: true, element: <Index /> },
          { path: 'about', element: <About /> },
          { path: 'shows', element: <Shows /> },
          { path: 'community', element: <Community /> },
          { path: 'schedule', element: <Schedule /> },
          { path: 'podcast/:slug', element: <PodcastPage /> },
          { path: 'podcast/:slug/episode/:episodeId', element: <EpisodePage /> },
          { path: ':nip19', element: <NIP19Page /> },
          { path: '*', element: <NotFound /> },
        ],
      },
    ],
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  },
  // Setup function — runs on both server and client
  () => {},
  {
    // Client options
  }
);
