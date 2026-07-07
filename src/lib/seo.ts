/**
 * Centralized SEO constants.
 *
 * Single source of truth for site-wide SEO values so every page
 * and component references the same data.
 */

export const SITE_URL = 'https://goodmorningbitcoin.com';
export const SITE_NAME = 'Good Morning Bitcoin Radio';
export const SITE_TAGLINE = 'The Voice of Bitcoin, Every Morning';

/** Default OG/share image used when no page-specific image exists */
export const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/img/og-default.jpg`;

/** Path to the default image in public/ (for direct file references) */
export const DEFAULT_OG_IMAGE_PATH = '/assets/img/og-default.jpg';

export const TWITTER_HANDLE = '@goodmorningbtc';

export const DEFAULT_KEYWORDS = [
  'bitcoin radio',
  'good morning bitcoin',
  'bitcoin podcast',
  'bitcoin news',
  'cryptocurrency radio',
  'bitcoin stream',
  'bitcoin community',
  'bitcoin 247',
  'btc radio',
  'lightning network',
];
