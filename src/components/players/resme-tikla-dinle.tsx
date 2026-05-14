'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Zap, ImageOff } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';

const XP_BASE = 8;

function comboMult(combo: number) {
  if (combo >= 10) return 10;
  if (combo >= 5) return 5;
  if (combo >= 3) return 3;
  if (combo >= 2) return 2;
  return 1;
}

interface BurstData { id: number; amount: number; mult: number }

export function ResmeTiklaDinlePlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);

  const [index, setIndex] = useState(0);
  const [dinlendi, setDinlendi] = useState(false);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [burst, setBurst] = useState<BurstData | null>(null);
  const [biliyorumAnim, setBiliyorumAnim] = useState(false);
  const [imgError, setImgError] = useState(false);
  const burstId = useRef(0);
  const actionDisabled = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { play } = useGameSound();

  const current = detaylar[index];
  const imgUrl = toMediaUrl(current.resimLink);
  const sesUrl = toMediaUrl(current.sesLink);
  const label = current.description || current.kelime1 || '';

  // Kart değişince sıfırla
  useEffect(() => {
    setDinlendi(false);
    setImgError(false);
    actionDisabled.current = false;
  }, [index]);

  // Unmount'ta sesi durdur
  useEffect(() => () => { audioRef.current?.pause(); }, []);

  function playAudio() {
    if (!sesUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(sesUrl);
    audioRef.current = audio;
    audio.play().catch(() => {});
  }

  function handleCardClick() {
    if (dinlendi) return;
    playAudio();
    play('flip');
    setDinlendi(true);
  }

  function answer(bildi: boolean) {
    if (actionDisabled.current) return;
    actionDisabled.current = true;

    if (bildi) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const mult = comboMult(newCombo);
      burstId.current += 1;
      const bid = burstId.current;
      setBurst({ id: bid, amount: XP_BASE * mult, mult });
      setTimeout(() => setBurst((b) => (b?.id === bid ? null : b)), 1500);
      setBiliyorumAnim(true);
      setTimeout(() => setBiliyorumAnim(false), 400);
      play([2, 3, 5, 10].includes(newCombo) ? 'combo' : 'correct');
    } else {
      setCombo(0);
      setLocalKalp((k) => Math.max(0, k - 1));
      play('wrong');
    }

    const next = [...cevaplar, { id: current.id, cevap: bildi ? '1' : '0' }];
    setCevaplar(next);

    setTimeout(() => {
      if (index + 1 >= detaylar.length) {
        onComplete(next);
      } else {
        setIndex(index + 1);
        setTimeout(() => { actionDisabled.current = false; }, 220);
      }
    }, bildi ? 480 : 320);
  }

  return (
    <div className="max-w-sm mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Resme Tıkla & Dinle"
        birim="Kart"
      />

      {/* XP burst */}
      <div className="relative h-0 overflow-visible">
        <AnimatePresence>
          {burst && (
            <motion.div
              key={burst.id}
              className="absolute left-1/2 -translate-x-1/2 -top-4 pointer-events-none z-50 flex flex-col items-center gap-0.5"
              initial={{ opacity: 1, y: 0, scale: 0.75 }}
              animate={{ opacity: 0, y: -68, scale: 1.05 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => setBurst(null)}
            >
              <span
                className="flex items-center gap-1 text-2xl font-black drop-shadow-sm"
                style={{ color: 'var(--correct)' }}
              >
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

      {/* Kart */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
          className="mb-4"
        >
          <div
            role="button"
            tabIndex={0}
            onClick={handleCardClick}
            onKeyDown={(e) => e.key === 'Enter' && handleCardClick()}
            className={cn(
              'rounded-2xl border overflow-hidden bg-card select-none transition-colors',
              !dinlendi && 'cursor-pointer border-border/60 hover:border-primary/30',
              dinlendi && 'cursor-default border-primary/25',
            )}
          >
            {/* Resim */}
            <div className="relative w-full aspect-[4/3] bg-muted">
              {imgUrl && !imgError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgUrl}
                  alt={label}
                  className="w-full h-full object-cover"
                  draggable={false}
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageOff className="size-10 opacity-40" />
                  {label && <p className="text-sm font-medium px-4 text-center">{label}</p>}
                </div>
              )}

              {/* Ses overlay — tıklamadan önce */}
              {!dinlendi && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="size-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
                  >
                    <Volume2 className="size-7 text-primary" />
                  </motion.div>
                </div>
              )}
            </div>

            {/* Label + ses butonu — dinlendikten sonra */}
            <AnimatePresence>
              {dinlendi && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between gap-3 px-5 py-4"
                >
                  <p className="text-2xl font-bold text-primary leading-tight">{label}</p>
                  {sesUrl && (
                    <button
                      onClick={(e) => { e.stopPropagation(); playAudio(); }}
                      className="shrink-0 size-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                      aria-label="Tekrar dinle"
                    >
                      <Volume2 className="size-4 text-primary" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {!dinlendi && (
            <p className="text-center text-xs text-muted-foreground mt-2 uppercase tracking-widest">
              Dinlemek için tıkla
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bilmiyorum / Biliyorum — sadece dinlendikten sonra */}
      <AnimatePresence>
        {dinlendi && (
          <motion.div
            className="flex gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.18 }}
          >
            <button
              onClick={() => answer(false)}
              className="flex-1 py-3 rounded-xl border-2 border-destructive text-destructive font-semibold hover:bg-destructive/10 transition-colors"
            >
              Bilmiyorum
            </button>
            <motion.button
              onClick={() => answer(true)}
              animate={biliyorumAnim ? { scale: [1, 1.09, 0.95, 1] } : {}}
              transition={{ duration: 0.35 }}
              className="flex-1 py-3 rounded-xl border-2 font-semibold transition-colors"
              style={{ borderColor: 'var(--correct)', color: 'var(--correct)' }}
            >
              Biliyorum ✓
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
