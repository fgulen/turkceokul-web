'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

const TIERS = [
  { min: 10, label: '10x', cls: 'bg-purple-500 text-white', emoji: '⚡' },
  { min: 5,  label: '5x',  cls: 'bg-orange-500 text-white', emoji: '🔥' },
  { min: 3,  label: '3x',  cls: 'bg-amber-400 text-amber-950', emoji: '🔥' },
  { min: 2,  label: '2x',  cls: 'bg-yellow-300 text-amber-900', emoji: '✨' },
] as const;

function getTier(combo: number) {
  return TIERS.find((t) => combo >= t.min) ?? null;
}

interface GameHUDProps {
  soruNo: number;       // 0-based — gösterimde +1 eklenir
  toplamSoru: number;
  kalp: number;         // 0–5
  combo: number;
  etiket?: string;
  birim?: string;       // "Soru" (default) veya "Kart" vb.
  hideCounter?: boolean; // "Kart X/Y" metnini gizle (noktalar kullanılıyorsa)
}

export function GameHUD({ soruNo, toplamSoru, kalp, combo, etiket, birim = 'Soru', hideCounter = false }: GameHUDProps) {
  const progress = (soruNo / toplamSoru) * 100;
  const tier = getTier(combo);
  const prevKalp = useRef(kalp);
  const [heartShake, setHeartShake] = useState(false);

  useEffect(() => {
    if (kalp < prevKalp.current) {
      setHeartShake(true);
      const t = setTimeout(() => setHeartShake(false), 400);
      prevKalp.current = kalp;
      return () => clearTimeout(t);
    }
    prevKalp.current = kalp;
  }, [kalp]);

  return (
    <div className="mb-6 select-none">
      <div className="flex items-center justify-between mb-3 min-h-[2rem]">
        {/* Kalpler */}
        <motion.div
          className="flex gap-1"
          animate={heartShake ? { x: [0, -5, 5, -4, 4, -2, 2, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Heart
              key={i}
              className="size-5 transition-all duration-300"
              style={{
                fill: i < kalp ? 'var(--heart)' : 'transparent',
                color: i < kalp ? 'var(--heart)' : 'oklch(0.80 0.02 145)',
                opacity: i < kalp ? 1 : 0.32,
              }}
            />
          ))}
        </motion.div>

        {/* Combo rozeti veya etiket */}
        <AnimatePresence mode="wait">
          {tier ? (
            <motion.div
              key={tier.label}
              className={cn(
                'px-3 py-1 rounded-full font-bold text-sm flex items-center gap-1.5 shadow-sm',
                tier.cls
              )}
              initial={{ scale: 0, rotate: -15, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0, rotate: 15 }}
              transition={{ type: 'spring', stiffness: 420, damping: 13 }}
            >
              {tier.emoji} {tier.label} Combo
            </motion.div>
          ) : etiket ? (
            <span key="etiket" className="text-xs font-medium text-muted-foreground">
              {etiket}
            </span>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--correct)' }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {!hideCounter && (
        <div className="flex justify-between mt-1.5 text-[11px] text-muted-foreground">
          <span>{birim} {soruNo + 1} / {toplamSoru}</span>
          {progress > 0 && (
            <span className="font-semibold" style={{ color: 'var(--correct)' }}>
              %{Math.round(progress)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
