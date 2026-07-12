'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { cn, toMediaUrl, cokSatirMi, diyalogMetinClass, duzMetneCevir } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { usePlayerAudio } from '@/hooks/use-player-audio';
import { PlayingBars } from './ui';

// NOT: bu tipte doğru cevap (current.cevap) güvenlik gereği öğrenciye API'den hiç
// gönderilmiyor (DersController.GetEtkinlik — "Doğru"/"Yanlış" doğrudan sorunun cevabı
// olduğu için ogretmenTier dışına sızdırılmaz). Bu yüzden anlık doğru/yanlış geri
// bildirimi İMKANSIZ — KelimeleriEslestir gibi "toplu" modda cevaplar biriktirilip tek
// seferde onComplete ile gönderilir, kalp/puan sonucu yalnızca sunucu yanıtından gelir.
export function DogruYanlisPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { playing: audioPlaying, play: playWord } = usePlayerAudio();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const current = detaylar[index];
  const imgUrl = toMediaUrl(current.resimLink);
  const sesUrl = toMediaUrl(current.sesLink);
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
    }, 350);
  }

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>Soru {index + 1} / {detaylar.length}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {imgUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgUrl}
          alt=""
          className="h-56 w-auto max-w-full mx-auto object-contain rounded-2xl mb-4 block"
        />
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
          className={cn(
            'bg-card border border-border rounded-2xl p-8 mb-8 min-h-[120px] flex items-center gap-3',
            cokSatirMi(current.description) ? 'justify-start text-left' : 'justify-center text-center',
          )}
        >
          <p className={cn('text-xl font-semibold leading-relaxed', diyalogMetinClass(current.description))}>
            {duzMetneCevir(current.description)}
          </p>
          {sesUrl && (
            <button
              type="button"
              onClick={() => playWord(sesUrl)}
              className="shrink-0 size-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
              aria-label="Sesi çal"
            >
              {audioPlaying
                ? <PlayingBars size="sm" color="bg-primary" />
                : <Volume2 className="size-4 text-primary" />
              }
            </button>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-4">
        {(['Doğru', 'Yanlış'] as const).map((val) => {
          const isSelected = val === selected;
          return (
            <button
              key={val}
              onClick={() => handleSelect(val)}
              disabled={selected !== null}
              className={cn(
                'py-5 rounded-2xl border-2 text-lg font-bold transition-all',
                selected === null && 'border-border hover:border-primary hover:bg-primary/5',
                isSelected && 'border-primary bg-primary/10 text-primary',
                selected !== null && !isSelected && 'opacity-30',
              )}
            >
              {val === 'Doğru' ? '✓ Doğru' : '✗ Yanlış'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
