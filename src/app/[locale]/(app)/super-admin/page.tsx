'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Users, Globe, BarChart3, Shield,
  Pencil, Trash2, Check, X, Search, Plus, Eye, EyeOff,
  RefreshCw, ExternalLink, LogIn, Package, AlertCircle
} from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { SlideOver } from '@/components/slide-over';
import { useAuthStore, impersonation } from '@/stores/auth';

type Tab = 'genel' | 'kitaplar' | 'kullanicilar' | 'ulkeler' | 'raporlar';
type UlkeTab = 'temsilciler' | 'kurumlar' | 'kitaplar' | 'siniflar';

const ROL_RENKLERI: Record<string, string> = {
  SuperAdmin: 'bg-purple-100 text-purple-700',
  Koordinator: 'bg-red-100 text-red-700',
  Editor: 'bg-indigo-100 text-indigo-700',
  UlkeTemsilcisi: 'bg-orange-100 text-orange-700',
  KurumYoneticisi: 'bg-blue-100 text-blue-700',
  Ogretmen: 'bg-green-100 text-green-700',
  Ogrenci: 'bg-slate-100 text-slate-600',
};

const TUM_ROLLER = ['SuperAdmin', 'Koordinator', 'Editor', 'UlkeTemsilcisi', 'KurumYoneticisi', 'Ogretmen', 'Ogrenci'];

export default function SuperAdminPage() {
  const { user, ready } = useAuthGuard('SuperAdmin');
  const [tab, setTab] = useState<Tab>('genel');

  if (!ready || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <TurkishLetterBackdrop variant="super-admin" opacity={0.04} />
      <main className="max-w-[1200px] mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
        <ImpersonationBanner />

        <div className="flex items-center gap-3 mb-6">
          <div className="size-9 rounded-xl bg-purple-100 flex items-center justify-center">
            <Shield className="size-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Super Admin Paneli</h1>
            <p className="text-xs text-slate-500">Sistem yönetimi — {user.name} {user.surname}</p>
          </div>
        </div>

        <div className="flex gap-1 border-b border-slate-200 mb-6 overflow-x-auto">
          {([
            ['genel', BarChart3, 'Genel Bakış'],
            ['kitaplar', BookOpen, 'Kitaplar'],
            ['kullanicilar', Users, 'Kullanıcılar'],
            ['ulkeler', Globe, 'Ülkeler & Okullar'],
            ['raporlar', BarChart3, 'Raporlar'],
          ] as [Tab, typeof BarChart3, string][]).map(([id, Icon, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === id
                  ? 'border-purple-600 text-purple-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="size-4" />
              {label}
            </button>
          ))}
        </div>

        {tab === 'genel' && <GenelBakis />}
        {tab === 'kitaplar' && <KitaplarTab />}
        {tab === 'kullanicilar' && <KullanicilarTab />}
        {tab === 'ulkeler' && <UlkelerTab />}
        {tab === 'raporlar' && <RaporlarTab />}
      </main>
    </div>
  );
}

// ─── Impersonation Banner ──────────────────────────────────────────────────

function ImpersonationBanner() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  if (!impersonation.isActive()) return null;

  function handleReturn() {
    const backup = impersonation.restore();
    if (!backup) return;
    setAuth(backup.user, backup.accessToken, backup.refreshToken);
    impersonation.clear();
    router.push('/super-admin');
  }

  return (
    <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
      <AlertCircle className="size-4 text-amber-600 shrink-0" />
      <span className="text-sm text-amber-800 flex-1">Başka bir kullanıcı olarak giriş yapıldı (impersonation)</span>
      <button onClick={handleReturn} className="text-sm font-medium text-amber-700 hover:text-amber-900">
        Kendi hesabına dön →
      </button>
    </div>
  );
}

// ─── Genel Bakış ──────────────────────────────────────────────────────────────

function GenelBakis() {
  const qc = useQueryClient();
  const { data: stats } = useQuery({
    queryKey: ['sa-istatistikler'],
    queryFn: () => api.get('/api/super-admin/istatistikler').then(r => r.data),
  });
  const { data: auditLog } = useQuery({
    queryKey: ['sa-audit-log'],
    queryFn: () => api.get('/api/super-admin/audit-log').then(r => r.data),
  });
  const { data: bekleyenSiparisler = [] } = useQuery({
    queryKey: ['sa-siparisler-bekleyen'],
    queryFn: () => api.get('/api/super-admin/siparisler?durum=Beklemede').then(r => r.data),
  });

  const onaylaMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/super-admin/siparis/${id}/onayla`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-siparisler-bekleyen'] });
      qc.invalidateQueries({ queryKey: ['sa-istatistikler'] });
    },
  });
  const iptalMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/super-admin/siparis/${id}/iptal`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-siparisler-bekleyen'] }),
  });

  return (
    <div className="space-y-6">
      {/* Sayaçlar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Toplam Kullanıcı', val: stats?.toplamKullanici },
          { label: 'Yayında Kitap', val: `${stats?.yayindaKitap ?? '—'} / ${stats?.toplamKitap ?? '—'}` },
          { label: 'Toplam Okul', val: stats?.toplamKurum },
          { label: 'Askıda Kullanıcı', val: stats?.askidaKullanici, danger: true },
          { label: 'Bekleyen Sipariş', val: stats?.bekleyenSiparis, danger: true },
        ].map(({ label, val, danger }) => (
          <div key={label} className={`bg-white border rounded-xl p-4 ${danger && (val as number) > 0 ? 'border-red-200' : 'border-slate-200'}`}>
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className={`text-2xl font-bold ${danger && (val as number) > 0 ? 'text-red-600' : 'text-slate-900'}`}>
              {val ?? '—'}
            </p>
          </div>
        ))}
      </div>

      {/* Rol dağılımı */}
      {stats?.rolDagilimi && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Rol Dağılımı</h3>
          <div className="flex flex-wrap gap-2">
            {(stats.rolDagilimi as { rol: string; sayi: number }[]).map(({ rol, sayi }) => (
              <span key={rol} className={`px-3 py-1 rounded-full text-xs font-medium ${ROL_RENKLERI[rol] ?? 'bg-slate-100 text-slate-600'}`}>
                {rol}: {sayi}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bekleyen siparişler */}
      {(bekleyenSiparisler as any[]).length > 0 && (
        <div className="bg-white border border-amber-200 rounded-xl">
          <div className="px-5 py-4 border-b border-amber-100 flex items-center gap-2">
            <Package className="size-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-amber-700">Bekleyen Siparişler ({(bekleyenSiparisler as any[]).length})</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {(bekleyenSiparisler as any[]).map((s: any) => (
              <div key={s.id} className="px-5 py-3 flex items-center gap-3 text-sm">
                <span className="font-medium text-slate-800 flex-1">{s.kurumAdi}</span>
                <span className="text-xs text-slate-500">{s.dersKitabiId} · {s.ogrenciKapasite} lisans</span>
                <span className="text-xs text-slate-400">{new Date(s.tarih).toLocaleDateString('tr')}</span>
                <button onClick={() => onaylaMutation.mutate(s.id)}
                  className="px-2 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors">
                  Onayla
                </button>
                <button onClick={() => iptalMutation.mutate(s.id)}
                  className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-300 transition-colors">
                  İptal
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Audit log */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-700">Son İşlemler</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {(auditLog as any[] ?? []).slice(0, 20).map((log: any) => (
            <div key={log.id} className="px-5 py-2.5 flex items-center gap-3 text-sm odd:bg-white even:bg-slate-50/40">
              <span className="font-mono text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded shrink-0">{log.entityType}</span>
              <span className="font-medium text-slate-800">{log.eylem}</span>
              {log.detay && <span className="text-slate-400 truncate max-w-[200px] text-xs">{log.detay}</span>}
              <span className="ml-auto text-xs text-slate-400 whitespace-nowrap">
                {log.admin} · {new Date(log.tarih).toLocaleDateString('tr')}
              </span>
            </div>
          ))}
          {!auditLog?.length && <p className="px-5 py-6 text-sm text-slate-400 text-center">Henüz işlem yok</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Kitaplar ─────────────────────────────────────────────────────────────────

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
  const [form, setForm] = useState({ name: kitap.name, seviye: kitap.seviye ?? '', kitapSeti: kitap.kitapSeti ?? '', orderNo: kitap.orderNo, visible: kitap.visible, onaylandi: kitap.onaylandi });

  return (
    <form id="kitap-edit-form" onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      {[['name', 'Ad'], ['seviye', 'Seviye (A1, B2...)'], ['kitapSeti', 'Kitap Seti']].map(([key, label]) => (
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

// ─── Kullanıcılar ─────────────────────────────────────────────────────────────

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
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <input value={arama} onChange={e => { setArama(e.target.value); setSayfa(1); }}
            placeholder="Ad, e-posta ara..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
        <select value={rolFilter} onChange={e => { setRolFilter(e.target.value); setSayfa(1); }}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300">
          <option value="">Tüm Roller</option>
          {TUM_ROLLER.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
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
        {toplam > 50 && (
          <div className="px-5 py-3 border-t border-slate-100 flex gap-2">
            <button disabled={sayfa === 1} onClick={() => setSayfa(p => p - 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40">Önceki</button>
            <button disabled={sayfa * 50 >= toplam} onClick={() => setSayfa(p => p + 1)}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40">Sonraki</button>
          </div>
        )}
      </div>

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

function UlkelerTab() {
  const qc = useQueryClient();

  const [selectedUlkeId, setSelectedUlkeId] = useState<number | null>(null);
  const [ulkeTab, setUlkeTab] = useState<UlkeTab>('kurumlar');
  const [aramaInput, setAramaInput] = useState('');
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const [yeniUlke, setYeniUlke] = useState({ name: '', ogretmenId: null as number | null });
  const [showAddUlke, setShowAddUlke] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ tip: string; id: any; name: string } | null>(null);
  const [selectedKurumId, setSelectedKurumId] = useState<number | null>(null);
  const [selectedKurumName, setSelectedKurumName] = useState('');
  const [editUlke, setEditUlke] = useState<{
    id: number; name: string; visible: boolean; ogretmenId: number | null; ogretmenAdi: string | null;
  } | null>(null);
  const [editDirty, setEditDirty] = useState(false);
  const [ogretmenQuery, setOgretmenQuery] = useState('');
  const [showOgretmenDropdown, setShowOgretmenDropdown] = useState(false);
  const [lastSelectedUlke, setLastSelectedUlke] = useState<any>(null);

  // 300ms debounce — arama değişince page 1'e döner
  useEffect(() => {
    const t = setTimeout(() => { setArama(aramaInput); setSayfa(1); }, 300);
    return () => clearTimeout(t);
  }, [aramaInput]);

  const { data } = useQuery({
    queryKey: ['sa-ulkeler', sayfa, arama],
    queryFn: () => api.get('/api/super-admin/ulkeler', {
      params: { arama: arama || undefined, pageNumber: sayfa, pageSize: 20 }
    }).then(r => r.data),
  });
  const ulkeler: any[] = data?.liste ?? [];
  const totalPages: number = data?.totalPages ?? 1;
  const totalCount: number = data?.totalCount ?? 0;

  const { data: ogretmenSonuclariRaw } = useQuery({
    queryKey: ['sa-ogretmenler', ogretmenQuery],
    queryFn: () => api.get('/api/super-admin/kullanicilar', {
      params: { rol: 'Ogretmen', arama: ogretmenQuery || undefined, sayfaBoyutu: 20 }
    }).then(r => r.data?.liste ?? []),
    enabled: !!editUlke || showAddUlke,
  });
  const ogretmenSonuclari: any[] = ogretmenSonuclariRaw ?? [];

  // Sayfa geçişlerinde seçili ülke kaybedilmemesi için son seçimi cache'liyoruz
  const selectedUlke = ulkeler.find((u: any) => u.id === selectedUlkeId) ?? lastSelectedUlke;

  const ulkeOlusturMutation = useMutation({
    mutationFn: (d: { name: string; ogretmenId: number | null }) => api.post('/api/super-admin/ulke', d),
    onSuccess: () => {
      setSayfa(1); setAramaInput(''); setArama('');
      qc.invalidateQueries({ queryKey: ['sa-ulkeler'] });
      setYeniUlke({ name: '', ogretmenId: null });
      setShowAddUlke(false);
    },
  });

  const ulkeGuncelleMutation = useMutation({
    mutationFn: (d: { name: string; visible: boolean; ogretmenId: number | null }) =>
      api.put(`/api/super-admin/ulke/${editUlke!.id}`, d),
    onSuccess: (_, vars) => {
      qc.setQueryData(['sa-ulkeler', sayfa, arama], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          liste: old.liste.map((u: any) =>
            u.id === editUlke!.id ? { ...u, ...vars } : u
          ),
        };
      });
      if (lastSelectedUlke?.id === editUlke!.id) {
        setLastSelectedUlke((f: any) => f ? { ...f, ...vars, ogretmenAdi: editUlke!.ogretmenAdi } : f);
      }
      qc.invalidateQueries({ queryKey: ['sa-ulkeler'] });
      setEditUlke(null); setEditDirty(false);
    },
  });

  const silMutation = useMutation({
    mutationFn: ({ tip, id }: { tip: string; id: any }) => api.delete(`/api/super-admin/${tip}/${id}`),
    onSuccess: (_, vars) => {
      setSayfa(1); setAramaInput(''); setArama('');
      if (vars.tip === 'ulke') { setSelectedUlkeId(null); setLastSelectedUlke(null); }
      qc.invalidateQueries({ queryKey: ['sa-ulkeler'] });
      qc.invalidateQueries({ queryKey: ['sa-kurumlar'] });
      setDeleteTarget(null);
    },
  });

  function handleUlkeClick(ulke: any) {
    if (editUlke && editDirty) {
      if (!window.confirm('Kaydedilmemiş değişiklikler var. Çıkmak istediğinize emin misiniz?')) return;
      setEditUlke(null); setEditDirty(false);
    }
    setSelectedUlkeId(ulke.id);
    setLastSelectedUlke(ulke);
    setUlkeTab('kurumlar');
  }

  return (
    <div className="flex gap-4 min-h-[600px]">
      {/* Sol: Ülkeler listesi */}
      <div className="w-72 shrink-0 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-slate-700 flex-1">Ülkeler</span>
            {totalCount > 0 && (
              <span className="text-[11px] text-slate-400 tabular-nums">{totalCount}</span>
            )}
            <button onClick={() => setShowAddUlke(v => !v)}
              className="size-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors">
              <Plus className="size-4" />
            </button>
          </div>

          {showAddUlke && (
            <div className="mb-2 space-y-1.5">
              <div className="flex gap-2">
                <input
                  value={yeniUlke.name}
                  onChange={e => setYeniUlke(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && yeniUlke.name && ulkeOlusturMutation.mutate(yeniUlke)}
                  placeholder="Ülke adı..."
                  autoFocus
                  className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
                <button
                  onClick={() => yeniUlke.name && ulkeOlusturMutation.mutate(yeniUlke)}
                  disabled={!yeniUlke.name || ulkeOlusturMutation.isPending}
                  className="px-2 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50">
                  Ekle
                </button>
              </div>
            </div>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-2 size-3.5 text-slate-400" />
            <input
              value={aramaInput}
              onChange={e => setAramaInput(e.target.value)}
              placeholder="Ülke ara..."
              className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
            {aramaInput.length > 0 && (
              <button
                onClick={() => { setAramaInput(''); setArama(''); setSayfa(1); }}
                className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {ulkeler.map((ulke: any) => (
            <div
              key={ulke.id}
              className={`group flex items-center gap-2 px-4 py-3 cursor-pointer border-r-2 transition-colors ${
                selectedUlkeId === ulke.id
                  ? 'bg-purple-50 border-r-purple-600'
                  : 'border-r-transparent hover:bg-slate-50'
              }`}
              onClick={() => handleUlkeClick(ulke)}
            >
              <Globe className="size-4 text-blue-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-800 truncate">{ulke.name}</div>
                <div className="text-xs text-slate-400">{ulke.kurumSayisi} okul · {ulke.ogrenciSayisi} öğrenci</div>
              </div>
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setEditUlke({ id: ulke.id, name: ulke.name, visible: ulke.visible, ogretmenId: ulke.ogretmenId ?? null, ogretmenAdi: ulke.ogretmenAdi ?? null });
                    setOgretmenQuery(ulke.ogretmenAdi ?? '');
                    setEditDirty(false);
                    setShowOgretmenDropdown(false);
                  }}
                  className="size-5 flex items-center justify-center rounded text-slate-300 hover:text-blue-500 transition-colors">
                  <Pencil className="size-3" />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setDeleteTarget({ tip: 'ulke', id: ulke.id, name: ulke.name }); }}
                  className="size-5 flex items-center justify-center rounded text-slate-300 hover:text-red-500 transition-colors">
                  <Trash2 className="size-3" />
                </button>
              </div>
            </div>
          ))}
          {ulkeler.length === 0 && (
            <p className="text-xs text-slate-400 px-4 py-6 text-center">
              {arama ? `"${arama}" için sonuç bulunamadı` : 'Henüz ülke yok'}
            </p>
          )}
        </div>

        {/* Sayfalama */}
        {totalPages > 1 && (
          <div className="border-t border-slate-100 px-2 py-2 flex items-center justify-center gap-0.5 shrink-0">
            <button
              disabled={sayfa === 1}
              onClick={() => setSayfa(p => p - 1)}
              className="size-6 flex items-center justify-center rounded text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              ‹
            </button>
            {buildPageRange(sayfa, totalPages).map((p, i) =>
              p === '...'
                ? <span key={`d${i}`} className="px-1 text-slate-400 text-xs">…</span>
                : <button
                    key={p}
                    onClick={() => setSayfa(Number(p))}
                    className={`size-6 flex items-center justify-center rounded text-xs transition-colors ${
                      sayfa === p
                        ? 'bg-purple-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                    {p}
                  </button>
            )}
            <button
              disabled={sayfa === totalPages}
              onClick={() => setSayfa(p => p + 1)}
              className="size-6 flex items-center justify-center rounded text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              ›
            </button>
          </div>
        )}
      </div>

      {/* Sağ: Ülke detayı */}
      <div className="flex-1 bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col">
        {!selectedUlke ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            Sol listeden bir ülke seçin
          </div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="size-5 text-blue-500" />
                <h2 className="text-base font-semibold text-slate-900">{selectedUlke.name}</h2>
                <span className="text-xs text-slate-400">{selectedUlke.kurumSayisi} okul · {selectedUlke.ogrenciSayisi} öğrenci</span>
              </div>
              <div className="flex gap-1 mt-3">
                {(['temsilciler', 'kurumlar', 'kitaplar', 'siniflar'] as UlkeTab[]).map(t => (
                  <button key={t} onClick={() => setUlkeTab(t)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      ulkeTab === t ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'
                    }`}>
                    {t === 'temsilciler' ? 'Temsilciler' : t === 'kurumlar' ? 'Kurumlar' : t === 'kitaplar' ? 'Ders Kitapları' : 'Sınıflar'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {ulkeTab === 'temsilciler' && <TemsilcilerPanel ulkeId={selectedUlkeId!} />}
              {ulkeTab === 'kurumlar' && (
                <KurumlarPanel
                  ulkeId={selectedUlkeId!}
                  onKurumClick={(id, name) => { setSelectedKurumId(id); setSelectedKurumName(name); }}
                  onDeleteKurum={(id, name) => setDeleteTarget({ tip: 'kurum', id, name })}
                />
              )}
              {ulkeTab === 'kitaplar' && <UlkeKitaplarPanel ulkeId={selectedUlkeId!} />}
              {ulkeTab === 'siniflar' && <UlkeSiniflarPanel ulkeId={selectedUlkeId!} />}
            </div>
          </>
        )}
      </div>

      {/* SlideOver: Kurum Sınıfları */}
      <SlideOver
        open={!!selectedKurumId}
        onClose={() => setSelectedKurumId(null)}
        title={selectedKurumName}
        subtitle="Sınıflar"
        width="sm"
      >
        {selectedKurumId && <KurumSiniflarDetail kurumId={selectedKurumId} />}
      </SlideOver>

      {/* SlideOver: Ülke Düzenle */}
      <SlideOver
        open={!!editUlke}
        onClose={() => { setEditUlke(null); setEditDirty(false); }}
        title="Ülke Düzenle"
        width="md"
        noDim
        footer={
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setEditUlke(null); setEditDirty(false); }}
              className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
              İptal
            </button>
            <button
              onClick={() => editUlke && ulkeGuncelleMutation.mutate({ name: editUlke.name, visible: editUlke.visible, ogretmenId: editUlke.ogretmenId })}
              disabled={ulkeGuncelleMutation.isPending || !editDirty}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {ulkeGuncelleMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </button>
          </div>
        }
      >
        {editUlke && (
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Ülke Adı</label>
              <input
                value={editUlke.name}
                onChange={e => { setEditUlke(f => f && { ...f, name: e.target.value }); setEditDirty(true); }}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="edit-visible"
                checked={editUlke.visible}
                onChange={e => { setEditUlke(f => f && { ...f, visible: e.target.checked }); setEditDirty(true); }}
                className="size-4 rounded border-slate-300 accent-purple-600"
              />
              <label htmlFor="edit-visible" className="text-sm text-slate-700 cursor-pointer">Görünür (Aktif)</label>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Sorumlu Öğretmen</label>
              {editUlke.ogretmenId && editUlke.ogretmenAdi && (
                <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
                  <span className="text-xs font-medium text-purple-800 flex-1">{editUlke.ogretmenAdi}</span>
                  <button
                    onClick={() => { setEditUlke(f => f && { ...f, ogretmenId: null, ogretmenAdi: null }); setOgretmenQuery(''); setEditDirty(true); }}
                    className="text-purple-400 hover:text-purple-600">
                    <X className="size-3.5" />
                  </button>
                </div>
              )}
              <div className="relative">
                <input
                  value={ogretmenQuery}
                  onChange={e => { setOgretmenQuery(e.target.value); setShowOgretmenDropdown(true); }}
                  onFocus={() => setShowOgretmenDropdown(true)}
                  onBlur={() => setTimeout(() => setShowOgretmenDropdown(false), 150)}
                  placeholder={editUlke.ogretmenId ? 'Değiştirmek için ara…' : 'Öğretmen ara…'}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                {showOgretmenDropdown && ogretmenSonuclari.length > 0 && (
                  <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                    {ogretmenSonuclari.map((u: any) => (
                      <button
                        key={u.id}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => {
                          setEditUlke(f => f && { ...f, ogretmenId: u.id, ogretmenAdi: `${u.name} ${u.surname}` });
                          setOgretmenQuery('');
                          setShowOgretmenDropdown(false);
                          setEditDirty(true);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-baseline gap-1 transition-colors">
                        <span className="text-xs font-medium text-slate-800">{u.name} {u.surname}</span>
                        <span className="text-[11px] text-slate-400">({u.email})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!editUlke.ogretmenId && (
                <div className="flex gap-2 mt-2">
                  <a
                    href={`mailto:?subject=T%C3%BCrk%C3%A7eOkulu%20%C3%96%C4%9Fretmen%20Daveti&body=Merhaba%2C%20TürkçeOkulu%20platformuna%20öğretmen%20olarak%20katılmanızı%20bekliyoruz.%20Kayıt%3A%20https%3A%2F%2Fturkceokulu.com%2Fkayit`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                    E-posta ile Davet
                  </a>
                  <a
                    href="https://wa.me/?text=Merhaba!%20T%C3%BCrk%C3%A7eOkulu%20platformuna%20%C3%B6%C4%9Fretmen%20olarak%20kat%C4%B1lman%C4%B1z%C4%B1%20bekliyoruz.%20Kay%C4%B1t%3A%20https%3A%2F%2Fturkceokulu.com%2Fkayit"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors">
                    WhatsApp ile Davet
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </SlideOver>

      <DeleteConfirmModal
        open={!!deleteTarget}
        entityName={deleteTarget?.name ?? ''}
        onConfirm={() => deleteTarget && silMutation.mutate({ tip: deleteTarget.tip, id: deleteTarget.id })}
        onCancel={() => setDeleteTarget(null)}
        loading={silMutation.isPending}
      />
    </div>
  );
}

function TemsilcilerPanel({ ulkeId }: { ulkeId: number }) {
  const { data } = useQuery({
    queryKey: ['sa-kullanicilar', 'UlkeTemsilcisi', '', 1, ulkeId],
    queryFn: () => api.get('/api/super-admin/kullanicilar', {
      params: { rol: 'UlkeTemsilcisi', ulkeId, sayfaBoyutu: 100 }
    }).then(r => r.data),
  });
  const liste: any[] = data?.liste ?? [];

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-5 py-2.5 text-left font-medium text-slate-600">Ad Soyad</th>
            <th className="px-5 py-2.5 text-left font-medium text-slate-600">E-posta</th>
            <th className="px-5 py-2.5 text-center font-medium text-slate-600">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {liste.map((u: any) => (
            <tr key={u.id} className="odd:bg-white even:bg-slate-50/40">
              <td className="px-5 py-2 font-medium text-slate-800">{u.name} {u.surname}</td>
              <td className="px-5 py-2 text-xs text-slate-500">{u.email}</td>
              <td className="px-5 py-2 text-center">
                <span className={`px-2 py-0.5 rounded-full text-xs ${u.isApproved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {u.isApproved ? 'Aktif' : 'Askıda'}
                </span>
              </td>
            </tr>
          ))}
          {liste.length === 0 && (
            <tr><td colSpan={3} className="px-5 py-8 text-center text-slate-400 text-sm">Bu ülkeye atanmış temsilci yok</td></tr>
          )}
        </tbody>
      </table>
      <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400">
        Temsilci atamak için Kullanıcılar sekmesinden kullanıcı rolünü UlkeTemsilcisi yapın ve ülkesini seçin.
      </div>
    </div>
  );
}

function KurumlarPanel({ ulkeId, onKurumClick, onDeleteKurum }: {
  ulkeId: number;
  onKurumClick: (id: number, name: string) => void;
  onDeleteKurum: (id: number, name: string) => void;
}) {
  const qc = useQueryClient();
  const [yeniKurum, setYeniKurum] = useState({ name: '', sehir: '' });

  const { data: kurumlar = [] } = useQuery({
    queryKey: ['sa-kurumlar', ulkeId],
    queryFn: () => api.get('/api/super-admin/kurumlar', { params: { ulkeId } }).then(r => r.data),
  });

  const kurumOlusturMutation = useMutation({
    mutationFn: (d: any) => api.post('/api/super-admin/kurum', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kurumlar', ulkeId] }); setYeniKurum({ name: '', sehir: '' }); },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Okul Ekle formu — her zaman görünür, tablonun üstünde */}
      <div className="border-b border-slate-100 px-5 py-3 flex gap-2 bg-slate-50/50 shrink-0">
        <input value={yeniKurum.name} onChange={e => setYeniKurum(f => ({ ...f, name: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && yeniKurum.name && kurumOlusturMutation.mutate({ name: yeniKurum.name, sehir: yeniKurum.sehir || null, ulkeId })}
          placeholder="Okul adı..." className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <input value={yeniKurum.sehir} onChange={e => setYeniKurum(f => ({ ...f, sehir: e.target.value }))}
          onKeyDown={e => e.key === 'Enter' && yeniKurum.name && kurumOlusturMutation.mutate({ name: yeniKurum.name, sehir: yeniKurum.sehir || null, ulkeId })}
          placeholder="Şehir..." className="w-28 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
        <button
          onClick={() => yeniKurum.name && kurumOlusturMutation.mutate({ name: yeniKurum.name, sehir: yeniKurum.sehir || null, ulkeId })}
          disabled={!yeniKurum.name || kurumOlusturMutation.isPending}
          className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg hover:bg-slate-700 disabled:opacity-50">
          <Plus className="size-3" /> Okul Ekle
        </button>
      </div>

      <table className="w-full text-sm flex-1">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-5 py-2.5 text-left font-medium text-slate-600">Kurum</th>
            <th className="px-5 py-2.5 text-left font-medium text-slate-600">Şehir</th>
            <th className="px-5 py-2.5 text-center font-medium text-slate-600">Sınıf</th>
            <th className="px-5 py-2.5 text-center font-medium text-slate-600">Öğrenci</th>
            <th className="px-5 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(kurumlar as any[]).map((k: any) => (
            <tr key={k.id}
              className="odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/30 cursor-pointer group"
              onClick={() => onKurumClick(k.id, k.name)}>
              <td className="px-5 py-2 font-medium text-slate-800">{k.name}</td>
              <td className="px-5 py-2 text-xs text-slate-500">{k.sehir ?? '—'}</td>
              <td className="px-5 py-2 text-center text-xs text-slate-600">{k.sinifSayisi}</td>
              <td className="px-5 py-2 text-center text-xs text-slate-600">{k.ogrenciSayisi}</td>
              <td className="px-5 py-2 text-right">
                <button onClick={e => { e.stopPropagation(); onDeleteKurum(k.id, k.name); }}
                  className="size-5 flex items-center justify-center rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ml-auto">
                  <Trash2 className="size-3" />
                </button>
              </td>
            </tr>
          ))}
          {(kurumlar as any[]).length === 0 && (
            <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">Bu ülkede kayıtlı okul yok</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function UlkeKitaplarPanel({ ulkeId }: { ulkeId: number }) {
  const qc = useQueryClient();
  const [seciliKitap, setSeciliKitap] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  const { data: mevcutKitaplar = [] } = useQuery({
    queryKey: ['sa-ulke-kitaplar', ulkeId],
    queryFn: () => api.get(`/api/super-admin/ulke/${ulkeId}/kitaplar`).then(r => r.data),
  });
  const { data: tumKitaplar = [] } = useQuery({
    queryKey: ['sa-kitaplar', ''],
    queryFn: () => api.get('/api/super-admin/kitaplar').then(r => r.data),
  });

  const ataMutation = useMutation({
    mutationFn: () => api.post(`/api/super-admin/ulke/${ulkeId}/kitap`, { dersKitabiId: seciliKitap, isDefault }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-ulke-kitaplar', ulkeId] }); setSeciliKitap(''); },
  });
  const kaldirMutation = useMutation({
    mutationFn: (kitapId: string) => api.delete(`/api/super-admin/ulke/${ulkeId}/kitap/${kitapId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-ulke-kitaplar', ulkeId] }),
  });
  const defaultMutation = useMutation({
    mutationFn: ({ id, isDefault }: { id: string; isDefault: boolean }) =>
      api.post(`/api/super-admin/ulke/${ulkeId}/kitap`, { dersKitabiId: id, isDefault }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sa-ulke-kitaplar', ulkeId] }),
  });

  const atanamaz = new Set((mevcutKitaplar as any[]).map((k: any) => k.dersKitabiId));

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-5 py-2.5 text-left font-medium text-slate-600">Kitap</th>
            <th className="px-5 py-2.5 text-left font-medium text-slate-600">Seviye</th>
            <th className="px-5 py-2.5 text-center font-medium text-slate-600">Varsayılan</th>
            <th className="px-5 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(mevcutKitaplar as any[]).map((k: any) => (
            <tr key={k.dersKitabiId} className="odd:bg-white even:bg-slate-50/40">
              <td className="px-5 py-2 font-medium text-slate-800">{k.name}</td>
              <td className="px-5 py-2 text-xs text-slate-500">{k.seviye ?? '—'}</td>
              <td className="px-5 py-2 text-center">
                <input type="checkbox" checked={k.isDefault}
                  onChange={e => defaultMutation.mutate({ id: k.dersKitabiId, isDefault: e.target.checked })} />
              </td>
              <td className="px-5 py-2 text-right">
                <button onClick={() => kaldirMutation.mutate(k.dersKitabiId)}
                  className="size-5 flex items-center justify-center rounded text-slate-300 hover:text-red-500 transition-colors ml-auto">
                  <X className="size-3" />
                </button>
              </td>
            </tr>
          ))}
          {(mevcutKitaplar as any[]).length === 0 && (
            <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400 text-sm">Atanmış kitap yok</td></tr>
          )}
        </tbody>
      </table>

      {/* Inline add */}
      <div className="border-t border-slate-100 px-5 py-3 flex gap-2 bg-slate-50/50">
        <select value={seciliKitap} onChange={e => setSeciliKitap(e.target.value)}
          className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300">
          <option value="">Kitap seç...</option>
          {(tumKitaplar as any[]).filter((k: any) => !atanamaz.has(k.id))
            .map((k: any) => <option key={k.id} value={k.id}>{k.name} ({k.seviye})</option>)}
        </select>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 whitespace-nowrap cursor-pointer">
          <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} />
          Varsayılan
        </label>
        <button onClick={() => seciliKitap && ataMutation.mutate()}
          disabled={!seciliKitap || ataMutation.isPending}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50">
          <Plus className="size-3" /> Ata
        </button>
      </div>
    </div>
  );
}

function UlkeSiniflarPanel({ ulkeId }: { ulkeId: number }) {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: siniflar = [] } = useQuery({
    queryKey: ['sa-ulke-siniflar', ulkeId],
    queryFn: () => api.get(`/api/super-admin/ulke/${ulkeId}/siniflar`).then(r => r.data),
  });

  const silMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/super-admin/sinif/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-ulke-siniflar', ulkeId] }); setDeleteTarget(null); },
  });

  return (
    <div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <th className="px-5 py-2.5 text-left font-medium text-slate-600">Sınıf</th>
            <th className="px-5 py-2.5 text-left font-medium text-slate-600">Kurum</th>
            <th className="px-5 py-2.5 text-center font-medium text-slate-600">Öğrenci</th>
            <th className="px-5 py-2.5 text-left font-medium text-slate-600">Kitap</th>
            <th className="px-5 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(siniflar as any[]).map((s: any) => (
            <tr key={s.id} className="odd:bg-white even:bg-slate-50/40">
              <td className="px-5 py-2 font-medium text-slate-800">{s.name}</td>
              <td className="px-5 py-2 text-xs text-slate-500">{s.kurumAdi ?? '—'}</td>
              <td className="px-5 py-2 text-center text-xs text-slate-600">{s.ogrenciSayisi}</td>
              <td className="px-5 py-2 text-xs text-slate-500 truncate max-w-[150px]">{s.dersKitabiId ?? '—'}</td>
              <td className="px-5 py-2 text-right">
                <button onClick={() => setDeleteTarget(s)}
                  className="size-5 flex items-center justify-center rounded text-slate-300 hover:text-red-500 transition-colors ml-auto">
                  <Trash2 className="size-3" />
                </button>
              </td>
            </tr>
          ))}
          {(siniflar as any[]).length === 0 && (
            <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm">Bu ülkede sınıf yok</td></tr>
          )}
        </tbody>
      </table>

      <DeleteConfirmModal
        open={!!deleteTarget}
        entityName={deleteTarget?.name ?? ''}
        onConfirm={() => deleteTarget && silMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={silMutation.isPending}
      />
    </div>
  );
}

function KurumSiniflarDetail({ kurumId }: { kurumId: number }) {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { data: siniflar = [] } = useQuery({
    queryKey: ['sa-siniflar', kurumId],
    queryFn: () => api.get(`/api/super-admin/kurum/${kurumId}/siniflar`).then(r => r.data),
  });

  const silMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/super-admin/sinif/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-siniflar', kurumId] }); setDeleteTarget(null); },
  });

  return (
    <div className="space-y-2">
      {(siniflar as any[]).map((s: any) => (
        <div key={s.id} className="flex items-center gap-3 py-2 border-b border-slate-100 text-sm group">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-slate-800">{s.name}</div>
            <div className="text-xs text-slate-400">{s.ogrenciSayisi} öğrenci · {s.efektifKitapAdi ?? '—'}</div>
          </div>
          <button onClick={() => setDeleteTarget(s)}
            className="size-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 className="size-3" />
          </button>
        </div>
      ))}
      {(siniflar as any[]).length === 0 && <p className="text-xs text-slate-400 py-4 text-center">Bu kurumda sınıf yok</p>}

      <DeleteConfirmModal
        open={!!deleteTarget}
        entityName={deleteTarget?.name ?? ''}
        onConfirm={() => deleteTarget && silMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
        loading={silMutation.isPending}
      />
    </div>
  );
}

// ─── Raporlar ─────────────────────────────────────────────────────────────────

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
