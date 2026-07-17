'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Info } from 'lucide-react';
import { Link } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface OgrenciOzet {
  userId: number;
  ad: string;
  katilimTarihi: string;
  toplamPuan: number;
  tamamlananUnite: number;
  sonAktivite: string | null;
  durum: 'Tamamlandi' | 'DevamEdiyor' | 'Baslamadi' | null;
  unitePuani: number | null;
  uniteSonAktivite: string | null;
  uniteIlerlemeYuzdesi: number | null;
}

interface UniteOzet {
  id: string;
  ad: string;
  sira: number;
}

interface SinifRapor {
  sinifId: number;
  sinifAdi: string;
  ogrenciSayisi: number;
  ogrenciler: OgrenciOzet[];
  uniteler: UniteOzet[];
}

function pctColor(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500 text-white';
  if (pct >= 50) return 'bg-amber-400 text-white';
  if (pct >= 20) return 'bg-orange-300 text-white';
  return 'bg-slate-100 text-slate-400';
}

function durumBilgisi(durum: OgrenciOzet['durum']): { label: string; cls: string } {
  if (durum === 'Tamamlandi') return { label: 'Tamamlandı', cls: 'bg-emerald-500 text-white' };
  if (durum === 'DevamEdiyor') return { label: 'Devam Ediyor', cls: 'bg-amber-400 text-white' };
  return { label: 'Başlamadı', cls: 'bg-slate-100 text-slate-400' };
}

export default function RaporlarPage({ params }: { params: Promise<{ sinifId: string }> }) {
  const { sinifId } = use(params);
  const id = parseInt(sinifId);
  const { user, ready } = useAuthGuard('Ogretmen');
  const [excelYukleniyor, setExcelYukleniyor] = useState(false);
  const [uniteId, setUniteId] = useState<string | null>(null);

  async function excelIndir() {
    setExcelYukleniyor(true);
    try {
      const res = await api.get(`/api/ogretmen/sinif/${id}/rapor/excel`, {
        params: uniteId ? { uniteId } : {},
        responseType: 'blob',
      });
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
    queryKey: ['sinif-rapor', id, uniteId],
    queryFn: () => api.get(`/api/ogretmen/sinif/${id}/rapor`, { params: uniteId ? { uniteId } : {} }).then(r => r.data),
    enabled: !!user,
  });

  if (!ready) return <div className="min-h-[100dvh] flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  const ogrenciler = rapor?.ogrenciler ?? [];
  const maxUnite = Math.max(...ogrenciler.map(o => o.tamamlananUnite), 1);

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6]">
      <main className="max-w-[1000px] mx-auto px-4 py-8">
        <Link href={`/ogretmen/sinif/${id}`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="size-4" />
          Sınıfa dön
        </Link>

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <h1 className="text-xl font-bold text-slate-900">
            {rapor?.sinifAdi ?? '...'} — İlerleme Raporu
          </h1>
          <div className="flex items-center gap-3">
            {!!rapor?.uniteler?.length && (
              <select
                value={uniteId ?? ''}
                onChange={e => setUniteId(e.target.value || null)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white"
              >
                <option value="">Tüm Üniteler</option>
                {rapor.uniteler.map(u => (
                  <option key={u.id} value={u.id}>{u.ad}</option>
                ))}
              </select>
            )}
            <button
              onClick={excelIndir}
              disabled={excelYukleniyor || !rapor?.ogrenciler?.length}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              <Download className="size-4" />
              {excelYukleniyor ? 'İndiriliyor...' : 'Excel İndir'}
            </button>
          </div>
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
                  {uniteId ? (
                    <>
                      <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Durum</th>
                      <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <span
                          className="inline-flex items-center gap-1 cursor-help"
                          title="Öğrencinin bu ünitede denediği etkinliklerin ortalama başarı yüzdesi (doğruluk). Ünitenin ne kadarının bitirildiğini göstermez — İlerleme sütununa bakın."
                        >
                          Ünite Puanı
                          <Info className="size-3 text-slate-300" />
                        </span>
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tamamlanan Ünite</th>
                      <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Toplam XP</th>
                    </>
                  )}
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Son Aktivite</th>
                  <th className="text-center px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <span
                      className="inline-flex items-center gap-1 cursor-help"
                      title={
                        uniteId
                          ? 'Bu ünitedeki etkinliklerin yüzde kaçının tamamlandığı (kapsam). Tamamlanan etkinliklerin ne kadar başarılı olduğunu göstermez — Ünite Puanı sütununa bakın.'
                          : 'Sınıftaki en çok ünite tamamlayan öğrenciye göre bu öğrencinin tamamladığı ünite oranı.'
                      }
                    >
                      İlerleme
                      <Info className="size-3 text-slate-300" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ogrenciler.map((o, idx) => {
                  const pct = uniteId
                    ? (o.uniteIlerlemeYuzdesi ?? 0)
                    : Math.round((o.tamamlananUnite / maxUnite) * 100);
                  const sonAktivite = uniteId ? o.uniteSonAktivite : o.sonAktivite;
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
                      {uniteId ? (
                        <>
                          <td className="px-4 py-4 text-center">
                            <span className={cn('inline-block px-2.5 py-1 rounded-full text-xs font-bold', durumBilgisi(o.durum).cls)}>
                              {durumBilgisi(o.durum).label}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">
                            {o.unitePuani != null ? `%${Math.round(o.unitePuani)}` : '—'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-4 text-center">
                            <span className={cn('inline-block px-2.5 py-1 rounded-full text-xs font-bold', pctColor(pct))}>
                              {o.tamamlananUnite}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">
                            {o.toplamPuan.toLocaleString('tr')}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-4 text-center text-xs text-slate-400">
                        {sonAktivite
                          ? new Date(sonAktivite).toLocaleDateString('tr')
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
