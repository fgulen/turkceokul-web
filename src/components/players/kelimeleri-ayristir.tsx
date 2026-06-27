'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';
import { ActivityHint } from './ui';
import { TurkceKlavye, insertIntoInput, sadelestir, stripTurkce, scoreAnswer } from './turkce-klavye';

function stripHtml(s: string) {
  return s.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
}

export function KelimeleriAyristirPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<{ isCorrect: boolean; isPerfect: boolean; isYakin: boolean }[]>([]);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const current = detaylar[index];
  // Her virgül = bir boşluk — "iyi akşamlar" gibi deyimler tek boşluk
  const correctWords = stripHtml(current.description ?? '')
    .split(',')
    .map((w) => w.trim())
    .filter(Boolean);
  // Bitişik form: her öğe içindeki boşluklar da kaldırılır ("iyi akşamlar" → "iyiakşamlar")
  const bitisikForm = correctWords.map((w) => w.replace(/\s+/g, '')).join('');
  const blankCount = correctWords.length;

  useEffect(() => {
    setValues(Array(blankCount).fill(''));
    setSubmitted(false);
    setResults([]);
    setFocusedIdx(null);
    inputRefs.current = Array(blankCount).fill(null);
    setTimeout(() => inputRefs.current[0]?.focus(), 80);
  }, [index, blankCount]);

  const safe = values.length === blankCount ? values : Array(blankCount).fill('');
  const allFilled = safe.every((v) => v.trim().length > 0);

  const insertChar = useCallback((ch: string) => {
    if (focusedIdx === null) return;
    const el = inputRefs.current[focusedIdx];
    if (!el) return;
    const next = insertIntoInput(el, safe[focusedIdx], ch);
    setValues((prev) => {
      const arr = [...prev];
      arr[focusedIdx] = next;
      return arr;
    });
  }, [focusedIdx, safe]);

  function handleSubmit() {
    if (!allFilled || submitted) return;
    setSubmitted(true);

    const wordResults = safe.map((v, i) => scoreAnswer(v, correctWords[i]));
    setResults(wordResults);

    const allCorrect = wordResults.every((r) => r.isCorrect);
    const allPerfect = wordResults.every((r) => r.isPerfect);
    const anyYakin = !allCorrect && wordResults.some((r) => r.isYakin);

    play(allCorrect ? 'correct' : 'wrong');
    if (allCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if ([2, 3, 5, 10].includes(newCombo)) play('combo');
    } else {
      setCombo(0);
      setLocalKalp((k) => Math.max(0, k - 1));
    }

    setTimeout(() => {
      const cevap = safe.join(',');
      const yeni = [...cevaplar, { id: current.id, cevap: cevap }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex((i) => i + 1);
      }
    }, anyYakin ? 1800 : 1100);
  }

  const allCorrect = results.length > 0 && results.every((r) => r.isCorrect);
  const allPerfect = results.length > 0 && results.every((r) => r.isPerfect);
  const anyYakin = results.length > 0 && !allCorrect && results.some((r) => r.isYakin);

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Ayırt Et"
      />

      <ActivityHint>Bitişik yazılan kelimeleri ayırarak yaz</ActivityHint>

      {/* Bitişik form */}
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-2 border-border rounded-2xl px-6 py-4 mb-5 text-center select-none"
      >
        <p className="text-3xl md:text-4xl font-bold break-all leading-tight">
          {bitisikForm || '—'}
        </p>
      </motion.div>

      {/* Geri bildirim */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4"
          >
            {allCorrect ? (
              <p className={cn(
                'text-center text-sm font-bold px-4 py-1.5 rounded-full',
                allPerfect
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                  : 'bg-[--correct]/10 text-[--correct]',
              )}>
                {allPerfect ? '⭐ Mükemmel!' : '✓ Doğru'}
              </p>
            ) : anyYakin ? (
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-2 text-center text-sm">
                <p className="text-amber-800 font-bold">Neredeyse! Türkçe karakterlere dikkat et.</p>
                <p className="text-amber-700 text-xs mt-1">Klavyeyi kullan ve tam puan al.</p>
              </div>
            ) : (
              <p className="text-center text-sm text-destructive font-medium">
                Doğrusu: <span className="font-bold">{correctWords.join(' ')}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Per-kelime boşluklar — klavye her inputun hemen altında */}
      <div className="space-y-1 mb-3">
        {safe.map((val, i) => {
          const res = results[i];
          return (
            <div key={i}>
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                value={val}
                disabled={submitted}
                onChange={(e) => {
                  if (submitted) return;
                  const arr = [...safe];
                  arr[i] = e.target.value;
                  setValues(arr);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && i < blankCount - 1) {
                    e.preventDefault();
                    inputRefs.current[i + 1]?.focus();
                  } else if (e.key === 'Enter' && i === blankCount - 1) {
                    handleSubmit();
                  }
                }}
                onFocus={() => setFocusedIdx(i)}
                onBlur={() => setFocusedIdx(null)}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                placeholder="Kelimeyi yazın…"
                className={cn(
                  'w-full h-14 px-4 rounded-2xl border-2 text-base font-medium transition-all outline-none placeholder:text-muted-foreground/50',
                  'focus:ring-2 focus:ring-primary/20',
                  !res && 'border-input focus:border-primary bg-background',
                  res?.isCorrect && 'border-[--correct] bg-[--correct]/5 text-[--correct]',
                  res && !res.isCorrect && res.isYakin && 'border-amber-400 bg-amber-50 text-amber-700',
                  res && !res.isCorrect && !res.isYakin && 'border-destructive bg-destructive/5 text-destructive',
                )}
              />
              {/* Klavye bu inputun hemen altında — sadece focus varken */}
              <TurkceKlavye
                onChar={insertChar}
                visible={focusedIdx === i && !submitted}
                disabled={submitted}
              />
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allFilled || submitted}
        className={cn(
          'w-full py-4 rounded-2xl font-semibold transition-all mt-1',
          allFilled && !submitted
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60',
        )}
      >
        {index + 1 >= detaylar.length ? 'Tamamla' : 'Kontrol Et'}
      </button>
    </div>
  );
}
