'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export function usePlayerAudio() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cooldownRef = useRef(false);

  const play = useCallback((url: string) => {
    if (cooldownRef.current) return;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 600);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play().catch(() => setPlaying(false));
  }, []);

  const reset = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    cooldownRef.current = false;
  }, []);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  return { playing, play, reset };
}
