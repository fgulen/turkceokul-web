'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { type PlayerProps, type Cevap, getKelimeler } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';

export function QuizPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const { play } = useGameSound();

  const current = detaylar[index];
  const progress = (index / detaylar.length) * 100;

  // Shuffle options once per question
  const options = useMemo(() => {
    const list = getKelimeler(current).slice(0, 4);
    return [...list].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const correct = current.kelime1 ?? '';

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    play(opt === correct ? 'correct' : 'wrong');
    setTimeout(() => {
      const yeni = [...cevaplar, { id: current.id, cevap: opt }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, 900);
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <span>{index + 1} / {detaylar.length}</span>
        <span>Quiz</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {etkinlik.soruYonergesi && (
        <p className="text-sm text-muted-foreground mb-4 text-center">{etkinlik.soruYonergesi}</p>
      )}

      <div className="bg-card border border-border rounded-2xl p-8 mb-6 text-center min-h-[120px] flex items-center justify-center">
        <p className="text-2xl font-bold">{current.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isCorrect = opt === correct;
          const isSelected = opt === selected;
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={selected !== null}
              className={cn(
                'py-4 px-3 rounded-xl border-2 font-medium text-sm transition-all',
                selected === null && 'border-border hover:border-primary hover:bg-primary/5',
                isSelected && isCorrect && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
                isSelected && !isCorrect && 'border-destructive bg-destructive/10 text-destructive',
                selected !== null && !isSelected && isCorrect && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
                selected !== null && !isSelected && !isCorrect && 'opacity-40'
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
