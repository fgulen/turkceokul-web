'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { type PlayerProps, type Cevap, type EtkinlikDetay } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';
import { HintCurtain } from './ui';

// "...", "…", "[___]", "___" hepsini blank olarak tanı
const BLANK_RE = /\.{3,}|…|\[___\]|_{3,}/g;

function splitByBlanks(text: string): string[] {
  return text.split(BLANK_RE);
}

function countBlanks(text: string): number {
  return (text.match(BLANK_RE) ?? []).length;
}

// CoktanSecmeliBoslukDoldurma: kelime1-5 = doğru cevaplar (sırayla), kelime6-10 = çeldirici
function getCorrectAnswers(d: EtkinlikDetay): string[] {
  return [d.kelime1, d.kelime2, d.kelime3, d.kelime4, d.kelime5].filter(Boolean) as string[];
}

function getAllOptions(d: EtkinlikDetay): string[] {
  return [
    d.kelime1, d.kelime2, d.kelime3, d.kelime4, d.kelime5,
    d.kelime6, d.kelime7, d.kelime8, d.kelime9, d.kelime10,
  ].filter(Boolean) as string[];
}

export function CoktanSecmeliBoslukDoldurmaPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  // selIdx[boşlukNo] = allOptions[i] içindeki index, null = boş
  const [selIdx, setSelIdx] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);

  const current = detaylar[index];
  const sentence = current.description ?? '';

  const parts = useMemo(() => splitByBlanks(sentence), [sentence]);
  const blankCount = parts.length - 1;

  const correctAnswers = useMemo(() => getCorrectAnswers(current), [current]);

  // Seçenekleri her soru değişiminde yeniden karıştır
  const allOptions = useMemo(() => {
    const opts = getAllOptions(current);
    return [...opts].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // Soru değişince seçim sıfırla
  useEffect(() => {
    setSelIdx(Array<number | null>(blankCount).fill(null));
    setSubmitted(false);
  }, [index, blankCount]);

  // selIdx uzunluğu henüz güncellenmemişse güvenli fallback
  const safe = selIdx.length === blankCount ? selIdx : Array<number | null>(blankCount).fill(null);

  const usedSet = new Set(safe.filter((v): v is number => v !== null));
  const allFilled = blankCount > 0 && safe.every((v) => v !== null);

  function handleOptionClick(optIdx: number) {
    if (submitted || usedSet.has(optIdx)) return;
    const firstEmpty = safe.findIndex((v) => v === null);
    if (firstEmpty === -1) return;
    const next = [...safe];
    next[firstEmpty] = optIdx;
    setSelIdx(next);
  }

  function handleBlankClick(blankIdx: number) {
    if (submitted || safe[blankIdx] === null) return;
    const next = [...safe];
    next[blankIdx] = null;
    setSelIdx(next);
  }

  function handleSubmit() {
    if (!allFilled || submitted) return;
    setSubmitted(true);

    const selected = safe.map((i) => allOptions[i!]);
    const answer = selected.join(',');

    const isCorrect = selected.every(
      (s, i) => s.toLowerCase().trim() === (correctAnswers[i] ?? '').toLowerCase().trim()
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
    }, 900);
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

      <HintCurtain
        hint={etkinlik.soruYonergesi || undefined}
        imageUrl={toMediaUrl(etkinlik.resimLink)}
        audioUrl={toMediaUrl(etkinlik.sesLink)}
        videoUrl={toMediaUrl(etkinlik.videoLink)}
        defaultOpen={!!(etkinlik.resimLink || etkinlik.sesLink || etkinlik.videoLink)}
      />

      {/* Cümle ve boşluk slotları */}
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-6 mb-6"
      >
        <p className="text-lg font-semibold leading-loose text-left font-mono whitespace-pre-wrap">
          {parts.map((part, i) => (
            <span key={i}>
              {/* eslint-disable-next-line react/no-danger */}
              <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }} />
              {i < blankCount && (() => {
                const optIdx = safe[i];
                const filled = optIdx !== null;
                const word = filled ? allOptions[optIdx] : null;
                const isCorrectBlank = submitted && filled &&
                  word!.toLowerCase().trim() === (correctAnswers[i] ?? '').toLowerCase().trim();
                const isWrongBlank = submitted && filled && !isCorrectBlank;
                // Boşluk genişliği doğru cevap uzunluğuna göre — doldurunca kayma olmaz
                const blankMinW = `${Math.max(3, (correctAnswers[i] ?? '___').length * 0.75)}em`;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleBlankClick(i)}
                    disabled={!filled || submitted}
                    style={{ minWidth: blankMinW }}
                    className={cn(
                      'inline-block mx-1.5 px-2 py-0.5 rounded-lg border-b-2 align-middle text-center transition-all',
                      !filled && 'border-primary/50 border-dashed text-transparent select-none cursor-default',
                      filled && !submitted && 'bg-primary/10 border-primary text-primary font-bold cursor-pointer hover:bg-primary/20',
                      isCorrectBlank && 'bg-[--correct]/15 border-[--correct] text-[--correct] font-bold cursor-default',
                      isWrongBlank && 'bg-destructive/10 border-destructive text-destructive font-bold cursor-default',
                    )}
                  >
                    {word ?? ' '}
                  </button>
                );
              })()}
            </span>
          ))}
        </p>
      </motion.div>

      {/* Kelime bankası */}
      <div className="flex flex-wrap gap-2 justify-center mb-5 min-h-[44px]">
        <AnimatePresence mode="popLayout">
          {allOptions.map((opt, optIdx) => {
            if (usedSet.has(optIdx)) return null;
            return (
              <motion.button
                key={`opt-${optIdx}`}
                layout
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.15 }}
                type="button"
                onClick={() => handleOptionClick(optIdx)}
                disabled={submitted}
                className={cn(
                  'px-4 py-2 rounded-xl border-2 border-border bg-card font-medium text-sm transition-all',
                  !submitted && 'hover:border-primary hover:bg-primary/5 active:scale-95',
                  submitted && 'opacity-40 cursor-not-allowed',
                )}
              >
                {opt}
              </motion.button>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Kontrol Et butonu */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allFilled || submitted}
        className={cn(
          'w-full py-4 rounded-2xl font-semibold transition-all',
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
