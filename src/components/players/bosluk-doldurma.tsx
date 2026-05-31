'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { cn, toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { ActivityHint } from './ui';

export function BoslukDoldurmaPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [value, setValue] = useState('');
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = detaylar[index];
  const progress = (index / detaylar.length) * 100;
  const sentence = current.description ?? '';

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!value.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    const yeni = [...cevaplar, { id: current.id, cevap: value.trim() }];
    setCevaplar(yeni);
    if (index + 1 >= detaylar.length) {
      onComplete(yeni);
    } else {
      setIndex(index + 1);
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <span>{index + 1} / {detaylar.length}</span>
        <span>Boşluk Doldurma</span>
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

      {/* Etkinlik resmi */}
      {etkinlik.resimLink && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={toMediaUrl(etkinlik.resimLink) ?? ''}
          alt=""
          className="w-full max-h-56 object-contain rounded-2xl mb-4 bg-muted"
        />
      )}

      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-8 mb-6 text-center min-h-[100px] flex items-center justify-center"
      >
        <p
          className="text-xl font-semibold leading-relaxed"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(sentence).replace(
              /\[___\]|_{3,}/g,
              `<span class="inline-block min-w-[80px] border-b-2 border-primary mx-1 text-primary font-bold">${value || '&nbsp;&nbsp;&nbsp;&nbsp;'}</span>`
            ),
          }}
        />
      </motion.div>

      <form onSubmit={handleSubmit}>
        <motion.input
          ref={inputRef}
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Cevabını yaz…"
          animate={shake ? { x: [-6, 6, -6, 6, 0] } : { x: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            'w-full h-14 px-5 rounded-2xl border-2 border-input bg-background text-lg font-medium outline-none',
            'focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors mb-4',
            'placeholder:text-muted-foreground'
          )}
        />
        <button
          type="submit"
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
        >
          {index + 1 >= detaylar.length ? 'Tamamla' : 'Devam Et'}
        </button>
      </form>
    </div>
  );
}
