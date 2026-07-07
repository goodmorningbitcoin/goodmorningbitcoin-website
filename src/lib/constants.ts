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
