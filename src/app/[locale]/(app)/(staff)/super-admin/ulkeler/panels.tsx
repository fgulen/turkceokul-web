'use client';

// Ülke detayının bölüm panelleri. v1b DataTable dönüşümünde page.tsx'ten çıkarıldı;
// hem /ulkeler/[ulkeId] detay sayfası hem SlideOver'lar kullanır.

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Trash2, X, Plus,
} from 'lucide-react';
import { api } from '@/lib/api';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { SlideOver } from '@/components/slide-over';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { SinifFormSlideOver } from '@/components/sinif-form-slideover';
import {
  SortTh, trSirala, useSiralama, useTopluSecim, TopluSecimTh, TopluSecimTd, TopluSilButton, topluSilParalel,
} from '@/components/staff/table-kit';

type TemsilciSortKey = 'name' | 'email' | 'isApproved';

export function TemsilcilerPanel({ ulkeId, ulkeAdi }: { ulkeId: number; ulkeAdi: string }) {
  const { sortKey, sortDir, toggleSort } = useSiralama<TemsilciSortKey>('name');
  const [showAdd, setShowAdd] = useState(false);

  const { data } = useQuery({
    queryKey: ['sa-kullanicilar', 'UlkeTemsilcisi', '', 1, ulkeId],
    queryFn: () => api.get('/api/super-admin/kullanicilar', {
      params: { rol: 'UlkeTemsilcisi', ulkeId, sayfaBoyutu: 100 }
    }).then(r => r.data),
  });
  const ham: any[] = data?.liste ?? [];

  const liste = useMemo(() => trSirala(ham, sortKey, sortDir), [ham, sortKey, sortDir]);

  return (
    <div>
      {/* Standart panel toolbar'ı: sağda mor "Yeni X" eylemi */}
      <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-end">
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
          <Plus className="size-3" /> Yeni Temsilci
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Ad Soyad</SortTh>
            <SortTh colKey="email" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>E-posta</SortTh>
            <SortTh colKey="isApproved" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center">Durum</SortTh>
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

      <TemsilciEkleSlideOver
        open={showAdd}
        ulkeId={ulkeId}
        ulkeAdi={ulkeAdi}
        onClose={() => setShowAdd(false)}
      />
    </div>
  );
}

function TemsilciEkleSlideOver({ open, ulkeId, ulkeAdi, onClose }: {
  open: boolean; ulkeId: number; ulkeAdi: string; onClose: () => void;
}) {
  const qc = useQueryClient();

  return (
    <SlideOver open={open} onClose={onClose} title="Yeni Temsilci" subtitle={ulkeAdi} width="sm">
      <RoleScopedUserForm
        bare
        baslik="Yeni Temsilci"
        aciklama="Bu ülke için temsilci daveti oluştur."
        hedefRolSecenekleri={[{ value: 'UlkeTemsilcisi', label: 'Ülke Temsilcisi' }]}
        sabitUlke={{ id: ulkeId, name: ulkeAdi }}
        onOlusturuldu={() => {
          qc.invalidateQueries({ queryKey: ['sa-kullanicilar', 'UlkeTemsilcisi'] });
          toast.success('Davet linki oluşturuldu');
        }}
      />
    </SlideOver>
  );
}

export function KurumlarPanel({ ulkeId, onKurumClick, onDeleteKurum }: {
  ulkeId: number;
  onKurumClick: (id: number, name: string) => void;
  onDeleteKurum: (id: number, name: string) => void;
}) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const { sortKey, sortDir, toggleSort } = useSiralama<'name' | 'sehir' | 'sinifSayisi' | 'ogrenciSayisi'>('name');
  const { secili, toggleBir, toggleHepsi, temizle } = useTopluSecim<number>();
  const [topluOnay, setTopluOnay] = useState(false);

  const { data: kurumlarHam = [] } = useQuery({
    queryKey: ['sa-kurumlar', ulkeId],
    queryFn: () => api.get('/api/super-admin/kurumlar', { params: { ulkeId } }).then(r => r.data),
  });

  const topluSilMutation = useMutation({
    mutationFn: (ids: number[]) => topluSilParalel(ids, id => api.delete(`/api/super-admin/kurum/${id}`)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kurumlar', ulkeId] }); temizle(); setTopluOnay(false); },
  });

  const kurumlar = useMemo(() => trSirala(kurumlarHam as any[], sortKey, sortDir), [kurumlarHam, sortKey, sortDir]);

  return (
    <div className="flex flex-col h-full">
      {/* Standart panel toolbar'ı: sağda mor "Yeni X" eylemi */}
      <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-end gap-2 shrink-0">
        <TopluSilButton sayi={secili.size} onClick={() => setTopluOnay(true)} />
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
          <Plus className="size-3" /> Yeni Kurum
        </button>
      </div>

      <table className="w-full text-sm flex-1">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <TopluSecimTh gorunenIdler={kurumlar.map((k: any) => k.id)} secili={secili} onToggleHepsi={toggleHepsi} />
            <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kurum</SortTh>
            <SortTh colKey="sehir" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Şehir</SortTh>
            <SortTh colKey="sinifSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center">Sınıf</SortTh>
            <SortTh colKey="ogrenciSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center">Öğrenci</SortTh>
            <th className="px-5 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(kurumlar as any[]).map((k: any) => (
            <tr key={k.id}
              className="odd:bg-white even:bg-slate-50/40 hover:bg-blue-50/30 cursor-pointer group"
              onClick={() => onKurumClick(k.id, k.name)}>
              <TopluSecimTd id={k.id} secili={secili} onToggle={toggleBir} />
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
            <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">Bu ülkede kayıtlı okul yok</td></tr>
          )}
        </tbody>
      </table>

      <DeleteConfirmModal
        open={topluOnay}
        entityName={`${secili.size} kurum`}
        onConfirm={() => topluSilMutation.mutate([...secili])}
        onCancel={() => setTopluOnay(false)}
        loading={topluSilMutation.isPending}
      />

      <KurumEkleSlideOver open={showAdd} ulkeId={ulkeId} onClose={() => setShowAdd(false)} />
    </div>
  );
}

function KurumEkleSlideOver({ open, ulkeId, onClose }: { open: boolean; ulkeId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', sehir: '' });

  useEffect(() => {
    if (open) setForm({ name: '', sehir: '' });
  }, [open]);

  const kurumOlusturMutation = useMutation({
    mutationFn: () => api.post('/api/super-admin/kurum', { name: form.name, sehir: form.sehir || null, ulkeId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-kurumlar', ulkeId] });
      toast.success('Kurum eklendi');
      onClose();
    },
  });

  const kaydet = () => form.name && kurumOlusturMutation.mutate();

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Yeni Kurum"
      width="sm"
      footer={
        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            İptal
          </button>
          <button onClick={kaydet} disabled={!form.name || kurumOlusturMutation.isPending}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {kurumOlusturMutation.isPending ? 'Ekleniyor…' : 'Ekle'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Okul Adı</label>
          <input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && kaydet()}
            autoFocus
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Şehir</label>
          <input
            value={form.sehir}
            onChange={e => setForm(f => ({ ...f, sehir: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && kaydet()}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
        </div>
      </div>
    </SlideOver>
  );
}

export function UlkeKitaplarPanel({ ulkeId }: { ulkeId: number }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const { sortKey, sortDir, toggleSort } = useSiralama<'name' | 'seviye'>('name');

  const { data: mevcutKitaplarHam = [] } = useQuery({
    queryKey: ['sa-ulke-kitaplar', ulkeId],
    queryFn: () => api.get(`/api/super-admin/ulke/${ulkeId}/kitaplar`).then(r => r.data),
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

  const atanamaz = new Set((mevcutKitaplarHam as any[]).map((k: any) => k.dersKitabiId));

  const mevcutKitaplar = useMemo(() => trSirala(mevcutKitaplarHam as any[], sortKey, sortDir), [mevcutKitaplarHam, sortKey, sortDir]);

  return (
    <div>
      {/* Standart panel toolbar'ı: sağda mor "Yeni X" eylemi */}
      <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-end">
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
          <Plus className="size-3" /> Kitap Ata
        </button>
      </div>

      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kitap</SortTh>
            <SortTh colKey="seviye" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Seviye</SortTh>
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

      <KitapAtaSlideOver open={showAdd} ulkeId={ulkeId} atanamaz={atanamaz} onClose={() => setShowAdd(false)} />
    </div>
  );
}

function KitapAtaSlideOver({ open, ulkeId, atanamaz, onClose }: {
  open: boolean; ulkeId: number; atanamaz: Set<string>; onClose: () => void;
}) {
  const qc = useQueryClient();
  const [seciliKitap, setSeciliKitap] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    if (open) { setSeciliKitap(''); setIsDefault(false); }
  }, [open]);

  const { data: tumKitaplar = [] } = useQuery({
    queryKey: ['sa-kitaplar', ''],
    queryFn: () => api.get('/api/super-admin/kitaplar').then(r => r.data),
    enabled: open,
  });

  const ataMutation = useMutation({
    mutationFn: () => api.post(`/api/super-admin/ulke/${ulkeId}/kitap`, { dersKitabiId: seciliKitap, isDefault }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-ulke-kitaplar', ulkeId] });
      toast.success('Kitap atandı');
      onClose();
    },
  });

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Kitap Ata"
      width="sm"
      footer={
        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            İptal
          </button>
          <button onClick={() => seciliKitap && ataMutation.mutate()}
            disabled={!seciliKitap || ataMutation.isPending}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {ataMutation.isPending ? 'Atanıyor…' : 'Ata'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1.5">Kitap</label>
          <select
            value={seciliKitap}
            onChange={e => setSeciliKitap(e.target.value)}
            autoFocus
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          >
            <option value="">Kitap seç...</option>
            {(tumKitaplar as any[]).filter((k: any) => !atanamaz.has(k.id))
              .map((k: any) => <option key={k.id} value={k.id}>{k.name} ({k.seviye})</option>)}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={isDefault}
            onChange={e => setIsDefault(e.target.checked)}
            className="size-4 rounded border-slate-300 accent-purple-600"
          />
          Varsayılan
        </label>
      </div>
    </SlideOver>
  );
}

export function UlkeSiniflarPanel({ ulkeId }: { ulkeId: number }) {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [showAdd, setShowAdd] = useState(false);
  const { sortKey, sortDir, toggleSort } = useSiralama<'name' | 'kurumAdi' | 'ogrenciSayisi' | 'dersKitabiId'>('name');
  const { secili, toggleBir, toggleHepsi, temizle } = useTopluSecim<number>();
  const [topluOnay, setTopluOnay] = useState(false);

  const { data: siniflarHam = [] } = useQuery({
    queryKey: ['sa-ulke-siniflar', ulkeId],
    queryFn: () => api.get(`/api/super-admin/ulke/${ulkeId}/siniflar`).then(r => r.data),
  });

  const silMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/super-admin/sinif/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-ulke-siniflar', ulkeId] }); setDeleteTarget(null); },
  });

  const topluSilMutation = useMutation({
    mutationFn: (ids: number[]) => topluSilParalel(ids, id => api.delete(`/api/super-admin/sinif/${id}`)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-ulke-siniflar', ulkeId] }); temizle(); setTopluOnay(false); },
  });

  const siniflar = useMemo(() => trSirala(siniflarHam as any[], sortKey, sortDir), [siniflarHam, sortKey, sortDir]);

  return (
    <div>
      <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-end gap-2">
        <TopluSilButton sayi={secili.size} onClick={() => setTopluOnay(true)} />
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
          <Plus className="size-3" /> Yeni Sınıf
        </button>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <TopluSecimTh gorunenIdler={siniflar.map((s: any) => s.id)} secili={secili} onToggleHepsi={toggleHepsi} />
            <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Sınıf</SortTh>
            <SortTh colKey="kurumAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kurum</SortTh>
            <SortTh colKey="ogrenciSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center">Öğrenci</SortTh>
            <SortTh colKey="dersKitabiId" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kitap</SortTh>
            <th className="px-5 py-2.5"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {(siniflar as any[]).map((s: any) => (
            <tr key={s.id} className="odd:bg-white even:bg-slate-50/40">
              <TopluSecimTd id={s.id} secili={secili} onToggle={toggleBir} />
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
            <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400 text-sm">Bu ülkede sınıf yok</td></tr>
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

      <DeleteConfirmModal
        open={topluOnay}
        entityName={`${secili.size} sınıf`}
        onConfirm={() => topluSilMutation.mutate([...secili])}
        onCancel={() => setTopluOnay(false)}
        loading={topluSilMutation.isPending}
      />

      <SinifFormSlideOver
        open={showAdd}
        mod="olustur"
        ulkeId={ulkeId}
        onClose={() => setShowAdd(false)}
        onBasarili={() => qc.invalidateQueries({ queryKey: ['sa-ulke-siniflar', ulkeId] })}
      />
    </div>
  );
}

export function KurumSiniflarDetail({ kurumId }: { kurumId: number }) {
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


