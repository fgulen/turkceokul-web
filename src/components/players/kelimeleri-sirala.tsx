'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap, getKelimeler } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';
import { ActivityHint, HintCurtain } from './ui';

export function KelimeleriSiralaPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  // arranged: shuffled-array indeksleri, yerleştirme sırasına göre
  const [arranged, setArranged] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);

  const audioUrl = toMediaUrl(etkinlik.sesLink);
  const current = detaylar[index];
  const correctWords = useMemo(() => getKelimeler(current), [current]);

  // Her soru başında bir kez karıştır
  const shuffled = useMemo(() => {
    return correctWords
      .map((word, origIdx) => ({ word, origIdx }))
      .sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    setArranged([]);
    setSubmitted(false);
  }, [index]);

  const usedSet = new Set(arranged);
  const allPlaced = arranged.length === shuffled.length;

  function addWord(shuffledIdx: number) {
    if (submitted || usedSet.has(shuffledIdx)) return;
    setArranged((prev) => [...prev, shuffledIdx]);
  }

  function removeWord(pos: number) {
    if (submitted) return;
    setArranged((prev) => prev.filter((_, i) => i !== pos));
  }

  function handleSubmit() {
    if (!allPlaced || submitted) return;
    setSubmitted(true);

    const studentWords = arranged.map((i) => shuffled[i].word);
    const answer = studentWords.join(',');
    const isCorrect =
      answer.toLowerCase().trim() === correctWords.join(',').toLowerCase().trim();

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
      const yeni = [...cevaplar, { id: current.id, cevap: answer }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex((i) => i + 1);
      }
    }, 900);
  }

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Sıralama"
      />

      {/* Ses varsa perde olarak → açılınca otomatik çalar, kapanınca durur */}
      <HintCurtain
        hint={etkinlik.soruYonergesi || undefined}
        imageUrl={null}
        audioUrl={audioUrl}
      />

      <ActivityHint>Cümleleri doğru sıraya koy</ActivityHint>

      {/* Yerleştirilen cümleler — dikey liste */}
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-2 border-dashed border-border rounded-2xl p-3 mb-4 min-h-[80px] flex flex-col gap-2"
      >
        {arranged.length === 0 ? (
          <p className="text-muted-foreground/40 text-sm text-center py-3 select-none">
            Aşağıdan cümle seç…
          </p>
        ) : (
          <AnimatePresence mode="popLayout">
            {arranged.map((shuffledIdx, pos) => {
              const word = shuffled[shuffledIdx].word;
              const isCorrectPos = submitted && word === correctWords[pos];
              const isWrongPos = submitted && !isCorrectPos;
              return (
                <motion.button
                  key={`arr-${shuffledIdx}`}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                  type="button"
                  onClick={() => removeWord(pos)}
                  disabled={submitted}
                  className={cn(
                    'w-full text-left px-4 py-3 rounded-xl border-2 font-medium text-sm leading-snug transition-all',
                    !submitted &&
                      'bg-primary/10 border-primary text-primary cursor-pointer hover:bg-primary/20 active:scale-[0.99]',
                    isCorrectPos &&
                      'bg-[--correct]/15 border-[--correct] text-[--correct] cursor-default',
                    isWrongPos &&
                      'bg-destructive/10 border-destructive text-destructive cursor-default',
                  )}
                >
                  <span className="opacity-40 text-xs mr-2">{pos + 1}.</span>
                  {word}
                </motion.button>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Kelime/cümle bankası — dikey liste */}
      <div className="flex flex-col gap-2 mb-5">
        <AnimatePresence mode="popLayout">
          {shuffled.map((item, shuffledIdx) => {
            if (usedSet.has(shuffledIdx)) return null;
            return (
              <motion.button
                key={`bank-${shuffledIdx}`}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={() => addWord(shuffledIdx)}
                disabled={submitted}
                className={cn(
                  'w-full text-left px-4 py-3 rounded-xl border-2 border-border bg-card font-medium text-sm leading-snug transition-all',
                  !submitted &&
                    'hover:border-primary hover:bg-primary/5 active:scale-[0.99]',
                  submitted && 'opacity-40 cursor-not-allowed',
                )}
              >
                {item.word}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allPlaced || submitted}
        className={cn(
          'w-full py-4 rounded-2xl font-semibold transition-all',
          allPlaced && !submitted
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60',
        )}
      >
        {index + 1 >= detaylar.length ? 'Tamamla' : 'Kontrol Et'}
      </button>
    </div>
  );
}
