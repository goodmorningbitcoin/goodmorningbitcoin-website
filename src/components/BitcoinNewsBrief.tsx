import { useQuery } from '@tanstack/react-query';
import { useRef, useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsPost {
  id: number;
  title: {
    rendered: string;
  };
  link: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
    }>;
  };
}

export function BitcoinNewsBrief() {
  const [visibleCount, setVisibleCount] = useState(4); // Start with a reasonable default
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['bitcoin-news'],
    queryFn: async () => {
      const response = await fetch('https://bitcoinnews.com/wp-json/wp/v2/posts?_embed&per_page=10');
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json();
      return data as NewsPost[];
    },
    staleTime: 300000, // 5 minutes
    retry: 2,
  });

  // Calculate how many articles fit in the available space
  useEffect(() => {
    if (!posts || !containerRef.current || !contentRef.current) return;

    const calculateVisibleCount = () => {
      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      // Get the available height for content
      const containerHeight = container.clientHeight;
      const header = container.querySelector('[data-header]');
      const headerHeight = header ? header.clientHeight : 0;
      const availableHeight = containerHeight - headerHeight - 24; // 24px for padding

      // Calculate height per article (approximately)
      const articles = content.children;
      if (articles.length === 0) return;

      const firstArticle = articles[0] as HTMLElement;
      const articleHeight = firstArticle.offsetHeight + 12; // 12px for gap (space-y-3)

      const maxVisible = Math.floor(availableHeight / articleHeight);
      setVisibleCount(Math.min(maxVisible, posts.length));
    };

    // Calculate on mount and when posts change
    calculateVisibleCount();

    // Recalculate on window resize
    const handleResize = () => {
      setTimeout(calculateVisibleCount, 100); // Small delay to ensure layout is stable
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [posts]);

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl-bold">Bitcoin News Brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 flex-1">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !posts) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl-bold">Bitcoin News Brief</CardTitle>
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
        <CardTitle className="text-xl-bold">Bitcoin News Brief</CardTitle>
      </CardHeader>
      <CardContent ref={contentRef} className="space-y-3 flex-1">
        {posts.slice(0, visibleCount).map((post) => (
          <div key={post.id} className="flex items-center space-x-3 group">
            {post._embedded?.['wp:featuredmedia']?.[0] && (
              <img 
                src={post._embedded['wp:featuredmedia'][0].source_url}
                alt=""
                className="w-10 h-10 object-cover rounded flex-shrink-0"
              />
            )}
            <a 
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline flex-1 text-sm line-clamp-2"
              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
            />
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}