'use client';

import { useState, useMemo } from 'react';
import { cn, toMediaUrl } from '@/lib/utils';
import { ActivityHint } from './ui';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';

export function KelimeleriEslestirPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { play } = useGameSound();

  // Right column: her sağ seçenek benzersiz bir rid taşır. Aynı kelime1 değeri birden
  // fazla çiftte geçebilir; eşleştirme değere DEĞİL bu instance'a (rid) göre yapılır —
  // aksi halde duplicate değerde tek eşleşme ikisini birden "kullanıldı" yapıp aktivite
  // tamamlanamıyordu (ayrıca key={val} duplicate React key uyarısı veriyordu).
  const rightOptions = useMemo(
    () => detaylar
      .map((d, i) => ({ value: d.kelime1 ?? '', rid: i }))
      .sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Map<string, number>>(new Map()); // detayId → sağ seçenek rid
  const [wrongLeft, setWrongLeft] = useState<string | null>(null);

  function handleLeft(id: string) {
    if (matched.has(id)) return;
    setSelectedLeft(id === selectedLeft ? null : id);
  }

  function handleRight(rid: number, value: string) {
    if (!selectedLeft) return;
    if ([...matched.values()].includes(rid)) return; // bu sağ seçenek zaten kullanıldı

    const correctKelime = detaylar.find((d) => d.id === selectedLeft)?.kelime1;

    if (value === correctKelime) {
      play('correct');
      const next = new Map(matched).set(selectedLeft, rid);
      setMatched(next);
      setSelectedLeft(null);

      if (next.size === detaylar.length) {
        // Sol öğe d'nin doğru cevabı = d.kelime1 (eşleşen değer zaten kelime1)
        const cevaplar: Cevap[] = detaylar.map((d) => ({
          id: d.id,
          cevap: d.kelime1 ?? '',
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

  const usedRids = new Set(matched.values());
  const progressPct = (matched.size / detaylar.length) * 100;

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto">
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
          {rightOptions.map((opt) => {
            const isUsed = usedRids.has(opt.rid);
            return (
              <button
                key={opt.rid}
                onClick={() => handleRight(opt.rid, opt.value)}
                disabled={isUsed}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-sm font-medium text-left transition-all',
                  isUsed && 'opacity-50 cursor-default',
                  !isUsed && 'border-border hover:border-primary/50'
                )}
                style={isUsed ? { borderColor: 'var(--correct)', color: 'var(--correct)' } : undefined}
              >
                {opt.value}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
