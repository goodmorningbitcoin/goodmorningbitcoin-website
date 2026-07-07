import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface NewsItem {
  title: string;
  link: string;
  thumbnail: string;
  pubDate: string;
}

interface Rss2JsonResponse {
  status: string;
  feed?: {
    title: string;
    link: string;
  };
  items?: Array<{
    title: string;
    link: string;
    thumbnail: string;
    pubDate: string;
  }>;
}

// Fixed number of articles to show. No dynamic height calculation —
// that caused render loops on mobile (scroll → resize → recalculate →
// count change → layout shift → repeat).
const VISIBLE_COUNT = 6;

export function BitcoinNewsBrief() {
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ['bitcoin-news'],
    queryFn: async () => {
      const response = await fetch(
        'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fbitcoinmagazine.com%2Ffeed&count=10'
      );
      if (!response.ok) {
        throw new Error('Failed to fetch news');
      }
      const data = await response.json() as Rss2JsonResponse;
      if (data.status !== 'ok' || !data.items) {
        throw new Error('News feed returned error status');
      }
      return data.items as NewsItem[];
    },
    staleTime: 300000, // 5 minutes
    retry: 2,
  });

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle className="text-xl-bold">Bitcoin News Brief</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 flex-1">
          {Array.from({ length: VISIBLE_COUNT }).map((_, i) => (
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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-xl-bold">Bitcoin News Brief</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 flex-1">
        {posts.slice(0, VISIBLE_COUNT).map((post, idx) => (
          <div key={idx} className="flex items-center space-x-3 group">
            {post.thumbnail && (
              <img
                src={post.thumbnail}
                alt=""
                className="w-10 h-10 object-cover rounded flex-shrink-0"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline flex-1 text-sm line-clamp-2"
            >
              {post.title}
            </a>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
