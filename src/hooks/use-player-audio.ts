'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export function usePlayerAudio() {
  const [playing, setPlaying] = useState(false);
  const [loadError, setLoadError] = useState(false);
  // needsTap: ses bitti veya autoplay engellendi → "tekrar çalmak için dokunun" pulse
  const [needsTap, setNeedsTap] = useState(false);
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
    setLoadError(false);
    setNeedsTap(false);
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlaying(true);
    audio.onended = () => { setPlaying(false); setNeedsTap(true); };
    audio.onerror = () => { setPlaying(false); setLoadError(true); };
    audio.play().catch(() => setPlaying(false));
  }, []);

  // Sayfa açılışında otomatik çalmayı dener; engellense pulse gösterir
  const tryAutoPlay = useCallback((url: string) => {
    if (!url) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setNeedsTap(false);
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlaying(true);
    audio.onended = () => { setPlaying(false); setNeedsTap(true); };
    audio.onerror = () => { setPlaying(false); setNeedsTap(true); };
    audio.play().catch(() => { setPlaying(false); setNeedsTap(true); });
  }, []);

  const reset = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
    setLoadError(false);
    setNeedsTap(false);
    cooldownRef.current = false;
  }, []);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  return { playing, loadError, needsTap, play, tryAutoPlay, reset };
}
