'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus, Eye, Pencil, Trash2 } from 'lucide-react';
import { Link } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

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
  const { user, ready } = useAuthGuard('Editor');
  const authUser = useAuthStore(s => s.user);
  const isSuperAdmin = authUser?.role === 'SuperAdmin';
  const queryClient = useQueryClient();
  const [silOnayId, setSilOnayId] = useState<string | null>(null);

  const { data: kitaplar, isLoading } = useQuery<KutuphaneKitap[]>({
    queryKey: ['editor-kutuphane-kitaplar'],
    queryFn: () => api.get('/api/kutuphane/kitaplar').then(r => r.data),
    enabled: !!user,
  });

  const sil = useMutation({
    mutationFn: (id: string) => api.delete(`/api/kutuphane/kitaplar/${id}`),
    onSuccess: () => {
      setSilOnayId(null);
      queryClient.invalidateQueries({ queryKey: ['editor-kutuphane-kitaplar'] });
    },
  });

  if (!ready) return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6]">
      <main className="max-w-[1000px] mx-auto px-4 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kütüphane Yönetimi</h1>
            <p className="text-slate-500 text-sm mt-1">Okuma kitaplarını ekle ve yönet</p>
          </div>
          <Link
            href="/editor/kutuphane/yeni"
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Kitap Ekle
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="size-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Kitaplar</h2>
            <span className="ml-auto text-xs text-slate-400">{kitaplar?.length ?? 0} kitap</span>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : !kitaplar?.length ? (
            <div className="text-center py-16">
              <BookOpen className="size-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Henüz kitap eklenmedi.</p>
              <p className="text-slate-400 text-sm mt-1">İlk kitabı eklemek için "Kitap Ekle" butonuna tıkla.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {kitaplar.map(k => (
                <div key={k.id}>
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <BookOpen className="size-5 text-slate-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-slate-800 truncate">{k.baslik}</div>
                        <div className="text-xs text-slate-400">{k.yazar} · <span className="font-mono">{k.id}</span></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">{k.seviye}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">{k.tur}</span>
                      {k.fixedLayout && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">FXL</span>
                      )}
                      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', durumStyle[k.durum] ?? 'bg-slate-100 text-slate-600')}>
                        {k.durum}
                      </span>
                      {isSuperAdmin && (
                        <Link
                          href={`/okuma/${k.id}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
                          title="Öğrencinin gördüğünü gör"
                        >
                          <Eye className="size-3" />
                          Önizle
                        </Link>
                      )}
                      <Link
                        href={`/editor/kutuphane/${k.id}/duzenle`}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        <Pencil className="size-3" />
                        Düzenle
                      </Link>
                      <button
                        onClick={() => setSilOnayId(k.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="size-3" />
                        Sil
                      </button>
                    </div>
                  </div>

                  {/* Satır içi silme onayı */}
                  {silOnayId === k.id && (
                    <div className="px-6 py-3 bg-red-50 border-t border-red-100 flex items-center justify-between gap-4">
                      <p className="text-sm text-red-700 font-medium">
                        <strong>&quot;{k.baslik}&quot;</strong> silinecek. Emin misin?
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSilOnayId(null)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
                        >
                          İptal
                        </button>
                        <button
                          onClick={() => sil.mutate(k.id)}
                          disabled={sil.isPending}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {sil.isPending ? 'Siliniyor...' : 'Evet, Sil'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
