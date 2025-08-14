import showsData from '../../public/shows.json';

interface Show {
  title: string;
  description: string;
  fountainlink: string;
  xlink: string;
  nostr: string;
  podcastXml: string;
}

/**
 * Generate SEO-friendly podcast URLs for sitemap generation
 */
export function generatePodcastUrls(): Array<{
  url: string;
  title: string;
  description: string;
  lastmod: string;
}> {
  const shows = showsData as Show[];
  
  return shows
    .filter(show => show.podcastXml) // Only shows with RSS feeds
    .map(show => ({
      url: `/podcast/${encodeURIComponent(show.title.toLowerCase().replace(/\s+/g, '-'))}`,
      title: show.title,
      description: show.description,
      lastmod: new Date().toISOString().split('T')[0] // Current date as lastmod
    }));
}

/**
 * Generate meta tags for podcast pages based on show data
 */
export function generatePodcastSEO(showTitle: string, showDescription: string, slug?: string) {
  const baseUrl = 'https://goodmorningbitcoin.com';
  
  return {
    title: `${showTitle} - Bitcoin Podcast Episodes | Good Morning Bitcoin Radio`,
    description: `Listen to ${showTitle} episodes on Good Morning Bitcoin Radio. ${showDescription} Stream Bitcoin podcasts with Lightning support and zap your favorite creators.`,
    keywords: `${showTitle}, bitcoin podcast, ${showTitle.toLowerCase()}, bitcoin episodes, cryptocurrency podcast, bitcoin radio, lightning zaps, ${showTitle} episodes`,
    canonical: slug ? `${baseUrl}/podcast/${slug}` : undefined,
    ogTitle: `${showTitle} - Bitcoin Podcast Episodes`,
    ogDescription: `Listen to ${showTitle} on Good Morning Bitcoin Radio. ${showDescription.substring(0, 160)}${showDescription.length > 160 ? '...' : ''}`,
    ogUrl: slug ? `${baseUrl}/podcast/${slug}` : undefined,
    twitterTitle: `${showTitle} - Bitcoin Podcast Episodes`,
    twitterDescription: `Listen to ${showTitle} episodes. ${showDescription.substring(0, 120)}${showDescription.length > 120 ? '...' : ''}`,
  };
}

/**
 * Generate breadcrumb JSON-LD for podcast pages
 */
export function generateBreadcrumbSchema(showTitle: string, slug: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://goodmorningbitcoin.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Shows",
        "item": "https://goodmorningbitcoin.com/shows"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": showTitle,
        "item": `https://goodmorningbitcoin.com/podcast/${slug}`
      }
    ]
  };
}

/**
 * Clean and optimize text for SEO
 */
export function cleanTextForSEO(text: string, maxLength: number = 160): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .substring(0, maxLength)
    .trim();
}

/**
 * Generate FAQ schema for common Bitcoin podcast questions
 */
export function generatePodcastFAQSchema(showTitle: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": `How can I listen to ${showTitle}?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `You can listen to ${showTitle} episodes directly on Good Morning Bitcoin Radio, or through popular podcast apps like Fountain, Apple Podcasts, and Spotify.`
        }
      },
      {
        "@type": "Question",
        "name": `Can I support ${showTitle} with Bitcoin?`,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": `Yes! Good Morning Bitcoin Radio supports Lightning Network zaps, allowing you to send Bitcoin tips directly to podcast creators during episodes.`
        }
      },
      {
        "@type": "Question",
        "name": "Are episodes available for free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all podcast episodes on Good Morning Bitcoin Radio are completely free to stream with no ads or subscription fees."
        }
      }
    ]
  };
}