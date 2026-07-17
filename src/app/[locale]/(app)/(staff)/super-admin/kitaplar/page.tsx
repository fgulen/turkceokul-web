'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Users, Globe, BarChart3, Shield,
  Pencil, Trash2, Check, X, Search, Plus, Eye, EyeOff,
  RefreshCw, ExternalLink, LogIn, Package, AlertCircle,
  Megaphone, TrendingDown, ScrollText, ChevronRight, UserPlus, Sparkles
} from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { SlideOver } from '@/components/slide-over';
import { useAuthStore, impersonation } from '@/stores/auth';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { ROL_RENKLERI, TUM_ROLLER, apiHataMesaji } from '../shared';

function KitaplarTab() {
  const qc = useQueryClient();
  const [arama, setArama] = useState('');
  const [editKitap, setEditKitap] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [secili, setSecili] = useState<Set<string>>(new Set());

  const { data: kitaplar = [] } = useQuery({
    queryKey: ['sa-kitaplar', arama],
    queryFn: () => api.get('/api/super-admin/kitaplar', { params: { arama } }).then(r => r.data),
  });

  const guncelleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/api/super-admin/kitap/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kitaplar'] }); setEditKitap(null); },
  });

  const silMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/super-admin/kitap/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kitaplar'] }); setDeleteTarget(null); },
  });

  const topluSilMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/api/super-admin/kitaplar/toplu-sil', { ids }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kitaplar'] }); setSecili(new Set()); },
  });

  function toggleSecili(id: string) {
    setSecili(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  return (
    <div className="space-y-4">
      {/* Kütüphane yönetimi linki */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-indigo-900">Kütüphane Kitapları</p>
          <p className="text-xs text-indigo-600 mt-0.5">PDF/EPUB okuma kitaplarını ekle, düzenle, önizle</p>
        </div>
        <Link href="/editor/kutuphane" className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
          Kütüphane Yönetimi →
        </Link>
      </div>

      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input value={arama} onChange={e => setArama(e.target.value)}
            placeholder="Ders kitabı ara..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        {secili.size > 0 && (
          <button onClick={() => topluSilMutation.mutate([...secili])}
            className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
            Toplu Sil ({secili.size})
          </button>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <input type="checkbox"
                  checked={secili.size === kitaplar.length && kitaplar.length > 0}
                  onChange={() => setSecili(secili.size === kitaplar.length ? new Set() : new Set(kitaplar.map((k: any) => k.id)))} />
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Kitap</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Seviye</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Ünite</th>
              <th className="px-4 py-2.5 text-center font-medium text-slate-600">Yayın</th>
              <th className="px-4 py-2.5 text-center font-medium text-slate-600">Onay</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {kitaplar.map((k: any) => (
              <tr key={k.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-purple-50/30">
                <td className="px-4 py-2">
                  <input type="checkbox" checked={secili.has(k.id)} onChange={() => toggleSecili(k.id)} />
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/super-admin/icerik-studyosu/${k.id}`}
                    className="font-medium text-slate-900 hover:text-indigo-700 hover:underline underline-offset-2 transition-colors"
                  >
                    {k.name}
                  </Link>
                  <div className="text-xs text-slate-400">{k.id}</div>
                </td>
                <td className="px-4 py-2 text-slate-600 text-xs">{k.seviye ?? '—'}</td>
                <td className="px-4 py-2 text-slate-600 text-xs">{k.uniteSayisi}</td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => guncelleMutation.mutate({ id: k.id, data: { ...k, visible: !k.visible } })}
                    className={`size-6 mx-auto flex items-center justify-center rounded-full transition-colors ${k.visible ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
                    {k.visible ? <Eye className="size-3" /> : <EyeOff className="size-3" />}
                  </button>
                </td>
                <td className="px-4 py-2 text-center">
                  <button onClick={() => guncelleMutation.mutate({ id: k.id, data: { ...k, onaylandi: !k.onaylandi } })}
                    className={`size-6 mx-auto flex items-center justify-center rounded-full transition-colors ${k.onaylandi ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                    {k.onaylandi ? <Check className="size-3" /> : <X className="size-3" />}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <Link href={`/super-admin/icerik-studyosu/${k.id}`}
                      className="size-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="İçeriği Düzenle">
                      <ExternalLink className="size-3" />
                    </Link>
                    <button onClick={() => setEditKitap(k)}
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
            {kitaplar.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400 text-sm">Kitap bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <SlideOver
        open={!!editKitap}
        onClose={() => setEditKitap(null)}
        title="Kitap Düzenle"
        subtitle={editKitap?.name}
        footer={
          <div className="flex gap-3">
            <button onClick={() => setEditKitap(null)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">İptal</button>
            <button
              form="kitap-edit-form"
              type="submit"
              disabled={guncelleMutation.isPending}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
              {guncelleMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        }
      >
        {editKitap && (
          <KitapEditForm
            kitap={editKitap}
            onSave={(data) => guncelleMutation.mutate({ id: editKitap.id, data })}
          />
        )}
      </SlideOver>

      <DeleteConfirmModal
        open={!!deleteTarget}
        entityName={deleteTarget ? `${deleteTarget.name} (${deleteTarget.id})` : ''}
        onConfirm={() => deleteTarget && silMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={silMutation.isPending}
      />
    </div>
  );
}

function KitapEditForm({ kitap, onSave }: { kitap: any; onSave: (d: any) => void }) {
  const [form, setForm] = useState({ name: kitap.name, seviye: kitap.seviye ?? '', kitapSeti: kitap.kitapSeti ?? '', seri: kitap.seri ?? '', orderNo: kitap.orderNo, visible: kitap.visible, onaylandi: kitap.onaylandi });

  return (
    <form id="kitap-edit-form" onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      {[['name', 'Ad'], ['seviye', 'Seviye (A1, B2...)'], ['kitapSeti', 'Kitap Seti'], ['seri', 'Seri (kurumsal katalogda kategori olarak gösterilir)']].map(([key, label]) => (
        <div key={key}>
          <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
          <input value={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      ))}
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Sıra No</label>
        <input type="number" value={form.orderNo} onChange={e => setForm(f => ({ ...f, orderNo: +e.target.value }))}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>
      <div className="flex gap-4 pt-1">
        {[['visible', 'Görünür'], ['onaylandi', 'Onaylı']].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={(form as any)[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
            {label}
          </label>
        ))}
      </div>
    </form>
  );
}

// ─── Kullanıcı Oluştur ──────────────────────────────────────────────────────


export default function Page() {
  return <KitaplarTab />;
}
