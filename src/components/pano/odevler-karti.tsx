'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { ClipboardList } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Odev {
  id: number;
  baslik: string;
  aciklama: string | null;
  teslimTarihi: string | null;
  olusturmaTarihi: string;
  gecikti: boolean;
}

export function OdevlerKarti() {
  const t = useTranslations();
  const locale = useLocale();

  const { data: odevler, isLoading } = useQuery<Odev[]>({
    queryKey: ['odevlerim'],
    queryFn: () => api.get('/api/odevlerim').then((r) => r.data),
  });

  return (
    <div className="bg-card border border-border rounded-3xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardList className="size-5 text-primary" />
        <h2 className="font-semibold text-lg">{t('pano.odevler.title')}</h2>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !odevler?.length ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <ClipboardList className="size-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">{t('pano.odevler.empty')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {odevler.map((o) => (
            <div key={o.id} className="p-4 rounded-xl border border-border">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug">{o.baslik}</p>
                {o.gecikti && (
                  <span className="shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">
                    {t('pano.odevler.overdue')}
                  </span>
                )}
              </div>
              {o.aciklama && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-2">
                  {o.aciklama}
                </p>
              )}
              {o.teslimTarihi && (
                <p
                  className={cn(
                    'text-xs mt-2',
                    o.gecikti ? 'text-red-600' : 'text-muted-foreground'
                  )}
                >
                  {t('pano.odevler.dueDate', {
                    date: new Date(o.teslimTarihi).toLocaleDateString(locale),
                  })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
