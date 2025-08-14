import { useContext } from 'react';
import { AudioPlayerContext } from '@/contexts/AudioPlayerTypes';

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  }
  return context;
}