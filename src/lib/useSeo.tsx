import { Helmet } from 'react-helmet-async';
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
 * Unified SEO component that sets title, description, canonical URL,
 * Open Graph tags, Twitter Card tags, and robots meta.
 *
 * Uses react-helmet-async so it works with vite-react-ssg server-side
 * rendering. Render this component anywhere in the tree — Helmet handles
 * the dedup and injection into <head>.
 */
export function Seo({
  title,
  description,
  path,
  image,
  keywords,
  ogType = 'website',
}: SeoOptions) {
  const canonicalUrl = path ? `${SITE_URL}${path}` : SITE_URL;
  const ogImage = image || DEFAULT_OG_IMAGE;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="Good Morning Bitcoin Radio" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      <meta name="robots" content="index,follow" />
    </Helmet>
  );
}

/**
 * Render JSON-LD structured data. Pass one or more schema objects.
 */
export function JsonLd({ schemas }: { schemas: object[] }) {
  return (
    <>
      {schemas.map((schema, i) => (
        <Helmet key={i}>
          <script type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        </Helmet>
      ))}
    </>
  );
}

/**
 * Generate BreadcrumbList JSON-LD for a page.
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
