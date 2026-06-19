'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { toMediaUrl } from '@/lib/utils';
import { usePlayerAudio } from '@/hooks/use-player-audio';
import { ProgressDots, AudioPlayButton, NextButton, NavCounter } from './ui';

export function YaziyaTiklaDinlePlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { playing, play, reset } = usePlayerAudio();
  const [index, setIndex] = useState(0);

  const current = detaylar[index];
  const sesUrl = toMediaUrl(current.sesLink);
  const anaYazi = current.kelime1 || current.description || '';
  const altYazi =
    current.kelime1 && current.description && current.description !== current.kelime1
      ? current.description
      : '';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
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
    <div className="max-w-sm md:max-w-lg mx-auto">
      <ProgressDots total={detaylar.length} activeIndex={index} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="bg-card border border-border rounded-2xl px-6 py-8 mb-5 text-center"
        >
          <p className="text-4xl font-bold text-foreground leading-snug tracking-tight">
            {anaYazi}
          </p>
          {altYazi && (
            <p className="text-base text-muted-foreground mt-3">{altYazi}</p>
          )}
          {sesUrl && (
            <div className="flex justify-center mt-5">
              <AudioPlayButton playing={playing} onPlay={() => play(sesUrl)} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <NextButton isLast={index === detaylar.length - 1} onClick={handleNext} />
      <NavCounter index={index} total={detaylar.length} />
    </div>
  );
}
