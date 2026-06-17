'use client';

import { useState, useMemo } from 'react';
import { Volume2 } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { ActivityHint } from './ui';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';
import { usePlayerAudio } from '@/hooks/use-player-audio';

export function ResimSesEslestirmePlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { play: playFx } = useGameSound();
  const { play: playAudio } = usePlayerAudio();

  // Shuffled audio list (sesLink strings)
  const shuffledAudios = useMemo(
    () => detaylar.map((d) => d.sesLink ?? '').sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({}); // detayId → sesLink
  const [wrongId, setWrongId] = useState<string | null>(null);

  const usedAudios = new Set(Object.values(assignments));

  function handleAudio(ses: string) {
    const url = toMediaUrl(ses);
    if (url) playAudio(url);
    setSelectedAudio(ses === selectedAudio ? null : ses);
  }

  function handleImage(detayId: string) {
    if (!selectedAudio || assignments[detayId]) return;
    const correctSes = detaylar.find((d) => d.id === detayId)?.sesLink ?? '';

    if (selectedAudio === correctSes) {
      playFx('correct');
      const next = { ...assignments, [detayId]: selectedAudio };
      setAssignments(next);
      setSelectedAudio(null);

      if (Object.keys(next).length === detaylar.length) {
        const cevaplar: Cevap[] = detaylar.map((d) => ({
          id: d.id,
          cevap: next[d.id] ?? '',
        }));
        setTimeout(() => onComplete(cevaplar), 400);
      }
    } else {
      playFx('wrong');
      setWrongId(detayId);
      setTimeout(() => {
        setWrongId(null);
        setSelectedAudio(null);
      }, 700);
    }
  }

  const matchedCount = Object.keys(assignments).length;
  const progressPct = (matchedCount / detaylar.length) * 100;

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>{matchedCount} / {detaylar.length} eşleşti</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <ActivityHint>Bir ses seç, sonra eşleşen resme tıkla.</ActivityHint>

      {/* Images */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        {detaylar.map((d) => {
          const isAssigned = !!assignments[d.id];
          const isWrong = wrongId === d.id;
          const imgUrl = toMediaUrl(d.resimLink);
          return (
            <button
              key={d.id}
              onClick={() => handleImage(d.id)}
              disabled={isAssigned}
              className={cn(
                'relative aspect-square rounded-2xl overflow-hidden border-2 transition-all',
                isAssigned && 'cursor-default opacity-60',
                isWrong && 'border-destructive animate-shake',
                !isAssigned && !isWrong && selectedAudio
                  ? 'border-primary hover:ring-2 hover:ring-primary/30 cursor-pointer'
                  : 'border-border'
              )}
              style={isAssigned ? { borderColor: 'var(--correct)' } : undefined}
            >
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl} alt={d.description ?? ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-muted text-sm text-muted-foreground p-2 text-center">
                  {d.description}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Audio buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {shuffledAudios.map((ses, i) => {
          const isUsed = usedAudios.has(ses);
          const isSelected = selectedAudio === ses;
          return (
            <button
              key={i}
              onClick={() => handleAudio(ses)}
              disabled={isUsed}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-medium text-sm transition-all',
                isSelected && 'border-primary bg-primary/10',
                isUsed && 'opacity-50 cursor-default',
                !isSelected && !isUsed && 'border-border hover:border-primary/50'
              )}
              style={isUsed ? { borderColor: 'var(--correct)' } : undefined}
            >
              <Volume2 className="size-4" />
              {i + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
}
