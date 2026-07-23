import { generatePodcastUrls } from './seoUtils';

interface SitemapUrl {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate XML sitemap for Good Morning Bitcoin Radio
 */
export function generateSitemap(): string {
  const baseUrl = 'https://goodmorningbitcoin.com';
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Static pages
  const staticPages: SitemapUrl[] = [
    {
      url: '/',
      lastmod: currentDate,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      url: '/shows',
      lastmod: currentDate, 
      changefreq: 'daily',
      priority: 0.9
    },
    {
      url: '/about',
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: 0.7
    },
    {
      url: '/community',
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: 0.8
    }
  ];

  // Dynamic podcast pages
  const podcastUrls = generatePodcastUrls();
  const podcastPages: SitemapUrl[] = podcastUrls.map(podcast => ({
    url: podcast.url,
    lastmod: podcast.lastmod,
    changefreq: 'weekly' as const,
    priority: 0.8
  }));

  // Combine all URLs
  const allPages = [...staticPages, ...podcastPages];

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    ${page.changefreq ? `<changefreq>${page.changefreq}</changefreq>` : ''}
    ${page.priority ? `<priority>${page.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

/**
 * Save sitemap to public directory (for build process)
 */
export function saveSitemap(): void {
  if (typeof window !== 'undefined') {
    console.warn('saveSitemap should only be called on server side');
    return;
  }

  generateSitemap();
  
  // This function is used for development and build processes
}