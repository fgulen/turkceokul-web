'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { type PlayerProps, type Cevap, type EtkinlikDetay } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';
import { TurkceKlavye, insertIntoInput, sadelestir, stripTurkce } from './turkce-klavye';

const BLANK_RE = /\.{3,}|…|\[___\]|_{3,}/g;

function splitByBlanks(text: string): string[] {
  return text.split(BLANK_RE);
}

function getCorrectAnswers(d: EtkinlikDetay): string[] {
  return [
    d.kelime1, d.kelime2, d.kelime3, d.kelime4, d.kelime5,
    d.kelime6, d.kelime7, d.kelime8, d.kelime9, d.kelime10,
  ].filter(Boolean) as string[];
}

export function BoslukDoldurmaPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [shake, setShake] = useState(false);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const [isAllPerfect, setIsAllPerfect] = useState(false);
  const [isAllCorrect, setIsAllCorrect] = useState(false);
  const [isAnyYakin, setIsAnyYakin] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const current = detaylar[index];
  const sentence = current.description ?? '';

  const parts = useMemo(() => splitByBlanks(sentence), [sentence]);
  const blankCount = Math.max(1, parts.length - 1);
  const correctAnswers = useMemo(() => getCorrectAnswers(current), [current]);

  useEffect(() => {
    setValues(Array(blankCount).fill(''));
    setSubmitted(false);
    setFocusedIdx(null);
    setIsAllPerfect(false);
    setIsAllCorrect(false);
    setIsAnyYakin(false);
    inputRefs.current = Array(blankCount).fill(null);
    setTimeout(() => {
      firstInputRef.current?.focus();
      firstInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  }, [index, blankCount]);

  const safe = values.length === blankCount ? values : Array(blankCount).fill('');
  const allFilled = safe.every((v) => v.trim().length > 0);

  const insertChar = useCallback((ch: string) => {
    if (focusedIdx === null) return;
    const el = focusedIdx === 0 ? firstInputRef.current : inputRefs.current[focusedIdx];
    if (!el) return;
    const next = insertIntoInput(el, safe[focusedIdx], ch);
    setValues((prev) => {
      const arr = [...prev];
      arr[focusedIdx] = next;
      return arr;
    });
  }, [focusedIdx, safe]);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!allFilled) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (submitted) return;
    setSubmitted(true);

    const correct = safe.every(
      (v, i) => sadelestir(v) === sadelestir(correctAnswers[i] ?? '')
    );
    const perfect = safe.every(
      (v, i) => v.trim() === (correctAnswers[i] ?? '').trim()
    );
    const yakin = !correct && safe.some(
      (v, i) => !( sadelestir(v) === sadelestir(correctAnswers[i] ?? '') ) &&
        stripTurkce(v) === stripTurkce(correctAnswers[i] ?? '')
    );

    setIsAllCorrect(correct);
    setIsAllPerfect(perfect);
    setIsAnyYakin(yakin);

    const answer = safe.join(',');
    play(correct ? 'correct' : 'wrong');
    let newKalp = localKalp;
    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if ([2, 3, 5, 10].includes(newCombo)) play('combo');
    } else {
      setCombo(0);
      newKalp = Math.max(0, localKalp - 1);
      setLocalKalp(newKalp);
    }

    setTimeout(() => {
      const yeni = [...cevaplar, { id: current.id, cevap: answer }];
      setCevaplar(yeni);
      if (newKalp === 0 || index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex((i) => i + 1);
      }
    }, yakin ? 1800 : 800);
  }

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Boşluk Doldurma"
      />

      {/* Cümle önizleme */}
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 mb-5"
      >
        <p className="text-lg font-semibold leading-loose text-left font-mono whitespace-pre-wrap">
          {parts.map((part, i) => (
            <span key={i}>
              {/* eslint-disable-next-line react/no-danger */}
              <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }} />
              {i < blankCount && (() => {
                const val = safe[i];
                const correct = submitted && sadelestir(val) === sadelestir(correctAnswers[i] ?? '');
                const wrong = submitted && !correct;
                const blankMinW = `${Math.max(3, (correctAnswers[i] ?? '___').length * 0.75)}em`;
                return (
                  <span
                    style={{ minWidth: blankMinW }}
                    className={cn(
                      'inline-block mx-1 px-2 py-0.5 border-b-2 text-center align-middle rounded-sm transition-all',
                      !val && 'border-primary/40 border-dashed text-transparent',
                      val && !submitted && 'border-primary text-primary font-bold',
                      correct && 'border-[--correct] text-[--correct] font-bold',
                      wrong && 'border-destructive text-destructive font-bold',
                    )}
                  >
                    {val || ' '}
                  </span>
                );
              })()}
            </span>
          ))}
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
            {isAllCorrect ? (
              <p className={cn(
                'text-center text-sm font-bold px-4 py-1.5 rounded-full',
                isAllPerfect
                  ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                  : 'bg-[--correct]/10 text-[--correct]',
              )}>
                {isAllPerfect ? '⭐ Mükemmel!' : '✓ Doğru'}
              </p>
            ) : isAnyYakin ? (
              <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-2 text-center text-sm">
                <p className="text-amber-800 font-bold">Neredeyse! Türkçe karakterlere dikkat et.</p>
                <p className="text-amber-600 text-xs mt-1">Klavyeyi kullan ve tam puan al.</p>
              </div>
            ) : (
              <p className="text-center text-sm text-destructive font-medium">
                Doğrusu: <span className="font-bold">{correctAnswers.join(', ')}</span>
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input(lar) */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {safe.map((val, i) => (
          <motion.div
            key={i}
            animate={shake && i === 0 ? { x: [-5, 5, -4, 4, -2, 2, 0] } : { x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {blankCount > 1 && (
              <label className="block text-xs font-medium text-muted-foreground mb-1 ml-1">
                {i + 1}. boşluk
              </label>
            )}
            <input
              ref={(el) => {
                inputRefs.current[i] = el;
                if (i === 0) (firstInputRef as React.MutableRefObject<HTMLInputElement | null>).current = el;
              }}
              value={val}
              disabled={submitted}
              onChange={(e) => {
                const next = [...safe];
                next[i] = e.target.value;
                setValues(next);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && i < blankCount - 1) {
                  e.preventDefault();
                  inputRefs.current[i + 1]?.focus();
                }
              }}
              onFocus={() => setFocusedIdx(i)}
              onBlur={() => setFocusedIdx(null)}
              onPaste={(e) => e.preventDefault()}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              placeholder="Cevabınızı yazın…"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className={cn(
                'bosluk-input w-full h-14 px-5 rounded-2xl border-2 border-input bg-background text-lg font-medium outline-none transition-colors',
                'focus:border-primary focus:ring-2 focus:ring-primary/20',
                'placeholder:text-muted-foreground',
                'disabled:opacity-60',
              )}
            />
            {/* Klavye bu inputun hemen altında — sadece focus varken */}
            <TurkceKlavye
              onChar={insertChar}
              visible={focusedIdx === i && !submitted}
              disabled={submitted}
            />
          </motion.div>
        ))}

        <button
          type="submit"
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
      </form>
    </div>
  );
}
