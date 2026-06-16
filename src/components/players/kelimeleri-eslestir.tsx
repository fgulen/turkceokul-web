'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ActivityHint } from './ui';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';

export function KelimeleriEslestirPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { play } = useGameSound();

  // Right column: shuffled kelime1 values
  const rightOptions = useMemo(
    () => detaylar.map((d) => d.kelime1 ?? '').sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Map<string, string>>(new Map()); // detayId → kelime1
  const [wrongLeft, setWrongLeft] = useState<string | null>(null);

  function handleLeft(id: string) {
    if (matched.has(id)) return;
    setSelectedLeft(id === selectedLeft ? null : id);
  }

  function handleRight(value: string) {
    if (!selectedLeft) return;
    if ([...matched.values()].includes(value)) return;

    const correctKelime = detaylar.find((d) => d.id === selectedLeft)?.kelime1;

    if (value === correctKelime) {
      play('correct');
      const next = new Map(matched).set(selectedLeft, value);
      setMatched(next);
      setSelectedLeft(null);

      if (next.size === detaylar.length) {
        const cevaplar: Cevap[] = detaylar.map((d) => ({
          id: d.id,
          cevap: next.get(d.id) ?? '',
        }));
        setTimeout(() => onComplete(cevaplar), 400);
      }
    } else {
      play('wrong');
      setWrongLeft(selectedLeft);
      setTimeout(() => {
        setWrongLeft(null);
        setSelectedLeft(null);
      }, 700);
    }
  }

  const usedValues = new Set(matched.values());
  const progressPct = (matched.size / detaylar.length) * 100;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>{matched.size} / {detaylar.length} eşleşti</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <ActivityHint>Sol taraftan bir kelime seç, sağ taraftan eşleştir.</ActivityHint>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-3">
          {detaylar.map((d) => {
            const isMatched = matched.has(d.id);
            const isSelected = selectedLeft === d.id;
            const isWrong = wrongLeft === d.id;
            return (
              <button
                key={d.id}
                onClick={() => handleLeft(d.id)}
                disabled={isMatched}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-sm font-medium text-left transition-all',
                  isMatched && 'opacity-50 cursor-default',
                  isSelected && !isMatched && 'border-primary bg-primary/10',
                  isWrong && 'border-destructive bg-destructive/10 animate-shake',
                  !isSelected && !isMatched && !isWrong && 'border-border hover:border-primary/50'
                )}
                style={isMatched ? { borderColor: 'var(--correct)', color: 'var(--correct)' } : undefined}
              >
                {d.description}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {rightOptions.map((val) => {
            const isUsed = usedValues.has(val);
            return (
              <button
                key={val}
                onClick={() => handleRight(val)}
                disabled={isUsed}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-sm font-medium text-left transition-all',
                  isUsed && 'opacity-50 cursor-default',
                  !isUsed && 'border-border hover:border-primary/50'
                )}
                style={isUsed ? { borderColor: 'var(--correct)', color: 'var(--correct)' } : undefined}
              >
                {val}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
