'use client';

// Okuma Kitapları (kütüphane yönetimi) — Liste şablonu (4 Şablon Kuralı: DataTable).
// Ekleme/düzenleme Tam Sayfa Form şablonu: /editor/kutuphane/yeni ve [id]/duzenle.

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Eye, Library, Pencil, Plus, Trash2 } from 'lucide-react';
import { Link } from '@/navigation';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DeleteConfirmModal } from '@/components/delete-confirm-modal';
import { KitapDuzenleSlideOver } from './kitap-duzenle-slideover';

interface KutuphaneKitap {
  id: string;
  baslik: string;
  yazar: string;
  seviye: string;
  tur: 'epub' | 'pdf';
  url: string;
  kapakUrl: string | null;
  fixedLayout: boolean;
  durum: 'Taslak' | 'Aktif' | 'Pasif';
  aciklama: string | null;
  insertDate: string;
}

const durumStyle: Record<string, string> = {
  Aktif:  'bg-emerald-50 text-emerald-700',
  Taslak: 'bg-amber-50 text-amber-700',
  Pasif:  'bg-red-50 text-red-600',
};

export default function EditorKutuphaneListPage() {
  const user = useAuthStore(s => s.user);
  const isSuperAdmin = user?.role === 'SuperAdmin';
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const [silOnay, setSilOnay] = useState<KutuphaneKitap | null>(null);
  // ?duzenle=<id> derin linki: eski /duzenle route'u buraya yönlendirir
  const [duzenleId, setDuzenleId] = useState<string | null>(() => searchParams?.get('duzenle') ?? null);

  const { data: kitaplar, isLoading } = useQuery<KutuphaneKitap[]>({
    queryKey: ['editor-kutuphane-kitaplar'],
    queryFn: () => api.get('/api/kutuphane/kitaplar').then(r => r.data),
    enabled: !!user,
  });

  const sil = useMutation({
    mutationFn: (id: string) => api.delete(`/api/kutuphane/kitaplar/${id}`),
    onSuccess: () => {
      setSilOnay(null);
      queryClient.invalidateQueries({ queryKey: ['editor-kutuphane-kitaplar'] });
    },
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Library className="size-4 text-indigo-500" />
          <h2 className="text-sm font-semibold text-slate-800">Okuma Kitapları</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">
            {kitaplar?.length ?? 0}
          </span>
        </div>
        <Link
          href="/editor/kutuphane/yeni"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors ml-auto"
        >
          <Plus className="size-3.5" /> Kitap Ekle
        </Link>
      </div>

      {isLoading ? (
        <div className="p-6 space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : !kitaplar?.length ? (
        <div className="text-center py-16">
          <BookOpen className="size-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Henüz kitap eklenmedi.</p>
          <p className="text-slate-400 text-sm mt-1">İlk kitabı eklemek için &quot;Kitap Ekle&quot; butonuna tıkla.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Kitap</th>
                <th className="px-4 py-2.5 text-left font-medium text-slate-600">Yazar</th>
                <th className="px-4 py-2.5 text-center font-medium text-slate-600">Seviye</th>
                <th className="px-4 py-2.5 text-center font-medium text-slate-600">Tür</th>
                <th className="px-4 py-2.5 text-center font-medium text-slate-600">Durum</th>
                <th className="px-4 py-2.5 w-40" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {kitaplar.map(k => (
                <tr key={k.id} className="group odd:bg-white even:bg-slate-50/40 hover:bg-purple-50/50 transition-colors">
                  <td className="px-4 py-2.5">
                    <div className="font-medium text-slate-800">{k.baslik}</div>
                    <div className="text-[11px] text-slate-400 font-mono">{k.id}</div>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{k.yazar || '—'}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{k.seviye}</span>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">{k.tur}</span>
                    {k.fixedLayout && (
                      <span className="ml-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">FXL</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', durumStyle[k.durum] ?? 'bg-slate-100 text-slate-600')}>
                      {k.durum}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isSuperAdmin && (
                        <Link
                          href={`/okuma/${k.id}`}
                          title="Öğrencinin gördüğünü gör"
                          className="size-6 flex items-center justify-center rounded text-slate-300 hover:text-indigo-500 transition-colors">
                          <Eye className="size-3.5" />
                        </Link>
                      )}
                      <button
                        onClick={() => setDuzenleId(k.id)}
                        className="size-6 flex items-center justify-center rounded text-slate-300 hover:text-blue-500 transition-colors">
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setSilOnay(k)}
                        className="size-6 flex items-center justify-center rounded text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DeleteConfirmModal
        open={!!silOnay}
        entityName={silOnay?.baslik ?? ''}
        onConfirm={() => silOnay && sil.mutate(silOnay.id)}
        onCancel={() => setSilOnay(null)}
        loading={sil.isPending}
      />

      <KitapDuzenleSlideOver kitapId={duzenleId} onClose={() => setDuzenleId(null)} />
    </div>
  );
}
