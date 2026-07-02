'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Megaphone, Plus, Pencil, Trash2, Check, X } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';
import { SlideOver } from '@/components/slide-over';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';

interface Kampanya {
  id: number;
  ad: string;
  indirimOrani: number;
  baslangicTarihi: string;
  bitisTarihi: string;
  aktifMi: boolean;
}

function toDateInput(iso: string) {
  return iso ? iso.slice(0, 10) : '';
}

export default function SuperAdminKampanyalarPage() {
  const { user, ready } = useAuthGuard('SuperAdmin');
  const qc = useQueryClient();
  const [editKampanya, setEditKampanya] = useState<Kampanya | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kampanya | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { data: kampanyalar = [], isLoading } = useQuery<Kampanya[]>({
    queryKey: ['sa-kampanyalar'],
    queryFn: () => api.get('/api/super-admin/kampanyalar').then((r) => r.data),
    enabled: !!user,
  });

  const olusturMutation = useMutation({
    mutationFn: (data: any) => api.post('/api/super-admin/kampanya', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kampanyalar'] }); setEditKampanya(null); setErrorMsg(null); },
    onError: (e: any) => setErrorMsg(e.response?.data ?? 'Kampanya oluşturulamadı.'),
  });

  const guncelleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/api/super-admin/kampanya/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kampanyalar'] }); setEditKampanya(null); setErrorMsg(null); },
    onError: (e: any) => setErrorMsg(e.response?.data ?? 'Kampanya güncellenemedi.'),
  });

  const silMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/super-admin/kampanya/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kampanyalar'] }); setDeleteTarget(null); setErrorMsg(null); },
    onError: (e: any) => { setErrorMsg(e.response?.data ?? 'Kampanya silinemedi.'); setDeleteTarget(null); },
  });

  if (!ready || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <TurkishLetterBackdrop variant="super-admin" opacity={0.04} />
      <main className="max-w-[1200px] mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-purple-100 flex items-center justify-center">
              <Megaphone className="size-5 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Kampanyalar</h1>
              <p className="text-xs text-slate-500">Zaman sınırlı indirim kampanyaları — katalog fiyatlamasına otomatik yansır</p>
            </div>
          </div>
          <button
            onClick={() => setEditKampanya('new')}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="size-4" /> Yeni Kampanya
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Ad</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">İndirim</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Başlangıç</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Bitiş</th>
                <th className="px-4 py-2.5 text-center font-medium text-slate-600">Aktif</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kampanyalar.map((k) => (
                <tr key={k.id} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2.5 font-medium text-slate-900">{k.ad}</td>
                  <td className="px-4 py-2.5 text-green-700 font-semibold">%{k.indirimOrani}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{new Date(k.baslangicTarihi).toLocaleDateString('tr')}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{new Date(k.bitisTarihi).toLocaleDateString('tr')}</td>
                  <td className="px-4 py-2.5 text-center">
                    {k.aktifMi ? <Check className="size-4 text-green-600 mx-auto" /> : <X className="size-4 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => setEditKampanya(k)}
                        className="size-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                        <Pencil className="size-3" />
                      </button>
                      <button onClick={() => setDeleteTarget(k)}
                        className="size-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && kampanyalar.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Henüz kampanya yok</td></tr>
              )}
              {isLoading && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Yükleniyor…</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <SlideOver
          open={!!editKampanya}
          onClose={() => { setEditKampanya(null); setErrorMsg(null); }}
          title={editKampanya === 'new' ? 'Yeni Kampanya' : 'Kampanya Düzenle'}
          subtitle={editKampanya && editKampanya !== 'new' ? editKampanya.ad : undefined}
          footer={
            <div className="flex gap-3">
              <button onClick={() => { setEditKampanya(null); setErrorMsg(null); }}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">İptal</button>
              <button
                form="kampanya-form"
                type="submit"
                disabled={olusturMutation.isPending || guncelleMutation.isPending}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {olusturMutation.isPending || guncelleMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          }
        >
          {editKampanya && (
            <KampanyaForm
              kampanya={editKampanya === 'new' ? null : editKampanya}
              onSave={(data) =>
                editKampanya === 'new'
                  ? olusturMutation.mutate(data)
                  : guncelleMutation.mutate({ id: editKampanya.id, data })
              }
            />
          )}
        </SlideOver>

        <DeleteConfirmModal
          open={!!deleteTarget}
          entityName={deleteTarget ? deleteTarget.ad : ''}
          onConfirm={() => deleteTarget && silMutation.mutate(deleteTarget.id)}
          onCancel={() => setDeleteTarget(null)}
          loading={silMutation.isPending}
        />
      </main>
    </div>
  );
}

function KampanyaForm({ kampanya, onSave }: { kampanya: Kampanya | null; onSave: (d: any) => void }) {
  const [form, setForm] = useState({
    ad: kampanya?.ad ?? '',
    indirimOrani: kampanya?.indirimOrani ?? 10,
    baslangicTarihi: toDateInput(kampanya?.baslangicTarihi ?? new Date().toISOString()),
    bitisTarihi: toDateInput(kampanya?.bitisTarihi ?? new Date().toISOString()),
    aktifMi: kampanya?.aktifMi ?? true,
  });

  return (
    <form
      id="kampanya-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave({
          ...form,
          baslangicTarihi: new Date(form.baslangicTarihi).toISOString(),
          bitisTarihi: new Date(form.bitisTarihi).toISOString(),
        });
      }}
      className="space-y-4"
    >
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Ad</label>
        <input value={form.ad} onChange={(e) => setForm((f) => ({ ...f, ad: e.target.value }))} required
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">İndirim Oranı (%)</label>
        <input type="number" min={0} max={100} value={form.indirimOrani}
          onChange={(e) => setForm((f) => ({ ...f, indirimOrani: +e.target.value }))}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Başlangıç</label>
          <input type="date" value={form.baslangicTarihi}
            onChange={(e) => setForm((f) => ({ ...f, baslangicTarihi: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600 block mb-1">Bitiş</label>
          <input type="date" value={form.bitisTarihi}
            onChange={(e) => setForm((f) => ({ ...f, bitisTarihi: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={form.aktifMi} onChange={(e) => setForm((f) => ({ ...f, aktifMi: e.target.checked }))} />
        Aktif
      </label>
    </form>
  );
}
