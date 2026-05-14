'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Play, Users, Trophy, Wifi } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppNav } from '@/components/app-nav';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface LeaderboardSatir {
  sira: number;
  userId: number;
  ad: string;
  toplamPuan: number;
}

interface KahootDurum {
  oyunKodu: string;
  sinifId: number;
  mevcutSoruIdx: number;
  aktif: boolean;
  oyuncuSayisi: number;
  soruSayisi: number;
}

export default function CanliKahootPage({ params }: { params: Promise<{ sinifId: string }> }) {
  const { sinifId } = use(params);
  const id = parseInt(sinifId);
  const { user, ready } = useAuthGuard('Ogretmen');
  const [oyunKodu, setOyunKodu] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardSatir[]>([]);

  const { data: sinif } = useQuery({
    queryKey: ['sinif', id],
    queryFn: () => api.get(`/api/ogretmen/sinif/${id}`).then(r => r.data),
    enabled: !!user,
  });

  const { data: durum } = useQuery<KahootDurum>({
    queryKey: ['kahoot-durum', oyunKodu],
    queryFn: () => api.get(`/api/kahoot/${oyunKodu}`).then(r => r.data),
    enabled: !!oyunKodu,
    refetchInterval: oyunKodu ? 3000 : false,
  });

  async function oyunBaslat() {
    setLoading(true);
    try {
      const res = await api.post('/api/kahoot/olustur', {
        sinifId: id,
        etkinlikIdleri: [], // TODO: etkinlik seçici eklenince doldurulacak
      });
      setOyunKodu(res.data.oyunKodu);
    } finally {
      setLoading(false);
    }
  }

  async function leaderboardGetir() {
    if (!oyunKodu) return;
    const res = await api.get(`/api/kahoot/${oyunKodu}/leaderboard`);
    setLeaderboard(res.data);
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AppNav />
      <main className="max-w-[800px] mx-auto px-4 py-8">
        <a href={`/ogretmen/sinif/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="size-4" />
          Sınıfa dön
        </a>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
          <div className="size-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Wifi className="size-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Canlı Kahoot Modu</h1>
          <p className="text-slate-500 mb-8">{sinif?.name ?? '...'}</p>

          {!oyunKodu ? (
            <button
              onClick={oyunBaslat}
              disabled={loading}
              className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-white rounded-2xl text-lg font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              <Play className="size-5 fill-current" />
              {loading ? 'Oluşturuluyor...' : 'Oyunu Başlat'}
            </button>
          ) : (
            <div className="space-y-6">
              {/* Katılım kodu */}
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-8">
                <p className="text-sm font-medium text-emerald-700 mb-2">Oyun Kodu</p>
                <div className="text-6xl font-black tracking-[0.2em] text-emerald-600">
                  {oyunKodu}
                </div>
                <p className="text-xs text-emerald-600 mt-3">
                  Öğrenciler bu kodu kullanarak oyuna katılır
                </p>
              </div>

              {/* Oyun durumu */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Users className="size-5 text-slate-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-slate-700">{durum?.oyuncuSayisi ?? 0}</div>
                  <div className="text-xs text-slate-500">Katılan</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Trophy className="size-5 text-slate-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-slate-700">{durum?.soruSayisi ?? 0}</div>
                  <div className="text-xs text-slate-500">Soru</div>
                </div>
              </div>

              {/* Leaderboard */}
              <button
                onClick={leaderboardGetir}
                className="w-full px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold"
              >
                Leaderboard&apos;u Güncelle
              </button>

              {leaderboard.length > 0 && (
                <div className="text-left space-y-2">
                  {leaderboard.slice(0, 10).map(s => (
                    <div key={s.userId} className={cn(
                      'flex items-center justify-between px-4 py-3 rounded-xl',
                      s.sira === 1 ? 'bg-amber-50 border border-amber-200' :
                      s.sira === 2 ? 'bg-slate-50 border border-slate-200' :
                      s.sira === 3 ? 'bg-orange-50 border border-orange-100' :
                      'bg-white border border-slate-100'
                    )}>
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-sm font-black',
                          s.sira <= 3 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-600'
                        )}>
                          {s.sira}
                        </span>
                        <span className="font-medium text-slate-800">{s.ad}</span>
                      </div>
                      <span className="font-bold text-primary">{s.toplamPuan} puan</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
