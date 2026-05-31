'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { Link } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppNav } from '@/components/app-nav';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface OgrenciOzet {
  userId: number;
  ad: string;
  katilimTarihi: string;
  toplamPuan: number;
  tamamlananUnite: number;
  sonAktivite: string | null;
}

interface SinifRapor {
  sinifId: number;
  sinifAdi: string;
  ogrenciSayisi: number;
  ogrenciler: OgrenciOzet[];
}

function pctColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500 text-white';
  if (pct >= 50) return 'bg-amber-400 text-white';
  if (pct >= 20) return 'bg-orange-300 text-white';
  return 'bg-slate-100 text-slate-400';
}

export default function RaporlarPage({ params }: { params: Promise<{ sinifId: string }> }) {
  const { sinifId } = use(params);
  const id = parseInt(sinifId);
  const { user, ready } = useAuthGuard('Ogretmen');
  const [excelYukleniyor, setExcelYukleniyor] = useState(false);

  async function excelIndir() {
    setExcelYukleniyor(true);
    try {
      const res = await api.get(`/api/ogretmen/sinif/${id}/rapor/excel`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sinif-${id}-rapor.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExcelYukleniyor(false);
    }
  }

  const { data: rapor, isLoading } = useQuery<SinifRapor>({
    queryKey: ['sinif-rapor', id],
    queryFn: () => api.get(`/api/ogretmen/sinif/${id}/rapor`).then(r => r.data),
    enabled: !!user,
  });

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  const ogrenciler = rapor?.ogrenciler ?? [];
  const maxUnite = Math.max(...ogrenciler.map(o => o.tamamlananUnite), 1);

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AppNav />
      <main className="max-w-[1000px] mx-auto px-4 py-8">
        <Link href={`/ogretmen/sinif/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="size-4" />
          Sınıfa dön
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-slate-900">
            {rapor?.sinifAdi ?? '...'} — İlerleme Raporu
          </h1>
          <button
            onClick={excelIndir}
            disabled={excelYukleniyor || !rapor?.ogrenciler?.length}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            <Download className="size-4" />
            {excelYukleniyor ? 'İndiriliyor...' : 'Excel İndir'}
          </button>
        </div>

        {isLoading ? (
          <div className="h-64 rounded-2xl bg-white animate-pulse" />
        ) : !ogrenciler.length ? (
          <p className="text-slate-400 text-center py-20">Henüz öğrenci yok.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Öğrenci</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tamamlanan Ünite</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam XP</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Son Aktivite</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">İlerleme</th>
                </tr>
              </thead>
              <tbody>
                {ogrenciler.map((o, idx) => {
                  const pct = Math.round((o.tamamlananUnite / maxUnite) * 100);
                  return (
                    <tr key={o.userId} className={cn('border-b border-slate-50', idx % 2 === 0 ? '' : 'bg-slate-50/50')}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {o.ad.charAt(0)}
                          </div>
                          <span className="font-medium text-sm text-slate-800">{o.ad}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <span className={cn('inline-block px-2.5 py-1 rounded-full text-xs font-bold', pctColor(pct))}>
                          {o.tamamlananUnite}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">
                        {o.toplamPuan.toLocaleString('tr')}
                      </td>
                      <td className="px-4 py-4 text-center text-xs text-slate-400">
                        {o.sonAktivite
                          ? new Date(o.sonAktivite).toLocaleDateString('tr')
                          : 'Hiç girmedi'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-slate-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
