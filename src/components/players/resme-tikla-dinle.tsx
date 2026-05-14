'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ImageOff, ChevronRight } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';

export function ResmeTiklaDinlePlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [imgError, setImgError] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cooldownRef = useRef(false);

  const current = detaylar[index];
  const imgUrl = toMediaUrl(current.resimLink);
  const sesUrl = toMediaUrl(current.sesLink);
  const label = current.description || current.kelime1 || '';

  function playAudio() {
    if (cooldownRef.current) return;
    if (!sesUrl) return;

    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, 600);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(sesUrl);
    audioRef.current = audio;
    setPlaying(true);
    audio.onended = () => setPlaying(false);
    audio.onerror = () => setPlaying(false);
    audio.play().catch(() => setPlaying(false));
  }

  useEffect(() => {
    setImgError(false);
    setPlaying(false);
    cooldownRef.current = false;
    const t = setTimeout(() => playAudio(), 300);
    return () => {
      clearTimeout(t);
      audioRef.current?.pause();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function handleNext() {
    if (index + 1 >= detaylar.length) {
      const cevaplar: Cevap[] = detaylar.map((d) => ({ id: d.id, cevap: '1' }));
      onComplete(cevaplar);
    } else {
      setIndex(index + 1);
    }
  }

  const isLast = index === detaylar.length - 1;

  return (
    <div className="max-w-sm mx-auto">
      {/* İlerleme noktaları — üstte */}
      <div className="flex justify-center gap-1.5 mb-6">
        {detaylar.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i < index  && 'bg-primary/40 w-3',
              i === index && 'bg-primary w-6',
              i > index  && 'bg-muted w-3',
            )}
          />
        ))}
      </div>

      {/* Kart */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.96, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.96, x: -40 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mb-5"
        >
          <div className="rounded-3xl border border-border/50 bg-card shadow-sm">
            {/* Resim — padding ile köşelerden uzak, radius kesmez */}
            <div className="p-3">
              <div className="relative rounded-[1.4rem] overflow-hidden bg-muted">
                {imgUrl && !imgError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt={label}
                    className="w-full h-auto block"
                    draggable={false}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full flex flex-col items-center justify-center gap-2 text-muted-foreground py-16">
                    <ImageOff className="size-10 opacity-30" />
                    {label && <p className="text-sm font-medium px-4 text-center">{label}</p>}
                  </div>
                )}

                {/* Ses butonu — resim üstünde ortada */}
                {sesUrl && (
                  <button
                    onClick={playAudio}
                    aria-label="Sesi çal"
                    className={cn(
                      'absolute inset-0 w-full h-full flex items-center justify-center',
                    )}
                  >
                    <span className={cn(
                      'size-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95',
                      playing
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-white/90 text-primary hover:bg-white',
                    )}>
                      {playing ? (
                        <span className="flex items-end gap-[3px] h-5">
                          {[0, 0.15, 0.3].map((delay, i) => (
                            <motion.span
                              key={i}
                              className="w-[3px] rounded-full bg-current"
                              animate={{ height: ['6px', '16px', '6px'] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
                            />
                          ))}
                        </span>
                      ) : (
                        <Volume2 className="size-6" />
                      )}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Kelime/etiket */}
            <div className="px-5 pb-5">
              <p className="text-2xl font-bold text-foreground leading-snug">{label}</p>
              {current.description && current.kelime1 && current.description !== current.kelime1 && (
                <p className="text-sm text-muted-foreground mt-1">{current.kelime1}</p>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* İleri butonu */}
      <button
        onClick={handleNext}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all"
      >
        {isLast ? 'Tamamla' : 'İleri'}
        <ChevronRight className="size-4" />
      </button>

      <p className="text-center text-xs text-muted-foreground mt-3">
        {index + 1} / {detaylar.length}
      </p>
    </div>
  );
}
