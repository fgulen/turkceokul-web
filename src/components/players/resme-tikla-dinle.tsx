'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageOff, Volume2 } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { usePlayerAudio } from '@/hooks/use-player-audio';
import { ProgressDots, PlayingBars, NextButton, NavCounter, ActivityHint } from './ui';

export function ResmeTiklaDinlePlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { playing, play, reset } = usePlayerAudio();

  const [index, setIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const current = detaylar[index];
  const imgUrl = toMediaUrl(current.resimLink);
  const sesUrl = toMediaUrl(current.sesLink);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setImgError(false);
    reset();
    const url = toMediaUrl(detaylar[index]?.sesLink);
    if (!url) return;
    const t = setTimeout(() => play(url), 300);
    return () => { clearTimeout(t); reset(); };
  }, [index]);

  function handleNext() {
    if (index + 1 >= detaylar.length) {
      const cevaplar: Cevap[] = detaylar.map((d) => ({ id: d.id, cevap: '1' }));
      onComplete(cevaplar);
    } else {
      setIndex((prev) => prev + 1);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <ProgressDots total={detaylar.length} activeIndex={index} />
      <ActivityHint>Resme tıkla, sesi dinle.</ActivityHint>

      {/* Kart */}
      <div className="rounded-xl border border-border/50 bg-card shadow-sm mb-5 overflow-hidden">
        <div className="relative aspect-[382/286] overflow-hidden bg-muted">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="absolute inset-0"
            >
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
            </motion.div>
          </AnimatePresence>

          {/* Ses butonu — resim üstünde */}
          {sesUrl && (
            <button
              onClick={() => play(sesUrl)}
              aria-label="Sesi çal"
              className="absolute inset-0 w-full h-full flex items-center justify-center"
            >
              <span className={cn(
                'size-14 rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95',
                playing
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white/90 text-primary hover:bg-white',
              )}>
                {playing
                  ? <PlayingBars size="lg" />
                  : <Volume2 className="size-6" />
                }
              </span>
            </button>
          )}
        </div>
      </div>

      <NextButton isLast={index === detaylar.length - 1} onClick={handleNext} />
      <NavCounter index={index} total={detaylar.length} />
    </div>
  );
}
