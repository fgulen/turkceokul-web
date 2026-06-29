'use client';

import { use, useState, useEffect, useRef } from 'react';
import { useRouter } from '@/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save, ArrowLeft, ChevronDown, ChevronUp, AlertTriangle, Loader2, Plus, Trash2,
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { toMediaUrl } from '@/lib/utils';
import { type EtkinlikData, type EtkinlikDetay } from '@/types/etkinlik';

const KELIME_KEYS = [
  'kelime1','kelime2','kelime3','kelime4','kelime5',
  'kelime6','kelime7','kelime8','kelime9','kelime10',
] as const;
type KelimeKey = typeof KELIME_KEYS[number];

function MediaPreview({ url }: { url: string }) {
  const resolved = toMediaUrl(url);
  if (!resolved || !url.trim()) return null;
  if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url))
    return <img src={resolved} alt="" className="mt-1.5 rounded-lg max-h-20 max-w-[120px] object-cover border border-slate-200" />;
  if (/\.(mp3|wav|ogg|aac|m4a)$/i.test(url))
    return <audio controls src={resolved} className="mt-1.5 w-full" style={{ height: 32 }} />;
  return null;
}

function UrlField({ label, value, onChange, placeholder = '/Medya/...' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
        placeholder={placeholder}
      />
      <MediaPreview url={value} />
    </div>
  );
}

function Spinner() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
}

let _tempSeq = 0;
function emptyDetay(orderNo: number): EtkinlikDetay {
  return {
    id: `__new_${++_tempSeq}`,
    description: null,
    resimLink: null,
    sesLink: null,
    cevap: null,
    kelime1: null, kelime2: null, kelime3: null, kelime4: null, kelime5: null,
    kelime6: null, kelime7: null, kelime8: null, kelime9: null, kelime10: null,
    orderNo,
  };
}

export default function EtkinlikDuzenlePageWrapper({
  params,
}: {
  params: Promise<{ etkinlikId: string }>;
}) {
  const { etkinlikId } = use(params);
  return <EtkinlikDuzenlePageContent etkinlikId={etkinlikId} />;
}

function EtkinlikDuzenlePageContent({ etkinlikId }: { etkinlikId: string }) {
  const { user, ready } = useAuthGuard('Editor');
  const router = useRouter();
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  const [perdeAlanlar, setPerdeAlanlar] = useState({
    soruYonergesi: '',
    resimLink: '',
    sesLink: '',
    videoLink: '',
  });
  const [detaylar, setDetaylar] = useState<EtkinlikDetay[]>([]);
  const [siliniyor, setSiliniyor] = useState<string | null>(null);
  const [pendingKelime, setPendingKelime] = useState<Record<string, string>>({});
  const [perdeAcik, setPerdeAcik] = useState(true);
  const [hata, setHata] = useState('');

  const { data: etkinlik, isLoading } = useQuery<EtkinlikData>({
    queryKey: ['etkinlik-duzenle', etkinlikId],
    queryFn: () => api.get(`/api/etkinlik/${etkinlikId}`).then((r) => r.data),
    enabled: !!user && ready,
    // Form state'i korumak için otomatik refetch kapatıldı
    refetchOnWindowFocus: false,
    staleTime: Infinity,
  });

  // Sadece ilk yüklemede form state'i doldur (refetch'te sıfırlamasın)
  useEffect(() => {
    if (etkinlik && !initialized.current) {
      initialized.current = true;
      setDetaylar(etkinlik.detaylar);
      setPerdeAlanlar({
        soruYonergesi: etkinlik.soruYonergesi || '',
        resimLink: etkinlik.resimLink || '',
        sesLink: etkinlik.sesLink || '',
        videoLink: etkinlik.videoLink || '',
      });
    }
  }, [etkinlik]);

  const { mutate: kaydet, isPending: kaydEdiliyor } = useMutation({
    mutationFn: async () => {
      const payload = {
        soruYonergesi: perdeAlanlar.soruYonergesi || null,
        resimLink: perdeAlanlar.resimLink || null,
        sesLink: perdeAlanlar.sesLink || null,
        videoLink: perdeAlanlar.videoLink || null,
        etkinlikTuruId: null,
        deletedDetayIds: null,
        detaylar: detaylar.map(d => ({
          id: d.id.startsWith('__new_') ? null : d.id,
          description: d.description,
          resimLink: d.resimLink || null,
          sesLink: d.sesLink || null,
          kelime1: d.kelime1 || null,
          kelime2: d.kelime2 || null,
          kelime3: d.kelime3 || null,
          kelime4: d.kelime4 || null,
          kelime5: d.kelime5 || null,
          kelime6: d.kelime6 || null,
          kelime7: d.kelime7 || null,
          kelime8: d.kelime8 || null,
          kelime9: d.kelime9 || null,
          kelime10: d.kelime10 || null,
          orderNo: d.orderNo,
        })),
      };
      return api.put(`/api/etkinlik/${etkinlikId}/duzenle`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['etkinlik', etkinlikId] });
      queryClient.invalidateQueries({ queryKey: ['etkinlik-duzenle', etkinlikId] });
      router.back();
    },
    onError: (err: Error) => setHata(err.message || 'Kaydedilemedi'),
  });

  function handlePerdeChange(key: keyof typeof perdeAlanlar, value: string) {
    setPerdeAlanlar(prev => ({ ...prev, [key]: value }));
  }

  function handleDetayChange(detayId: string, key: string, value: string | null) {
    setDetaylar(prev => prev.map(d => d.id === detayId ? { ...d, [key]: value } : d));
  }

  function handleDetayEkle() {
    const maxOrder = detaylar.reduce((m, d) => Math.max(m, d.orderNo), 0);
    setDetaylar(prev => [...prev, emptyDetay(maxOrder + 10)]);
  }

  async function handleDetaySil(detayId: string) {
    if (detayId.startsWith('__new_')) {
      setDetaylar(prev => prev.filter(d => d.id !== detayId));
      return;
    }
    if (!window.confirm('Bu detayı silmek istiyor musunuz?')) return;
    setSiliniyor(detayId);
    try {
      await api.delete(`/api/etkinlik/detay/${detayId}`);
      setDetaylar(prev => prev.filter(d => d.id !== detayId));
    } catch {
      setHata('Detay silinemedi.');
    } finally {
      setSiliniyor(null);
    }
  }

  function handleDetayTasi(index: number, yon: 'yukari' | 'asagi') {
    setDetaylar(prev => {
      const arr = [...prev];
      const hedef = yon === 'yukari' ? index - 1 : index + 1;
      if (hedef < 0 || hedef >= arr.length) return prev;
      [arr[index], arr[hedef]] = [arr[hedef], arr[index]];
      // orderNo güncelle — sırayı yansıt
      return arr.map((d, i) => ({ ...d, orderNo: (i + 1) * 10 }));
    });
  }

  function handleKelimeEkle(detayId: string) {
    setPendingKelime(prev => ({ ...prev, [detayId]: '' }));
  }

  function commitPending(detayId: string, value: string) {
    const trimmed = value.trim();
    if (trimmed) {
      setDetaylar(prev => prev.map(d => {
        if (d.id !== detayId) return d;
        for (const key of KELIME_KEYS) {
          if (!d[key]) return { ...d, [key]: trimmed };
        }
        return d;
      }));
    }
    setPendingKelime(prev => { const n = { ...prev }; delete n[detayId]; return n; });
  }

  function handleKelimeSil(detayId: string, kelimeKey: KelimeKey) {
    setDetaylar(prev => prev.map(d =>
      d.id === detayId ? { ...d, [kelimeKey]: null } : d
    ));
  }

  if (!ready) return <Spinner />;
  if (!user) return null;
  if (isLoading) return <Spinner />;
  if (!etkinlik) return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <p className="text-slate-500">Etkinlik bulunamadı.</p>
    </div>
  );

  return (
    <div className="bg-[#F3F4F6] min-h-[100dvh]">
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white transition-colors" title="Geri">
            <ArrowLeft className="size-5 text-slate-600" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 truncate">{etkinlik.name}</h1>
            <p className="text-xs text-slate-500 mt-0.5">{etkinlik.bolum}</p>
          </div>
        </div>

        {/* Bildirimler */}
        {hata && (
          <div className="mb-4 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertTriangle className="size-4 mt-0.5 shrink-0" />{hata}
          </div>
        )}


        {/* Perde Alanları */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <button
            onClick={() => setPerdeAcik(!perdeAcik)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="font-semibold text-slate-900">Perde Alanları</h2>
            {perdeAcik ? <ChevronUp className="size-5 text-slate-400" /> : <ChevronDown className="size-5 text-slate-400" />}
          </button>

          {perdeAcik && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Perde Metni
                  <span className="ml-2 text-xs text-slate-400 font-normal">diyalog, yönerge, ipucu</span>
                </label>
                <textarea
                  value={perdeAlanlar.soruYonergesi}
                  onChange={(e) => handlePerdeChange('soruYonergesi', e.target.value)}
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y font-mono leading-7 tracking-wide"
                  placeholder={"Arzu  :  Günaydın Taner!\nTaner :  Günaydın Arzu!\n\nHizalama için boşluk kullanın."}
                  spellCheck={false}
                  onKeyDown={(e) => {
                    if (e.key === 'Tab') {
                      e.preventDefault();
                      const ta = e.currentTarget;
                      const start = ta.selectionStart;
                      const end = ta.selectionEnd;
                      const val = ta.value;
                      const newVal = val.substring(0, start) + '  ' + val.substring(end);
                      handlePerdeChange('soruYonergesi', newVal);
                      requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
                    }
                  }}
                />
                <p className="text-xs text-slate-400 mt-1">
                  Monospace font — Tab 2 boşluk ekler. Satır sonları korunur.
                </p>
              </div>

              <UrlField label="Resim Linki" value={perdeAlanlar.resimLink} onChange={(v) => handlePerdeChange('resimLink', v)} />
              <UrlField label="Ses Linki" value={perdeAlanlar.sesLink} onChange={(v) => handlePerdeChange('sesLink', v)} />
              <UrlField label="Video Linki" value={perdeAlanlar.videoLink} onChange={(v) => handlePerdeChange('videoLink', v)} />
            </div>
          )}
        </div>

        {/* Detaylar */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">
            Detaylar
            <span className="ml-2 text-xs font-normal text-slate-400">{detaylar.length} satır</span>
          </h2>

          <div className="space-y-4">
            {detaylar.map((detay, detayIndex) => {
              const kelimeler = KELIME_KEYS
                .map((key) => ({ key, val: detay[key] }))
                .filter((k): k is { key: KelimeKey; val: string } => !!k.val);

              const isNew = detay.id.startsWith('__new_');
              const isSiliniyor = siliniyor === detay.id;

              return (
                <div
                  key={detay.id}
                  className={`border rounded-xl p-4 ${isNew ? 'border-primary/30 bg-primary/5' : 'border-slate-100 bg-slate-50'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
                        {detayIndex + 1}
                      </span>
                      {isNew && (
                        <span className="text-xs text-primary font-medium">Yeni</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDetayTasi(detayIndex, 'yukari')}
                        disabled={detayIndex === 0}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 transition-colors"
                        title="Yukarı taşı"
                      >
                        <ChevronUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDetayTasi(detayIndex, 'asagi')}
                        disabled={detayIndex === detaylar.length - 1}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-20 transition-colors"
                        title="Aşağı taşı"
                      >
                        <ChevronDown className="size-4" />
                      </button>
                      <button
                        type="button"
                        disabled={isSiliniyor}
                        onClick={() => handleDetaySil(detay.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-40 transition-colors"
                        title="Detayı sil"
                      >
                        {isSiliniyor
                          ? <Loader2 className="size-4 animate-spin" />
                          : <Trash2 className="size-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Açıklama */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Açıklama
                        <span className="ml-1.5 text-xs text-slate-400 font-normal">Tab → 2 boşluk</span>
                      </label>
                      <textarea
                        value={detay.description || ''}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono leading-7 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
                        placeholder={"Arzu   : Merhaba!\nTaner  : Merhaba!"}
                        spellCheck={false}
                        onChange={(e) => handleDetayChange(detay.id, 'description', e.target.value || null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Tab') {
                            e.preventDefault();
                            const ta = e.currentTarget;
                            const start = ta.selectionStart;
                            const end = ta.selectionEnd;
                            const val = ta.value;
                            const newVal = val.substring(0, start) + '  ' + val.substring(end);
                            handleDetayChange(detay.id, 'description', newVal || null);
                            requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = start + 2; });
                          }
                        }}
                      />
                    </div>

                    {/* Resim + Ses */}
                    <div className="grid grid-cols-2 gap-3">
                      <UrlField
                        label="Resim"
                        value={detay.resimLink || ''}
                        onChange={(v) => handleDetayChange(detay.id, 'resimLink', v || null)}
                      />
                      <UrlField
                        label="Ses"
                        value={detay.sesLink || ''}
                        onChange={(v) => handleDetayChange(detay.id, 'sesLink', v || null)}
                      />
                    </div>

                    {/* Kelimeler — sadece varsa göster */}
                    {kelimeler.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Kelimeler ({kelimeler.length}/10)
                        </label>
                        <div className="space-y-1.5">
                          {kelimeler.map(({ key, val }) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 w-6 shrink-0">{key.replace('kelime', 'K')}</span>
                              <input
                                type="text"
                                value={val}
                                onChange={(e) => handleDetayChange(detay.id, key, e.target.value || null)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                              />
                              <button
                                onClick={() => handleKelimeSil(detay.id, key)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-50 transition-colors"
                                title="Sil"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </div>
                          ))}

                          {/* Pending input */}
                          {pendingKelime[detay.id] !== undefined && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 w-6 shrink-0">K{kelimeler.length + 1}</span>
                              <input
                                autoFocus
                                type="text"
                                value={pendingKelime[detay.id]}
                                onChange={(e) => setPendingKelime(prev => ({ ...prev, [detay.id]: e.target.value }))}
                                onBlur={(e) => commitPending(detay.id, e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') { e.preventDefault(); commitPending(detay.id, pendingKelime[detay.id]); }
                                  if (e.key === 'Escape') setPendingKelime(prev => { const n = { ...prev }; delete n[detay.id]; return n; });
                                }}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-primary/50 ring-1 ring-primary/20 text-sm focus:outline-none"
                                placeholder="Kelime → Enter"
                              />
                            </div>
                          )}
                        </div>

                        {kelimeler.length < 10 && pendingKelime[detay.id] === undefined && (
                          <button
                            type="button"
                            onClick={() => handleKelimeEkle(detay.id)}
                            className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors"
                          >
                            <Plus className="size-3" /> Kelime Ekle
                          </button>
                        )}
                      </div>
                    )}

                    {/* Kelime bölümü hiç yoksa da + butonu göster */}
                    {kelimeler.length === 0 && pendingKelime[detay.id] === undefined && (
                      <button
                        type="button"
                        onClick={() => handleKelimeEkle(detay.id)}
                        className="flex items-center gap-1 text-xs text-slate-400 hover:text-primary transition-colors"
                      >
                        <Plus className="size-3" /> Kelime Ekle
                      </button>
                    )}
                    {kelimeler.length === 0 && pendingKelime[detay.id] !== undefined && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Kelimeler</label>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400 w-6 shrink-0">K1</span>
                          <input
                            autoFocus
                            type="text"
                            value={pendingKelime[detay.id]}
                            onChange={(e) => setPendingKelime(prev => ({ ...prev, [detay.id]: e.target.value }))}
                            onBlur={(e) => commitPending(detay.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); commitPending(detay.id, pendingKelime[detay.id]); }
                              if (e.key === 'Escape') setPendingKelime(prev => { const n = { ...prev }; delete n[detay.id]; return n; });
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg border border-primary/50 ring-1 ring-primary/20 text-sm focus:outline-none"
                            placeholder="Kelime → Enter"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detay Ekle */}
          <button
            onClick={handleDetayEkle}
            className="mt-4 flex items-center gap-2 w-full justify-center py-3 rounded-xl border-2 border-dashed border-slate-200 text-sm text-slate-500 hover:border-primary/40 hover:text-primary transition-colors"
          >
            <Plus className="size-4" />
            Detay Ekle
          </button>
        </div>

        {/* Butonlar — sticky */}
        <div className="fixed bottom-6 right-6 z-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-5 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-lg"
          >
            Çık
          </button>
          <button
            type="button"
            onClick={() => kaydet()}
            disabled={kaydEdiliyor}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors shadow-xl"
          >
            {kaydEdiliyor
              ? <><Loader2 className="size-4 animate-spin" />Kaydediliyor...</>
              : <><Save className="size-4" />Kaydet</>
            }
          </button>
        </div>

      </main>
    </div>
  );
}
