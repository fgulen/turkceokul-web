'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type PlayerProps } from '@/types/etkinlik';
import { toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';

export function OkuGecPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const [index, setIndex] = useState(0);

  const current = detaylar[index];
  const progress = ((index + 1) / detaylar.length) * 100;
  const imgUrl = toMediaUrl(current.resimLink);

  function next() {
    if (index + 1 >= detaylar.length) {
      onComplete(detaylar.map((d) => ({ id: d.id, cevap: '1' })));
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <span>{index + 1} / {detaylar.length}</span>
        <span>Oku &amp; Geç</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-card border border-border rounded-2xl overflow-hidden mb-6"
        >
          {imgUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imgUrl}
              alt={current.description ?? ''}
              className="w-full max-h-64 object-contain bg-muted"
            />
          )}
          <div className="p-8">
              {current.description ? (
              // DB'den gelen içerik HTML işaretleme içerebilir (span.sozluk, br vs.)
              <div
                className="text-lg leading-relaxed [&_br]:block [&_.sozluk]:text-primary [&_.sozluk]:cursor-help"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(current.description ?? '') }}
              />
            ) : (
              <p className="text-muted-foreground text-sm">İçerik yükleniyor…</p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={next}
        className={cn(
          'w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors',
          'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {index + 1 >= detaylar.length ? 'Tamamla' : 'Devam Et'}
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}
