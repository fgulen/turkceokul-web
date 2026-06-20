'use client';

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Lightbulb, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Progress Dots ─────────────────────────────────────────────────────────────
export function ProgressDots({ total, activeIndex }: { total: number; activeIndex: number }) {
  return (
    <div className="flex justify-center gap-1.5 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-1.5 rounded-full transition-all duration-300',
            i < activeIndex  && 'bg-primary/40 w-3',
            i === activeIndex && 'bg-primary w-6',
            i > activeIndex  && 'bg-muted w-3',
          )}
        />
      ))}
    </div>
  );
}

// ─── Playing Bars ──────────────────────────────────────────────────────────────
// size   barW  minH   maxH   gap   containerH
// sm     2px   3px    12px   2px   16px  — küçük alanlar (akilli-kart, resmin-sesi)
// md     3px   4px    12px   2px   16px  — orta alanlar (metin-ses)
// lg     3px   6px    16px   3px   20px  — büyük alanlar (resme-tikla)

const SIZES = {
  sm: { w: '2px', min: '3px', max: '12px', gap: '2px', h: '16px' },
  md: { w: '3px', min: '4px', max: '12px', gap: '2px', h: '16px' },
  lg: { w: '3px', min: '6px', max: '16px', gap: '3px', h: '20px' },
} as const;

interface PlayingBarsProps {
  size?: keyof typeof SIZES;
  color?: string;   // tailwind bg class, default 'bg-current'
  count?: number;   // default 3
}

export function PlayingBars({ size = 'md', color = 'bg-current', count = 3 }: PlayingBarsProps) {
  const s = SIZES[size];
  const delays = [0, 0.15, 0.3, 0.1, 0.2];
  return (
    <span className="flex items-end" style={{ gap: s.gap, height: s.h }}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={cn('rounded-full', color)}
          style={{ width: s.w, height: s.min }}
          animate={{ height: [s.min, s.max, s.min] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: delays[i] ?? 0, ease: 'easeInOut' }}
        />
      ))}
    </span>
  );
}

// ─── Next Button ───────────────────────────────────────────────────────────────
interface NextButtonProps {
  isLast: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export function NextButton({ isLast, onClick, disabled }: NextButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
    >
      {isLast ? 'Tamamla' : 'İleri'}
      <ChevronRight className="size-4" />
    </button>
  );
}

// ─── Audio Play Button ─────────────────────────────────────────────────────────
// Standart ses çal butonu — akıllı kart, yazıya tıkla, resme tıkla, vb.
interface AudioPlayButtonProps {
  playing: boolean;
  onPlay: () => void;
  className?: string;
}
export function AudioPlayButton({ playing, onPlay, className }: AudioPlayButtonProps) {
  return (
    <button
      onClick={onPlay}
      aria-label="Sesi çal"
      className={cn(
        'shrink-0 size-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors',
        className,
      )}
    >
      {playing
        ? <PlayingBars size="sm" color="bg-primary" />
        : <Volume2 className="size-4 text-primary" />
      }
    </button>
  );
}

// ─── Nav Counter ───────────────────────────────────────────────────────────────
export function NavCounter({ index, total }: { index: number; total: number }) {
  return (
    <p className="text-center text-xs text-muted-foreground mt-3">
      {index + 1} / {total}
    </p>
  );
}

// ─── Activity Hint ─────────────────────────────────────────────────────────────
// Statik, her zaman görünür talimat (oyun tipleri için: "Kartı çevir" vb.)
export function ActivityHint({ children }: { children: ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground text-center mb-6">{children}</p>
  );
}

// ─── Hint Curtain ──────────────────────────────────────────────────────────────
// • defaultOpen=true → perde görevi: etkinlik başında otomatik açık, ses otomatik çalar
// • imageUrl → inline (altına açılır); audioUrl → inline + otomatik çalma; videoUrl → inline video
// • hint → metin ipucu; kombinasyonlar çalışır
interface HintCurtainProps {
  hint?: string;
  imageUrl?: string | null;
  audioUrl?: string | null;
  videoUrl?: string | null;
  defaultOpen?: boolean;
}

export function HintCurtain({ hint, imageUrl, audioUrl, videoUrl, defaultOpen }: HintCurtainProps) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasImage = Boolean(imageUrl);
  const hasAudio = Boolean(audioUrl);
  const hasVideo = Boolean(videoUrl);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioPlaying(false);
  }, []);

  const startAudio = useCallback(() => {
    if (!audioUrl) return;
    stopAudio();
    const a = new Audio(audioUrl);
    audioRef.current = a;
    setAudioPlaying(true);
    a.onended = () => setAudioPlaying(false);
    a.onerror = () => setAudioPlaying(false);
    a.play().catch(() => setAudioPlaying(false));
  }, [audioUrl, stopAudio]);

  // defaultOpen=true ise ses otomatik çal
  useEffect(() => {
    if (defaultOpen && hasAudio) startAudio();
    return () => stopAudio();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc ile kapat
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); stopAudio(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, stopAudio]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (hasAudio) {
      if (next) startAudio();
      else stopAudio();
    }
  }

  if (!hint && !imageUrl && !audioUrl && !videoUrl) return null;

  const label = hasAudio && !hasImage && !hasVideo ? 'Dinle' : 'İpucu';
  const icon = hasAudio && !hasImage && !hasVideo
    ? <Volume2 className="size-3.5" />
    : <Lightbulb className="size-3.5" />;

  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={toggle}
        className={cn(
          'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors',
          open
            ? 'bg-amber-100 border-amber-300 text-amber-800'
            : 'text-amber-600 border-amber-200/70 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700',
        )}
      >
        {icon}
        {open ? 'Gizle' : label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
              {/* Resim — inline */}
              {hasImage && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl!}
                  alt=""
                  className="w-full h-auto block"
                  draggable={false}
                />
              )}

              {/* Video — inline */}
              {hasVideo && (
                <video
                  src={videoUrl!}
                  controls
                  playsInline
                  className="w-full block"
                />
              )}

              {/* Ses + metin */}
              {(hasAudio || hint) && (
                <div className="px-4 py-3">
                  {hasAudio && (
                    <div className="flex items-center gap-2 text-sm text-amber-800">
                      {audioPlaying ? (
                        <>
                          <PlayingBars size="sm" color="bg-amber-500" />
                          <span>Dinleniyor…</span>
                          <button
                            type="button"
                            onClick={stopAudio}
                            className="ml-auto text-xs underline opacity-60 hover:opacity-100"
                          >
                            Durdur
                          </button>
                        </>
                      ) : (
                        <>
                          <Volume2 className="size-3.5" />
                          <button
                            type="button"
                            onClick={startAudio}
                            className="underline hover:text-amber-900"
                          >
                            Tekrar dinle
                          </button>
                        </>
                      )}
                    </div>
                  )}
                  {hint && (
                    <p className={cn('text-sm text-amber-900 leading-relaxed', hasAudio && 'mt-2')}>
                      {hint}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
