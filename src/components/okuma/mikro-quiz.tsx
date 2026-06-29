'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { type EtkinlikData, type Cevap } from '@/types/etkinlik';
import { CoktanSecmeliPlayer } from '@/components/players/coktan-secmeli';
import { DogruYanlisPlayer } from '@/components/players/dogru-yanlis';
import { BoslukDoldurmaPlayer } from '@/components/players/bosluk-doldurma';

export interface QuizEtkinlik {
  id: string;
  name: string;
  etkinlikTuru: string;
}

interface MikroQuizProps {
  etkinlikler: QuizEtkinlik[];
  onBitti: () => void;
}

// Okuma modülü için sadece 3 player tipi desteklenir.
// Diğer tipler sessizce geçilir; kalp sistemi uygulanmaz.
function renderPlayer(etkinlik: EtkinlikData, onComplete: (cevaplar: Cevap[]) => void) {
  const props = { etkinlik, onComplete };
  switch (etkinlik.etkinlikTuru) {
    case 'CoktanSecmeli':
      return <CoktanSecmeliPlayer {...props} />;
    case 'DogruYanlis':
      return <DogruYanlisPlayer {...props} />;
    case 'BoslukDoldurma':
      return <BoslukDoldurmaPlayer {...props} />;
    default:
      // Diğer tipler için sessizce geç
      onComplete([]);
      return null;
  }
}

function EtkinlikPlayerInline({
  etkinlikId,
  onComplete,
}: {
  etkinlikId: string;
  onComplete: (cevaplar: Cevap[]) => void;
}) {
  const { data: etkinlik, isLoading } = useQuery<EtkinlikData>({
    queryKey: ['etkinlik', etkinlikId],
    queryFn: () => api.get(`/api/etkinlik/${etkinlikId}`).then((r) => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="h-2 rounded-full bg-muted animate-pulse" />
        <div className="h-36 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!etkinlik) return null;

  return renderPlayer(etkinlik, onComplete);
}

export function MikroQuiz({ etkinlikler, onBitti }: MikroQuizProps) {
  const [idx, setIdx] = useState(0);
  const current = etkinlikler[idx];
  const isLast = idx === etkinlikler.length - 1;

  // onComplete: etkinlik tamamlandı (doğru/yanlış fark etmez) → sonraki etkinliğe geç
  const handleComplete = (_cevaplar: Cevap[]) => {
    if (isLast) {
      onBitti();
    } else {
      setIdx((i) => i + 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* İlerleme çubuğu */}
      <div className="flex gap-1.5">
        {etkinlikler.map((_, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-colors duration-300',
              i < idx
                ? 'bg-emerald-400'
                : i === idx
                  ? 'bg-primary'
                  : 'bg-muted',
            )}
          />
        ))}
      </div>

      {/* Etkinlik sayacı */}
      <p className="text-xs text-muted-foreground">
        {idx + 1} / {etkinlikler.length} — {current.name}
      </p>

      {/* Player — key={current.id} ile etkinlik değişince sıfırlanır */}
      <EtkinlikPlayerInline
        key={current.id}
        etkinlikId={current.id}
        onComplete={handleComplete}
      />
    </div>
  );
}
