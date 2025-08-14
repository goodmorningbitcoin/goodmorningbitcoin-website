import { createContext, useState, useRef, useEffect, ReactNode } from 'react';

export type AudioSource = 
  | { type: 'radio'; url: string; title: string; artist: string; }
  | { type: 'podcast'; url: string; title: string; artist: string; showTitle: string; showNpub?: string; valueBlock?: Record<string, unknown>; };

interface AudioPlayerContextValue {
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

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentSource, setCurrentSource] = useState<AudioSource | null>({
    type: 'radio',
    url: 'https://radio.goodmorningbitcoin.com/radio/8000/radio.mp3',
    title: 'Good Morning Bitcoin Radio',
    artist: 'Live Stream',
  });
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Update audio source when currentSource changes
  useEffect(() => {
    if (!audioRef.current || !currentSource) return;
    
    const audio = audioRef.current;
    const wasPlaying = !audio.paused;
    
    // Stop current playback
    audio.pause();
    
    // Update source
    audio.src = currentSource.url;
    
    // Auto-play for both radio and podcasts
    if (currentSource.type === 'radio') {
      // For radio, only auto-play if it was already playing
      if (wasPlaying) {
        audio.play().catch(console.error);
      }
    } else if (currentSource.type === 'podcast') {
      // For podcasts, always auto-play when a new episode is selected
      audio.load();
      // Auto-play the podcast episode
      audio.addEventListener('canplay', () => {
        audio.play().catch(console.error);
      }, { once: true });
    }
  }, [currentSource]);

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      if (currentSource?.type === 'podcast') {
        setCurrentTime(0);
      }
    };

    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSource]);

  const play = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const value: AudioPlayerContextValue = {
    currentSource,
    setCurrentSource,
    isPlaying,
    play,
    pause,
    togglePlay,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    currentTime,
    duration,
    seek,
    audioRef,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        crossOrigin="anonymous"
      />
    </AudioPlayerContext.Provider>
  );
}

