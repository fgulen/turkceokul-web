'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type PlayerProps, type Cevap, getKelimeler } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';
import { useAuthStore } from '@/stores/auth';
import { GameHUD } from '@/components/game/game-hud';

const XP_BASE = 10;

function comboMult(combo: number) {
  if (combo >= 10) return 10;
  if (combo >= 5) return 5;
  if (combo >= 3) return 3;
  if (combo >= 2) return 2;
  return 1;
}

interface BurstData { id: number; amount: number; mult: number }

export function QuizPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [burst, setBurst] = useState<BurstData | null>(null);
  const burstId = useRef(0);
  const { play } = useGameSound();

  const current = detaylar[index];

  const options = useMemo(() => {
    const list = getKelimeler(current).slice(0, 4);
    return [...list].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const correct = current.kelime1 ?? '';

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    const isCorrect = opt === correct;
    play(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const mult = comboMult(newCombo);
      burstId.current += 1;
      setBurst({ id: burstId.current, amount: XP_BASE * mult, mult });
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
    }, 950);
  }

  return (
    <div className="max-w-sm mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Quiz"
      />

      {etkinlik.soruYonergesi && (
        <p className="text-sm text-muted-foreground mb-4 text-center">{etkinlik.soruYonergesi}</p>
      )}

      {/* Soru kartı — her soru değişiminde fade+slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          className="bg-card border border-border rounded-2xl p-8 mb-5 text-center min-h-[120px] flex items-center justify-center"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
        >
          <p className="text-2xl font-bold">{current.description}</p>
        </motion.div>
      </AnimatePresence>

      {/* XP burst — doğru cevapta yükseliyor */}
      <div className="relative h-0 overflow-visible">
        <AnimatePresence>
          {burst && (
            <motion.div
              key={burst.id}
              className="absolute left-1/2 -translate-x-1/2 -top-4 pointer-events-none z-50 flex flex-col items-center gap-0.5"
              initial={{ opacity: 1, y: 0, scale: 0.75 }}
              animate={{ opacity: 0, y: -68, scale: 1.05 }}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => setBurst(null)}
            >
              <span
                className="flex items-center gap-1 text-2xl font-black drop-shadow-sm"
                style={{ color: 'var(--correct)' }}
              >
                <Zap className="size-5 fill-current" />
                +{burst.amount} XP
              </span>
              {burst.mult > 1 && (
                <span className="text-sm font-bold text-orange-500">{burst.mult}x Combo!</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cevap butonları */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isCorrect = opt === correct;
          const isSelected = opt === selected;

          return (
            <motion.button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={selected !== null}
              className={cn(
                'py-4 px-3 rounded-xl border-2 font-medium text-sm transition-colors duration-150',
                selected === null && 'border-border hover:border-primary hover:bg-primary/5',
                isSelected && isCorrect && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
                isSelected && !isCorrect && 'border-destructive bg-destructive/10 text-destructive',
                !isSelected && selected !== null && isCorrect && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
                !isSelected && selected !== null && !isCorrect && 'opacity-35 border-border',
              )}
              animate={
                isSelected && isCorrect
                  ? { scale: [1, 1.07, 0.97, 1] }
                  : isSelected && !isCorrect
                  ? { x: [0, -10, 10, -7, 7, -4, 4, 0] }
                  : {}
              }
              transition={{ duration: 0.38 }}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
