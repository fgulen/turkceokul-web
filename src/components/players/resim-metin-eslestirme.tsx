'use client';

import { useState, useMemo } from 'react';
import { ImageOff } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { ActivityHint } from './ui';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';

export function ResimMetinEslestirmePlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;

  // Shuffled text labels
  const shuffledMetinler = useMemo(
    () =>
      detaylar
        .map((d) => ({ id: d.id, label: d.kelime1 || d.description || '' }))
        .sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const { play } = useGameSound();

  const [selectedId, setSelectedId] = useState<string | null>(null); // seçili metin detayId'si
  const [matched, setMatched] = useState<Record<string, string>>({}); // imgDetayId → labelDetayId
  const [wrongImgId, setWrongImgId] = useState<string | null>(null);

  const matchedImgIds = new Set(Object.keys(matched));
  const matchedLabelIds = new Set(Object.values(matched));

  function handleMetin(id: string) {
    if (matchedLabelIds.has(id)) return;
    setSelectedId(id === selectedId ? null : id);
  }

  function handleResim(detayId: string) {
    if (!selectedId || matchedImgIds.has(detayId)) return;

    if (selectedId === detayId) {
      // Doğru eşleşme
      play('correct');
      const next = { ...matched, [detayId]: selectedId };
      setMatched(next);
      setSelectedId(null);

      if (Object.keys(next).length === detaylar.length) {
        const cevaplar: Cevap[] = detaylar.map((d) => ({
          id: d.id,
          cevap: d.description ?? '',  // backend d.Description ile karşılaştırıyor
        }));
        setTimeout(() => onComplete(cevaplar), 400);
      }
    } else {
      // Yanlış eşleşme
      play('wrong');
      setWrongImgId(detayId);
      setTimeout(() => {
        setWrongImgId(null);
        setSelectedId(null);
      }, 700);
    }
  }

  const cols = detaylar.length <= 4 ? 2 : 3;
  const matchedCount = Object.keys(matched).length;
  const progressPct = (matchedCount / detaylar.length) * 100;

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>{matchedCount} / {detaylar.length} eşleşti</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <ActivityHint>Bir kelime seç, sonra eşleşen resme tıkla.</ActivityHint>

      {/* Metin etiketleri — üstte */}
      <div className="flex flex-wrap gap-2 justify-center mb-8">
        {shuffledMetinler.map(({ id, label }) => {
          const isUsed = matchedLabelIds.has(id);
          const isSelected = selectedId === id;

          return (
            <button
              key={id}
              onClick={() => handleMetin(id)}
              disabled={isUsed}
              className={cn(
                'px-5 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all duration-200',
                isSelected && 'border-primary bg-primary/10 text-primary',
                isUsed && 'opacity-50 cursor-default',
                !isSelected && !isUsed && 'border-border hover:border-primary/50',
              )}
              style={isUsed ? { borderColor: 'var(--correct)', color: 'var(--correct)' } : undefined}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Resim ızgarası — altta, doğal oran, crop/blank yok */}
      <div
        className="grid gap-3 items-start"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {detaylar.map((d) => {
          const isMatched = matchedImgIds.has(d.id);
          const isWrong = wrongImgId === d.id;
          const isClickable = !!selectedId && !isMatched;
          const imgUrl = toMediaUrl(d.resimLink);

          return (
            <button
              key={d.id}
              onClick={() => handleResim(d.id)}
              disabled={!isClickable && !isMatched}
              className={cn(
                'relative rounded-2xl overflow-hidden border-2 transition-all duration-200',
                isMatched && 'cursor-default opacity-60',
                isWrong && 'border-destructive animate-shake',
                !isMatched && !isWrong && isClickable && 'border-primary hover:ring-2 hover:ring-primary/30 cursor-pointer',
                !isMatched && !isWrong && !isClickable && 'border-border',
              )}
              style={isMatched ? { borderColor: 'var(--correct)' } : undefined}
            >
              {imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgUrl}
                  alt={d.description ?? ''}
                  className="w-full h-auto block"
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 bg-muted text-muted-foreground p-4 text-center" style={{ minHeight: 100 }}>
                  <ImageOff className="size-6 opacity-40" />
                  <span className="text-xs font-medium">{d.description}</span>
                </div>
              )}

              {/* Eşleşti rozeti */}
              {isMatched && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="size-8 rounded-full bg-white flex items-center justify-center shadow">
                    <span className="text-[var(--correct)] text-lg font-bold">✓</span>
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
