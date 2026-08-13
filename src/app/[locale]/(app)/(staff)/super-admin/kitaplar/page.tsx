'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BookOpen,
  Pencil, Trash2, Check, X, Plus, Eye, EyeOff,
  ExternalLink,
} from 'lucide-react';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { apiHataMesaji } from '@/lib/utils';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { SlideOver } from '@/components/slide-over';
import {
  AramaInput, Sayfalama, SortTh, trSirala, useSiralama, useTopluSecim, TopluSecimTh, TopluSecimTd, TopluSilButton,
} from '@/components/staff/table-kit';

interface Kitap {
  id: string;
  name: string;
  seviye: string | null;
  uniteSayisi: number;
  visible: boolean;
  onaylandi: boolean;
  kitapSeti?: string | null;
  seri?: string | null;
  orderNo: number;
}

type SortKey = 'name' | 'seviye' | 'uniteSayisi' | 'visible' | 'onaylandi';

function KitaplarTab() {
  const qc = useQueryClient();
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const [editKitap, setEditKitap] = useState<Kitap | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Kitap | null>(null);
  const { secili, toggleBir, toggleHepsi, temizle } = useTopluSecim<string>();
  const [topluOnay, setTopluOnay] = useState(false);
  const { sortKey, sortDir, toggleSort } = useSiralama<SortKey>('name', () => setSayfa(1));

  const { data: kitaplarHam = [] } = useQuery({
    queryKey: ['sa-kitaplar', arama],
    queryFn: () => api.get('/api/super-admin/kitaplar', { params: { arama } }).then(r => r.data),
  });

  const kitaplar = useMemo(() => trSirala(kitaplarHam as Kitap[], sortKey, sortDir), [kitaplarHam, sortKey, sortDir]);

  const SAYFA_BOYUTU = 20;
  const totalPages = Math.max(1, Math.ceil((kitaplar as Kitap[]).length / SAYFA_BOYUTU));
  const guvenliSayfa = Math.min(sayfa, totalPages);
  const sayfadakiler = (kitaplar as Kitap[]).slice((guvenliSayfa - 1) * SAYFA_BOYUTU, guvenliSayfa * SAYFA_BOYUTU);

  const guncelleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Kitap> }) =>
      api.put(`/api/super-admin/kitap/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kitaplar'] }); setEditKitap(null); },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  const silMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/super-admin/kitap/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kitaplar'] }); setDeleteTarget(null); },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  const topluSilMutation = useMutation({
    mutationFn: (ids: string[]) => api.post('/api/super-admin/kitaplar/toplu-sil', { ids }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sa-kitaplar'] }); temizle(); setTopluOnay(false); },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {/* Standart liste toolbar'ı (referans: Ülkeler): başlık+sayaç · arama · sağda eylemler */}
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="size-4 text-purple-600" />
            <h2 className="text-sm font-semibold text-slate-800">Ders Kitapları</h2>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{(kitaplar as Kitap[]).length}</span>
          </div>
          <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Ders kitabı ara..." />
          <div className="flex items-center gap-2 ml-auto">
            <TopluSilButton sayi={secili.size} onClick={() => setTopluOnay(true)} />
            {/* Ders kitabı üretimi AI Stüdyosu'nda yapılır — manuel oluşturma endpoint'i yok */}
            <Link href="/ogretmen/ai-icerik"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap">
              <Plus className="size-3.5" /> Yeni Kitap (AI Stüdyosu)
            </Link>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <TopluSecimTh gorunenIdler={kitaplar.map((k: Kitap) => k.id)} secili={secili} onToggleHepsi={toggleHepsi} />
              <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kitap</SortTh>
              <SortTh colKey="seviye" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Seviye</SortTh>
              <SortTh colKey="uniteSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Ünite</SortTh>
              <SortTh colKey="visible" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center">Yayın</SortTh>
              <SortTh colKey="onaylandi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center">Onay</SortTh>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sayfadakiler.map((k: Kitap) => (
              <tr key={k.id} className="odd:bg-white even:bg-slate-50/40 hover:bg-purple-50/30">
                <TopluSecimTd id={k.id} secili={secili} onToggle={toggleBir} />
                <td className="px-4 py-2">
                  <Link
                    href={`/ders/${k.id}`}
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
                    <Link href={`/ders/${k.id}`}
                      className="size-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      title="İçeriği Aç (ünite ve etkinlikler)">
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

      <Sayfalama sayfa={guvenliSayfa} totalPages={totalPages} toplam={(kitaplar as Kitap[]).length} sayfaBoyutu={SAYFA_BOYUTU} onSayfa={setSayfa} />

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

      <DeleteConfirmModal
        open={topluOnay}
        entityName={`${secili.size} kitap`}
        onConfirm={() => topluSilMutation.mutate([...secili])}
        onCancel={() => setTopluOnay(false)}
        loading={topluSilMutation.isPending}
      />
    </div>
  );
}

interface KitapEditFormProps {
  kitap: Kitap;
  onSave: (d: Partial<Kitap>) => void;
}

interface KitapEditFormData {
  name: string;
  seviye: string;
  kitapSeti: string;
  seri: string;
  orderNo: number;
  visible: boolean;
  onaylandi: boolean;
}

type StringFieldKey = 'name' | 'seviye' | 'kitapSeti' | 'seri';
type BooleanFieldKey = 'visible' | 'onaylandi';

function KitapEditForm({ kitap, onSave }: KitapEditFormProps) {
  const [form, setForm] = useState<KitapEditFormData>({ name: kitap.name, seviye: kitap.seviye ?? '', kitapSeti: kitap.kitapSeti ?? '', seri: kitap.seri ?? '', orderNo: kitap.orderNo, visible: kitap.visible, onaylandi: kitap.onaylandi });

  const stringFields: Array<[StringFieldKey, string]> = [
    ['name', 'Ad'],
    ['seviye', 'Seviye (A1, B2...)'],
    ['kitapSeti', 'Kitap Seti'],
    ['seri', 'Seri (kurumsal katalogda kategori olarak gösterilir)'],
  ];

  return (
    <form id="kitap-edit-form" onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-4">
      {stringFields.map(([key, label]) => (
        <div key={key}>
          <label className="text-xs font-medium text-slate-600 block mb-1">{label}</label>
          <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
        </div>
      ))}
      <div>
        <label className="text-xs font-medium text-slate-600 block mb-1">Sıra No</label>
        <input type="number" value={form.orderNo} onChange={e => setForm(f => ({ ...f, orderNo: +e.target.value }))}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
      </div>
      <div className="flex gap-4 pt-1">
        {(['visible', 'onaylandi'] as const satisfies BooleanFieldKey[]).map(key => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
            {key === 'visible' ? 'Görünür' : 'Onaylı'}
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
