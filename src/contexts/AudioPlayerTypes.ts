import { createContext } from 'react';

export type AudioSource = 
  | { type: 'radio'; url: string; title: string; artist: string; }
  | { type: 'podcast'; url: string; title: string; artist: string; showTitle: string; showNpub?: string; valueBlock?: Record<string, unknown>; };

export interface AudioPlayerContextValue {
  // Current source
  currentSource: AudioSource | null;
  setCurrentSource: (source: AudioSource) => void;
  
  // Playback controls
  isPlaying: boolean;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  
  // Volume controls
  volume: number;
  setVolume: (volume: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
  
  // Progress (for podcasts)
  currentTime: number;
  duration: number;
  seek: (time: number) => void;
  
  // Audio element ref
  audioRef: React.RefObject<HTMLAudioElement>;
}

export const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);