'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn, toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { type PlayerProps, type Cevap, type EtkinlikDetay } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';
import { HintCurtain } from './ui';

// "......", "…", "[___]", "___" hepsini tek boşluk olarak tanı
// \.{3,} greedy — kaç nokta olursa olsun (......., ...........) tek blank sayılır
const BLANK_RE = /\.{3,}|…|\[___\]|_{3,}/g;

function splitByBlanks(text: string): string[] {
  return text.split(BLANK_RE);
}

// BoslukDoldurma: doğru cevap sırası kelime1, kelime2, ... (hepsi sırayla)
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
  const firstInputRef = useRef<HTMLInputElement>(null);

  const current = detaylar[index];
  const sentence = current.description ?? '';

  const parts = useMemo(() => splitByBlanks(sentence), [sentence]);
  const blankCount = Math.max(1, parts.length - 1);

  const correctAnswers = useMemo(() => getCorrectAnswers(current), [current]);

  // Soru değişince input sıfırla
  useEffect(() => {
    setValues(Array(blankCount).fill(''));
    setSubmitted(false);
    setTimeout(() => firstInputRef.current?.focus(), 80);
  }, [index, blankCount]);

  const safe = values.length === blankCount ? values : Array(blankCount).fill('');
  const allFilled = safe.every((v) => v.trim().length > 0);

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!allFilled) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (submitted) return;
    setSubmitted(true);

    const answer = safe.join(',');
    const isCorrect = safe.every(
      (v, i) => v.toLowerCase().trim() === (correctAnswers[i] ?? '').toLowerCase().trim()
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
      const yeni = [...cevaplar, { id: current.id, cevap: answer }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex((i) => i + 1);
      }
    }, 800);
  }

  return (
    <div className="max-w-sm mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Boşluk Doldurma"
      />

      <HintCurtain
        hint={etkinlik.soruYonergesi || undefined}
        imageUrl={toMediaUrl(etkinlik.resimLink)}
      />

      {/* Cümle önizleme — yazdıkça boşluk dolar */}
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 mb-5"
      >
        <p className="text-lg font-semibold leading-loose text-left">
          {parts.map((part, i) => (
            <span key={i}>
              {/* eslint-disable-next-line react/no-danger */}
              <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }} />
              {i < blankCount && (() => {
                const val = safe[i];
                const isCorrectBlank = submitted &&
                  val.toLowerCase().trim() === (correctAnswers[i] ?? '').toLowerCase().trim();
                const isWrongBlank = submitted && !isCorrectBlank;
                const blankMinW = `${Math.max(3, (correctAnswers[i] ?? '___').length * 0.75)}em`;
                return (
                  <span
                    style={{ minWidth: blankMinW }}
                    className={cn(
                      'inline-block mx-1 px-2 py-0.5 border-b-2 text-center align-middle rounded-sm transition-all',
                      !val && 'border-primary/40 border-dashed text-transparent',
                      val && !submitted && 'border-primary text-primary font-bold',
                      isCorrectBlank && 'border-[--correct] text-[--correct] font-bold',
                      isWrongBlank && 'border-destructive text-destructive font-bold',
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
              ref={i === 0 ? firstInputRef : undefined}
              autoFocus={i === 0}
              value={val}
              disabled={submitted}
              onChange={(e) => {
                const next = [...safe];
                next[i] = e.target.value;
                setValues(next);
              }}
              onKeyDown={(e) => {
                // Enter ile sonraki inputa geç veya gönder
                if (e.key === 'Enter' && i < blankCount - 1) {
                  e.preventDefault();
                  const next = document.querySelectorAll<HTMLInputElement>('.bosluk-input');
                  next[i + 1]?.focus();
                }
              }}
              placeholder={blankCount > 1 ? `${i + 1}. boşluğu yaz…` : 'Cevabınızı yazın…'}
              className={cn(
                'bosluk-input w-full h-14 px-5 rounded-2xl border-2 border-input bg-background text-lg font-medium outline-none transition-colors',
                'focus:border-primary focus:ring-2 focus:ring-primary/20',
                'placeholder:text-muted-foreground',
                'disabled:opacity-60',
              )}
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
