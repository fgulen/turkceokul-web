'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { usePlayerAudio } from '@/hooks/use-player-audio';
import { GameHUD } from '@/components/game/game-hud';
import { ProgressDots, PlayingBars } from './ui';

const MAX_TEKRAR = 2;

function sadelestir(s: string) {
  return s.trim().toLowerCase();
}

function stripTurkce(s: string) {
  return sadelestir(s)
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ı/g, 'i').replace(/İ/gi, 'i');
}

const TURKCE_KLAVYE = ['ğ', 'ü', 'ş', 'ö', 'ç', 'ı', 'İ'];

export function SesiDinleveKelimeYazPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play: playSound } = useGameSound();
  const { playing, loadError, play: playAudio, reset: resetAudio } = usePlayerAudio();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPerfect, setIsPerfect] = useState(false);
  const [isYakin, setIsYakin] = useState(false);
  const [shake, setShake] = useState(false);
  const [tekrarKalan, setTekrarKalan] = useState(MAX_TEKRAR);
  const [hicCalınmadı, setHicCalınmadı] = useState(true);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = detaylar[index];
  const sesUrl = toMediaUrl(current.sesLink) || toMediaUrl(etkinlik.sesLink);
  const dogruCevap = current.description ?? '';

  // Soru değişince sıfırla (autoplay yok — browser policy bunu sıklıkla engeller)
  useEffect(() => {
    setValue('');
    setSubmitted(false);
    setIsCorrect(false);
    setIsPerfect(false);
    setIsYakin(false);
    setTekrarKalan(MAX_TEKRAR);
    setHicCalınmadı(true);
    resetAudio();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    if (!submitted) setTimeout(() => inputRef.current?.focus(), 80);
  }, [submitted, index]);

  function handlePlayAudio() {
    if (!sesUrl || tekrarKalan <= 0 || submitted) return;
    if (hicCalınmadı) {
      setHicCalınmadı(false);
    } else {
      setTekrarKalan((k) => k - 1);
    }
    playAudio(sesUrl);
  }

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
    const yakin = !correct && stripTurkce(value) === stripTurkce(dogruCevap);

    setSubmitted(true);
    setIsCorrect(correct);
    setIsPerfect(perfect);
    setIsYakin(yakin);
    resetAudio();

    playSound(correct ? 'correct' : 'wrong');
    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if ([2, 3, 5, 10].includes(newCombo)) playSound('combo');
    } else {
      setCombo(0);
      setLocalKalp((k) => Math.max(0, k - 1));
    }

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
    <div className="max-w-sm mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Dinle & Yaz"
      />

      <ProgressDots total={detaylar.length} activeIndex={index} />

      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-5"
      >
        {/* Ses butonu */}
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="relative">
            {/* İlk tıklamayı çeken pulse halkası */}
            {hicCalınmadı && sesUrl && !submitted && (
              <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
            )}
            <button
              type="button"
              onClick={handlePlayAudio}
              disabled={!sesUrl || (tekrarKalan <= 0 && !hicCalınmadı) || submitted}
              aria-label="Sesi çal"
              className={cn(
                'relative size-24 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95',
                sesUrl && (hicCalınmadı || tekrarKalan > 0) && !submitted
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed',
              )}
            >
              {playing ? (
                <PlayingBars size="lg" color="bg-current" count={3} />
              ) : !sesUrl || (!hicCalınmadı && tekrarKalan <= 0) ? (
                <VolumeX className="size-9" />
              ) : (
                <Volume2 className="size-9" />
              )}
            </button>
          </div>

          {/* Durum mesajı */}
          {!submitted && (
            <p className={cn(
              'text-xs font-medium text-center',
              loadError ? 'text-destructive'
                : hicCalınmadı ? 'text-primary'
                : tekrarKalan > 0 ? 'text-muted-foreground'
                : 'text-destructive',
            )}>
              {loadError
                ? 'Ses dosyası yüklenemedi'
                : hicCalınmadı
                  ? 'Sesi dinlemek için tıkla'
                  : tekrarKalan > 0
                    ? `Tekrar hakkı: ${tekrarKalan}`
                    : 'Tekrar hakkı bitti'}
            </p>
          )}
        </div>

        {/* Geri bildirim */}
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
                    : 'bg-[--correct]/10 text-[--correct]',
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
            placeholder="Duyduğunuzu yazın…"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            className={cn(
              'w-full h-14 px-5 rounded-2xl border-2 bg-background text-lg font-medium outline-none transition-all',
              'placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20',
              !submitted && 'border-input focus:border-primary',
              submitted && isCorrect && 'border-[--correct] text-[--correct] bg-[--correct]/5',
              submitted && !isCorrect && isYakin && 'border-amber-400 text-amber-700 bg-amber-50',
              submitted && !isCorrect && !isYakin && 'border-destructive text-destructive bg-destructive/5',
              'disabled:opacity-70',
            )}
          />
        </motion.div>

        {/* Türkçe karakter klavyesi */}
        <div className="flex gap-2 justify-center flex-wrap my-3">
          {TURKCE_KLAVYE.map((ch) => (
            <button
              key={ch}
              type="button"
              disabled={submitted}
              onClick={() => insertChar(ch)}
              className="min-w-[44px] h-11 px-3 rounded-xl border border-input bg-muted text-base font-semibold hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-40 select-none"
            >
              {ch}
            </button>
          ))}
        </div>

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
