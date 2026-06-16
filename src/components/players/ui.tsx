'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Lightbulb } from 'lucide-react';
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
// • imageUrl varsa → tam ekran modal (konuşma balonları okunabilsin; soru arkada kalır)
// • sadece hint varsa → inline aşağı açılan perde (quiz/dogru-yanlis gibi oyunlar)
// • ikisi birlikte olabilir: modal içinde hint metni resmin altında gösterilir
interface HintCurtainProps {
  hint?: string;
  imageUrl?: string | null;
}

export function HintCurtain({ hint, imageUrl }: HintCurtainProps) {
  const [open, setOpen] = useState(false);
  const hasImage = Boolean(imageUrl);

  // Tam ekran modaldayken body scroll kilitle
  useEffect(() => {
    if (!hasImage || !open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [hasImage, open]);

  // Esc ile kapat
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  if (!hint && !imageUrl) return null;

  return (
    <>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors',
            open && !hasImage
              ? 'bg-amber-100 border-amber-300 text-amber-800'
              : 'text-amber-600 border-amber-200/70 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700',
          )}
        >
          <Lightbulb className="size-3.5" />
          İpucu
        </button>

        {/* Metin-only: inline perde */}
        {!hasImage && hint && (
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <p className="mt-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-900 leading-relaxed">
                  {hint}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Resim: tam ekran modal — soru kartı arkada kalır, öğrenci ezberlemeye zorlanır */}
      {hasImage && (
        <AnimatePresence>
          {open && (
            <motion.div
              className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/88 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
            >
              {/* Kapat butonu — 44px min hedef */}
              <button
                type="button"
                aria-label="Kapat"
                onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                className="absolute top-4 right-4 flex items-center justify-center min-w-[44px] min-h-[44px] rounded-full bg-white/15 text-white hover:bg-white/30 active:scale-95 transition-all text-2xl font-bold leading-none"
              >
                ✕
              </button>

              {/* eslint-disable-next-line @next/next/no-img-element */}
              <motion.img
                src={imageUrl!}
                alt=""
                className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                onClick={(e) => e.stopPropagation()}
              />

              {hint && (
                <p className="mt-4 max-w-sm text-center text-white/90 text-sm leading-relaxed px-6">
                  {hint}
                </p>
              )}

              <p className="absolute bottom-5 text-white/40 text-xs select-none">
                Ekrana dokun veya ✕ ile kapat
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </>
  );
}
