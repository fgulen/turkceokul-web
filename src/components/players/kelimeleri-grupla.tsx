'use client';

import { useState, useMemo } from 'react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap, getKelimeler } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';
import { ActivityHint } from './ui';

interface WordItem {
  word: string;
  detayId: string;
  key: string;
}

export function KelimeleriGruplaPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { play } = useGameSound();

  const allWords = useMemo<WordItem[]>(() => {
    const words: WordItem[] = [];
    detaylar.forEach((d) => {
      getKelimeler(d).forEach((word, i) => {
        words.push({ word, detayId: d.id, key: `${d.id}-${i}` });
      });
    });
    return words.sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [wrongCatId, setWrongCatId] = useState<string | null>(null);

  const placedKeys = new Set(Object.keys(placements));
  const totalWords = allWords.length;
  const placedCount = placedKeys.size;
  const progressPct = totalWords > 0 ? (placedCount / totalWords) * 100 : 0;

  function handleWordTap(key: string) {
    if (placedKeys.has(key)) return;
    setSelectedKey(key === selectedKey ? null : key);
  }

  function handleCategoryTap(catId: string) {
    if (!selectedKey) return;
    const item = allWords.find((w) => w.key === selectedKey);
    if (!item) return;

    if (item.detayId === catId) {
      play('correct');
      const next = { ...placements, [selectedKey]: catId };
      setPlacements(next);
      setSelectedKey(null);
      setWrongCatId(null);

      if (Object.keys(next).length === totalWords) {
        const cevaplar: Cevap[] = detaylar.map((d) => ({
          id: d.id,
          cevap: allWords.filter((w) => w.detayId === d.id).map((w) => w.word).join(','),
        }));
        setTimeout(() => onComplete(cevaplar), 400);
      }
    } else {
      play('wrong');
      setWrongCatId(catId);
      setTimeout(() => {
        setWrongCatId(null);
        setSelectedKey(null);
      }, 700);
    }
  }

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>{placedCount} / {totalWords} kelime gruplanlandı</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>


      <ActivityHint>Bir kelime seç, sonra doğru gruba yerleştir.</ActivityHint>

      {/* Category buckets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {detaylar.map((d) => {
          const isWrong = wrongCatId === d.id;
          const wordsInCat = allWords.filter((w) => placements[w.key] === d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => handleCategoryTap(d.id)}
              className={cn(
                'text-left rounded-2xl border-2 p-3 min-h-[80px] transition-all',
                selectedKey
                  ? 'border-primary hover:bg-primary/5 cursor-pointer'
                  : 'border-border cursor-default',
                isWrong && 'border-destructive animate-shake',
              )}
            >
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {d.description}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {wordsInCat.map((w) => (
                  <span
                    key={w.key}
                    className="px-2.5 py-1 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--correct, #22c55e)1a', color: 'var(--correct, #22c55e)', border: '1px solid var(--correct, #22c55e)4d' }}
                  >
                    {w.word}
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Word chips */}
      <div className="flex flex-wrap gap-2 justify-center">
        {allWords.map((item) => {
          if (placedKeys.has(item.key)) return null;
          const isSelected = selectedKey === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleWordTap(item.key)}
              className={cn(
                'px-4 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all min-h-[44px]',
                isSelected
                  ? 'border-primary bg-primary/10 text-primary scale-105'
                  : 'border-border hover:border-primary/50',
              )}
            >
              {item.word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
