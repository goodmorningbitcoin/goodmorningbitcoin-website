/**
 * Centralized constants for the Good Morning Bitcoin application.
 *
 * These were previously hardcoded across 7+ files. Now they have a single
 * source of truth so changes don't require hunting down duplicates.
 */

/** Radio stream URL for the live broadcast */
export const RADIO_STREAM_URL = 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3';

/** AzuraCast API base for now-playing and history data */
export const RADIO_API_BASE = 'https://radio.goodmorningbitcoin.com/api';

/** The default radio source object used when initializing the audio player */
export const RADIO_SOURCE = {
  type: 'radio' as const,
  url: RADIO_STREAM_URL,
  title: 'Good Morning Bitcoin Radio',
  artist: 'Live Stream',
};

/** Citadel Wire Nostr pubkey (hex) */
export const CITADEL_WIRE_PUBKEY = '01d077c7b21bfee89a6883edabcd408ef324e9ab431f46bf57d5860430bcb97c';

/** Citadel Wire Nostr npub */
export const CITADEL_WIRE_NPUB = 'npub1q8g803ajr0lw3xngs0k6hn2q3mejf6dtgv05d06h6krqgv9uh97q5382kp';

/** Citadel Wire RSS feed URL (fallback) */
export const CITADEL_WIRE_RSS = 'https://citadelwire.com/feed.xml';

/** Citadel Wire website */
export const CITADEL_WIRE_URL = 'https://citadelwire.com';
