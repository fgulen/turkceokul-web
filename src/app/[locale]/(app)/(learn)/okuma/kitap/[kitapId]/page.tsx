'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from '@/navigation';
import { use } from 'react';
import { CheckCircle2, Lock, Play, BookOpen, ChevronLeft, AlertCircle } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Button } from '@/components/ui/button';

interface Bolum {
  id: string;
  name: string;
  orderNo: number;
  tamamlandi: boolean;
  kilitli: boolean;
}

interface KitapDetay {
  kitap: {
    id: string;
    name: string;
    seviye: string;
    description: string | null;
    thumbnailPicture: string | null;
    kapakResimUrl?: string | null;
    toplamBolum: number;
  };
  kutuphaneKitapId: string | null;
  etkinlikAktif: boolean;
  bolumler: Bolum[];
}

export default function KitapDetayPage({
  params,
}: {
  params: Promise<{ kitapId: string; locale: string }>;
}) {
  const { user, ready } = useAuthGuard(undefined, true);
  const { kitapId } = use(params);

  const { data, isLoading, isError } = useQuery<KitapDetay>({
    queryKey: ['okuma-kitap', kitapId],
    queryFn: () => api.get(`/api/okuma/kitap/${kitapId}`).then((r) => r.data),
    enabled: !!user,
  });

  if (!ready) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  if (isLoading || (!data && !isError)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        <div className="flex flex-col md:flex-row gap-6 md:gap-8">
          <div className="w-40 md:w-56 aspect-[5/7] bg-muted rounded-xl animate-pulse shrink-0 mx-auto md:mx-0" />
          <div className="flex-1 space-y-3">
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            <div className="h-7 w-64 bg-muted rounded animate-pulse" />
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            <div className="h-2 w-40 bg-muted rounded-full animate-pulse" />
            <div className="h-11 w-full max-w-sm bg-muted rounded-xl animate-pulse mt-4" />
            <div className="space-y-2 pt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 max-w-2xl mx-auto px-4">
        <div className="flex flex-col items-center gap-2 text-center">
          <AlertCircle className="size-8 text-destructive" />
          <p className="text-muted-foreground">Kitap yüklenemedi.</p>
        </div>
        <Link href="/okuma">
          <Button variant="outline">Geri Dön</Button>
        </Link>
      </div>
    );
  }

  const { kitap, kutuphaneKitapId, etkinlikAktif, bolumler } = data;
  const tamamlanan = bolumler.filter((b) => b.tamamlandi).length;
  const pct =
    kitap.toplamBolum > 0
      ? Math.round((tamamlanan / kitap.toplamBolum) * 100)
      : 0;

  // İlk tamamlanmamış açık bölüm; yoksa ilk açık bölüm
  const aktifBolum =
    bolumler.find((b) => !b.kilitli && !b.tamamlandi) ??
    bolumler.find((b) => !b.kilitli);

  const tumTamamlandi =
    bolumler.length > 0 && bolumler.every((b) => b.tamamlandi);

  const kapakSrc = toMediaUrl(kitap.kapakResimUrl) || toMediaUrl(kitap.thumbnailPicture);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Geri */}
      <Link
        href="/okuma"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px]"
      >
        <ChevronLeft className="size-4" />
        Okuma Kitapları
      </Link>

      <div className="flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Kapak */}
        <div className="shrink-0 mx-auto md:mx-0">
          {kapakSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={kapakSrc}
              alt={kitap.name}
              width={224}
              height={314}
              className="w-40 md:w-56 aspect-[5/7] object-cover rounded-xl shadow-md"
            />
          ) : (
            <div className="w-40 md:w-56 aspect-[5/7] bg-muted rounded-xl flex items-center justify-center">
              <BookOpen className="size-10 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Bilgi + içerik */}
        <div className="flex-1 min-w-0 space-y-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="inline-block text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
              {kitap.seviye}
            </span>
            <h1 className="text-2xl font-bold text-foreground">{kitap.name}</h1>
            {kitap.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {kitap.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              {tamamlanan}/{kitap.toplamBolum} bölüm tamamlandı
            </p>
            <div className="h-2 bg-muted rounded-full w-40 mx-auto md:mx-0 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all',
                  tumTamamlandi ? 'bg-emerald-500' : 'bg-primary'
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {etkinlikAktif ? (
            <>
              {/* Okumaya Başla / Devam Et butonu */}
              {aktifBolum && (
                <Link
                  href={`/okuma/kitap/${kitapId}/bolum/${aktifBolum.id}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors min-h-[48px]"
                >
                  <Play className="size-4 fill-current" />
                  {tumTamamlandi
                    ? 'Tekrar Oku'
                    : tamamlanan === 0
                      ? 'Okumaya Başla'
                      : 'Devam Et'}
                </Link>
              )}

              {/* PDF/EPUB versiyonu — eşleştirme varsa */}
              {kutuphaneKitapId && (
                <Link
                  href={`/okuma/${kutuphaneKitapId}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl border border-border py-3 font-semibold text-foreground hover:bg-muted/50 transition-colors min-h-[48px]"
                >
                  <BookOpen className="size-4" />
                  Kitabı Oku (PDF)
                </Link>
              )}

              {/* Bölüm listesi */}
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Bölümler
                </h2>
                {bolumler.map((b) => (
                  <div key={b.id}>
                    {b.kilitli ? (
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/30 opacity-60 min-h-[48px]">
                        <Lock className="size-4 shrink-0 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{b.name}</span>
                      </div>
                    ) : (
                      <Link
                        href={`/okuma/kitap/${kitapId}/bolum/${b.id}`}
                        className={cn(
                          'flex items-center gap-3 px-4 py-3 rounded-xl border hover:shadow-sm transition-shadow min-h-[48px]',
                          b.tamamlandi
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-card border-border'
                        )}
                      >
                        {b.tamamlandi ? (
                          <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                        ) : (
                          <Play className="size-4 shrink-0 text-primary" />
                        )}
                        <span
                          className={cn(
                            'text-sm font-medium',
                            b.tamamlandi && 'text-emerald-800'
                          )}
                        >
                          {b.name}
                        </span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 px-4 py-4 rounded-xl border border-border bg-muted/30">
                <AlertCircle className="size-5 shrink-0 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Etkileşimli alıştırmalar öğretmeniniz tarafından henüz açılmamıştır,
                  kitabınızı PDF olarak okuyabilirsiniz.
                </p>
              </div>

              {kutuphaneKitapId && (
                <Link
                  href={`/okuma/${kutuphaneKitapId}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors min-h-[48px]"
                >
                  <BookOpen className="size-4" />
                  Kitabı Oku (PDF)
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
