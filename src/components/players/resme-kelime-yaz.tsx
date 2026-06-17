'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';
import { ProgressDots } from './ui';

// Sunucu Sadelestir() ile birebir aynı: sadece lowercase + trim (Türkçe karakterler korunur)
function sadelestir(s: string) {
  return s.trim().toLowerCase();
}

// Türkçe özel karakterleri ASCII karşılığına indirgeyerek karşılaştırır
// Sadece "yakın mı?" tespiti için kullanılır, puanlama için değil
function stripTurkce(s: string) {
  return sadelestir(s)
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ı/g, 'i').replace(/İ/gi, 'i');
}

const TURKCE_KLAVYE = ['ğ', 'ü', 'ş', 'ö', 'ç', 'ı', 'İ'];

function TurkceKlavye({
  onChar,
  disabled,
}: {
  onChar: (ch: string) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-2 justify-center flex-wrap my-3">
      {TURKCE_KLAVYE.map((ch) => (
        <button
          key={ch}
          type="button"
          disabled={disabled}
          onClick={() => onChar(ch)}
          className="min-w-[44px] md:min-w-[52px] h-11 md:h-12 px-3 md:px-4 rounded-xl border border-input bg-muted text-base font-semibold hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-40 select-none"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}

export function ResmeKelimeYazPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPerfect, setIsPerfect] = useState(false);
  const [isYakin, setIsYakin] = useState(false);
  const [shake, setShake] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = detaylar[index];
  const imgUrl = toMediaUrl(current.resimLink);
  const dogruCevap = current.description ?? '';

  useEffect(() => {
    setValue('');
    setSubmitted(false);
    setIsCorrect(false);
    setIsPerfect(false);
    setIsYakin(false);
    setImgError(false);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
  }, [index]);

  function insertChar(ch: string) {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? value.length;
    const next = value.slice(0, start) + ch + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      input.focus();
      input.setSelectionRange(start + ch.length, start + ch.length);
    });
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!value.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    if (submitted) return;

    const correct = sadelestir(value) === sadelestir(dogruCevap);
    const perfect = correct && value.trim() === dogruCevap;
    // Türkçe karakter eksik ama anlam doğru: yanlış sayılır, ama farklı mesaj gösterilir
    const yakin = !correct && stripTurkce(value) === stripTurkce(dogruCevap);

    setSubmitted(true);
    setIsCorrect(correct);
    setIsPerfect(perfect);
    setIsYakin(yakin);

    play(correct ? 'correct' : 'wrong');
    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if ([2, 3, 5, 10].includes(newCombo)) play('combo');
    } else {
      setCombo(0);
      setLocalKalp((k) => Math.max(0, k - 1));
    }

    // Yakın cevaplarda biraz daha uzun bekle — öğrenci mesajı okusun
    setTimeout(() => {
      const yeni = [...cevaplar, { id: current.id, cevap: value.trim() }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex((i) => i + 1);
      }
    }, yakin ? 1800 : 900);
  }

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Resme Kelime Yaz"
      />

      <ProgressDots total={detaylar.length} activeIndex={index} />

      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        {/* Resim */}
        <div className="rounded-2xl overflow-hidden border border-border/50 bg-muted aspect-[4/3] mb-4">
          {imgUrl && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgUrl}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <ImageOff className="size-10 opacity-30" />
            </div>
          )}
        </div>

        {/* Geri bildirim rozeti */}
        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="mb-2"
            >
              {isCorrect ? (
                <p className={cn(
                  'text-center text-sm font-bold px-4 py-1.5 rounded-full',
                  isPerfect
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    : 'bg-[--correct]/10 text-[--correct]'
                )}>
                  {isPerfect ? '⭐ Mükemmel!' : '✓ Doğru'}
                </p>
              ) : isYakin ? (
                <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 text-center">
                  <p className="text-amber-800 font-bold text-sm mb-0.5">
                    Neredeyse! Türkçe karakterlere dikkat et.
                  </p>
                  <p className="text-amber-700 text-sm">
                    Doğrusu: <span className="font-bold">{dogruCevap}</span>
                  </p>
                  <p className="text-amber-600 text-xs mt-1">
                    Bir sonraki seferde klavyeyi kullan ve tam puan al.
                  </p>
                </div>
              ) : (
                <p className="text-center text-sm text-destructive font-medium">
                  Doğrusu: <span className="font-bold">{dogruCevap}</span>
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <motion.div
          animate={shake ? { x: [-5, 5, -4, 4, -2, 2, 0] } : { x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <input
            ref={inputRef}
            value={value}
            disabled={submitted}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Kelimeyi yazın…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            className={cn(
              'w-full h-14 px-5 rounded-2xl border-2 bg-background text-lg font-medium outline-none transition-all',
              'placeholder:text-muted-foreground',
              'focus:ring-2 focus:ring-primary/20',
              !submitted && 'border-input focus:border-primary',
              submitted && isCorrect && 'border-[--correct] text-[--correct] bg-[--correct]/5',
              submitted && !isCorrect && isYakin && 'border-amber-400 text-amber-700 bg-amber-50',
              submitted && !isCorrect && !isYakin && 'border-destructive text-destructive bg-destructive/5',
              'disabled:opacity-70',
            )}
          />
        </motion.div>

        {/* Türkçe karakter klavyesi */}
        <TurkceKlavye onChar={insertChar} disabled={submitted} />

        <button
          type="submit"
          disabled={!value.trim() || submitted}
          className={cn(
            'w-full py-4 rounded-2xl font-semibold transition-all',
            value.trim() && !submitted
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
