'use client';

import { useState, useMemo, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';
import { PlayingBars, ActivityHint } from './ui';

export function MetinSesEslestirmePlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { play } = useGameSound();

  const shuffledSesler = useMemo(
    () => detaylar.map((d) => d.sesLink ?? '').sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);
  const [matched, setMatched] = useState<Record<string, string>>({}); // detayId → sesLink
  const [wrongId, setWrongId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const usedAudios = new Set(Object.values(matched));

  function handleAudio(ses: string) {
    const url = toMediaUrl(ses);
    if (!url) return;

    // Ses çal
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudio(ses);
    audio.onended = () => setPlayingAudio(null);
    audio.onerror = () => setPlayingAudio(null);
    audio.play().catch(() => setPlayingAudio(null));

    setSelectedAudio(ses === selectedAudio ? null : ses);
  }

  function handleMetin(detayId: string) {
    if (!selectedAudio || matched[detayId]) return;

    const correctSes = detaylar.find((d) => d.id === detayId)?.sesLink ?? '';

    if (selectedAudio === correctSes) {
      play('correct');
      const next = { ...matched, [detayId]: selectedAudio };
      setMatched(next);
      setSelectedAudio(null);

      if (Object.keys(next).length === detaylar.length) {
        const cevaplar: Cevap[] = detaylar.map((d) => ({
          id: d.id,
          cevap: next[d.id] ?? '',
        }));
        setTimeout(() => onComplete(cevaplar), 400);
      }
    } else {
      play('wrong');
      setWrongId(detayId);
      setTimeout(() => {
        setWrongId(null);
        setSelectedAudio(null);
      }, 700);
    }
  }

  const matchedCount = Object.keys(matched).length;
  const progressPct = (matchedCount / detaylar.length) * 100;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>{matchedCount} / {detaylar.length} eşleşti</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <ActivityHint>Bir ses seç, sonra eşleşen metne tıkla.</ActivityHint>

      {/* Ses butonları — üstte */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {shuffledSesler.map((ses, i) => {
          const isUsed = usedAudios.has(ses);
          const isSelected = selectedAudio === ses;
          const isPlaying = playingAudio === ses;

          return (
            <button
              key={i}
              onClick={() => handleAudio(ses)}
              disabled={isUsed}
              aria-label={`${i + 1}. sesi çal`}
              className={cn(
                'flex flex-col items-center justify-center gap-1 w-16 h-14 rounded-2xl border-2 text-xs font-semibold transition-all duration-200',
                isSelected && 'border-primary bg-primary/10 text-primary',
                isUsed && 'opacity-40 cursor-default',
                !isSelected && !isUsed && 'border-border hover:border-primary/50',
              )}
              style={isUsed ? { borderColor: 'var(--correct)', color: 'var(--correct)' } : undefined}
            >
              {isPlaying
                ? <PlayingBars size="md" />
                : <Volume2 className="size-5" />
              }
              <span>{isPlaying ? '…' : 'Dinle'}</span>
            </button>
          );
        })}
      </div>

      {/* Metin kartları — altta */}
      <div className="grid grid-cols-2 gap-3">
        {detaylar.map((d) => {
          const isMatched = !!matched[d.id];
          const isWrong = wrongId === d.id;
          const isClickable = !!selectedAudio && !isMatched;
          const label = d.kelime1 || d.description || '';

          return (
            <button
              key={d.id}
              onClick={() => handleMetin(d.id)}
              disabled={!isClickable && !isMatched}
              className={cn(
                'p-4 rounded-2xl border-2 text-sm font-semibold text-center transition-all duration-200',
                isMatched && 'cursor-default opacity-60',
                isWrong && 'border-destructive animate-shake',
                !isMatched && !isWrong && isClickable && 'border-primary hover:ring-2 hover:ring-primary/30 cursor-pointer',
                !isMatched && !isWrong && !isClickable && 'border-border',
              )}
              style={isMatched ? { borderColor: 'var(--correct)', color: 'var(--correct)' } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
