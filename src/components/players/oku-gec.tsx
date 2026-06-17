'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type PlayerProps } from '@/types/etkinlik';
import { toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';

export function OkuGecPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const [index, setIndex] = useState(0);
  const [imgError, setImgError] = useState(false);

  const current = detaylar[index];
  const progress = ((index + 1) / detaylar.length) * 100;
  const imgUrl = toMediaUrl(current.resimLink);
  const hasText = !!current.description?.trim();
  const hasImg = !!imgUrl && !imgError;

  function next() {
    if (index + 1 >= detaylar.length) {
      onComplete(detaylar.map((d) => ({ id: d.id, cevap: '1' })));
    } else {
      setIndex(index + 1);
      setImgError(false);
    }
  }

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto">
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
          {/* Resim */}
          {imgUrl && (
            imgError ? null : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt=""
                className="w-full max-h-72 object-contain bg-muted"
                onError={() => setImgError(true)}
              />
            )
          )}

          {/* Metin içeriği */}
          {hasText && (
            <div className="p-6">
              <div
                className="text-lg md:text-xl leading-relaxed md:leading-loose [&_br]:block [&_.sozluk]:text-primary [&_.sozluk]:cursor-help"
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(current.description!) }}
              />
            </div>
          )}

          {/* İkisi de yok veya ikisi de yüklenemedi */}
          {!hasImg && !hasText && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <ImageOff className="size-10 opacity-30" />
              <p className="text-sm">İçerik bulunamadı.</p>
            </div>
          )}
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
