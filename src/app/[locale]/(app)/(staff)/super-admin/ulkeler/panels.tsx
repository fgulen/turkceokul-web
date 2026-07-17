'use client';

// Ülke detayının bölüm panelleri. v1b DataTable dönüşümünde page.tsx'ten çıkarıldı;
// hem /ulkeler/[ulkeId] detay sayfası hem SlideOver'lar kullanır.

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  BookOpen, Users, Globe, Pencil, Trash2, Check, X, Search, Plus, Eye, EyeOff,
  RefreshCw, ExternalLink, ChevronRight,
} from 'lucide-react';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import {
  SortTh, trSirala, useTopluSecim, TopluSecimTh, TopluSecimTd, TopluSilButton, topluSilParalel,
} from '@/components/staff/table-kit';
import { apiHataMesaji } from '../shared';

type TemsilciSortKey = 'name' | 'email' | 'isApproved';

export function TemsilcilerPanel({ ulkeId }: { ulkeId: number }) {
  const [sortKey, setSortKey] = useState<TemsilciSortKey>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { data } = useQuery({
    queryKey: ['sa-kullanicilar', 'UlkeTemsilcisi', '', 1, ulkeId],
    queryFn: () => api.get('/api/super-admin/kullanicilar', {
      params: { rol: 'UlkeTemsilcisi', ulkeId, sayfaBoyutu: 100 }
    }).then(r => r.data),
  });
  const ham: any[] = data?.liste ?? [];

  function toggleSort(key: TemsilciSortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  const liste = useMemo(() => trSirala(ham, sortKey, sortDir), [ham, sortKey, sortDir]);

  return (
    <div>
      {/* Standart panel toolbar'ı: sağda mor "Yeni X" eylemi */}
      <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-end">
        <Link href="/super-admin/kullanici-olustur"
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
          <Plus className="size-3" /> Yeni Temsilci
        </Link>
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
    </div>
  );
}

export function KurumlarPanel({ ulkeId, onKurumClick, onDeleteKurum }: {
  ulkeId: number;
  onKurumClick: (id: number, name: string) => void;
  onDeleteKurum: (id: number, name: string) => void;
}) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [yeniKurum, setYeniKurum] = useState({ name: '', sehir: '' });
  const [sortKey, setSortKey] = useState<'name' | 'sehir' | 'sinifSayisi' | 'ogrenciSayisi'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const { secili, toggleBir, toggleHepsi, temizle } = useTopluSecim<number>();
  const [topluOnay, setTopluOnay] = useState(false);

  const { data: kurumlarHam = [] } = useQuery({
    queryKey: ['sa-kurumlar', ulkeId],
    queryFn: () => api.get('/api/super-admin/kurumlar', { params: { ulkeId } }).then(r => r.data),
  });

  const kurumOlusturMutation = useMutation({
    mutationFn: (d: any) => api.post('/api/super-admin/kurum', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-kurumlar', ulkeId] });
      setYeniKurum({ name: '', sehir: '' });
      setShowAdd(false);
    },
  });

  const topluSilMutation = useMutation({
    mutationFn: (ids: number[]) => topluSilParalel(ids, id => api.delete(`/api/super-admin/kurum/${id}`)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kurumlar', ulkeId] }); temizle(); setTopluOnay(false); },
  });

  const kaydet = () => yeniKurum.name && kurumOlusturMutation.mutate({ name: yeniKurum.name, sehir: yeniKurum.sehir || null, ulkeId });

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  const kurumlar = useMemo(() => trSirala(kurumlarHam as any[], sortKey, sortDir), [kurumlarHam, sortKey, sortDir]);

  return (
    <div className="flex flex-col h-full">
      {/* Standart panel toolbar'ı: sağda mor "Yeni X" eylemi */}
      <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-end gap-2 shrink-0">
        <TopluSilButton sayi={secili.size} onClick={() => setTopluOnay(true)} />
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
          <Plus className="size-3" /> Yeni Kurum
        </button>
      </div>

      {showAdd && (
        <div className="border-b border-slate-100 px-5 py-3 flex gap-2 bg-purple-50/40 shrink-0">
          <input value={yeniKurum.name} onChange={e => setYeniKurum(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && kaydet()}
            placeholder="Okul adı..." autoFocus
            className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
          <input value={yeniKurum.sehir} onChange={e => setYeniKurum(f => ({ ...f, sehir: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && kaydet()}
            placeholder="Şehir..." className="w-28 border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
          <button
            onClick={kaydet}
            disabled={!yeniKurum.name || kurumOlusturMutation.isPending}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {kurumOlusturMutation.isPending ? 'Ekleniyor…' : 'Ekle'}
          </button>
        </div>
      )}

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
    </div>
  );
}

export function UlkeKitaplarPanel({ ulkeId }: { ulkeId: number }) {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [seciliKitap, setSeciliKitap] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'seviye'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { data: mevcutKitaplarHam = [] } = useQuery({
    queryKey: ['sa-ulke-kitaplar', ulkeId],
    queryFn: () => api.get(`/api/super-admin/ulke/${ulkeId}/kitaplar`).then(r => r.data),
  });
  const { data: tumKitaplar = [] } = useQuery({
    queryKey: ['sa-kitaplar', ''],
    queryFn: () => api.get('/api/super-admin/kitaplar').then(r => r.data),
  });

  const ataMutation = useMutation({
    mutationFn: () => api.post(`/api/super-admin/ulke/${ulkeId}/kitap`, { dersKitabiId: seciliKitap, isDefault }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-ulke-kitaplar', ulkeId] });
      setSeciliKitap('');
      setShowAdd(false);
    },
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

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  const mevcutKitaplar = useMemo(() => trSirala(mevcutKitaplarHam as any[], sortKey, sortDir), [mevcutKitaplarHam, sortKey, sortDir]);

  return (
    <div>
      {/* Standart panel toolbar'ı: sağda mor "Yeni X" eylemi */}
      <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-end">
        <button onClick={() => setShowAdd(v => !v)}
          className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
          <Plus className="size-3" /> Kitap Ata
        </button>
      </div>

      {showAdd && (
        <div className="border-b border-slate-100 px-5 py-3 flex gap-2 bg-purple-50/40">
          <select value={seciliKitap} onChange={e => setSeciliKitap(e.target.value)} autoFocus
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
            className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {ataMutation.isPending ? 'Atanıyor…' : 'Ekle'}
          </button>
        </div>
      )}

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
    </div>
  );
}

export function UlkeSiniflarPanel({ ulkeId }: { ulkeId: number }) {
  const qc = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [sortKey, setSortKey] = useState<'name' | 'kurumAdi' | 'ogrenciSayisi' | 'dersKitabiId'>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
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

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  const siniflar = useMemo(() => trSirala(siniflarHam as any[], sortKey, sortDir), [siniflarHam, sortKey, sortDir]);

  return (
    <div>
      <div className="px-5 py-2.5 border-b border-slate-100 flex items-center justify-end">
        <TopluSilButton sayi={secili.size} onClick={() => setTopluOnay(true)} />
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


