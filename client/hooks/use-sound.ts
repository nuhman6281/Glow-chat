import { useState, useEffect } from 'react';

interface UseSoundReturn {
  volume: number;
  setVolume: (v: number) => void;
  isMuted: boolean;
  toggleMute: () => void;
}

export function useSound(): UseSoundReturn {
  const [volume, setVolumeState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('volume');
      return stored ? Number(stored) : 1;
    }
    return 1;
  });
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('isMuted') === 'true';
    }
    return false;
  });

  useEffect(() => {
    localStorage.setItem('volume', String(volume));
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('isMuted', String(isMuted));
  }, [isMuted]);

  const setVolume = (v: number) => {
    setVolumeState(v);
    if (v === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => setIsMuted((m) => !m);

  return {
    volume,
    setVolume,
    isMuted,
    toggleMute,
  };
}