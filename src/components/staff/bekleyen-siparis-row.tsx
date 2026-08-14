'use client';

// SuperAdmin dashboard'unda doğan, Admin Paneli'nde (Koordinator) de aynen kullanılan
// bekleyen sipariş satırı: onay öncesi bağlam bilgileri + kapasite/tutar düzenleme +
// Onayla/İptal. Koordinator'a bu tam yetki kullanıcının kararıyla açıldı (2026-07-27) —
// önceki "fiyatlandırma Koordinator'a verilmez" ilkesinden bu noktada bilinçli sapıldı.

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { apiHataMesaji, waLink } from '@/lib/utils';

export interface Siparis {
  id: number;
  kurumId: number | null;
  kurumAdi: string;
  dersKitabiId: number;
  urunAdi: string | null;
  ogrenciKapasite: number | null;
  toplamTutar: number | null;
  tarih: string;
  yetkiliAdi: string | null;
  yetkiliEmail: string | null;
  ulkeAdi: string;
  telefon: string | null;
  egitimYili: string;
  sinifSayisi: number;
  aktifOgrenci: number;
  mevcutLisansTipi: string;
}

export function euro(cent: number | null | undefined) {
  if (cent == null) return '—';
  return `€${(cent / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function BekleyenSiparisRow({ siparis: s, siparisEndpoint, bekleyenQueryKey, extraInvalidateKeys }: {
  siparis: Siparis;
  /** Onayla/İptal/Düzenle çağıracağı API tabanı — SuperAdmin: /api/super-admin, Admin (Koordinator): /api/admin */
  siparisEndpoint: string;
  bekleyenQueryKey: unknown[];
  extraInvalidateKeys?: unknown[][];
}) {
  const qc = useQueryClient();
  const [hata, setHata] = useState<string | null>(null);
  const [duzenle, setDuzenle] = useState(false);
  const [kapasite, setKapasite] = useState('');
  const [kapasiteBaslangic, setKapasiteBaslangic] = useState('');
  const [tutar, setTutar] = useState('');
  const [kapasiteDebounced, setKapasiteDebounced] = useState('');

  const lead = s.kurumId == null; // lead: henüz kuruma dönüştürülmemiş talep

  // Kapasite değişince 400ms sonra tutarı otomatik hesapla (hacim indirimi/kampanya dahil).
  useEffect(() => {
    const t = setTimeout(() => setKapasiteDebounced(kapasite), 400);
    return () => clearTimeout(t);
  }, [kapasite]);

  const kapasiteSayi = Number(kapasiteDebounced);
  const { data: fiyatOnerisi, isFetching: fiyatHesaplaniyor } = useQuery({
    queryKey: ['fiyat-hesapla', s.dersKitabiId, kapasiteSayi],
    queryFn: () => api.get('/api/katalog/fiyat-hesapla', {
      params: { kitapIdler: s.dersKitabiId, ogrenciSayisi: kapasiteSayi },
    }).then(r => r.data),
    enabled: duzenle && !!s.dersKitabiId && kapasiteSayi > 0 && kapasiteDebounced !== kapasiteBaslangic,
  });

  useEffect(() => {
    if (fiyatOnerisi) setTutar(String(fiyatOnerisi.toplamEurCent / 100));
  }, [fiyatOnerisi]);

  function invalidate() {
    qc.invalidateQueries({ queryKey: bekleyenQueryKey });
    extraInvalidateKeys?.forEach(k => qc.invalidateQueries({ queryKey: k }));
  }

  const onaylaMutation = useMutation({
    mutationFn: () => api.put(`${siparisEndpoint}/siparis/${s.id}/onayla`),
    onMutate: () => setHata(null),
    onSuccess: invalidate,
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
  });
  const iptalMutation = useMutation({
    mutationFn: () => api.put(`${siparisEndpoint}/siparis/${s.id}/iptal`),
    onMutate: () => setHata(null),
    onSuccess: invalidate,
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
  });
  const kaydetMutation = useMutation({
    mutationFn: () => api.put(`${siparisEndpoint}/siparis/${s.id}`, {
      ogrenciKapasite: Number(kapasite),
      toplamTutar: Math.round(Number(tutar) * 100), // input EUR gösterir, backend cent bekler
    }),
    onMutate: () => setHata(null),
    onSuccess: () => { setDuzenle(false); invalidate(); },
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
  });

  function toggleDuzenle() {
    if (!duzenle) {
      const baslangic = String(s.ogrenciKapasite ?? '');
      setKapasite(baslangic);
      setKapasiteBaslangic(baslangic);
      setKapasiteDebounced(baslangic);
      setTutar(String((s.toplamTutar ?? 0) / 100));
    }
    setDuzenle(v => !v);
  }

  const alan = (etiket: string, deger: React.ReactNode, aciklama?: string) => (
    <div className="min-w-0">
      <dt
        className={`text-[10px] uppercase tracking-wide text-slate-400 ${aciklama ? 'cursor-help w-fit border-b border-dotted border-slate-300' : ''}`}
        title={aciklama}>
        {etiket}
      </dt>
      <dd className="text-xs text-slate-700 truncate">{deger ?? '—'}</dd>
    </div>
  );

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-slate-50 border-b border-slate-100">
        <div className="min-w-0">
          <p className="font-semibold text-slate-800 truncate">{s.kurumAdi}</p>
          <p className="text-xs text-slate-500 truncate">
            {s.urunAdi ?? s.dersKitabiId ?? '—'} ·{' '}
            <span
              className="cursor-help border-b border-dotted border-slate-300"
              title="Satın alınan / onaylanan lisans üst limiti — sisteme şu an eklenmiş öğrenci sayısı değil">
              {s.ogrenciKapasite} lisans
            </span>{' '}
            · {euro(s.toplamTutar)}
          </p>
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap shrink-0">{new Date(s.tarih).toLocaleDateString('tr-TR')}</span>
      </div>

      <dl className="px-4 py-2.5 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
        {alan('Yetkili', <>{s.yetkiliAdi ?? '—'}{s.yetkiliEmail ? <span className="text-slate-400"> · {s.yetkiliEmail}</span> : ''}</>)}
        {alan('Ülke', s.ulkeAdi)}
        {alan('WhatsApp', s.telefon
          ? <a href={waLink(s.telefon, s.kurumAdi ?? '')} target="_blank" rel="noreferrer" className="text-green-700 hover:underline">{s.telefon}</a>
          : '—')}
        {alan('Eğitim yılı', s.egitimYili)}
        {alan('Sınıf', s.sinifSayisi, 'Bu kurumda bu kitaba atanmış sınıf adedi')}
        {alan('Aktif öğrenci', s.aktifOgrenci, 'O sınıflardaki, sisteme şu an aktif olarak eklenmiş öğrenci sayısı')}
        {alan('Mevcut lisans', s.mevcutLisansTipi, 'Onay öncesi kurumun bu kitap için halihazırda sahip olduğu lisans tipi (Deneme / Ücretli)')}
      </dl>

      {duzenle && (
        <div className="mx-4 mb-2.5 flex flex-wrap items-end gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Öğrenci Kapasitesi</label>
            <input type="number" min={1} value={kapasite} onChange={e => setKapasite(e.target.value)}
              className="w-28 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Tutar (EUR)</label>
            <input type="number" min={0} step="0.01" value={tutar} onChange={e => setTutar(e.target.value)}
              className="w-32 border border-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
          </div>
          <button
            onClick={() => kaydetMutation.mutate()}
            disabled={kaydetMutation.isPending || kapasite === '' || tutar === ''}
            className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
            {kaydetMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          {fiyatHesaplaniyor && <span className="text-[11px] text-slate-400">Tutar hesaplanıyor…</span>}
          {!fiyatHesaplaniyor && fiyatOnerisi && (
            <span className="text-[11px] text-slate-500">
              Otomatik: {fiyatOnerisi.toplamGosterim} ({fiyatOnerisi.ogrenciSayisi} öğrenci × €{(fiyatOnerisi.birimFiyatEurCent / 100).toFixed(2)}
              {fiyatOnerisi.hacimIndirimiOrani ? `, hacim indirimi %${fiyatOnerisi.hacimIndirimiOrani}` : ''}
              {fiyatOnerisi.kampanyaIndirimOrani ? `, kampanya %${fiyatOnerisi.kampanyaIndirimOrani}` : ''}) — üzerine elle yazılabilir
            </span>
          )}
        </div>
      )}

      {hata && (
        <p role="alert" className="px-4 pb-2 text-xs text-red-600">{hata}</p>
      )}

      <div className="px-4 py-2 flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-white">
        {lead && (
          <span className="text-xs text-slate-400 italic mr-auto" title="Lead siparişler onaylanamaz">
            Önce kuruma dönüştürülmeli (ülke temsilcisi paneli)
          </span>
        )}
        <button onClick={toggleDuzenle}
          className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${duzenle ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
          {duzenle ? 'Kapat' : 'Düzenle'}
        </button>
        <button onClick={() => iptalMutation.mutate()} disabled={iptalMutation.isPending}
          className="px-2.5 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50">
          İptal
        </button>
        {!lead && (
          <button onClick={() => onaylaMutation.mutate()} disabled={onaylaMutation.isPending}
            className="px-2.5 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">
            {onaylaMutation.isPending ? 'Onaylanıyor…' : 'Onayla'}
          </button>
        )}
      </div>
    </div>
  );
}
