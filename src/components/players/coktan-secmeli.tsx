'use client';

import { useState, useMemo } from 'react';
import { cn, toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { type PlayerProps, type Cevap, getKelimeler } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';

function comboMult(combo: number) {
  if (combo >= 10) return 10;
  if (combo >= 5) return 5;
  if (combo >= 3) return 3;
  if (combo >= 2) return 2;
  return 1;
}

export function CoktanSecmeliPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);

  const current = detaylar[index];
  const correct = current.kelime1 ?? '';

  const options = useMemo(() => {
    const list = getKelimeler(current);
    return [...list].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    const isCorrect = opt === correct;
    play(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if ([2, 3, 5, 10].includes(newCombo)) play('combo');
    } else {
      setCombo(0);
      setLocalKalp((k) => Math.max(0, k - 1));
    }

    setTimeout(() => {
      const yeni = [...cevaplar, { id: current.id, cevap: opt }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, 700);
  }

  const sentence = current.description ?? '';

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Boşluk Doldurma"
      />


      {etkinlik.resimLink && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={toMediaUrl(etkinlik.resimLink) ?? ''}
          alt=""
          className="w-full max-h-56 object-contain rounded-2xl mb-4 bg-muted"
        />
      )}

      <div className="bg-card border border-border rounded-2xl p-8 mb-6 text-center min-h-[100px] flex items-center justify-center">
        <p
          className="text-xl font-semibold leading-relaxed"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(sentence).replace(
              /\[___\]|_{3,}/g,
              `<span class="inline-block min-w-[80px] border-b-2 border-primary mx-1 text-primary font-bold">${selected ?? '&nbsp;&nbsp;&nbsp;&nbsp;'}</span>`
            ),
          }}
        />
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {options.map((opt) => {
          const isCorrect = opt === correct;
          const isSelected = opt === selected;
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={selected !== null}
              className={cn(
                'px-5 py-2.5 rounded-xl border-2 font-medium text-sm transition-all',
                selected === null && 'border-border hover:border-primary hover:bg-primary/5',
                isSelected && isCorrect && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
                isSelected && !isCorrect && 'border-destructive bg-destructive/10 text-destructive',
                !isSelected && selected !== null && isCorrect && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
                !isSelected && selected !== null && !isCorrect && 'opacity-40',
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
