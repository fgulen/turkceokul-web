'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Zap } from 'lucide-react';
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

export function AkilliKartPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [burst, setBurst] = useState<BurstData | null>(null);
  const [biliyorumAnim, setBiliyorumAnim] = useState(false);
  const burstId = useRef(0);
  const flipDisabled = useRef(false);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const { play } = useGameSound();

  // Kelime sesi — öncekini durdur, yenisini başlat
  function playWordAudio(url: string) {
    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
      wordAudioRef.current.currentTime = 0;
    }
    const audio = new Audio(url);
    wordAudioRef.current = audio;
    audio.play().catch(() => {});
  }

  // Unmount'ta sesi durdur
  useEffect(() => () => { wordAudioRef.current?.pause(); }, []);

  const current = detaylar[index];
  const imgUrl = toMediaUrl(current.resimLink);
  const sesUrl = toMediaUrl(current.sesLink);
  const word = current.description || current.kelime1 || '';
  const back = current.kelime1 || current.description || '';
  const imageMode = !!imgUrl;

  function handleFlip() {
    if (flipped || flipDisabled.current) return;
    setFlipped(true);
    play('flip');
    if (sesUrl) playWordAudio(sesUrl);
  }

  function answer(bildi: boolean) {
    flipDisabled.current = true;

    if (bildi) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const mult = comboMult(newCombo);
      burstId.current += 1;
      const bid = burstId.current;
      setBurst({ id: bid, amount: XP_BASE * mult, mult });
      // onAnimationComplete tetiklenmezse 1.5s sonra temizle
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

    const delay = bildi ? 480 : 320;
    setTimeout(() => {
      if (index + 1 >= detaylar.length) {
        onComplete(next);
      } else {
        setIndex(index + 1);
        setFlipped(false);
        // Kart exit + enter animasyonu bitince flip'e izin ver (~200ms slide + buffer)
        setTimeout(() => { flipDisabled.current = false; }, 500);
      }
    }, delay);
  }

  return (
    <div className="max-w-sm mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Akıllı Kart"
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

      {/* Kart — 3D flip + soru geçiş slide */}
      {/* initial={false}: ilk mount'ta (ve retry'da) kart animasyonsuz çıkar, geçişler animasyonlu */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.2 }}
          className="mb-4"
          style={{ perspective: 1400 }}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: 0.5, type: 'spring', stiffness: 180, damping: 22 }}
            style={{ transformStyle: 'preserve-3d', position: 'relative' }}
          >
            {/* SIZER — görünmez, arka yüz boyutunu temel alarak container yüksekliğini belirler */}
            <div style={{ visibility: 'hidden' }} aria-hidden="true" className="w-full rounded-2xl overflow-hidden">
              {imageMode && <img src={imgUrl!} alt="" className="w-full h-auto block" />}
              <div className={cn('flex flex-col items-center gap-3 px-6 py-5', !imageMode && 'min-h-44 justify-center')}>
                <p className="text-3xl font-bold text-center leading-tight">{imageMode ? word : back}</p>
                {sesUrl && <div className="size-10 rounded-full" />}
              </div>
            </div>

            {/* ÖN YÜZ */}
            <div
              role="button"
              tabIndex={0}
              onClick={handleFlip}
              onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
              style={{ backfaceVisibility: 'hidden' }}
              className={cn(
                'absolute inset-0 rounded-2xl border overflow-hidden bg-card select-none',
                'flex flex-col cursor-pointer border-border/60 hover:border-primary/30 transition-colors',
              )}
            >
              {imageMode && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl!} alt={word} className="w-full h-auto block" draggable={false} />
              )}
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-5">
                {!imageMode && (
                  <p className="text-2xl font-bold text-center leading-snug">{word}</p>
                )}
                {imageMode ? (
                  <p className="text-sm font-medium text-muted-foreground">
                    Bil bakalım — bu hangi kelime?
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
                    Çevirmek için tıkla
                  </p>
                )}
              </div>
            </div>

            {/* ARKA YÜZ */}
            <div
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
              className="absolute inset-0 rounded-2xl border border-primary/25 overflow-hidden bg-card select-none flex flex-col"
            >
              {imageMode && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imgUrl!} alt={back} className="w-full h-auto block" draggable={false} />
              )}
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-5">
                <p className="text-3xl font-bold text-primary text-center leading-tight">
                  {imageMode ? word : back}
                </p>
                {sesUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); playWordAudio(sesUrl); }}
                    className="size-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                    aria-label="Sesi çal"
                  >
                    <Volume2 className="size-4 text-primary" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      {/* Bilmiyorum / Biliyorum — sadece arka yüzde */}
      <AnimatePresence>
        {flipped && (
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
