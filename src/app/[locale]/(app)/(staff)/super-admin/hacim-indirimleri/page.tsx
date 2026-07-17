'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TrendingDown, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';

interface Kademe {
  minOgrenci: number;
  indirimOrani: number;
}

export default function SuperAdminHacimIndirimleriPage() {
  const { user, ready } = useAuthGuard('SuperAdmin');
  const qc = useQueryClient();
  const [kademeler, setKademeler] = useState<Kademe[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState(false);

  const { data, isLoading } = useQuery<Kademe[]>({
    queryKey: ['sa-hacim-indirimleri'],
    queryFn: () => api.get('/api/super-admin/hacim-indirimleri').then((r) => r.data),
    enabled: !!user,
  });

  useEffect(() => {
    if (data) setKademeler(data);
  }, [data]);

  const kaydetMutation = useMutation({
    mutationFn: (dto: Kademe[]) => api.put('/api/super-admin/hacim-indirimleri', dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-hacim-indirimleri'] });
      setErrorMsg(null);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    },
    onError: (e: any) => setErrorMsg(e.response?.data ?? 'Kaydedilemedi.'),
  });

  function updateRow(i: number, patch: Partial<Kademe>) {
    setKademeler((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  function removeRow(i: number) {
    setKademeler((rows) => rows.filter((_, idx) => idx !== i));
  }

  function addRow() {
    setKademeler((rows) => [...rows, { minOgrenci: 0, indirimOrani: 0 }]);
  }

  function handleSave() {
    if (kademeler.some((k) => k.indirimOrani < 0 || k.indirimOrani > 100)) {
      setErrorMsg('İndirim oranı 0–100 arasında olmalı.');
      return;
    }
    kaydetMutation.mutate([...kademeler].sort((a, b) => a.minOgrenci - b.minOgrenci));
  }

  if (!ready || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <TurkishLetterBackdrop variant="super-admin" opacity={0.04} />
      <main className="max-w-[800px] mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="size-9 rounded-xl bg-purple-100 flex items-center justify-center">
            <TrendingDown className="size-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hacim İndirimleri</h1>
            <p className="text-xs text-slate-500">Öğrenci sayısı bu eşiği geçince otomatik uygulanan kademeli indirim</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
          <strong>Örnek:</strong> 50–99 öğrenci → %5, 100–299 → %10, 300–499 → %15, 500+ → %20.
          Kaydet, tüm kademeleri baştan yazar (sipariş geçmişini etkilemez, sadece yeni fiyat hesaplamalarına yansır).
        </div>

        {errorMsg && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {errorMsg}
          </div>
        )}
        {savedMsg && (
          <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            Kaydedildi.
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Min. Öğrenci</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">İndirim (%)</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kademeler.map((k, i) => (
                <tr key={i} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2">
                    <input type="number" min={0} value={k.minOgrenci}
                      onChange={(e) => updateRow(i, { minOgrenci: +e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </td>
                  <td className="px-4 py-2">
                    <input type="number" min={0} max={100} value={k.indirimOrani}
                      onChange={(e) => updateRow(i, { indirimOrani: +e.target.value })}
                      className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => removeRow(i)}
                      className="size-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="size-3" />
                    </button>
                  </td>
                </tr>
              ))}
              {!isLoading && kademeler.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Henüz kademe yok</td></tr>
              )}
              {isLoading && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Yükleniyor…</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            <Plus className="size-4" /> Kademe Ekle
          </button>
          <button onClick={handleSave} disabled={kaydetMutation.isPending}
            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {kaydetMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </main>
    </div>
  );
}
