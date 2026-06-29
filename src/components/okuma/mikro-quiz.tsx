'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { type EtkinlikData, type Cevap } from '@/types/etkinlik';
import { CoktanSecmeliPlayer } from '@/components/players/coktan-secmeli';
import { QuizPlayer } from '@/components/players/quiz';
import { DogruYanlisPlayer } from '@/components/players/dogru-yanlis';
import { BoslukDoldurmaPlayer } from '@/components/players/bosluk-doldurma';
import { AkilliKartPlayer } from '@/components/players/akilli-kart';
import { KelimeleriEslestirPlayer } from '@/components/players/kelimeleri-eslestir';
import { CoktanSecmeliBoslukDoldurmaPlayer } from '@/components/players/coktan-secmeli-bosluk-doldurma';
import { ResimSesEslestirmePlayer } from '@/components/players/resim-ses-eslestirme';
import { ResmeTiklaDinlePlayer } from '@/components/players/resme-tikla-dinle';
import { YaziyaTiklaDinlePlayer } from '@/components/players/yaziya-tikla-dinle';
import { ResimMetinEslestirmePlayer } from '@/components/players/resim-metin-eslestirme';
import { MetinSesEslestirmePlayer } from '@/components/players/metin-ses-eslestirme';
import { ResminSesiHangisiPlayer } from '@/components/players/resmin-sesi-hangisi';
import { ResimlerdenBiriniSecmePlayer } from '@/components/players/resimlerden-birini-secme';
import { KelimeleriSiralaPlayer } from '@/components/players/kelimeleri-sirala';
import { ResmeKelimeYazPlayer } from '@/components/players/resme-kelime-yaz';
import { SesiDinleveKelimeYazPlayer } from '@/components/players/sesi-dinle-ve-kelime-yaz';
import { KelimeleriGruplaPlayer } from '@/components/players/kelimeleri-grupla';
import { KelimelerdenCumleYapPlayer } from '@/components/players/kelimelerden-cumle-yap';
import { ResimliSoruCevapPlayer } from '@/components/players/resimli-soru-cevap';
import { KelimeleriAyristirPlayer } from '@/components/players/kelimeleri-ayristir';

export interface QuizEtkinlik {
  id: string;
  name: string;
  etkinlikTuru: string;
}

interface MikroQuizProps {
  etkinlikler: QuizEtkinlik[];
  onBitti: () => void;
}

// Mevcut /etkinlik/[etkinlikId]/page.tsx renderPlayer mantığının kopyası.
// OkuGec burada kasıtlı olarak yer almaz — okuma metni ayrı aşamada gösterilir.
// Not: Kalp sistemi okuma modülünde uygulanmaz; onComplete her durumda sonraki etkinliğe geçirir.
function renderPlayer(etkinlik: EtkinlikData, onComplete: (cevaplar: Cevap[]) => void) {
  const props = { etkinlik, onComplete };
  switch (etkinlik.etkinlikTuru) {
    case 'CoktanSecmeli':
      return <CoktanSecmeliPlayer {...props} />;
    case 'AkilliKart':
      return <AkilliKartPlayer {...props} />;
    case 'Quiz':
      return <QuizPlayer {...props} />;
    case 'KelimeleriEslestir':
      return <KelimeleriEslestirPlayer {...props} />;
    case 'CoktanSecmeliBoslukDoldurma':
      return <CoktanSecmeliBoslukDoldurmaPlayer {...props} />;
    case 'ResimSesEslestirme':
    case 'ResimSesEslestirmeDogruYanlis':
      return <ResimSesEslestirmePlayer {...props} />;
    case 'MetinDogruYanlis':
    case 'MetinCheckBox':
    case 'ResimMetinEslestirmeDogruYanlis':
      return <DogruYanlisPlayer {...props} />;
    case 'BoslukDoldurma':
      return <BoslukDoldurmaPlayer {...props} />;
    case 'ResmeTiklaDinle':
      return <ResmeTiklaDinlePlayer {...props} />;
    case 'YaziyaTiklaDinle':
      return <YaziyaTiklaDinlePlayer {...props} />;
    case 'ResimMetinEslestirme':
      return <ResimMetinEslestirmePlayer {...props} />;
    case 'MetinSesEslestirme':
    case 'MetinSesEslestirmeDogruYanlis':
      return <MetinSesEslestirmePlayer {...props} />;
    case 'ResminSesiHangisi':
      return <ResminSesiHangisiPlayer {...props} />;
    case 'ResimlerdenBiriniSecme':
      return <ResimlerdenBiriniSecmePlayer {...props} />;
    case 'KelimeleriSirala':
      return <KelimeleriSiralaPlayer {...props} />;
    case 'ResmeKelimeYaz':
      return <ResmeKelimeYazPlayer {...props} />;
    case 'SesiDinleveKelimeYaz':
      return <SesiDinleveKelimeYazPlayer {...props} />;
    case 'KelimeleriGrupla':
      return <KelimeleriGruplaPlayer {...props} />;
    case 'KelimelerdenCumleYap':
      return <KelimelerdenCumleYapPlayer {...props} />;
    case 'ResimliSoruCevap':
    case 'SoruCevap':
      return <ResimliSoruCevapPlayer {...props} />;
    case 'KelimeleriAyristir':
      return <KelimeleriAyristirPlayer {...props} />;
    default:
      // Bilinmeyen tip — etkinliği geç
      return (
        <div className="text-center py-10 space-y-4">
          <p className="text-sm text-muted-foreground">{etkinlik.name}</p>
          <button
            onClick={() => onComplete(etkinlik.detaylar.map((d) => ({ id: d.id, cevap: '1' })))}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold hover:bg-primary/90 transition-colors"
          >
            Devam Et
          </button>
        </div>
      );
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
