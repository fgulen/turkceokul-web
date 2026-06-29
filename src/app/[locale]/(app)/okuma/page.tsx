'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from '@/navigation';
import { BookOpen, CheckCircle2, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface OkumaKitap {
  id: string;
  name: string;
  seviye: string;
  thumbnailPicture: string | null;
  toplamBolum: number;
  tamamlananBolum: number;
}

interface OkumaAtama {
  atamaId: number;
  dersKitabiId: string;
  kitapAdi: string;
  seviye: string;
  thumbnailPicture: string | null;
  teslimTarihi: string | null;
  toplamBolum: number;
  tamamlananBolum: number;
}

export default function OkumaPage() {
  const { user, ready } = useAuthGuard(undefined, true);

  const { data: kitaplar, isLoading } = useQuery<OkumaKitap[]>({
    queryKey: ['okuma-kitaplar'],
    queryFn: () => api.get('/api/okuma/kitaplar').then((r) => r.data),
    enabled: !!user,
  });

  const { data: atamalar } = useQuery<OkumaAtama[]>({
    queryKey: ['okuma-atamalar'],
    queryFn: () => api.get('/api/okuma/atamalar').then((r) => r.data),
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

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <div className="h-7 w-48 bg-muted rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-muted rounded mt-2 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Okuma</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Seviyene uygun kitabı seç, bölüm bölüm oku.
        </p>
      </div>

      {/* Atamalarım — sadece atama varsa göster */}
      {atamalar && atamalar.length > 0 && (
        <section>
          <h2 className="text-base font-semibold mb-3">Atamalarım</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {atamalar.map((a) => {
              const pct = a.toplamBolum > 0
                ? Math.round((a.tamamlananBolum / a.toplamBolum) * 100)
                : 0;
              const tamam = a.tamamlananBolum === a.toplamBolum && a.toplamBolum > 0;
              const gecikti = a.teslimTarihi && new Date(a.teslimTarihi) < new Date();

              return (
                <Link
                  key={a.atamaId}
                  href={`/okuma/kitap/${a.dersKitabiId}`}
                  className="group flex gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
                >
                  {a.thumbnailPicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.thumbnailPicture}
                      alt={a.kitapAdi}
                      className="w-16 h-20 object-cover rounded-md shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded-md shrink-0 flex items-center justify-center">
                      <BookOpen className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {a.seviye}
                      </span>
                      {tamam && <CheckCircle2 className="size-4 text-emerald-500" />}
                    </div>
                    <h3 className="font-semibold text-foreground leading-snug line-clamp-2">
                      {a.kitapAdi}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {a.tamamlananBolum}/{a.toplamBolum} bölüm
                    </p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', tamam ? 'bg-emerald-500' : 'bg-primary')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {a.teslimTarihi && (
                      <p className={cn('text-xs flex items-center gap-1 mt-1', gecikti ? 'text-red-500' : 'text-muted-foreground')}>
                        <Calendar className="size-3" />
                        {new Date(a.teslimTarihi).toLocaleDateString('tr-TR')}
                        {gecikti && ' (gecikmeli)'}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Kütüphane */}
      <section>
        {atamalar && atamalar.length > 0 && (
          <h2 className="text-base font-semibold mb-3">Kütüphane</h2>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : !kitaplar?.length ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="mx-auto size-12 mb-4 opacity-30" />
            <p>Henüz okuma kitabı eklenmemiş.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {kitaplar.map((kitap) => {
              const pct = kitap.toplamBolum > 0
                ? Math.round((kitap.tamamlananBolum / kitap.toplamBolum) * 100)
                : 0;
              const tamam = kitap.tamamlananBolum === kitap.toplamBolum && kitap.toplamBolum > 0;

              return (
                <Link
                  key={kitap.id}
                  href={`/okuma/kitap/${kitap.id}`}
                  className="group flex gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
                >
                  {kitap.thumbnailPicture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={kitap.thumbnailPicture}
                      alt={kitap.name}
                      className="w-16 h-20 object-cover rounded-md shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-20 bg-muted rounded-md shrink-0 flex items-center justify-center">
                      <BookOpen className="size-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                        {kitap.seviye}
                      </span>
                      {tamam && <CheckCircle2 className="size-4 text-emerald-500" />}
                    </div>
                    <h2 className="font-semibold text-foreground leading-snug line-clamp-2">
                      {kitap.name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {kitap.tamamlananBolum}/{kitap.toplamBolum} bölüm
                    </p>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all', tamam ? 'bg-emerald-500' : 'bg-primary')}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
