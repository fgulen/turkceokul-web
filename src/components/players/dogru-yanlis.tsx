'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { ActivityHint } from './ui';

export function DogruYanlisPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const current = detaylar[index];
  const progress = (index / detaylar.length) * 100;

  function handleSelect(val: 'Doğru' | 'Yanlış') {
    if (selected !== null) return;
    setSelected(val);
    setTimeout(() => {
      const yeni = [...cevaplar, { id: current.id, cevap: val }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, 600);
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <span>{index + 1} / {detaylar.length}</span>
        <span>Doğru / Yanlış</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {etkinlik.soruYonergesi && (
        <ActivityHint>{etkinlik.soruYonergesi}</ActivityHint>
      )}

      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 mb-8 text-center min-h-[120px] flex items-center justify-center"
      >
        <p className="text-xl font-semibold leading-relaxed">
          {current.description}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {(['Doğru', 'Yanlış'] as const).map((val) => (
          <button
            key={val}
            onClick={() => handleSelect(val)}
            disabled={selected !== null}
            className={cn(
              'py-5 rounded-2xl border-2 text-lg font-bold transition-all',
              selected === null && val === 'Doğru' && 'border-border hover:border-[--correct] hover:bg-[--correct]/10 hover:text-[--correct]',
              selected === null && val === 'Yanlış' && 'border-border hover:border-destructive hover:bg-destructive/10 hover:text-destructive',
              selected === val && val === 'Doğru' && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
              selected === val && val === 'Yanlış' && 'border-destructive bg-destructive/10 text-destructive',
              selected !== null && selected !== val && 'opacity-30'
            )}
          >
            {val === 'Doğru' ? '✓ Doğru' : '✗ Yanlış'}
          </button>
        ))}
      </div>
    </div>
  );
}
