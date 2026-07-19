'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import {
  BookOpen, Users, Globe, BarChart3, Shield,
  Pencil, Trash2, Check, X, Search, Plus, Eye, EyeOff,
  RefreshCw, ExternalLink, LogIn, Package, AlertCircle,
  Megaphone, TrendingDown, ScrollText, ChevronRight, UserPlus, Sparkles
} from 'lucide-react';
import { useRouter } from '@/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { SlideOver } from '@/components/slide-over';
import { useAuthStore, impersonation } from '@/stores/auth';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { ROL_RENKLERI, TUM_ROLLER, apiHataMesaji } from '../shared';
import { AramaInput, Sayfalama, SortTh, useSiralama, useTopluSecim, TopluSecimTh, TopluSecimTd } from '@/components/staff/table-kit';

type SortKey = 'name' | 'rol' | 'kurum' | 'ulke' | 'kayitTarihi' | 'durum';

function KullanicilarTab() {
  const qc = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: saUser, setAuth } = useAuthStore();
  const [arama, setArama] = useState('');
  const [rolFilter, setRolFilter] = useState('');
  const [durumFilter, setDurumFilter] = useState(() => searchParams?.get('durum') ?? '');
  const [sayfa, setSayfa] = useState(1);
  const [editUser, setEditUser] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { secili, toggleBir, toggleHepsi, temizle } = useTopluSecim<number>();
  const [topluOnay, setTopluOnay] = useState(false);
  const { sortKey, sortDir, toggleSort } = useSiralama<SortKey>('name', () => setSayfa(1));

  const isApproved = durumFilter === 'askida' ? false : durumFilter === 'aktif' ? true : undefined;

  const { data } = useQuery({
    queryKey: ['sa-kullanicilar', rolFilter, durumFilter, arama, sayfa, sortKey, sortDir],
    queryFn: () => api.get('/api/super-admin/kullanicilar', {
      params: { rol: rolFilter || undefined, isApproved, arama: arama || undefined, sayfa, sayfaBoyutu: 50, sortKey, sortDir }
    }).then(r => r.data),
    placeholderData: keepPreviousData,
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kullanicilar'] }); temizle(); setTopluOnay(false); },
  });

  const topluOnaylaMutation = useMutation({
    mutationFn: (ids: number[]) => api.post('/api/super-admin/kullanicilar/toplu-onayla', { ids }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kullanicilar'] }); temizle(); },
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
        KurumYoneticisi: '/kurum-yoneticisi', UlkeTemsilcisi: '/ulke-temsilcisi', Editor: '/pano'
      };
      router.push(roleRoutes[data.user.role] ?? '/pano');
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Standart liste toolbar'ı (referans: Ülkeler): başlık+sayaç · arama · sağda eylemler */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-800">Kullanıcılar</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{toplam}</span>
          </div>
          <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Ad, e-posta ara..." />
          <select value={rolFilter} onChange={e => { setRolFilter(e.target.value); setSayfa(1); }}
            className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300">
            <option value="">Tüm Roller</option>
            {TUM_ROLLER.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={durumFilter} onChange={e => { setDurumFilter(e.target.value); setSayfa(1); }}
            className={`border rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300 ${durumFilter === 'askida' ? 'border-red-200 text-red-700 bg-red-50' : 'border-slate-200'}`}>
            <option value="">Tüm Durumlar</option>
            <option value="aktif">Aktif</option>
            <option value="askida">Askıda</option>
          </select>
          <div className="flex items-center gap-2 ml-auto">
            {secili.size > 0 && (
              <>
                <button onClick={() => topluOnaylaMutation.mutate([...secili])}
                  className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors">
                  Onayla ({secili.size})
                </button>
                <button onClick={() => setTopluOnay(true)}
                  className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors">
                  Toplu Sil ({secili.size})
                </button>
              </>
            )}
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap">
              <UserPlus className="size-3.5" /> Yeni Kullanıcı
            </button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <TopluSecimTh gorunenIdler={kullanicilar.map((u: any) => u.id)} secili={secili} onToggleHepsi={toggleHepsi} />
              <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kullanıcı</SortTh>
              <SortTh colKey="ulke" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell">Ülke</SortTh>
              <SortTh colKey="kurum" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell">Kurum</SortTh>
              <SortTh colKey="kayitTarihi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell">Kayıt Tarihi</SortTh>
              <SortTh colKey="rol" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Rol</SortTh>
              <SortTh colKey="durum" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center">Durum</SortTh>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {kullanicilar.map((u: any) => (
              <tr key={u.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-purple-50/30">
                <TopluSecimTd id={u.id} secili={secili} onToggle={toggleBir} />
                <td className="px-4 py-2">
                  <div className="font-medium text-slate-900">{u.name} {u.surname}</div>
                  <div className="text-xs text-slate-400">{u.email}</div>
                </td>
                <td className="px-4 py-2 text-xs text-slate-500 hidden md:table-cell">
                  {u.ulkeAdi ?? '—'}
                </td>
                <td className="px-4 py-2 text-xs text-slate-500 hidden md:table-cell">
                  {u.kurumAdi ?? u.ulkeAdi ?? '—'}
                </td>
                <td className="px-4 py-2 text-xs text-slate-500 hidden md:table-cell">
                  {new Date(u.insertDate).toLocaleDateString('tr')}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROL_RENKLERI[u.rol] ?? 'bg-slate-100 text-slate-600'}`}>
                    {u.rol}
                  </span>
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
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">Kullanıcı bulunamadı</td></tr>
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

      <KullaniciEkleSlideOver
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onOlusturuldu={() => qc.invalidateQueries({ queryKey: ['sa-kullanicilar'] })}
      />

      <DeleteConfirmModal
        open={topluOnay}
        entityName={`${secili.size} kullanıcı`}
        onConfirm={() => topluSilMutation.mutate([...secili])}
        onCancel={() => setTopluOnay(false)}
        loading={topluSilMutation.isPending}
      />

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

function KullaniciEkleSlideOver({ open, onClose, onOlusturuldu }: {
  open: boolean; onClose: () => void; onOlusturuldu: () => void;
}) {
  return (
    <SlideOver open={open} onClose={onClose} title="Yeni Kullanıcı" width="sm">
      <RoleScopedUserForm
        bare
        baslik="Kullanıcı Oluştur"
        aciklama="Koordinatör, ülke temsilcisi, kurum yöneticisi veya öğretmen davet et."
        hedefRolSecenekleri={[
          { value: 'Koordinator', label: 'Koordinatör' },
          { value: 'UlkeTemsilcisi', label: 'Ülke Temsilcisi' },
          { value: 'KurumYoneticisi', label: 'Kurum Yöneticisi' },
          { value: 'Ogretmen', label: 'Öğretmen' },
        ]}
        onOlusturuldu={() => {
          onOlusturuldu();
          toast.success('Davet linki oluşturuldu');
        }}
      />
    </SlideOver>
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

export default function Page() {
  return <KullanicilarTab />;
}
