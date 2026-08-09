'use client';

import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { BookMarked, BookOpen, CheckCircle2, Circle, Flame, Heart, Zap, Lock, PartyPopper } from 'lucide-react';
import { bookCoverUrl } from '@/lib/book-covers';
import { useEffect, useState } from 'react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { PlusBanner } from '@/components/plus-banner';
import { cn, toMediaUrl } from '@/lib/utils';
import { Link, useRouter, useLocale } from '@/navigation';

interface Gorev {
  gorevTipi: string;
  hedef: number;
  mevcut: number;
  tamamlandi: boolean;
  odulTipi: string;
  odulMiktari: number;
}

interface LigSatir {
  sira: number;
  userId: number;
  name: string;
  haftalikXp: number;
  benimSatir: boolean;
}

interface LigTablosu {
  ligAdi: string;
  seviye: number;
  haftaBitis: string;
  tablo: LigSatir[];
}

interface DersKitabi {
  id: string;
  name: string;
  kitapSeti: string;
  seviye: string;
  orderNo: number;
  thumbnailPicture?: string | null;
}

interface OkumaKitabi {
  id: string;
  name: string;
  seviye: string;
  thumbnailPicture: string | null;
  kapakResimUrl?: string | null;
  toplamBolum: number;
  tamamlananBolum: number;
}

const gorevLabelMap: Record<string, string> = {
  EtkinlikHatasiz: 'pano.taskLabels.EtkinlikHatasiz',
};

export default function PanoPage() {
  const t = useTranslations();
  const { user, ready } = useAuthGuard();
  const [cefrLevel, setCefrLevel] = useState<string | null>(null);

  useEffect(() => {
    setCefrLevel(localStorage.getItem("cefrLevel"));
  }, []);

  const { data: gorevler, isLoading: gorevLoading } = useQuery<Gorev[]>({
    queryKey: ['gorevler'],
    queryFn: () => api.get('/api/gorevler').then((r) => r.data),
    enabled: !!user,
  });

  const { data: lig } = useQuery<LigTablosu | null>({
    queryKey: ['lig'],
    queryFn: () =>
      api.get('/api/lig').then((r) => r.data || null).catch(() => null),
    enabled: !!user,
  });

  const { data: kitaplar, isLoading: kitapLoading } = useQuery<DersKitabi[]>({
    queryKey: ['derskitaplari'],
    queryFn: () => api.get('/api/derskitaplari').then((r) => r.data),
    enabled: !!user,
  });

  const { data: okumaKitaplari } = useQuery<OkumaKitabi[]>({
    queryKey: ['okuma-kitaplar'],
    queryFn: () => api.get('/api/okuma/kitaplar').then((r) => r.data),
    enabled: !!user,
  });

  // Sınıfsız (bireysel) öğrenci artık kataloğu görmez — bekleme listesi kararı
  // (docs/superpowers/specs/2026-07-29-bireysel-bekleme-listesi-design.md).
  const { data: profilDurum } = useQuery<{ sinifaBagliMi: boolean | null }>({
    queryKey: ['profil-sinif-durumu'],
    queryFn: () => api.get('/api/profil').then((r) => r.data),
    enabled: !!user && user.role === 'Ogrenci',
  });

  if (!ready) return <div className="min-h-[100dvh] flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  if (user.role === 'Ogrenci' && profilDurum?.sinifaBagliMi === false) {
    return <BeklemeEkrani />;
  }

  return (
    <div className="min-h-[100dvh] bg-background">

      <main className="max-w-[1200px] mx-auto px-4 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t('pano.greeting', { name: user.name })}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('pano.greetingSub')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <StatCard
            icon={<Flame className="size-5 fill-current" style={{ color: 'var(--streak)' }} />}
            label={t('pano.streak')}
            value={t('pano.streakDays', { count: user.streakCount })}
          />
          <StatCard
            icon={<Heart className="size-5 fill-current" style={{ color: 'var(--heart)' }} />}
            label={t('pano.hearts')}
            value={t('pano.heartsCount', { current: user.kalp })}
          />
          <StatCard
            icon={<Zap className="size-5 fill-current" style={{ color: 'var(--xp)' }} />}
            label={t('pano.totalXp')}
            value={user.puan.toLocaleString('tr')}
          />
        </div>

        <PlusBanner className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Günlük Görevler */}
          <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6">
            <h2 className="font-semibold text-lg mb-4">{t('pano.dailyTasks')}</h2>
            {gorevLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {(gorevler ?? []).map((g) => (
                  <GorevSatiri key={g.gorevTipi} gorev={g} />
                ))}
              </div>
            )}
          </div>

          {/* Lig */}
          <div className="bg-card border border-border rounded-3xl p-6">
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">{t('pano.myLeague')}</h2>
                {lig && (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    {lig.ligAdi}
                  </span>
                )}
              </div>
              {lig && (
                <p className="text-xs text-muted-foreground mt-0.5">{t('pano.leagueWeeklyHint')}</p>
              )}
            </div>
            {!lig ? (
              lig === undefined ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-9 rounded-lg bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t('pano.noLeague')}
                </p>
              )
            ) : (
              <div className="space-y-0.5">
                {lig.tablo.slice(0, 5).map((s) => (
                  <LigSatirRow key={s.sira} satir={s} />
                ))}
                {(() => {
                  const benim = lig.tablo.find((s) => s.benimSatir);
                  return benim && benim.sira > 5 ? (
                    <>
                      <div className="text-center text-muted-foreground text-xs py-0.5">···</div>
                      <LigSatirRow satir={benim} />
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>

        {/* Okuma Kitapları */}
        {okumaKitaplari && okumaKitaplari.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">{t('pano.readingBooks')}</h2>
              <Link href="/okuma" className="text-xs text-primary hover:underline">
                {t('pano.viewAll')}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {okumaKitaplari.map((kitap) => {
                const pct = kitap.toplamBolum > 0
                  ? Math.round((kitap.tamamlananBolum / kitap.toplamBolum) * 100)
                  : 0;
                const tamam = kitap.tamamlananBolum === kitap.toplamBolum && kitap.toplamBolum > 0;
                const devamEtHref = `/okuma/kitap/${kitap.id}`;

                return (
                  <Link
                    key={kitap.id}
                    href={devamEtHref}
                    className="p-5 bg-card border border-border rounded-3xl hover:border-primary/40 hover:shadow-md transition-all group flex items-start gap-4"
                  >
                    <OkumaKitapKapak kitap={kitap} />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {kitap.seviye}
                        </span>
                      </div>
                      <div className="font-semibold text-sm group-hover:text-primary transition-colors leading-snug">
                        {kitap.name}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('pano.progress', { done: kitap.tamamlananBolum, total: kitap.toplamBolum })}
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
          </div>
        )}

        {/* Ders Kitapları */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">{t('pano.courseBooks')}</h2>
            {cefrLevel && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {t('pano.yourLevel', { level: cefrLevel })}
              </span>
            )}
          </div>

          {kitapLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 rounded-3xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(kitaplar ?? []).map((k, idx, arr) => {
                // Seri içi sırayı hesapla (1-tabanlı)
                const seriesIdx = arr.filter((x, i) => i < idx && x.kitapSeti === k.kitapSeti).length + 1;
                const coverUrl = toMediaUrl(k.thumbnailPicture) ?? bookCoverUrl(k.kitapSeti, seriesIdx);
                const active = !cefrLevel || k.seviye === cefrLevel;
                if (active) {
                  return (
                    <Link
                      key={k.id}
                      href={`/ders/${k.id}`}
                      className="p-5 bg-card border border-border rounded-3xl hover:border-primary/40 hover:shadow-md transition-all group"
                    >
                      <div className="flex items-start gap-4">
                        <BookCoverThumb src={coverUrl} alt={k.name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {k.seviye}
                            </span>
                          </div>
                          <div className="font-semibold group-hover:text-primary transition-colors truncate">{k.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{k.kitapSeti}</div>
                        </div>
                      </div>
                    </Link>
                  );
                }
                return (
                  <Link
                    key={k.id}
                    href="/kayit?tip=bireysel"
                    className="p-5 bg-card border border-border rounded-3xl opacity-50 hover:opacity-70 transition-opacity relative group"
                    title={t('pano.premiumRequired')}
                  >
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <BookCoverThumb src={coverUrl} alt={k.name} />
                        <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                          <Lock className="size-3.5 text-white" aria-label={t('pano.locked')} role="img" />
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {k.seviye}
                          </span>
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            {t('pano.premium')}
                          </span>
                        </div>
                        <div className="font-semibold text-muted-foreground truncate">{k.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{k.kitapSeti}</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function BeklemeEkrani() {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const [kod, setKod] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const k = kod.trim();
    router.push(k ? `/sinif/katil?kod=${encodeURIComponent(k)}` : '/sinif/katil', { locale });
  }

  return (
    <div className="min-h-[100dvh] bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <PartyPopper className="size-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">{t('pano.bekleme.title')}</h1>
        <p className="text-muted-foreground mb-8">{t('pano.bekleme.desc')}</p>

        <form onSubmit={handleSubmit} className="text-left">
          <label className="mb-1.5 block text-sm font-semibold text-foreground">{t('pano.bekleme.kodLabel')}</label>
          <div className="flex gap-2">
            <input
              value={kod}
              onChange={(e) => setKod(e.target.value)}
              placeholder={t('pano.bekleme.kodPlaceholder')}
              className="flex-1 h-11 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 font-mono tracking-wide"
            />
            <button
              type="submit"
              disabled={kod.trim().length < 4}
              className="h-11 shrink-0 rounded-lg bg-primary px-4 text-sm font-bold text-white transition-opacity disabled:opacity-40"
            >
              {t('pano.bekleme.kodCta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LigSatirRow({ satir }: { satir: LigSatir }) {
  const t = useTranslations();
  return (
    <div
      className={cn(
        'flex items-center justify-between py-2 px-3 rounded-lg text-sm',
        satir.benimSatir && 'bg-primary/10 font-semibold'
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            'w-5 text-center text-xs font-bold',
            satir.sira <= 3 ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          {satir.sira}
        </span>
        <span className="truncate max-w-[100px]">{satir.name}</span>
        {satir.benimSatir && (
          <span className="text-xs text-primary">{t('pano.youLabel')}</span>
        )}
      </div>
      <span className="text-muted-foreground text-xs shrink-0">
        {satir.haftalikXp} XP
      </span>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-3xl p-4 flex items-center gap-3">
      {icon}
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}

function BookCoverThumb({ src, alt }: { src: string; alt: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className="w-10 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <BookOpen className="size-5 text-primary/50" />
      </div>
    );
  }
  return (
    <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 shadow-sm bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        onError={() => setErr(true)}
      />
    </div>
  );
}

// Okuma kitabı kapağı: kapakResimUrl (öğretmen/R2 kapağı) → thumbnailPicture → ikon fallback.
// BookCoverThumb'un aynısı ama okuma kitapları kapakResimUrl'den gelir (ders kitapları
// seri bazlı statik kapak kullanır). Okuma sayfasındaki w-16 h-20 ile birebir aynı boyut.
function OkumaKitapKapak({ kitap }: { kitap: OkumaKitabi }) {
  const [err, setErr] = useState(false);
  const src = toMediaUrl(kitap.kapakResimUrl) || toMediaUrl(kitap.thumbnailPicture);
  if (!src || err) {
    return (
      <div className="w-16 h-20 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <BookMarked className="size-6 text-primary" />
      </div>
    );
  }
  return (
    <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 shadow-sm bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={kitap.name}
        className="w-full h-full object-contain"
        onError={() => setErr(true)}
      />
    </div>
  );
}

function GorevSatiri({ gorev }: { gorev: Gorev }) {
  const t = useTranslations();
  const pct = Math.min(100, Math.round((gorev.mevcut / gorev.hedef) * 100));

  function odulLabel(tipi: string, miktar: number) {
    const type = tipi === 'Xp' ? t('pano.xpUnit') : tipi === 'Kalp' ? t('pano.heartUnit') : '';
    return t('pano.taskReward', { count: miktar, type });
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
      {gorev.tamamlandi ? (
        <CheckCircle2 className="size-5 shrink-0" style={{ color: 'var(--correct)' }} aria-label={t('pano.completed')} role="img" />
      ) : (
        <Circle className="size-5 shrink-0 text-muted-foreground" aria-label={t('pano.notCompleted')} role="img" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">
            {gorevLabelMap[gorev.gorevTipi] ? t(gorevLabelMap[gorev.gorevTipi]) : gorev.gorevTipi}
          </span>
          <span className="text-xs text-primary font-medium ml-2 shrink-0">
            {odulLabel(gorev.odulTipi, gorev.odulMiktari)}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all', gorev.tamamlandi ? 'bg-emerald-500' : 'progress-shimmer')}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {gorev.mevcut} / {gorev.hedef}
        </div>
      </div>
    </div>
  );
}
