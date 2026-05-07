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

function kalanSure(haftaBitis: string) {
  const bitis = new Date(haftaBitis);
  const simdi = new Date();
  const ms = bitis.getTime() - simdi.getTime();
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
  return s === 'Bitti' ? s : s.toUpperCase().replace(/\s/g, ' ') + ' KALDI';
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
      <div className="size-8 rounded-full border-4 border-[#16a34a] border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <AppNav />

      <main className="mt-16 mb-32 max-w-[600px] mx-auto px-4">
        {/* League Header — circular badge */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-40 h-40 mb-4 bg-orange-100 rounded-full flex items-center justify-center border-4 border-orange-400 shadow-lg">
            <div className="bg-orange-500 w-32 h-32 rounded-full flex flex-col items-center justify-center text-white p-4">
              <Award className="size-12 mb-1" />
              <span className="font-black text-xl leading-tight text-center">{lig ? lig.ligAdi.toUpperCase() : '—'}</span>
            </div>
            {lig && (
              <div className="absolute -bottom-4 bg-white border-2 border-slate-200 px-4 py-1 rounded-full shadow-md flex items-center gap-2">
                <Clock className="size-4 text-slate-500" />
                <span className="text-[10px] font-semibold text-slate-600">{kalanSureUpper(lig.haftaBitis)}</span>
              </div>
            )}
          </div>

          {/* Promotion / Demotion Bar */}
          {lig && (
            <div className="w-full mt-10 space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 px-2">
                <span className="text-[#16a34a]">Yükselme Bölgesi</span>
                <span className="text-pink-500">Düşme Bölgesi</span>
              </div>
              <div className="h-4 w-full bg-slate-200 rounded-full flex overflow-hidden border-2 border-white shadow-inner">
                <div className="h-full w-[33%] bg-[#16a34a]" />
                <div className="h-full bg-slate-200 w-[34%]" />
                <div className="h-full bg-pink-400 w-[33%]" />
              </div>
            </div>
          )}
        </div>

        {/* Leaderboard List — single card */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border-4 border-slate-200 overflow-hidden shadow-sm">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 border-b-2 border-slate-100 last:border-b-0">
                <div className="w-8 h-8 rounded-full bg-slate-100 animate-pulse" />
                <div className="w-10 h-10 rounded-full bg-slate-100 animate-pulse" />
                <div className="flex-1 h-4 bg-slate-100 animate-pulse rounded" />
                <div className="w-16 h-4 bg-slate-100 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : lig && lig.tablo.length > 0 ? (
          <motion.div
            className="bg-white rounded-2xl border-4 border-slate-200 overflow-hidden shadow-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {lig.tablo.map((satir, i) => (
              <motion.div
                key={satir.userId}
                className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                  i < lig.tablo.length - 1 ? 'border-b-2 border-slate-100' : ''
                } ${
                  satir.benimSatir
                    ? 'bg-green-50'
                    : 'hover:bg-slate-50'
                }`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                {/* Rank */}
                <div className="w-8 flex justify-center">
                  {satir.sira === 1 && <Award className="size-5 text-yellow-500" />}
                  {satir.sira === 2 && <Award className="size-5 text-slate-400" />}
                  {satir.sira === 3 && <Award className="size-5 text-orange-400" />}
                  {satir.sira > 3 && (
                    <span className="font-black text-slate-400">{satir.sira}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <User className="size-5 text-slate-400" />
                </div>

                {/* Name */}
                <div className="flex-grow">
                  <span className={`text-sm ${
                    satir.benimSatir ? 'font-black text-slate-800' : 'font-semibold text-slate-600'
                  }`}>
                    {satir.name}{satir.benimSatir && ' (sen)'}
                  </span>
                </div>

                {/* XP */}
                <div className="text-right">
                  <span className={`font-black text-sm ${
                    satir.benimSatir ? 'text-[#16a34a]' : 'text-slate-400'
                  }`}>
                    {satir.haftalikXp.toLocaleString('tr')} XP
                  </span>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-16 text-slate-500">
            <Award className="size-12 mx-auto mb-3 opacity-30" />
            <p>Henüz bir lig grubunda değilsin.</p>
            <p className="text-sm mt-1">İlk etkinliği tamamlayınca otomatik katılırsın.</p>
          </div>
        )}

        {/* Lig Kuralları Card */}
        {lig && lig.tablo.length > 0 && (
          <div className="mt-8 p-6 bg-white rounded-2xl border-4 border-slate-200 shadow-sm">
            <h3 className="font-black text-slate-800 text-lg mb-4 flex items-center gap-2">
              <Info className="size-5 text-[#16a34a]" />
              Lig Kuralları
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-[#16a34a] shrink-0" />
                <p className="text-slate-600 font-medium">
                  <span className="font-black text-slate-800">İlk 10</span> oyuncu bir üst lige terfi eder.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-pink-400 shrink-0" />
                <p className="text-slate-600 font-medium">
                  <span className="font-black text-slate-800">Son 5</span> oyuncu bir alt lige düşme tehlikesi yaşar.
                </p>
              </div>
    
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
