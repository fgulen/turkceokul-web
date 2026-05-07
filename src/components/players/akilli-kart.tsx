'use client';

import { useState } from 'react';
import { Volume2 } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';

function playAudio(url: string) {
  new Audio(url).play().catch(() => {});
}

export function AkilliKartPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);

  const current = detaylar[index];
  const progress = (index / detaylar.length) * 100;

  const imgUrl = toMediaUrl(current.resimLink);
  const sesUrl = toMediaUrl(current.sesLink);

  // || boş string için de fallback yapar (? sadece null/undefined atlar)
  const word = current.description || current.kelime1 || '';
  const back = current.kelime1 || current.description || '';
  const imageMode = !!imgUrl;

  function handleFlip() {
    if (flipped) return;
    setFlipped(true);
    if (sesUrl) playAudio(sesUrl);
  }

  function answer(bildi: boolean) {
    const next = [...cevaplar, { id: current.id, cevap: bildi ? '1' : '0' }];
    setCevaplar(next);
    if (index + 1 >= detaylar.length) {
      onComplete(next);
    } else {
      setIndex(index + 1);
      setFlipped(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto">
      {/* İlerleme */}
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <span>{index + 1} / {detaylar.length}</span>
        <span>Akıllı Kart</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/*
        Kart — tek div, resim doğal oranında tam görünür.
        Ön ve arka yüz aynı container içinde — sadece alt içerik değişir.
        Overlay yok, absolute pozisyon yok.
      */}
      <div
        role={!flipped ? 'button' : undefined}
        tabIndex={!flipped ? 0 : undefined}
        onClick={!flipped ? handleFlip : undefined}
        onKeyDown={(e) => !flipped && e.key === 'Enter' && handleFlip()}
        className={cn(
          'w-full rounded-2xl border overflow-hidden bg-card select-none transition-colors',
          !flipped
            ? 'cursor-pointer border-border/60 hover:border-primary/30'
            : 'border-primary/25',
        )}
      >
        {/* Resim — tam görünür, natural aspect ratio, kırpma yok */}
        {imageMode && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgUrl!}
            alt={word}
            className="w-full h-auto block"
            draggable={false}
          />
        )}

        {/* İçerik alanı — ön ve arka için tek div */}
        <div className={cn(
          'flex flex-col items-center gap-3 px-6 py-5',
          !imageMode && 'min-h-44 justify-center',
        )}>
          {!flipped ? (
            /* ─── ÖN YÜZ ─── */
            <>
              {!imageMode && (
                <p className="text-2xl font-bold text-center leading-snug">{word}</p>
              )}
              <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
                Çevirmek için tıkla
              </p>
            </>
          ) : (
            /* ─── ARKA YÜZ ─── */
            <>
              <p className="text-3xl font-bold text-primary text-center leading-tight">
                {imageMode ? word : back}
              </p>
              {sesUrl && (
                <button
                  onClick={(e) => { e.stopPropagation(); playAudio(sesUrl); }}
                  className="size-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  aria-label="Sesi çal"
                >
                  <Volume2 className="size-4 text-primary" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Bilmiyorum / Biliyorum — sadece arka yüzde */}
      {flipped && (
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => answer(false)}
            className="flex-1 py-3 rounded-xl border-2 border-destructive text-destructive font-semibold hover:bg-destructive/10 transition-colors"
          >
            Bilmiyorum
          </button>
          <button
            onClick={() => answer(true)}
            className="flex-1 py-3 rounded-xl border-2 font-semibold transition-colors"
            style={{ borderColor: 'var(--correct)', color: 'var(--correct)' }}
          >
            Biliyorum
          </button>
        </div>
      )}
    </div>
  );
}
