'use client';

import { useState, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ActivityHint } from './ui';
import { type PlayerProps, type Cevap, kontrolEt } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';

export function KelimeleriEslestirPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { play } = useGameSound();

  // Right column: sunucuda karıştırılmış, detaylardan kopuk bir değer listesi
  // (etkinlik.sagSecenekleri — 2026-07-31 cevap-gizli mimari fix'i: d.kelime1 artık
  // aynı objede description ile birlikte gitmiyor, aksi halde hangi solun hangi sağla
  // eşleştiği hiç oynamadan JSON'dan okunabilirdi). Her sağ seçenek benzersiz bir rid
  // (dizideki index) taşır — aynı değer birden fazla çiftte geçebilir, eşleştirme
  // değere DEĞİL bu instance'a göre yapılır.
  const rightOptions = useMemo(
    () => (etkinlik.sagSecenekleri ?? []).map((value, rid) => ({ value, rid })),
    [etkinlik.sagSecenekleri],
  );

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matched, setMatched] = useState<Map<string, { rid: number; value: string }>>(new Map());
  const [wrongLeft, setWrongLeft] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  function handleLeft(id: string) {
    if (matched.has(id) || pendingRef.current) return;
    setSelectedLeft(id === selectedLeft ? null : id);
  }

  async function handleRight(rid: number, value: string) {
    if (!selectedLeft || pendingRef.current) return;
    if ([...matched.values()].some((m) => m.rid === rid)) return; // bu sağ seçenek zaten kullanıldı

    const leftId = selectedLeft;
    pendingRef.current = true;
    setPending(true);

    let dogru = false;
    try {
      ({ sonuc: dogru } = await kontrolEt(etkinlik.id, leftId, value));
    } catch {
      dogru = false; // ağ hatasında güvenli taraf: eşleşmeyi kabul etme, kullanıcı tekrar dener
    }

    pendingRef.current = false;
    setPending(false);

    if (dogru) {
      play('correct');
      const next = new Map(matched).set(leftId, { rid, value });
      setMatched(next);
      setSelectedLeft(null);

      if (next.size === detaylar.length) {
        const cevaplar: Cevap[] = [...next.entries()].map(([id, m]) => ({ id, cevap: m.value }));
        setTimeout(() => onComplete(cevaplar), 400);
      }
    } else {
      play('wrong');
      setWrongLeft(leftId);
      setTimeout(() => {
        setWrongLeft(null);
        setSelectedLeft(null);
      }, 700);
    }
  }

  const usedRids = new Set([...matched.values()].map((m) => m.rid));
  const progressPct = (matched.size / detaylar.length) * 100;

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>{matched.size} / {detaylar.length} eşleşti</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      <ActivityHint>Sol taraftan bir kelime seç, sağ taraftan eşleştir.</ActivityHint>

      <div className="grid grid-cols-2 gap-3">
        {/* Left column */}
        <div className="space-y-3">
          {detaylar.map((d) => {
            const isMatched = matched.has(d.id);
            const isSelected = selectedLeft === d.id;
            const isWrong = wrongLeft === d.id;
            return (
              <button
                key={d.id}
                onClick={() => handleLeft(d.id)}
                disabled={isMatched || pending}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-sm font-medium text-left transition-all',
                  isMatched && 'opacity-50 cursor-default',
                  isSelected && !isMatched && 'border-primary bg-primary/10',
                  isWrong && 'border-destructive bg-destructive/10 animate-shake',
                  !isSelected && !isMatched && !isWrong && 'border-border hover:border-primary/50'
                )}
                style={isMatched ? { borderColor: 'var(--correct)', color: 'var(--correct)' } : undefined}
              >
                {d.description}
              </button>
            );
          })}
        </div>

        {/* Right column */}
        <div className="space-y-3">
          {rightOptions.map((opt) => {
            const isUsed = usedRids.has(opt.rid);
            return (
              <button
                key={opt.rid}
                onClick={() => handleRight(opt.rid, opt.value)}
                disabled={isUsed || pending}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-sm font-medium text-left transition-all',
                  isUsed && 'opacity-50 cursor-default',
                  !isUsed && 'border-border hover:border-primary/50'
                )}
                style={isUsed ? { borderColor: 'var(--correct)', color: 'var(--correct)' } : undefined}
              >
                {opt.value}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
