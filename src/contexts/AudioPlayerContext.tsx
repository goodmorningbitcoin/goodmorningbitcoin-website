import { useState, useRef, useEffect, ReactNode } from 'react';
import { AudioPlayerContext, AudioSource, AudioPlayerContextValue } from './AudioPlayerTypes';

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

    if (currentSource.type === 'radio') {
      if (wasPlaying) {
        audio.play().catch(console.error);
      }
    } else if (currentSource.type === 'podcast') {
      audio.load();
      // Auto-play: wait for canplay, then play. This is more reliable
      // than calling play() immediately after load() because some browsers
      // need the new source to be buffered first.
      const handleCanPlay = () => {
        audio.play().catch(console.error);
        audio.removeEventListener('canplay', handleCanPlay);
      };
      audio.addEventListener('canplay', handleCanPlay);
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
    const handleError = () => {
      console.error('Audio playback error:', audio.error);
      setIsPlaying(false);
    };
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
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('error', handleError);
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
      {/* crossOrigin removed: most podcast CDNs don't send CORS headers.
          The attribute was causing browsers to silently block audio playback.
          It's only needed for Web Audio API analysis, not plain playback. */}
      <audio
        ref={audioRef}
        preload="none"
      />
    </AudioPlayerContext.Provider>
  );
}
