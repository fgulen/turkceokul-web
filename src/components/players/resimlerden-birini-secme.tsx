'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Zap } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap, getKelimeler } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { usePlayerAudio } from '@/hooks/use-player-audio';
import { GameHUD, } from '@/components/game/game-hud';
import { PlayingBars, HintCurtain } from './ui';

// Veri yapısı:
//   description = soru metni ("Günaydın")
//   sesLink     = kelimenin sesi (opsiyonel)
//   kelime1     = DOĞRU resim yolu
//   kelime2..4  = YANLIŞ seçenekler (resim yolları)
// Backend: d.Kelime1 == cevap kontrolü

const XP_BASE = 10;

function comboMult(combo: number) {
  if (combo >= 10) return 10;
  if (combo >= 5) return 5;
  if (combo >= 3) return 3;
  if (combo >= 2) return 2;
  return 1;
}

interface BurstData { id: number; amount: number; mult: number }

export function ResimlerdenBiriniSecmePlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();
  const { playing: audioPlaying, play: playWord } = usePlayerAudio();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // seçilen image path
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [burst, setBurst] = useState<BurstData | null>(null);
  const burstId = useRef(0);

  const current = detaylar[index];
  const correct = current.kelime1 ?? '';
  const sesUrl = toMediaUrl(current.sesLink);

  // Seçenekler: kelime1..kelimeN = resim yolları, karıştırılmış
  const options = useMemo(() => {
    return getKelimeler(current).sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const cols = options.length <= 2 ? 2 : options.length <= 4 ? 2 : 3;

  function handleSelect(imgPath: string) {
    if (selected !== null) return;
    setSelected(imgPath);
    const isCorrect = imgPath === correct;
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
      const yeni = [...cevaplar, { id: current.id, cevap: imgPath }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex(index + 1);
        setSelected(null);
        setBurst(null);
      }
    }, 900);
  }

  return (
    <div className="max-w-sm mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Resim Seç"
      />

      {etkinlik.soruYonergesi && (
        <HintCurtain hint={etkinlik.soruYonergesi} />
      )}

      {/* Soru kartı */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="bg-card border border-border rounded-2xl p-5 mb-5 flex items-center justify-center gap-4 min-h-[72px]"
        >
          <p className="text-2xl font-bold flex-1 text-center">{current.description}</p>
          {sesUrl && (
            <button
              onClick={() => playWord(sesUrl)}
              className="shrink-0 size-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              aria-label="Sesi çal"
            >
              {audioPlaying
                ? <PlayingBars size="sm" color="bg-primary" />
                : <Volume2 className="size-4 text-primary" />
              }
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      {/* XP burst */}
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
              <span className="flex items-center gap-1 text-2xl font-black drop-shadow-sm" style={{ color: 'var(--correct)' }}>
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

      {/* Resim seçenekleri */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {options.map((imgPath) => {
          const url = toMediaUrl(imgPath);
          const isCorrect = imgPath === correct;
          const isSelected = selected === imgPath;
          const revealed = selected !== null;

          return (
            <motion.button
              key={imgPath}
              onClick={() => handleSelect(imgPath)}
              disabled={revealed}
              animate={
                isSelected && isCorrect
                  ? { scale: [1, 1.06, 0.97, 1] }
                  : isSelected && !isCorrect
                  ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                  : {}
              }
              transition={{ duration: 0.38 }}
              className={cn(
                'relative rounded-2xl overflow-hidden border-2 transition-all duration-200 bg-muted',
                !revealed && 'border-border hover:border-primary hover:shadow-md cursor-pointer',
                isSelected && isCorrect && 'border-[--correct]',
                isSelected && !isCorrect && 'border-destructive',
                !isSelected && revealed && isCorrect && 'border-[--correct]',
                !isSelected && revealed && !isCorrect && 'opacity-40 border-border',
              )}
            >
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={url}
                  alt=""
                  className="w-full h-auto block"
                  draggable={false}
                />
              ) : (
                <div className="w-full aspect-square flex items-center justify-center text-muted-foreground text-xs p-2">
                  ?
                </div>
              )}

              {revealed && isCorrect && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="size-9 rounded-full bg-white flex items-center justify-center shadow">
                    <span className="text-lg font-bold" style={{ color: 'var(--correct)' }}>✓</span>
                  </div>
                </div>
              )}
              {isSelected && !isCorrect && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="size-9 rounded-full bg-white flex items-center justify-center shadow">
                    <span className="text-lg font-bold text-destructive">✗</span>
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
