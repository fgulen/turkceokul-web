'use client';

// Ülkeler — Liste şablonu (4 Şablon Kuralı: DataTable).
// Satır tıklama → /super-admin/ulkeler/[id] detay route'u.
// Veri seti küçük (< 500 ülke) olduğu için tek fetch + client-side
// arama/sıralama/sayfalama; büyürse server-side'a geçilir.

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Globe, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { buildPageRange } from '../shared';
import { UlkeDuzenleSlideOver, type UlkeOzet } from './ulke-duzenle';

const SAYFA_BOYUTU = 20;

type SortKey = 'name' | 'ogretmenAdi' | 'kurumSayisi' | 'ogrenciSayisi' | 'visible';
type SortDir = 'asc' | 'desc';

function csvIndir(satirlar: any[]) {
  const basliklar = ['Ülke', 'Sorumlu Öğretmen', 'Kurum Sayısı', 'Öğrenci Sayısı', 'Durum'];
  const csv = [
    basliklar.join(';'),
    ...satirlar.map(u => [
      `"${(u.name ?? '').replace(/"/g, '""')}"`,
      `"${(u.ogretmenAdi ?? '').replace(/"/g, '""')}"`,
      u.kurumSayisi ?? 0,
      u.ogrenciSayisi ?? 0,
      u.visible ? 'Aktif' : 'Pasif',
    ].join(';')),
  ].join('\r\n');
  // UTF-8 BOM: Excel'in Türkçe karakterleri doğru açması için şart
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ulkeler.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function UlkelerListePage() {
  const qc = useQueryClient();
  const router = useRouter();

  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showAdd, setShowAdd] = useState(false);
  const [yeniAd, setYeniAd] = useState('');
  const [editUlke, setEditUlke] = useState<UlkeOzet | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sa-ulkeler', 'tumu'],
    queryFn: () => api.get('/api/super-admin/ulkeler', {
      params: { pageNumber: 1, pageSize: 500 }
    }).then(r => r.data),
  });
  const tumUlkeler: any[] = data?.liste ?? [];

  const olusturMutation = useMutation({
    mutationFn: (name: string) => api.post('/api/super-admin/ulke', { name, ogretmenId: null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-ulkeler'] });
      setYeniAd('');
      setShowAdd(false);
    },
  });

  const silMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/api/super-admin/ulke/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-ulkeler'] });
      setDeleteTarget(null);
    },
  });

  const gorunen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr');
    const filtreli = q
      ? tumUlkeler.filter(u => (u.name ?? '').toLocaleLowerCase('tr').includes(q))
      : tumUlkeler;
    const yon = sortDir === 'asc' ? 1 : -1;
    return [...filtreli].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey];
      if (typeof av === 'string' || typeof bv === 'string')
        return yon * String(av ?? '').localeCompare(String(bv ?? ''), 'tr');
      return yon * ((av ?? 0) === (bv ?? 0) ? 0 : (av ?? 0) > (bv ?? 0) ? 1 : -1);
    });
  }, [tumUlkeler, arama, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(gorunen.length / SAYFA_BOYUTU));
  const guvenliSayfa = Math.min(sayfa, totalPages);
  const sayfadakiler = gorunen.slice((guvenliSayfa - 1) * SAYFA_BOYUTU, guvenliSayfa * SAYFA_BOYUTU);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    setSayfa(1);
  }

  function SortHeader({ colKey, children, align = 'left' }: { colKey: SortKey; children: React.ReactNode; align?: 'left' | 'center' }) {
    const aktif = sortKey === colKey;
    const Icon = !aktif ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
    return (
      <th className={`px-4 py-2.5 font-medium text-slate-600 ${align === 'center' ? 'text-center' : 'text-left'}`}>
        <button
          onClick={() => toggleSort(colKey)}
          className={`inline-flex items-center gap-1 hover:text-slate-900 transition-colors ${aktif ? 'text-slate-900' : ''}`}>
          {children}
          <Icon className={`size-3 ${aktif ? 'text-purple-600' : 'text-slate-300'}`} />
        </button>
      </th>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Globe className="size-4 text-blue-500" />
          <h2 className="text-sm font-semibold text-slate-800">Ülkeler</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">
            {gorunen.length}{arama && ` / ${tumUlkeler.length}`}
          </span>
        </div>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-2 size-3.5 text-slate-400" />
          <input
            value={arama}
            onChange={e => { setArama(e.target.value); setSayfa(1); }}
            placeholder="Ülke ara..."
            className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
          {arama && (
            <button onClick={() => { setArama(''); setSayfa(1); }}
              className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="size-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            onClick={() => csvIndir(gorunen)}
            disabled={gorunen.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors">
            <Download className="size-3.5" />
            Excel'e Aktar
          </button>
          <button
            onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
            <Plus className="size-3.5" />
            Yeni Ülke
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="px-4 py-3 border-b border-slate-100 bg-purple-50/40 flex gap-2">
          <input
            value={yeniAd}
            onChange={e => setYeniAd(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && yeniAd.trim() && olusturMutation.mutate(yeniAd.trim())}
            placeholder="Ülke adı..."
            autoFocus
            className="flex-1 max-w-xs border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
          <button
            onClick={() => yeniAd.trim() && olusturMutation.mutate(yeniAd.trim())}
            disabled={!yeniAd.trim() || olusturMutation.isPending}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {olusturMutation.isPending ? 'Ekleniyor…' : 'Ekle'}
          </button>
        </div>
      )}

      {/* Tablo */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortHeader colKey="name">Ülke</SortHeader>
              <SortHeader colKey="ogretmenAdi">Sorumlu Öğretmen</SortHeader>
              <SortHeader colKey="kurumSayisi" align="center">Kurumlar</SortHeader>
              <SortHeader colKey="ogrenciSayisi" align="center">Öğrenciler</SortHeader>
              <SortHeader colKey="visible" align="center">Durum</SortHeader>
              <th className="px-4 py-2.5 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sayfadakiler.map((u: any) => (
              <tr
                key={u.id}
                onClick={() => router.push(`/super-admin/ulkeler/${u.id}`)}
                className="group cursor-pointer odd:bg-white even:bg-slate-50/40 hover:bg-purple-50/50 transition-colors">
                <td className="px-4 py-2.5 font-medium text-slate-800">{u.name}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{u.ogretmenAdi ?? '—'}</td>
                <td className="px-4 py-2.5 text-center tabular-nums text-slate-700">{u.kurumSayisi}</td>
                <td className="px-4 py-2.5 text-center tabular-nums text-slate-700">{u.ogrenciSayisi}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${u.visible ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.visible ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setEditUlke({ id: u.id, name: u.name, visible: u.visible, ogretmenId: u.ogretmenId ?? null, ogretmenAdi: u.ogretmenAdi ?? null });
                      }}
                      className="size-6 flex items-center justify-center rounded text-slate-300 hover:text-blue-500 transition-colors">
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget({ id: u.id, name: u.name }); }}
                      className="size-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && sayfadakiler.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-xs text-slate-400">
                  {arama ? `"${arama}" için sonuç bulunamadı` : 'Henüz ülke yok'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Sayfalama */}
      {totalPages > 1 && (
        <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs text-slate-400 tabular-nums">
            {(guvenliSayfa - 1) * SAYFA_BOYUTU + 1}–{Math.min(guvenliSayfa * SAYFA_BOYUTU, gorunen.length)} / {gorunen.length}
          </span>
          <div className="flex items-center gap-0.5">
            <button
              disabled={guvenliSayfa === 1}
              onClick={() => setSayfa(p => p - 1)}
              className="size-7 flex items-center justify-center rounded text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              ‹
            </button>
            {buildPageRange(guvenliSayfa, totalPages).map((p, i) =>
              p === '...'
                ? <span key={`d${i}`} className="px-1 text-slate-400 text-xs">…</span>
                : <button
                    key={p}
                    onClick={() => setSayfa(Number(p))}
                    className={`size-7 flex items-center justify-center rounded text-xs transition-colors ${
                      guvenliSayfa === p ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                    }`}>
                    {p}
                  </button>
            )}
            <button
              disabled={guvenliSayfa === totalPages}
              onClick={() => setSayfa(p => p + 1)}
              className="size-7 flex items-center justify-center rounded text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              ›
            </button>
          </div>
        </div>
      )}

      <UlkeDuzenleSlideOver ulke={editUlke} onClose={() => setEditUlke(null)} />

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
