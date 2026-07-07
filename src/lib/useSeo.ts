import { useSeoMeta, useHead } from '@unhead/react';
import { SITE_URL, DEFAULT_OG_IMAGE } from '@/lib/seo';

interface SeoOptions {
  title: string;
  description: string;
  /** Path relative to site root, e.g. '/shows' or '/podcast/tftc' */
  path?: string;
  /** OG image URL (absolute). Falls back to default OG image. */
  image?: string;
  keywords?: string;
  ogType?: string;
}

/**
 * Unified SEO hook that sets title, description, canonical URL,
 * Open Graph tags, Twitter Card tags, and robots meta.
 *
 * Use this on every page instead of calling useSeoMeta/useHead directly.
 */
export function useSeo({
  title,
  description,
  path,
  image,
  keywords,
  ogType = 'website',
}: SeoOptions) {
  const canonicalUrl = path ? `${SITE_URL}${path}` : SITE_URL;
  const ogImage = image || DEFAULT_OG_IMAGE;

  useSeoMeta({
    title,
    description,
    keywords,
    ogTitle: title,
    ogDescription: description,
    ogType: ogType as 'website',
    ogSiteName: 'Good Morning Bitcoin Radio',
    ogUrl: canonicalUrl,
    ogImage,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: ogImage,
    robots: 'index,follow',
  });

  useHead({
    link: [{ rel: 'canonical', href: canonicalUrl }],
  });
}

/**
 * Generate BreadcrumbList JSON-LD for a page.
 *
 * Pass an array of { name, path } breadcrumbs.
 */
export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.path}`,
    })),
  };
}

/**
 * Render JSON-LD structured data in the document head.
 */
export function useJsonLd(schemas: object[]) {
  useHead({
    script: schemas.map(schema => ({
      type: 'application/ld+json',
      innerHTML: JSON.stringify(schema),
    })),
  });
}
