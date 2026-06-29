'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { OkumaMetin } from '@/components/okuma/okuma-metin';
import { ChevronLeft, CheckCircle2, BookOpen, AlertCircle } from 'lucide-react';
import { type EtkinlikData } from '@/types/etkinlik';
import { Button } from '@/components/ui/button';

type Asama = 'metin' | 'tamamlandi';

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

  // Bir sonraki bölüm (tamamlandi aşamasında göster)
  const sonrakiBolum =
    mevcutBolumIndex >= 0 && mevcutBolumIndex < bolumler.length - 1
      ? bolumler[mevcutBolumIndex + 1]
      : null;

  // OkuGec description'larını paragraf olarak ayıkla
  const paragraflar =
    okugecData?.detaylar
      .filter((d) => d.description?.trim())
      .map((d) => d.description!) ?? [];

  // Bölümü tamamla + aşamayı ilerlet
  const handleMetinBitti = () => {
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
            style={{ width: asama === 'metin' ? '50%' : '100%' }}
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

      {/* ── Tamamlandı aşaması ── */}
      {asama === 'tamamlandi' && (
        <div className="flex flex-col items-center gap-6 py-10 text-center">
          <div className="size-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="size-8 text-emerald-500" />
          </div>

          <div>
            <h2 className="text-xl font-bold text-foreground mb-1">Bölüm Tamamlandı!</h2>
            {kazanilanKelimeler.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                Bu bölümde{' '}
                <span className="font-semibold text-foreground">
                  {kazanilanKelimeler.length}
                </span>{' '}
                kelime kaydettiniz.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Metni başarıyla okudunuz.
              </p>
            )}
          </div>

          {/* Kaydedilen kelimeler */}
          {kazanilanKelimeler.length > 0 && (
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {kazanilanKelimeler.map((k) => (
                <span
                  key={k}
                  className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {k}
                </span>
              ))}
            </div>
          )}

          {/* TODO: Task 8 — Mikro Quiz */}

          {/* Navigasyon */}
          <div className="flex flex-col gap-2 w-full max-w-xs">
            {sonrakiBolum && !sonrakiBolum.kilitli && (
              <Link
                href={`/okuma/kitap/${kitapId}/bolum/${sonrakiBolum.id}`}
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors min-h-[48px]"
              >
                Sonraki Bölüm →
              </Link>
            )}
            <Link
              href={`/okuma/kitap/${kitapId}`}
              className="flex items-center justify-center w-full rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted/50 transition-colors min-h-[48px]"
            >
              Kitaba Dön
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
