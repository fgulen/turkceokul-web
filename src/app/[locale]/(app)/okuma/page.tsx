'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from '@/navigation';
import { BookOpen, CheckCircle2 } from 'lucide-react';
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

export default function OkumaPage() {
  const { user, ready } = useAuthGuard(undefined, true);

  const { data: kitaplar, isLoading } = useQuery<OkumaKitap[]>({
    queryKey: ['okuma-kitaplar'],
    queryFn: () => api.get('/api/okuma/kitaplar').then((r) => r.data),
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
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Okuma Kitapları</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Seviyene uygun kitabı seç, bölüm bölüm oku.
        </p>
      </div>

      {!kitaplar?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <BookOpen className="mx-auto size-12 mb-4 opacity-30" />
          <p>Henüz okuma kitabı eklenmemiş.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {kitaplar.map((kitap) => {
            const pct =
              kitap.toplamBolum > 0
                ? Math.round((kitap.tamamlananBolum / kitap.toplamBolum) * 100)
                : 0;
            const tamam =
              kitap.tamamlananBolum === kitap.toplamBolum &&
              kitap.toplamBolum > 0;

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
                      className={cn(
                        'h-full rounded-full transition-all',
                        tamam ? 'bg-emerald-500' : 'bg-primary'
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
