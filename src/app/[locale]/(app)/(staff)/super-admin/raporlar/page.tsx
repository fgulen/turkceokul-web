'use client';

import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { ROL_RENKLERI } from '../shared';

function RaporlarTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['sa-raporlar'],
    queryFn: () => api.get('/api/super-admin/raporlar').then(r => r.data),
  });

  if (isLoading) return <div className="text-sm text-slate-400 py-8 text-center">Yükleniyor...</div>;
  if (!data) return null;

  const maxTamamlama = Math.max(...(data.enCokTamamlanan ?? []).map((x: any) => x.tamamlamaSayisi), 1);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button onClick={() => refetch()} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <RefreshCw className="size-4" /> Yenile
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Son 30 gün aktif', val: data.son30GunAktif },
          { label: 'Bugün kayıt', val: data.bugunKayit },
          { label: 'Toplam etkinlik cevabı', val: data.toplamEtkinlikCevap?.toLocaleString('tr') },
        ].map(({ label, val }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold text-slate-900">{val ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Rol Dağılımı</h3>
          <div className="space-y-2">
            {(data.rolDagilimi as any[] ?? []).map(({ rol, sayi }: any) => (
              <div key={rol} className="flex items-center gap-3">
                <span className={`text-xs font-medium w-28 shrink-0 ${ROL_RENKLERI[rol]?.split(' ')[1] ?? 'text-slate-600'}`}>{rol}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(sayi / (data.toplamKullanici || 1)) * 100}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{sayi}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">En Çok Tamamlanan Kitaplar</h3>
          <div className="space-y-2">
            {(data.enCokTamamlanan as any[] ?? []).map(({ kitapAdi, tamamlamaSayisi }: any) => (
              <div key={kitapAdi} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 flex-1 truncate">{kitapAdi}</span>
                <div className="w-24 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${(tamamlamaSayisi / maxTamamlama) * 100}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{tamamlamaSayisi}</span>
              </div>
            ))}
            {!data.enCokTamamlanan?.length && <p className="text-xs text-slate-400">Veri yok</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  return <RaporlarTab />;
}
