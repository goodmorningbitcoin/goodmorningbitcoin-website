import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { Skeleton } from "@/components/ui/skeleton";

// Eagerly load the homepage for fast initial render
import Index from "./pages/Index";

// Lazy-load all other routes to reduce initial bundle size
const About = lazy(() => import("./pages/About"));
const Shows = lazy(() => import("./pages/Shows"));
const Community = lazy(() => import("./pages/Community"));
const Schedule = lazy(() => import("./pages/Schedule"));
const PodcastPage = lazy(() => import("./pages/PodcastPage"));
const EpisodePage = lazy(() => import("./pages/EpisodePage"));
const NIP19Page = lazy(() => import("./pages/NIP19Page").then(m => ({ default: m.NIP19Page })));
const NotFound = lazy(() => import("./pages/NotFound"));

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

export function AppRouter() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
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
          {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
          <Route path="/:nip19" element={<NIP19Page />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
export default AppRouter;
