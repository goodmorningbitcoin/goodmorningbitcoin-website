import { useEffect, useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useCitadelWire } from '@/hooks/useCitadelWire';
import { CITADEL_WIRE_URL } from '@/lib/constants';

// Desktop: dynamically fit items to match adjacent column height.
// Mobile: fixed count to avoid scroll feedback loops (measure → layout
// shift → resize → re-measure → repeat).
const MOBILE_COUNT = 6;

export function CitadelWireNews() {
  const [visibleCount, setVisibleCount] = useState(MOBILE_COUNT);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: stories, isLoading, error } = useCitadelWire(5);

  // Dynamic item count on desktop only (md breakpoint = 768px).
  // Mobile uses the fixed MOBILE_COUNT and never enters the measure path.
  useEffect(() => {
    if (!stories || !containerRef.current || !contentRef.current) return;

    const calculateVisibleCount = () => {
      // Only calculate on desktop layout
      if (window.innerWidth < 768) {
        setVisibleCount(MOBILE_COUNT);
        return;
      }

      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      const containerHeight = container.clientHeight;
      const header = container.querySelector('[data-header]');
      const headerHeight = header ? header.clientHeight : 0;
      const availableHeight = containerHeight - headerHeight - 24;

      const articles = content.children;
      if (articles.length === 0) return;

      const firstArticle = articles[0] as HTMLElement;
      const articleHeight = firstArticle.offsetHeight + 12;

      const maxVisible = Math.floor(availableHeight / articleHeight);
      setVisibleCount(Math.min(maxVisible, stories.length));
    };

    calculateVisibleCount();

    const handleResize = () => {
      setTimeout(calculateVisibleCount, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [stories]);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl-bold">Citadel Wire</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !stories || stories.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl-bold">Citadel Wire</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-muted-foreground">Failed to load news.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card ref={containerRef} className="h-full flex flex-col">
      <CardHeader data-header>
        <CardTitle className="text-xl-bold">
          <a href={CITADEL_WIRE_URL} target="_blank" rel="noopener noreferrer" className="hover:underline">
            Citadel Wire
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent ref={contentRef} className="space-y-3 flex-1">
        {stories.slice(0, visibleCount).map((story, idx) => (
          <div key={idx} className="flex items-start space-x-3 group">
            <a
              href={story.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline flex-1 text-sm line-clamp-2"
            >
              {story.headline}
            </a>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 mt-1" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
