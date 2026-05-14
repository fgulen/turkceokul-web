'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { AppNav } from '@/components/app-nav';
import { Award, Clock, Info, User } from 'lucide-react';

interface LigSatir {
  sira: number;
  userId: number;
  name: string;
  haftalikXp: number;
  benimSatir: boolean;
}

interface LigTablo {
  ligAdi: string;
  seviye: number;
  haftaBitis: string;
  tablo: LigSatir[];
}

// Seviyeye göre badge rengi — CSS Tailwind sınıfları sabit tutulmalı (purge-safe)
const LIG_BADGE: Record<number, { outer: string; inner: string }> = {
  1:  { outer: 'border-amber-600 bg-amber-50',   inner: 'bg-amber-700'   }, // Bronz
  2:  { outer: 'border-amber-600 bg-amber-50',   inner: 'bg-amber-700'   },
  3:  { outer: 'border-slate-400 bg-slate-50',   inner: 'bg-slate-500'   }, // Gümüş
  4:  { outer: 'border-slate-400 bg-slate-50',   inner: 'bg-slate-500'   },
  5:  { outer: 'border-yellow-400 bg-yellow-50', inner: 'bg-yellow-500'  }, // Altın
  6:  { outer: 'border-yellow-400 bg-yellow-50', inner: 'bg-yellow-500'  },
  7:  { outer: 'border-emerald-500 bg-emerald-50', inner: 'bg-emerald-600' }, // Zümrüt
  8:  { outer: 'border-purple-500 bg-purple-50', inner: 'bg-purple-600'  }, // Ametist
  9:  { outer: 'border-red-500 bg-red-50',       inner: 'bg-red-600'     }, // Yakut
  10: { outer: 'border-purple-700 bg-purple-50', inner: 'bg-purple-800'  }, // Taç
};

function getBadge(seviye?: number) {
  return LIG_BADGE[seviye ?? 1] ?? LIG_BADGE[1];
}

function kalanSure(haftaBitis: string) {
  const bitis = new Date(haftaBitis);
  const ms = bitis.getTime() - Date.now();
  if (ms <= 0) return 'Bitti';
  const gun = Math.floor(ms / 86400000);
  const saat = Math.floor((ms % 86400000) / 3600000);
  const dk = Math.floor((ms % 3600000) / 60000);
  if (gun > 0) return `${gun} gün ${saat} saat`;
  if (saat > 0) return `${saat} saat ${dk} dk`;
  return `${dk} dk`;
}

function kalanSureUpper(haftaBitis: string) {
  const s = kalanSure(haftaBitis);
  return s === 'Bitti' ? s : `${s.toUpperCase()} KALDI`;
}

export default function LigPage() {
  const { user, ready } = useAuthGuard();

  const { data: lig, isLoading } = useQuery<LigTablo>({
    queryKey: ['lig'],
    queryFn: () => api.get('/api/lig').then((r) => r.data),
    enabled: !!user,
  });

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  const badge = getBadge(lig?.seviye);

  return (
    <div className="min-h-screen bg-background">
      <AppNav />

      <main className="mt-16 mb-32 max-w-[600px] mx-auto px-4">
        {/* League Header */}
        <div className="flex flex-col items-center mb-8">
          <div className={`relative w-40 h-40 mb-4 rounded-full flex items-center justify-center border-4 shadow-lg ${badge.outer}`}>
            <div className={`w-32 h-32 rounded-full flex flex-col items-center justify-center text-white p-4 ${badge.inner}`}>
              <Award className="size-12 mb-1" />
              <span className="font-black text-xl leading-tight text-center">
                {lig ? lig.ligAdi.toUpperCase() : '—'}
              </span>
            </div>
            {lig && (
              <div className="absolute -bottom-4 bg-card border-2 border-border px-4 py-1 rounded-full shadow-md flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {kalanSureUpper(lig.haftaBitis)}
                </span>
              </div>
            )}
          </div>

          {/* Yükselme / Düşme Barı */}
          {lig && (
            <div className="w-full mt-10 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest px-2">
                <span className="text-correct">Yükselme Bölgesi</span>
                <span className="text-wrong">Düşme Bölgesi</span>
              </div>
              <div className="h-4 w-full bg-muted rounded-full flex overflow-hidden border-2 border-background shadow-inner">
                <div className="h-full w-[33%] bg-correct rounded-l-full" />
                <div className="h-full bg-muted w-[34%]" />
                <div className="h-full bg-wrong w-[33%] rounded-r-full" />
              </div>
            </div>
          )}
        </div>

        {/* Liderlik Tablosu */}
        {isLoading ? (
          <div className="bg-card rounded-2xl border-2 border-border overflow-hidden shadow-sm">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b border-border last:border-b-0">
                <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
                <div className="w-10 h-10 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 h-4 bg-muted animate-pulse rounded" />
                <div className="w-16 h-4 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : lig && lig.tablo.length > 0 ? (
          <motion.div
            className="bg-card rounded-2xl border-2 border-border overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {lig.tablo.map((satir, i) => (
              <motion.div
                key={satir.userId}
                className={[
                  'flex items-center gap-4 px-6 py-4 transition-colors',
                  i < lig.tablo.length - 1 ? 'border-b border-border' : '',
                  satir.benimSatir ? 'bg-primary/8' : 'hover:bg-muted/40',
                ].join(' ')}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                {/* Sıra */}
                <div className="w-8 flex justify-center">
                  {satir.sira === 1 && <Award className="size-5 text-yellow-500" />}
                  {satir.sira === 2 && <Award className="size-5 text-muted-foreground" />}
                  {satir.sira === 3 && <Award className="size-5 text-amber-500" />}
                  {satir.sira > 3 && (
                    <span className="font-black text-muted-foreground">{satir.sira}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <User className="size-5 text-muted-foreground" />
                </div>

                {/* İsim */}
                <div className="flex-grow">
                  <span className={`text-sm ${satir.benimSatir ? 'font-black text-foreground' : 'font-semibold text-muted-foreground'}`}>
                    {satir.name}{satir.benimSatir && ' (sen)'}
                  </span>
                </div>

                {/* XP */}
                <div className="text-right">
                  <span className={`font-black text-sm ${satir.benimSatir ? 'text-primary' : 'text-muted-foreground'}`}>
                    {satir.haftalikXp.toLocaleString('tr')} XP
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Award className="size-12 mx-auto mb-3 opacity-30" />
            <p>Henüz bir lig grubunda değilsin.</p>
            <p className="text-sm mt-1">İlk etkinliği tamamlayınca otomatik katılırsın.</p>
          </div>
        )}

        {/* Lig Kuralları */}
        {lig && lig.tablo.length > 0 && (
          <div className="mt-8 p-6 bg-card rounded-2xl border-2 border-border shadow-sm">
            <h3 className="font-black text-foreground text-lg mb-4 flex items-center gap-2">
              <Info className="size-5 text-primary" />
              Lig Kuralları
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-correct shrink-0" />
                <p className="text-muted-foreground font-medium">
                  <span className="font-black text-foreground">İlk 10</span> oyuncu bir üst lige terfi eder.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-wrong shrink-0" />
                <p className="text-muted-foreground font-medium">
                  <span className="font-black text-foreground">Son 5</span> oyuncu bir alt lige düşme tehlikesi yaşar.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
