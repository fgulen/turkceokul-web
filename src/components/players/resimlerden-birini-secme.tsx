'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Zap } from 'lucide-react';
import { cn, toMediaUrl, diyalogMetinClass, duzMetneCevir } from '@/lib/utils';
import { type PlayerProps, type Cevap, kontrolEt } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { usePlayerAudio } from '@/hooks/use-player-audio';
import { GameHUD, } from '@/components/game/game-hud';
import { PlayingBars } from './ui';

// Veri yapısı:
//   description = soru metni ("Günaydın")
//   sesLink     = kelimenin sesi (opsiyonel)
//   secenekler  = resim yolları (sunucuda karıştırılmış, hangisinin doğru olduğu
//                 client'a gönderilmiyor — bkz. kontrolEt, 2026-07-31 cevap-gizli mimari fix'i)

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
  const [correctReveal, setCorrectReveal] = useState<string | null>(null);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [burst, setBurst] = useState<BurstData | null>(null);
  const burstId = useRef(0);

  const current = detaylar[index];
  const sesUrl = toMediaUrl(current.sesLink);
  const options = current.secenekler ?? [];

  const cols = options.length <= 2 ? 2 : options.length <= 4 ? 2 : 3;

  async function handleSelect(imgPath: string) {
    if (selected !== null) return;
    setSelected(imgPath);

    let isCorrect = false;
    try {
      const { sonuc, dogruCevap } = await kontrolEt(etkinlik.id, current.id, imgPath);
      isCorrect = sonuc;
      setCorrectReveal(dogruCevap);
    } catch {
      setCorrectReveal(imgPath);
    }
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
        setCorrectReveal(null);
        setBurst(null);
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
        etiket="Resim Seç"
      />


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
          <p className={cn('text-2xl font-bold flex-1', diyalogMetinClass(current.description) ?? 'text-center')}>{duzMetneCevir(current.description)}</p>
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
        {options.map((imgPath, optIndex) => {
          const url = toMediaUrl(imgPath);
          const locked = selected !== null; // seçilir seçilmez kilitlenir, renk sunucu yanıtını bekler
          const revealed = locked && correctReveal !== null;
          const isCorrect = imgPath === correctReveal;
          const isSelected = selected === imgPath;

          return (
            <motion.button
              key={imgPath}
              onClick={() => handleSelect(imgPath)}
              disabled={locked}
              aria-label={`Seçenek ${optIndex + 1}`}
              animate={
                revealed && isSelected && isCorrect
                  ? { scale: [1, 1.06, 0.97, 1] }
                  : revealed && isSelected && !isCorrect
                  ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                  : {}
              }
              transition={{ duration: 0.38, type: 'tween' }}
              className={cn(
                'relative rounded-2xl overflow-hidden border-2 transition-all duration-200 bg-muted',
                !locked && 'border-border hover:border-primary hover:shadow-md cursor-pointer',
                locked && !revealed && isSelected && 'border-primary',
                revealed && isSelected && isCorrect && 'border-[--correct]',
                revealed && isSelected && !isCorrect && 'border-destructive',
                revealed && !isSelected && isCorrect && 'border-[--correct]',
                revealed && !isSelected && !isCorrect && 'opacity-40 border-border',
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
              {revealed && isSelected && !isCorrect && (
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
