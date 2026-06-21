'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus } from 'lucide-react';
import { Link, useRouter } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';

interface KitapEkleForm {
  id: string;
  baslik: string;
  yazar: string;
  seviye: string;
  tur: 'epub' | 'pdf';
  url: string;
  kapakUrl: string;
  fixedLayout: boolean;
  durum: string;
  aciklama: string;
}

export default function EditorKitapEklePage() {
  const { user, ready } = useAuthGuard('Editor');
  const router = useRouter();

  const [form, setForm] = useState<KitapEkleForm>({
    id: '',
    baslik: '',
    yazar: '',
    seviye: 'A1',
    tur: 'pdf',
    url: '',
    kapakUrl: '',
    fixedLayout: false,
    durum: 'Taslak',
    aciklama: '',
  });
  const [hata, setHata] = useState('');

  function set<K extends keyof KitapEkleForm>(key: K, val: KitapEkleForm[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  const ekle = useMutation({
    mutationFn: () => api.post('/api/kutuphane/kitaplar', {
      ...form,
      kapakUrl: form.kapakUrl || null,
      aciklama: form.aciklama || null,
    }),
    onSuccess: () => router.push('/editor/kutuphane'),
    onError: (e: Error) => setHata('Hata: ' + e.message),
  });

  const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
  const labelCls = 'block text-xs font-semibold text-slate-500 mb-1';

  if (!ready) return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6]">
      <main className="max-w-[680px] mx-auto px-4 py-10">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/editor/kutuphane" className="p-2 rounded-xl hover:bg-white border border-slate-200 transition-colors">
            <ArrowLeft className="size-4 text-slate-500" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Kitap Ekle</h1>
            <p className="text-slate-500 text-sm mt-0.5">Kütüphaneye yeni kitap ekle</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">

          <div>
            <label className={labelCls}>ID (slug) *</label>
            <input
              type="text"
              value={form.id}
              onChange={e => set('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
              placeholder="cirkin-ordek-yavrusu"
              className={inputCls}
            />
            <p className="text-[11px] text-slate-400 mt-1">Küçük harf, tire ile ayır. URL'de görünür: /okuma/<strong>{form.id || '...'}</strong></p>
          </div>

          <div>
            <label className={labelCls}>Başlık *</label>
            <input
              type="text"
              value={form.baslik}
              onChange={e => set('baslik', e.target.value)}
              placeholder="Çirkin Ördek Yavrusu"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Yazar</label>
            <input
              type="text"
              value={form.yazar}
              onChange={e => set('yazar', e.target.value)}
              placeholder="Hans Christian Andersen"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>CEFR Seviyesi</label>
              <select value={form.seviye} onChange={e => set('seviye', e.target.value)} className={inputCls}>
                {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Format</label>
              <select value={form.tur} onChange={e => set('tur', e.target.value as 'epub' | 'pdf')} className={inputCls}>
                <option value="pdf">PDF</option>
                <option value="epub">EPUB</option>
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>İçerik URL *</label>
            <input
              type="text"
              value={form.url}
              onChange={e => set('url', e.target.value)}
              placeholder="/books/cirkin-ordek-yavrusu.pdf"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Kapak Görseli URL</label>
            <input
              type="text"
              value={form.kapakUrl}
              onChange={e => set('kapakUrl', e.target.value)}
              placeholder="https://... veya /images/..."
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Durum</label>
              <select value={form.durum} onChange={e => set('durum', e.target.value)} className={inputCls}>
                <option value="Taslak">Taslak</option>
                <option value="Aktif">Aktif</option>
                <option value="Pasif">Pasif</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={form.fixedLayout}
                  onChange={e => set('fixedLayout', e.target.checked)}
                  className="size-4 rounded border-slate-300 text-primary focus:ring-primary/30"
                />
                <span className="text-sm text-slate-700">Fixed Layout (FXL)</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelCls}>Açıklama</label>
            <textarea
              value={form.aciklama}
              onChange={e => set('aciklama', e.target.value)}
              rows={3}
              placeholder="Kısa kitap açıklaması..."
              className={inputCls + ' resize-none'}
            />
          </div>

          {hata && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{hata}</p>
          )}

          <button
            onClick={() => ekle.mutate()}
            disabled={!form.id || !form.baslik || !form.url || ekle.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            {ekle.isPending ? 'Kaydediliyor...' : 'Kitabı Kaydet'}
          </button>
        </div>
      </main>
    </div>
  );
}
