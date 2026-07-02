'use client';

// Bu sayfa Faz 1'de minimal, salt-okunur bir paket listesi gösterir.
// Tam editör (kitap çoklu seç, seri indirim açıklama metni) Faz 2'ye sarkıyor —
// brief'in kendi kapsam notu: "temel CRUD çalışmalı", tam CRUD değil.
import { useQuery } from '@tanstack/react-query';
import { Package, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';

interface SaPaket {
  id: number;
  ad: string;
  aciklama?: string | null;
  aktifMi: boolean;
  olusturmaTarihi: string;
  kitapIdler: string[];
}

export default function SuperAdminPaketlerPage() {
  const { user, ready } = useAuthGuard('SuperAdmin');

  const { data: paketler = [], isLoading } = useQuery<SaPaket[]>({
    queryKey: ['sa-paketler'],
    queryFn: () => api.get('/api/super-admin/paketler').then((r) => r.data),
    enabled: !!user,
  });

  if (!ready || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <TurkishLetterBackdrop variant="super-admin" opacity={0.04} />
      <main className="max-w-[1200px] mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="size-9 rounded-xl bg-indigo-100 flex items-center justify-center">
            <Package className="size-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Paketler</h1>
            <p className="text-xs text-slate-500">Kurumsal katalogdaki kitap paketleri — salt okunur (Faz 1)</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          <strong>Paket nedir?</strong> Kurumsal alıcıya birlikte sunulan kitap grubu. Tematik paket (farklı
          serilerden seçme) veya seri tamamlama paketi olabilir. En iyi uygulama: 2–4 kitap, net tema
          (ör. &quot;A1 Başlangıç Seti&quot;). Paket oluşturma/düzenleme ve seri indirim tanımları Faz 2&apos;de eklenecek.
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Ad</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600 hidden md:table-cell">Açıklama</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Kitaplar</th>
                <th className="px-4 py-2.5 text-center font-medium text-slate-600">Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paketler.map((p) => (
                <tr key={p.id} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{p.ad}</td>
                  <td className="px-4 py-2.5 text-slate-500 hidden md:table-cell">{p.aciklama ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{p.kitapIdler?.join(', ') || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    {p.aktifMi
                      ? <Check className="size-4 text-green-600 mx-auto" />
                      : <X className="size-4 text-slate-300 mx-auto" />}
                  </td>
                </tr>
              ))}
              {!isLoading && paketler.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">Henüz paket yok</td></tr>
              )}
              {isLoading && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">Yükleniyor…</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
