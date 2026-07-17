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
import { AramaInput, Sayfalama } from '@/components/staff/table-kit';

function KullanicilarTab() {
  const qc = useQueryClient();
  const router = useRouter();
  const { user: saUser, setAuth } = useAuthStore();
  const [arama, setArama] = useState('');
  const [rolFilter, setRolFilter] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [secili, setSecili] = useState<Set<number>>(new Set());

  const { data } = useQuery({
    queryKey: ['sa-kullanicilar', rolFilter, arama, sayfa],
    queryFn: () => api.get('/api/super-admin/kullanicilar', {
      params: { rol: rolFilter || undefined, arama: arama || undefined, sayfa, sayfaBoyutu: 50 }
    }).then(r => r.data),
  });

  const kullanicilar: any[] = data?.liste ?? [];
  const toplam: number = data?.toplam ?? 0;

  const { data: ulkeler = [] } = useQuery({
    queryKey: ['sa-ulkeler-liste'],
    queryFn: () => api.get('/api/super-admin/ulkeler', { params: { pageSize: 200 } }).then(r => r.data?.liste ?? []),
  });
  const { data: kurumlar = [] } = useQuery({
    queryKey: ['sa-kurumlar-liste'],
    queryFn: () => api.get('/api/super-admin/kurumlar').then(r => r.data),
  });

  const guncelleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.put(`/api/super-admin/kullanici/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kullanicilar'] }); setEditUser(null); },
  });

  const silMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/super-admin/kullanici/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kullanicilar'] }); setDeleteTarget(null); },
  });

  const topluSilMutation = useMutation({
    mutationFn: (ids: number[]) => api.post('/api/super-admin/kullanicilar/toplu-sil', { ids }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kullanicilar'] }); setSecili(new Set()); },
  });

  const topluOnaylaMutation = useMutation({
    mutationFn: (ids: number[]) => api.post('/api/super-admin/kullanicilar/toplu-onayla', { ids }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kullanicilar'] }); setSecili(new Set()); },
  });

  const askiyaMutation = useMutation({
    mutationFn: ({ id, isApproved }: { id: number; isApproved: boolean }) => {
      const u = kullanicilar.find(u => u.id === id);
      return api.put(`/api/super-admin/kullanici/${id}`, {
        rol: u?.rol ?? 'Ogrenci', ulkeId: u?.ulkeId ?? null, kurumId: u?.kurumId ?? null, isApproved
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-kullanicilar'] }),
  });

  const impersonateMutation = useMutation({
    mutationFn: (id: number) => api.post(`/api/super-admin/impersonate/${id}`).then(r => r.data),
    onSuccess: (data) => {
      if (!saUser || !useAuthStore.getState().accessToken || !useAuthStore.getState().refreshToken) return;
      impersonation.save(saUser, useAuthStore.getState().accessToken!, useAuthStore.getState().refreshToken!);
      setAuth(data.user, data.accessToken, data.refreshToken);
      const roleRoutes: Record<string, string> = {
        SuperAdmin: '/super-admin', Admin: '/admin', Ogretmen: '/ogretmen', Ogrenci: '/pano',
        KurumYoneticisi: '/admin', UlkeTemsilcisi: '/pano', Editor: '/pano'
      };
      router.push(roleRoutes[data.user.role] ?? '/pano');
    },
  });

  function toggleSecili(id: number) {
    setSecili(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Ad, e-posta ara..." />
        <select value={rolFilter} onChange={e => { setRolFilter(e.target.value); setSayfa(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          <option value="">Tüm Roller</option>
          {TUM_ROLLER.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <Link href="/super-admin/kullanici-olustur"
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors">
          <UserPlus className="size-4" /> Yeni Kullanıcı
        </Link>
        {secili.size > 0 && (
          <>
            <button onClick={() => topluOnaylaMutation.mutate([...secili])}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
              Onayla ({secili.size})
            </button>
            <button onClick={() => topluSilMutation.mutate([...secili])}
              className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors">
              Toplu Sil ({secili.size})
            </button>
          </>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-2.5 border-b border-slate-100 text-xs text-slate-500">
          Toplam {toplam} kullanıcı · Sayfa {sayfa}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="w-10 px-4 py-2.5">
                <input type="checkbox"
                  checked={secili.size === kullanicilar.length && kullanicilar.length > 0}
                  onChange={() => setSecili(secili.size === kullanicilar.length ? new Set() : new Set(kullanicilar.map((u: any) => u.id)))} />
              </th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Kullanıcı</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Rol</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 hidden md:table-cell">Kurum</th>
              <th className="px-4 py-2.5 text-center font-medium text-slate-600">Durum</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {kullanicilar.map((u: any) => (
              <tr key={u.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-purple-50/30">
                <td className="px-4 py-2">
                  <input type="checkbox" checked={secili.has(u.id)} onChange={() => toggleSecili(u.id)} />
                </td>
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900">{u.name} {u.surname}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROL_RENKLERI[u.rol] ?? 'bg-slate-100 text-slate-600'}`}>
                    {u.rol}
                  </span>
                </td>
                <td className="px-4 py-2 text-xs text-slate-500 hidden md:table-cell">
                  {u.kurumAdi ?? u.ulkeAdi ?? '—'}
                </td>
                <td className="px-4 py-2 text-center">
                  <button
                    onClick={() => askiyaMutation.mutate({ id: u.id, isApproved: !u.isApproved })}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${u.isApproved ? 'bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700' : 'bg-red-100 text-red-700 hover:bg-green-100 hover:text-green-700'}`}>
                    {u.isApproved ? 'Aktif' : 'Askıda'}
                  </button>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => setEditUser({ ...u, ulkeler, kurumlar })}
                      className="size-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                      <Pencil className="size-3" />
                    </button>
                    <button onClick={() => setDeleteTarget(u)}
                      className="size-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {kullanicilar.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Kullanıcı bulunamadı</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Sayfalama sayfa={sayfa} totalPages={Math.max(1, Math.ceil(toplam / 50))} toplam={toplam} sayfaBoyutu={50} onSayfa={setSayfa} />

      <SlideOver
        open={!!editUser}
        onClose={() => setEditUser(null)}
        title="Kullanıcı Düzenle"
        subtitle={editUser ? `${editUser.name} ${editUser.surname} · ${editUser.email}` : undefined}
        footer={
          editUser && (
            <div className="space-y-2">
              <div className="flex gap-3">
                <button onClick={() => setEditUser(null)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 hover:bg-slate-50">İptal</button>
                <button form="user-edit-form" type="submit" disabled={guncelleMutation.isPending}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                  {guncelleMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
              <button
                onClick={() => { if (editUser) impersonateMutation.mutate(editUser.id); }}
                disabled={impersonateMutation.isPending}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-50">
                <LogIn className="size-4" />
                {impersonateMutation.isPending ? 'Giriş yapılıyor...' : 'Bu Kullanıcı Olarak Giriş Yap'}
              </button>
            </div>
          )
        }
      >
        {editUser && (
          <KullaniciEditForm
            user={editUser}
            ulkeler={ulkeler}
            kurumlar={kurumlar}
            onSave={(data) => guncelleMutation.mutate({ id: editUser.id, data })}
          />
        )}
      </SlideOver>

      <DeleteConfirmModal
        open={!!deleteTarget}
        entityName={deleteTarget ? `${deleteTarget.name} ${deleteTarget.surname} (${deleteTarget.email})` : ''}
        onConfirm={() => deleteTarget && silMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={silMutation.isPending}
      />
    </div>
  );
}

function KullaniciEditForm({ user, ulkeler, kurumlar, onSave }: {
  user: any; ulkeler: any[]; kurumlar: any[];
  onSave: (d: any) => void;
}) {
  const [form, setForm] = useState({ rol: user.rol, ulkeId: user.ulkeId ?? '', kurumId: user.kurumId ?? '', isApproved: user.isApproved });

  return (
    <form id="user-edit-form" onSubmit={e => { e.preventDefault(); onSave({ rol: form.rol, ulkeId: form.ulkeId || null, kurumId: form.kurumId || null, isApproved: form.isApproved }); }} className="space-y-4">
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Rol</label>
        <select value={form.rol} onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          {TUM_ROLLER.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Ülke</label>
        <select value={form.ulkeId} onChange={e => setForm(f => ({ ...f, ulkeId: e.target.value ? +e.target.value : '' }))}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          <option value="">— Yok —</option>
          {ulkeler.map((u: any) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Kurum</label>
        <select value={form.kurumId} onChange={e => setForm(f => ({ ...f, kurumId: e.target.value ? +e.target.value : '' }))}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          <option value="">— Yok —</option>
          {kurumlar.map((k: any) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.isApproved} onChange={e => setForm(f => ({ ...f, isApproved: e.target.checked }))} />
        Hesap Aktif (onaylı)
      </label>
    </form>
  );
}

// ─── Ülkeler & Okullar — Master-Detail ────────────────────────────────────────

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}


export default function Page() {
  return <KullanicilarTab />;
}
