'use client';

import { useQuery } from '@tanstack/react-query';
import { BookOpen, CheckCircle2, Circle, Flame, Heart, Zap } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { AppNav } from '@/components/app-nav';
import { PlusBanner } from '@/components/plus-banner';
import { cn } from '@/lib/utils';
import { Link } from '@/navigation';

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
}

const gorevLabel: Record<string, string> = {
  DakikaCalış: '20 dakika çalış',
  EtkinlikHatasiz: '3 etkinliği hatasız tamamla',
  DüelloDavet: 'Bir düello başlat',
};

function odulLabel(tipi: string, miktar: number) {
  if (tipi === 'Xp') return `+${miktar} XP`;
  if (tipi === 'Kalp') return `+${miktar} Kalp`;
  return `+${miktar}`;
}

export default function PanoPage() {
  const { user, ready } = useAuthGuard();

  const { data: gorevler, isLoading: gorevLoading } = useQuery<Gorev[]>({
    queryKey: ['gorevler'],
    queryFn: () => api.get('/api/gorevler').then((r) => r.data),
    enabled: !!user,
  });

  const { data: lig } = useQuery<LigTablosu | null>({
    queryKey: ['lig'],
    queryFn: () =>
      api.get('/api/lig').then((r) => r.data).catch(() => null),
    enabled: !!user,
  });

  const { data: kitaplar, isLoading: kitapLoading } = useQuery<DersKitabi[]>({
    queryKey: ['derskitaplari'],
    queryFn: () => api.get('/api/derskitaplari').then((r) => r.data),
    enabled: !!user,
  });

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppNav />

      <main className="max-w-[1200px] mx-auto px-4 py-10">
        {/* Greeting */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Selam, {user.name}!</h1>
          <p className="text-muted-foreground mt-1">Bugün ne öğreniyorsun?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-5">
          <StatCard
            icon={<Flame className="size-5 fill-current" style={{ color: 'var(--streak)' }} />}
            label="Streak"
            value={`${user.streakCount} gün`}
          />
          <StatCard
            icon={<Heart className="size-5 fill-current" style={{ color: 'var(--heart)' }} />}
            label="Kalp"
            value={`${user.kalp} / 5`}
          />
          <StatCard
            icon={<Zap className="size-5 fill-current" style={{ color: 'var(--xp)' }} />}
            label="Toplam XP"
            value={user.puan.toLocaleString('tr')}
          />
        </div>

        <PlusBanner className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          {/* Günlük Görevler */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-4">Günlük Görevler</h2>
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
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-lg">Ligim</h2>
              {lig && (
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                  {lig.ligAdi}
                </span>
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
                <p className="text-sm text-muted-foreground">Lig verisi bulunamadı.</p>
              )
            ) : (
              <div className="space-y-0.5">
                {lig.tablo.slice(0, 5).map((s) => (
                  <div
                    key={s.sira}
                    className={cn(
                      'flex items-center justify-between py-2 px-3 rounded-lg text-sm',
                      s.benimSatir && 'bg-primary/10 font-semibold'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'w-5 text-center text-xs font-bold',
                          s.sira <= 3 ? 'text-primary' : 'text-muted-foreground'
                        )}
                      >
                        {s.sira}
                      </span>
                      <span className="truncate max-w-[100px]">{s.name}</span>
                      {s.benimSatir && (
                        <span className="text-xs text-primary">(sen)</span>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs shrink-0">
                      {s.haftalikXp} XP
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ders Kitapları */}
        <div>
          <h2 className="font-semibold text-lg mb-4">Ders Kitapları</h2>
          {kitapLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(kitaplar ?? []).map((k) => (
                <Link
                  key={k.id}
                  href={`/ders/${k.id}`}
                  className="p-5 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
                >
                   <div className="flex items-start justify-between gap-2">
                     <div className="min-w-0 flex-1">
                       <div className="flex items-center gap-2 mb-1.5">
                         <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                           {k.seviye}
                         </span>
                       </div>
                       <div className="font-semibold group-hover:text-primary transition-colors truncate">
                         {k.name}
                       </div>
                       <div className="text-xs text-muted-foreground mt-1">{k.kitapSeti}</div>
                     </div>
                     <div className="size-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                       <BookOpen className="size-5 text-primary/50 group-hover:text-primary/70 transition-colors" />
                     </div>
                   </div>
                 </Link>
               ))}
             </div>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
      {icon}
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-semibold truncate">{value}</div>
      </div>
    </div>
  );
}

function GorevSatiri({ gorev }: { gorev: Gorev }) {
  const pct = Math.min(100, Math.round((gorev.mevcut / gorev.hedef) * 100));
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-border">
      {gorev.tamamlandi ? (
        <CheckCircle2 className="size-5 shrink-0" style={{ color: 'var(--correct)' }} />
      ) : (
        <Circle className="size-5 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium">
            {gorevLabel[gorev.gorevTipi] ?? gorev.gorevTipi}
          </span>
          <span className="text-xs text-primary font-medium ml-2 shrink-0">
            {odulLabel(gorev.odulTipi, gorev.odulMiktari)}
          </span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
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
