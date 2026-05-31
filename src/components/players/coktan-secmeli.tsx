'use client';

import { useState, useMemo } from 'react';
import { cn, toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { type PlayerProps, type Cevap, getKelimeler } from '@/types/etkinlik';
import { ActivityHint } from './ui';

export function CoktanSecmeliPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const current = detaylar[index];
  const progress = (index / detaylar.length) * 100;

  const options = useMemo(() => {
    const list = getKelimeler(current);
    return [...list].sort(() => Math.random() - 0.5);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);
    setTimeout(() => {
      const yeni = [...cevaplar, { id: current.id, cevap: opt }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex(index + 1);
        setSelected(null);
      }
    }, 700);
  }

  // Parse description — replace [___] or ___ with a styled blank indicator
  const sentence = current.description ?? '';

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

      {/* Cümle — [___] boşluğunu seçilen kelimeyle göster, HTML entity'lerini çöz */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-6 text-center min-h-[100px] flex items-center justify-center">
        <p
          className="text-xl font-semibold leading-relaxed"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(sentence).replace(
              /\[___\]|_{3,}/g,
              `<span class="inline-block min-w-[80px] border-b-2 border-primary mx-1 text-primary font-bold">${selected ?? '&nbsp;&nbsp;&nbsp;&nbsp;'}</span>`
            ),
          }}
        />
      </div>

      {/* Options */}
      <div className="flex flex-wrap gap-3 justify-center">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            disabled={selected !== null}
            className={cn(
              'px-5 py-2.5 rounded-xl border-2 font-medium text-sm transition-all',
              selected === null && 'border-border hover:border-primary hover:bg-primary/5',
              selected === opt && 'border-primary bg-primary/10 text-primary',
              selected !== null && selected !== opt && 'opacity-40'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
