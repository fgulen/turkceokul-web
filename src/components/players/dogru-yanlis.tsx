'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
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

export function DogruYanlisPlayer({ etkinlik, onComplete }: PlayerProps) {
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

  function handleSelect(val: 'Doğru' | 'Yanlış') {
    if (selected !== null) return;
    setSelected(val);
    const isCorrect = val === correct;
    play(isCorrect ? 'correct' : 'wrong');

    let newKalp = localKalp;
    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if ([2, 3, 5, 10].includes(newCombo)) play('combo');
    } else {
      setCombo(0);
      newKalp = Math.max(0, localKalp - 1);
      setLocalKalp(newKalp);
    }

    setTimeout(() => {
      const yeni = [...cevaplar, { id: current.id, cevap: val }];
      setCevaplar(yeni);
      if (newKalp === 0 || index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, 600);
  }

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Doğru / Yanlış"
      />


      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 mb-8 text-center min-h-[120px] flex items-center justify-center"
      >
        <p className="text-xl font-semibold leading-relaxed">
          {current.description}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {(['Doğru', 'Yanlış'] as const).map((val) => {
          const isCorrect = val === correct;
          const isSelected = val === selected;
          return (
            <button
              key={val}
              onClick={() => handleSelect(val)}
              disabled={selected !== null}
              className={cn(
                'py-5 rounded-2xl border-2 text-lg font-bold transition-all',
                selected === null && val === 'Doğru' && 'border-border hover:border-[--correct] hover:bg-[--correct]/10 hover:text-[--correct]',
                selected === null && val === 'Yanlış' && 'border-border hover:border-destructive hover:bg-destructive/10 hover:text-destructive',
                isSelected && isCorrect && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
                isSelected && !isCorrect && 'border-destructive bg-destructive/10 text-destructive',
                !isSelected && selected !== null && isCorrect && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
                !isSelected && selected !== null && !isCorrect && 'opacity-30',
              )}
            >
              {val === 'Doğru' ? '✓ Doğru' : '✗ Yanlış'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
