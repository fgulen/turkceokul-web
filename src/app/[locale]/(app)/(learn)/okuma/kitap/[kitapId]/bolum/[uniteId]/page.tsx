'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { OkumaMetin } from '@/components/okuma/okuma-metin';
import { MikroQuiz } from '@/components/okuma/mikro-quiz';
import { BolumTamamlandi } from '@/components/okuma/bolum-tamamlandi';
import { ChevronLeft, BookOpen, AlertCircle } from 'lucide-react';
import { type EtkinlikData } from '@/types/etkinlik';
import { Button } from '@/components/ui/button';

type Asama = 'metin' | 'quiz' | 'tamamlandi';

interface EtkinlikOzet {
  id: string;
  name: string;
  etkinlikTuru: string;
  bolum: string;
}

interface KitapDetay {
  kitap: {
    id: string;
    name: string;
    toplamBolum: number;
  };
  bolumler: Array<{
    id: string;
    name: string;
    orderNo: number;
    tamamlandi: boolean;
    kilitli: boolean;
  }>;
}

export default function BolumPage({
  params,
}: {
  params: Promise<{ kitapId: string; uniteId: string; locale: string }>;
}) {
  const { user, ready } = useAuthGuard(undefined, true);
  const { kitapId, uniteId } = use(params);

  const [asama, setAsama] = useState<Asama>('metin');
  const [kazanilanKelimeler, setKazanilanKelimeler] = useState<string[]>([]);

  // Kitap verisi — progress counter (X / Y bölüm)
  const { data: kitapDetay } = useQuery<KitapDetay>({
    queryKey: ['okuma-kitap', kitapId],
    queryFn: () => api.get(`/api/okuma/kitap/${kitapId}`).then((r) => r.data),
    enabled: !!user,
  });

  // Bu ünitedeki etkinlikleri al — OkuGec'i bul
  const { data: etkinlikler } = useQuery<EtkinlikOzet[]>({
    queryKey: ['bolum-etkinlikler', uniteId],
    queryFn: () => api.get(`/api/etkinlikler/${uniteId}`).then((r) => r.data),
    enabled: !!user,
  });

  const okugecEtkinlik = etkinlikler?.find((e) => e.etkinlikTuru === 'OkuGec');
  const quizEtkinlikler = (etkinlikler ?? []).filter((e) => e.etkinlikTuru !== 'OkuGec');

  // OkuGec'in tam verisini al (detaylar içerir)
  const { data: okugecData, isLoading: okugecLoading, isError: okugecError } = useQuery<EtkinlikData>({
    queryKey: ['okugec-data', okugecEtkinlik?.id],
    queryFn: () => api.get(`/api/etkinlik/${okugecEtkinlik!.id}`).then((r) => r.data),
    enabled: !!okugecEtkinlik,
  });

  // Progress counter
  const bolumler = kitapDetay?.bolumler ?? [];
  const mevcutBolumIndex = bolumler.findIndex((b) => b.id === uniteId);
  const bolumNo = mevcutBolumIndex >= 0 ? mevcutBolumIndex + 1 : null;
  const toplamBolum = kitapDetay?.kitap.toplamBolum;
  const sonrakiBolum = bolumler[mevcutBolumIndex + 1] ?? null;

  // OkuGec description'larını paragraf olarak ayıkla
  const paragraflar =
    okugecData?.detaylar
      .filter((d) => d.description?.trim())
      .map((d) => d.description!) ?? [];

  // Bölümü tamamla + aşamayı ilerlet
  const handleMetinBitti = () => {
    if (quizEtkinlikler.length > 0) {
      setAsama('quiz');
      // API çağrısı YOK burada — quiz bittikten sonra çağrılacak
    } else {
      api
        .post('/api/okuma/bolum-tamamla', { uniteId })
        .catch(() => {
          // sessizce geç — UI engellenmesin
        });
      setAsama('tamamlandi');
    }
  };

  const handleQuizBitti = () => {
    api
      .post('/api/okuma/bolum-tamamla', { uniteId })
      .catch(() => {
        // sessizce geç — UI engellenmesin
      });
    setAsama('tamamlandi');
  };

  // Yüklenme
  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Üst bar: geri + sayaç + progress */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/okuma/kitap/${kitapId}`}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0 min-h-[44px] flex items-center"
        >
          <ChevronLeft className="size-5" />
        </Link>

        {bolumNo && toplamBolum ? (
          <span className="text-sm text-muted-foreground shrink-0 tabular-nums">
            {bolumNo} / {toplamBolum} bölüm
          </span>
        ) : null}

        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: asama === 'metin' ? '33%' : asama === 'quiz' ? '67%' : '100%' }}
          />
        </div>
      </div>

      {/* ── Metin aşaması ── */}
      {asama === 'metin' && (
        <>
          {/* Yükleniyor */}
          {(okugecLoading || (!okugecData && !okugecError && etkinlikler)) && (
            <div className="space-y-3">
              {[90, 75, 85, 60, 80].map((w, i) => (
                <div
                  key={i}
                  className="h-5 bg-muted rounded animate-pulse"
                  style={{ width: `${w}%` }}
                />
              ))}
            </div>
          )}

          {/* OkuGec etkinliği yok */}
          {etkinlikler && !okugecEtkinlik && (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <BookOpen className="size-10 opacity-30" />
              <p className="text-sm">Bu bölümde okuma metni bulunamadı.</p>
              <Link href={`/okuma/kitap/${kitapId}`}>
                <Button variant="outline" size="sm">Kitaba Dön</Button>
              </Link>
            </div>
          )}

          {/* Hata */}
          {okugecError && (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <AlertCircle className="size-8 text-destructive" />
              <p className="text-sm">Metin yüklenemedi.</p>
              <Link href={`/okuma/kitap/${kitapId}`}>
                <Button variant="outline" size="sm">Kitaba Dön</Button>
              </Link>
            </div>
          )}

          {/* Paragraf yok */}
          {okugecData && paragraflar.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <BookOpen className="size-10 opacity-30" />
              <p className="text-sm">Metin içeriği henüz eklenmemiş.</p>
            </div>
          )}

          {/* OkumaMetin bileşeni */}
          {okugecData && paragraflar.length > 0 && (
            <OkumaMetin
              uniteId={uniteId}
              kitapId={kitapId}
              paragraflar={paragraflar}
              onKelimeTiklandi={(w) => setKazanilanKelimeler((prev) => [...prev, w])}
              onBitti={handleMetinBitti}
            />
          )}
        </>
      )}

      {/* ── Quiz aşaması ── */}
      {asama === 'quiz' && quizEtkinlikler.length > 0 && (
        <MikroQuiz etkinlikler={quizEtkinlikler} onBitti={handleQuizBitti} />
      )}

      {/* ── Tamamlandı aşaması ── */}
      {asama === 'tamamlandi' && (
        <BolumTamamlandi
          uniteId={uniteId}
          kitapId={kitapId}
          kelimeSayisi={kazanilanKelimeler.length}
          sonrakiBolumId={sonrakiBolum?.id}
        />
      )}
    </div>
  );
}
