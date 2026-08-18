'use client';

// Okuma kitabı hızlı düzenleme (4 Şablon Kuralı: SlideOver) — Ders Kitapları'ndaki
// düzenleme deseniyle aynı: listeden ayrılmadan sağdan panel.
// Eski /editor/kutuphane/[id]/duzenle sayfasının formu buraya taşındı;
// o route artık ?duzenle= parametresiyle listeye yönlendirir (derin link korunur).

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { api } from '@/lib/api';
import { SlideOver } from '@/components/slide-over';
import { KapakSecici } from '@/components/media/kapak-secici';

interface KitapForm {
  baslik: string;
  yazar: string;
  seviye: string;
  tur: 'epub' | 'pdf';
  url: string;
  kapakUrl: string;
  fixedLayout: boolean;
  durum: string;
  aciklama: string;
  yayinevi: string;
  sayfaSayisi: string;
  kelimeSayisi: string;
  dilbilgisiOdagi: string;
  etiketler: string[];
  dersKitabiId: string;
}

const EMPTY: KitapForm = {
  baslik: '', yazar: '', seviye: 'A1', tur: 'pdf', url: '',
  kapakUrl: '', fixedLayout: false, durum: 'Taslak', aciklama: '',
  yayinevi: '', sayfaSayisi: '', kelimeSayisi: '', dilbilgisiOdagi: '', etiketler: [], dersKitabiId: '',
};

function parseEtiketler(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

const inputCls = 'w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30';
const labelCls = 'block text-xs font-semibold text-slate-500 mb-1';

interface Props {
  kitapId: string | null;
  onClose: () => void;
}

export function KitapDuzenleSlideOver({ kitapId, onClose }: Props) {
  const qc = useQueryClient();
  const [form, setForm] = useState<KitapForm>(EMPTY);
  const [etiketInput, setEtiketInput] = useState('');
  const [yukluyor, setYukluyor] = useState(true);
  const [hata, setHata] = useState('');

  function set<K extends keyof KitapForm>(key: K, val: KitapForm[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function etiketEkle() {
    const tag = etiketInput.trim().replace(/^#/, '');
    if (!tag || form.etiketler.includes(tag)) { setEtiketInput(''); return; }
    set('etiketler', [...form.etiketler, tag]);
    setEtiketInput('');
  }

  function etiketSil(tag: string) {
    set('etiketler', form.etiketler.filter(t => t !== tag));
  }

  useEffect(() => {
    if (!kitapId) return;
    setYukluyor(true);
    setHata('');
    setForm(EMPTY);
    api.get(`/api/kutuphane/kitaplar/${kitapId}`).then(r => {
      const k = r.data;
      setForm({
        baslik:          k.baslik ?? '',
        yazar:           k.yazar ?? '',
        seviye:          k.seviye ?? 'A1',
        tur:             k.tur ?? 'pdf',
        url:             k.url ?? '',
        kapakUrl:        k.kapakUrl ?? '',
        fixedLayout:     !!k.fixedLayout,
        durum:           k.durum ?? 'Taslak',
        aciklama:        k.aciklama ?? '',
        yayinevi:        k.yayinevi ?? '',
        sayfaSayisi:     k.sayfaSayisi?.toString() ?? '',
        kelimeSayisi:    k.kelimeSayisi?.toString() ?? '',
        dilbilgisiOdagi: k.dilbilgisiOdagi ?? '',
        etiketler:       parseEtiketler(k.etiketler),
        dersKitabiId:    k.dersKitabiId ?? '',
      });
      setYukluyor(false);
    }).catch(() => {
      setHata('Kitap bulunamadı.');
      setYukluyor(false);
    });
  }, [kitapId]);

  const { data: okumaKitaplari } = useQuery<{ id: string; name: string; seviye: string }[]>({
    queryKey: ['okuma-kitaplar'],
    queryFn: () => api.get('/api/okuma/kitaplar').then(r => r.data),
    enabled: !!kitapId,
  });

  const guncelle = useMutation({
    mutationFn: () => api.put(`/api/kutuphane/kitaplar/${kitapId}`, {
      id: kitapId,
      baslik:          form.baslik,
      yazar:           form.yazar || null,
      seviye:          form.seviye,
      tur:             form.tur,
      url:             form.url,
      kapakUrl:        form.kapakUrl || null,
      fixedLayout:     form.fixedLayout,
      durum:           form.durum,
      aciklama:        form.aciklama || null,
      yayinevi:        form.yayinevi || null,
      sayfaSayisi:     form.sayfaSayisi ? parseInt(form.sayfaSayisi) : null,
      kelimeSayisi:    form.kelimeSayisi ? parseInt(form.kelimeSayisi) : null,
      yayinYili:       null,
      isbn:            null,
      dilbilgisiOdagi: form.dilbilgisiOdagi || null,
      etiketler:       form.etiketler.length ? JSON.stringify(form.etiketler) : null,
      dersKitabiId:    form.dersKitabiId || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['editor-kutuphane-kitaplar'] });
      onClose();
    },
    onError: (e: Error) => setHata('Hata: ' + e.message),
  });

  return (
    <SlideOver
      open={!!kitapId}
      onClose={onClose}
      title="Kitabı Düzenle"
      subtitle={kitapId ?? ''}
      width="md"
      noDim
      footer={
        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            İptal
          </button>
          <button
            onClick={() => guncelle.mutate()}
            disabled={guncelle.isPending || yukluyor || !form.baslik || !form.url}
            className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
            {guncelle.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
        </div>
      }
    >
      {yukluyor ? (
        <div className="py-16 flex items-center justify-center">
          <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {hata && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3">{hata}</p>
          )}

          <div>
            <label className={labelCls}>Başlık *</label>
            <input type="text" value={form.baslik} onChange={e => set('baslik', e.target.value)} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Yazar</label>
            <input type="text" value={form.yazar} onChange={e => set('yazar', e.target.value)} className={inputCls} />
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
            <input type="text" value={form.url} onChange={e => set('url', e.target.value)} className={inputCls} />
          </div>

          <KapakSecici value={form.kapakUrl} onChange={v => set('kapakUrl', v)} />

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
                <input type="checkbox" checked={form.fixedLayout} onChange={e => set('fixedLayout', e.target.checked)} className="size-4 rounded border-slate-300 text-primary focus:ring-primary/30" />
                <span className="text-sm text-slate-700">Fixed Layout (FXL)</span>
              </label>
            </div>
          </div>

          <div>
            <label className={labelCls}>Açıklama</label>
            <textarea value={form.aciklama} onChange={e => set('aciklama', e.target.value)} rows={3} className={inputCls + ' resize-none'} />
          </div>

          <div>
            <label className={labelCls}>Etkinlik Kitabıyla Eşleştir</label>
            <select
              value={form.dersKitabiId}
              onChange={e => set('dersKitabiId', e.target.value)}
              className={inputCls}
            >
              <option value="">— Eşleştirme yok —</option>
              {(okumaKitaplari ?? []).map(k => (
                <option key={k.id} value={k.id}>{k.seviye} — {k.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Eşleşen kitabın detay sayfasında &quot;Kitabı Oku (PDF)&quot; butonu görünür.
            </p>
            {!form.dersKitabiId && form.baslik && (() => {
              const oneri = (okumaKitaplari ?? []).find(
                k => k.name.trim().toLocaleLowerCase('tr') === form.baslik.trim().toLocaleLowerCase('tr'),
              );
              return oneri ? (
                <button
                  type="button"
                  onClick={() => set('dersKitabiId', oneri.id)}
                  className="mt-2 text-xs font-medium text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg hover:bg-primary/20 transition-colors"
                >
                  Öneri: &quot;{oneri.name}&quot; ile eşleştir
                </button>
              ) : null;
            })()}
          </div>

          {/* Metadata */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Kitap Bilgileri</p>

            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className={labelCls}>Yayınevi</label>
                  <input type="text" value={form.yayinevi} onChange={e => set('yayinevi', e.target.value)} placeholder="Nevaî Yayınları" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Sayfa Sayısı</label>
                  <input type="number" value={form.sayfaSayisi} onChange={e => set('sayfaSayisi', e.target.value)} placeholder="23" className={inputCls} />
                </div>
              </div>

              <div>
                <label className={labelCls}>Kelime Sayısı (~)</label>
                <input type="number" value={form.kelimeSayisi} onChange={e => set('kelimeSayisi', e.target.value)} placeholder="500" className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Dil Bilgisi Odak Noktaları</label>
                <textarea
                  value={form.dilbilgisiOdagi}
                  onChange={e => set('dilbilgisiOdagi', e.target.value)}
                  rows={2}
                  placeholder="Şimdiki zaman, temel sıfat tamlamaları..."
                  className={inputCls + ' resize-none'}
                />
                <p className="text-[11px] text-slate-400 mt-1">AI quiz üretiminde kullanılır.</p>
              </div>

              <div>
                <label className={labelCls}>Etiketler</label>
                {form.etiketler.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {form.etiketler.map(tag => (
                      <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        #{tag}
                        <button type="button" onClick={() => etiketSil(tag)} className="hover:text-primary/70">
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={etiketInput}
                    onChange={e => setEtiketInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); etiketEkle(); } }}
                    placeholder="hayvanlar, mevsimler... (Enter ile ekle)"
                    className={inputCls}
                  />
                  <button type="button" onClick={etiketEkle} className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors shrink-0">
                    Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </SlideOver>
  );
}
