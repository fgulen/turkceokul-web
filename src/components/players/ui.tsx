'use client';

import { useState, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Volume2 } from 'lucide-react';
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
// pulse: ses bitti veya autoplay engellendi → "tekrar çalmak için dokunun" ping halkası
interface AudioPlayButtonProps {
  playing: boolean;
  onPlay: () => void;
  className?: string;
  pulse?: boolean;
}
export function AudioPlayButton({ playing, onPlay, className, pulse }: AudioPlayButtonProps) {
  return (
    <span className="relative inline-flex shrink-0">
      {pulse && !playing && (
        <span className="absolute inset-0 rounded-full bg-primary/30 animate-ping" />
      )}
      <button
        onClick={onPlay}
        aria-label="Sesi çal"
        className={cn(
          'relative size-9 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors',
          className,
        )}
      >
        {playing
          ? <PlayingBars size="sm" color="bg-primary" />
          : <Volume2 className="size-4 text-primary" />
        }
      </button>
    </span>
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
