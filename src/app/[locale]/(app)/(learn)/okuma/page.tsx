'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from '@/navigation';
import { BookOpen, CheckCircle2, Calendar } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { useAuthGuard } from '@/hooks/use-auth-guard';

interface OkumaKitap {
  id: string;
  name: string;
  seviye: string;
  thumbnailPicture: string | null;
  kapakResimUrl?: string | null;
  toplamBolum: number;
  tamamlananBolum: number;
}

interface OkumaAtama {
  atamaId: number;
  dersKitabiId: string;
  kitapAdi: string;
  seviye: string;
  thumbnailPicture: string | null;
  kapakResimUrl?: string | null;
  teslimTarihi: string | null;
  toplamBolum: number;
  tamamlananBolum: number;
}

export default function OkumaPage() {
  const t = useTranslations();
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

  // Atama meta verisini kitaplara bağla — tek liste, duplicate yok
  const atamaMap = new Map((atamalar ?? []).map((a) => [a.dersKitabiId, a]));
  const birlesik = (kitaplar ?? [])
    .map((k) => ({ kitap: k, atama: atamaMap.get(k.id) }))
    .sort((a, b) => {
      if (!!a.atama !== !!b.atama) return a.atama ? -1 : 1;
      if (a.atama && b.atama) {
        const at = a.atama.teslimTarihi ? new Date(a.atama.teslimTarihi).getTime() : Infinity;
        const bt = b.atama.teslimTarihi ? new Date(b.atama.teslimTarihi).getTime() : Infinity;
        return at - bt;
      }
      return 0; // API sırası (OrderNo) korunur
    });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Başlık */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('okuma.title')}</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {t('okuma.subtitle')}
        </p>
      </div>

      {!birlesik.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="mx-auto size-12 mb-4 opacity-30" />
          <p>{t('okuma.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {birlesik.map(({ kitap, atama }) => {
            const pct = kitap.toplamBolum > 0
              ? Math.round((kitap.tamamlananBolum / kitap.toplamBolum) * 100)
              : 0;
            const tamam = kitap.tamamlananBolum === kitap.toplamBolum && kitap.toplamBolum > 0;
            const gecikti = atama?.teslimTarihi && new Date(atama.teslimTarihi) < new Date();

            return (
              <Link
                key={kitap.id}
                href={`/okuma/kitap/${kitap.id}`}
                className="group flex gap-4 rounded-xl border border-border bg-card p-4 hover:shadow-md transition-shadow"
              >
                {(() => {
                  const coverSrc = toMediaUrl(kitap.kapakResimUrl) || toMediaUrl(kitap.thumbnailPicture);
                  if (coverSrc) {
                    // eslint-disable-next-line @next/next/no-img-element
                    return <img src={coverSrc} alt={kitap.name} className="w-16 h-20 object-cover rounded-md shrink-0" />;
                  }
                  return (
                    <div className="w-16 h-20 bg-muted rounded-md shrink-0 flex items-center justify-center">
                      <BookOpen className="size-6 text-muted-foreground" />
                    </div>
                  );
                })()}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {kitap.seviye}
                    </span>
                    {atama && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {t('okuma.assignment')}
                      </span>
                    )}
                    {tamam && <CheckCircle2 className="size-4 text-emerald-500" />}
                  </div>
                  <h2 className="font-semibold text-foreground leading-snug line-clamp-2">
                    {kitap.name}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {t('okuma.progress', { done: kitap.tamamlananBolum, total: kitap.toplamBolum })}
                  </p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', tamam ? 'bg-emerald-500' : 'bg-primary')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {atama?.teslimTarihi && (
                    <p className={cn('text-xs flex items-center gap-1 mt-1', gecikti ? 'text-red-500' : 'text-muted-foreground')}>
                      <Calendar className="size-3" />
                      {new Date(atama.teslimTarihi).toLocaleDateString('tr-TR')}
                      {gecikti && ` ${t('okuma.overdue')}`}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
