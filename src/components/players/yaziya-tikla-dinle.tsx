'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronRight } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';

export function YaziyaTiklaDinlePlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cooldownRef = useRef(false);

  const current = detaylar[index];
  const sesUrl = toMediaUrl(current.sesLink);
  const anaYazi = current.kelime1 || current.description || '';
  const altYazi = current.kelime1 && current.description && current.description !== current.kelime1
    ? current.description
    : '';

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
      {/* İlerleme noktaları */}
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
          {/* Tıklanabilir metin kartı */}
          <button
            onClick={playAudio}
            disabled={!sesUrl}
            aria-label="Sesi çal"
            className={cn(
              'w-full rounded-3xl border bg-card shadow-sm transition-all duration-200',
              'active:scale-[0.97]',
              sesUrl
                ? 'cursor-pointer hover:border-primary/40 hover:shadow-md'
                : 'cursor-default',
              playing && 'border-primary/50 shadow-primary/10 shadow-lg',
            )}
          >
            {/* Ses dalgası / ikon göstergesi */}
            <div className="flex justify-center pt-7 pb-3">
              <div className={cn(
                'flex items-end gap-[4px] h-8 transition-opacity',
                playing ? 'opacity-100' : 'opacity-30',
              )}>
                {[0, 0.12, 0.24, 0.12, 0].map((delay, i) => (
                  <motion.span
                    key={i}
                    className="w-[4px] rounded-full bg-primary"
                    animate={playing
                      ? { height: ['8px', i === 2 ? '28px' : '18px', '8px'] }
                      : { height: '8px' }
                    }
                    transition={playing
                      ? { duration: 0.65, repeat: Infinity, delay, ease: 'easeInOut' }
                      : { duration: 0.2 }
                    }
                  />
                ))}
              </div>
            </div>

            {/* Ana metin */}
            <div className="px-6 pb-8 text-center">
              <p className="text-4xl font-bold text-foreground leading-snug tracking-tight">
                {anaYazi}
              </p>
              {altYazi && (
                <p className="text-base text-muted-foreground mt-3">{altYazi}</p>
              )}
              {sesUrl && (
                <div className={cn(
                  'inline-flex items-center gap-1.5 mt-5 text-xs font-medium transition-colors',
                  playing ? 'text-primary' : 'text-muted-foreground',
                )}>
                  <Volume2 className="size-3.5" />
                  {playing ? 'Dinleniyor…' : 'Dinlemek için dokun'}
                </div>
              )}
            </div>
          </button>
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
