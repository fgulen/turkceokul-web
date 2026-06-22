'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Lock } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { bookCoverUrl } from '@/lib/book-covers';
import { Link } from '@/navigation';
import { cn } from '@/lib/utils';

interface DersKitabi {
  id: string;
  name: string;
  kitapSeti: string;
  seviye: string;
  orderNo: number;
  thumbnailPicture?: string | null;
  description?: string | null;
}

function BookCoverThumb({ src, alt }: { src: string; alt: string }) {
  if (!src) return <div className="size-16 rounded-xl bg-muted flex items-center justify-center shrink-0"><BookOpen className="size-6 text-muted-foreground" /></div>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className="size-16 rounded-xl object-cover shrink-0 shadow-sm" />
  );
}

const SEVIYE_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function KutuphanePage() {
  const { user, ready } = useAuthGuard(undefined, true);
  const [cefrLevel, setCefrLevel] = useState<string | null>(null);

  useEffect(() => {
    setCefrLevel(localStorage.getItem('cefrLevel'));
  }, []);

  const { data: kitaplar, isLoading } = useQuery<DersKitabi[]>({
    queryKey: ['derskitaplari'],
    queryFn: () => api.get('/api/derskitaplari').then((r) => r.data),
    enabled: !!user,
  });

  if (!ready) return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  const isStaff = user.role !== 'Ogrenci';

  // Seri bazında grupla, sonra seviyeye göre sırala
  const seriListesi = kitaplar
    ? [...new Set(kitaplar.map((k) => k.kitapSeti))].sort()
    : [];

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6] pb-20 md:pb-10">
      <main className="max-w-[1200px] mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Ders Kitapları</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isStaff
              ? 'Müfredattaki tüm kitaplar ve etkinlikler'
              : 'Size uygun kitabı seçin ve etkinliklere başlayın'}
          </p>
        </div>

        {/* Öğrenci: seviye testi banner */}
        {!isStaff && !cefrLevel && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800">
              Seviye testini tamamlayarak size uygun kitaplara erişin.
            </p>
            <Link
              href="/seviye-testi"
              className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
            >
              Testi Başlat →
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : seriListesi.length === 0 ? (
          <p className="text-muted-foreground text-sm">Henüz kitap eklenmemiş.</p>
        ) : (
          <div className="space-y-10">
            {seriListesi.map((seri) => {
              const seridekiKitaplar = (kitaplar ?? [])
                .filter((k) => k.kitapSeti === seri)
                .sort((a, b) => {
                  const ai = SEVIYE_ORDER.indexOf(a.seviye);
                  const bi = SEVIYE_ORDER.indexOf(b.seviye);
                  return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
                });

              return (
                <div key={seri}>
                  <h2 className="font-semibold text-base text-foreground mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-5 rounded-full bg-primary inline-block" />
                    {seri}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {seridekiKitaplar.map((k, idx) => {
                      const coverUrl = bookCoverUrl(k.kitapSeti, idx + 1);
                      const active = isStaff || !cefrLevel || k.seviye === cefrLevel;

                      if (active) {
                        return (
                          <Link
                            key={k.id}
                            href={`/ders/${k.id}`}
                            className="p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group flex items-start gap-4"
                          >
                            <BookCoverThumb src={coverUrl} alt={k.name} />
                            <div className="min-w-0 flex-1">
                              <span className={cn(
                                'text-[11px] font-bold px-2 py-0.5 rounded-full inline-block mb-1.5',
                                isStaff
                                  ? 'bg-primary/10 text-primary'
                                  : cefrLevel === k.seviye
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-primary/10 text-primary',
                              )}>
                                {k.seviye}
                              </span>
                              <div className="font-semibold text-sm group-hover:text-primary transition-colors leading-snug">{k.name}</div>
                              {k.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{k.description}</p>
                              )}
                            </div>
                          </Link>
                        );
                      }

                      return (
                        <div
                          key={k.id}
                          className="p-5 bg-card border border-border rounded-2xl opacity-50 flex items-start gap-4"
                        >
                          <div className="relative shrink-0">
                            <BookCoverThumb src={coverUrl} alt={k.name} />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                              <Lock className="size-5 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{k.seviye}</span>
                              <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">Premium</span>
                            </div>
                            <div className="font-semibold text-sm text-muted-foreground leading-snug">{k.name}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
