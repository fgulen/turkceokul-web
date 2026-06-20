'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap, getKelimeler } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';
import { ActivityHint } from './ui';

// Splits text on "..." markers; returns array where even indices are text, blanks sit between them
function splitBlanks(text: string): string[] {
  return text.split(/\.{3,}/);
}

export function ResimliSoruCevapPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [filledBlanks, setFilledBlanks] = useState<string[]>([]);
  const [checking, setChecking] = useState(false);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);

  const current = detaylar[index];
  const answers = useMemo(() => getKelimeler(current), [current]);
  const textParts = useMemo(() => splitBlanks(current.description ?? ''), [current]);
  const blankCount = textParts.length - 1;

  const shuffledChips = useMemo(
    () => answers.map((w, i) => ({ w, origIdx: i })).sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index],
  );

  const allFilled = filledBlanks.length >= Math.max(blankCount, answers.length > 0 ? 1 : 0);

  function handleChip(word: string) {
    if (checking || filledBlanks.length >= blankCount) return;
    const next = [...filledBlanks, word];
    setFilledBlanks(next);
    if (next.length === blankCount && blankCount > 0) {
      checkAnswer(next);
    }
  }

  function checkAnswer(blanks: string[]) {
    setChecking(true);
    const isCorrect = blanks.every(
      (w, i) => w.trim().toLowerCase() === (answers[i] ?? '').trim().toLowerCase(),
    );
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
      const yeni = [...cevaplar, { id: current.id, cevap: blanks.join(',') }];
      setCevaplar(yeni);
      setFilledBlanks([]);
      setChecking(false);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex((i) => i + 1);
      }
    }, 1000);
  }

  // No-blank fallback: show image + answers, user taps Next
  function handleNext() {
    const yeni = [...cevaplar, { id: current.id, cevap: answers.join(',') }];
    setCevaplar(yeni);
    if (index + 1 >= detaylar.length) {
      onComplete(yeni);
    } else {
      setIndex((i) => i + 1);
    }
  }

  const imgUrl = toMediaUrl(current.resimLink);

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Soru-Cevap"
      />

      {imgUrl && (
        <div className="mb-4 rounded-2xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt="" className="w-full h-auto object-cover" />
        </div>
      )}

      <ActivityHint>Boşlukları doğru kelimelerle doldurun</ActivityHint>

      {/* Dialogue text with inline blanks */}
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-2 border-border rounded-2xl p-4 mb-5 text-[15px] leading-loose"
      >
        {blankCount === 0 ? (
          <div
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: current.description ?? '' }}
          />
        ) : (
          textParts.map((part, i) => (
            <span key={i}>
              <span dangerouslySetInnerHTML={{ __html: part }} />
              {i < blankCount && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center min-w-[90px] px-2 mx-1 rounded-lg border-2 text-sm font-semibold align-middle leading-normal',
                    filledBlanks[i]
                      ? checking
                        ? filledBlanks[i].trim().toLowerCase() ===
                          (answers[i] ?? '').trim().toLowerCase()
                          ? 'bg-[--correct]/10 border-[--correct] text-[--correct]'
                          : 'bg-destructive/10 border-destructive text-destructive'
                        : 'bg-primary/10 border-primary text-primary'
                      : 'border-dashed border-muted-foreground/40 text-muted-foreground/40 text-xs',
                  )}
                >
                  {filledBlanks[i] ?? '___'}
                </span>
              )}
            </span>
          ))
        )}
      </motion.div>

      {/* Answer chips — shown when there are blanks */}
      {blankCount > 0 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {shuffledChips.map(({ w, origIdx }) => {
            const usedCount = filledBlanks.filter((f) => f === w).length;
            const totalCount = answers.filter((a) => a === w).length;
            if (usedCount >= totalCount) return null;
            return (
              <button
                key={`chip-${origIdx}`}
                type="button"
                onClick={() => handleChip(w)}
                disabled={checking || allFilled}
                className={cn(
                  'px-4 py-2.5 rounded-xl border-2 border-border font-medium text-sm transition-all min-h-[44px]',
                  !checking && !allFilled && 'hover:border-primary hover:bg-primary/5 active:scale-[0.98]',
                  (checking || allFilled) && 'opacity-40 cursor-not-allowed',
                )}
              >
                {w}
              </button>
            );
          })}
        </div>
      )}

      {/* No-blank mode: show answers as reference, then next button */}
      {blankCount === 0 && (
        <div className="space-y-3">
          {answers.map((ans, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-muted text-sm font-medium"
            >
              {ans}
            </div>
          ))}
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-4 rounded-2xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all mt-2"
          >
            {index + 1 >= detaylar.length ? 'Tamamla' : 'İleri →'}
          </button>
        </div>
      )}
    </div>
  );
}
