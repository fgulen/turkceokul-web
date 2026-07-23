'use client';

// Kurumsal Satış — Siparişler (4 Şablon Kuralı: Liste=DataTable + SlideOver detay).
// Sipariş çok bölümlü bir entity olmadığı için detay route yerine SlideOver kullanılır.
// API tüm listeyi döner; durum filtresi/arama/sıralama/sayfalama client-side.

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { SlideOver } from '@/components/slide-over';
import { AramaInput, SortTh, Sayfalama, trSirala, csvIndir, useSiralama } from '@/components/staff/table-kit';
import { apiHataMesaji } from '../shared';

interface Siparis {
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
  durum: 'Beklemede' | 'Onaylandi' | 'Iptal' | 'Donusturuldu';
  kurumYoneticisiEmail: string | null;
  kurumYoneticisiAdi: string | null;
  ulkeTemsilcisiAdi: string | null;
  ulkeTemsilcisiEmail: string | null;
}

const SAYFA_BOYUTU = 20;

type Durum = 'Tumu' | 'Beklemede' | 'Onaylandi' | 'Iptal' | 'Donusturuldu';
type SortKey = 'kurumAdi' | 'ulkeAdi' | 'yetkiliAdi' | 'ogrenciKapasite' | 'toplamTutar' | 'tarih' | 'durum';

const DURUM_ETIKET: Record<string, string> = {
  Beklemede: 'Beklemede',
  Onaylandi: 'Onaylandı',
  Iptal: 'İptal',
  Donusturuldu: 'Dönüştürüldü',
};

const DURUM_RENK: Record<string, string> = {
  Beklemede: 'bg-amber-100 text-amber-700',
  Onaylandi: 'bg-green-100 text-green-700',
  Iptal: 'bg-red-100 text-red-600',
  Donusturuldu: 'bg-blue-100 text-blue-700',
};

function euro(cent: number | null | undefined) {
  if (cent == null) return '—';
  return `€${(cent / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function KurumsalSatisPage() {

  const [durum, setDurum] = useState<Durum>('Tumu');
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const { sortKey, sortDir, toggleSort } = useSiralama<SortKey>('tarih', () => setSayfa(1), 'desc');
  const [seciliSiparis, setSeciliSiparis] = useState<Siparis | null>(null);

  const { data: siparisler = [], isLoading } = useQuery({
    queryKey: ['sa-siparisler'],
    queryFn: () => api.get('/api/super-admin/siparisler').then(r => r.data),
  });

  const durumSayilari = useMemo(() => {
    const s: Record<string, number> = { Tumu: siparisler.length };
    for (const sp of siparisler as Siparis[]) s[sp.durum] = (s[sp.durum] ?? 0) + 1;
    return s;
  }, [siparisler]);

  const gorunen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr');
    let liste = (siparisler as Siparis[]).filter(s => durum === 'Tumu' || s.durum === durum);
    if (q) {
      liste = liste.filter(s =>
        [s.kurumAdi, s.ulkeAdi, s.yetkiliAdi, s.yetkiliEmail]
          .some(v => (v ?? '').toLocaleLowerCase('tr').includes(q)));
    }
    return trSirala(liste, sortKey, sortDir);
  }, [siparisler, durum, arama, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(gorunen.length / SAYFA_BOYUTU));
  const guvenliSayfa = Math.min(sayfa, totalPages);
  const sayfadakiler = gorunen.slice((guvenliSayfa - 1) * SAYFA_BOYUTU, guvenliSayfa * SAYFA_BOYUTU);

  function exportCsv() {
    csvIndir('siparisler.csv',
      ['Kurum', 'Ülke', 'Yetkili', 'E-posta', 'Kapasite', 'Tutar (EUR)', 'Eğitim Yılı', 'Tarih', 'Durum'],
      gorunen.map(s => [
        s.kurumAdi ?? '', s.ulkeAdi ?? '', s.yetkiliAdi ?? '', s.yetkiliEmail ?? '',
        s.ogrenciKapasite ?? 0, (s.toplamTutar ?? 0) / 100, s.egitimYili ?? '',
        new Date(s.tarih).toLocaleDateString('tr-TR'), DURUM_ETIKET[s.durum] ?? s.durum,
      ]));
  }

  return (
    <>
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Package className="size-4 text-purple-600" />
          <h2 className="text-sm font-semibold text-slate-800">Siparişler</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">
            {gorunen.length}
          </span>
        </div>

        <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Kurum, yetkili, ülke ara..." />

        <button
          onClick={exportCsv}
          disabled={gorunen.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors ml-auto">
          <Download className="size-3.5" />
          Excel&apos;e Aktar
        </button>
      </div>

      {/* Durum filtreleri */}
      <div className="px-4 py-2 border-b border-slate-100 flex flex-wrap gap-1.5">
        {(['Tumu', 'Beklemede', 'Onaylandi', 'Iptal', 'Donusturuldu'] as Durum[]).map(d => (
          <button key={d}
            onClick={() => { setDurum(d); setSayfa(1); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              durum === d ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'
            }`}>
            {d === 'Tumu' ? 'Tümü' : DURUM_ETIKET[d]}
            <span className="tabular-nums text-[11px] opacity-70">{durumSayilari[d] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Tablo */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortTh colKey="kurumAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kurum</SortTh>
              <SortTh colKey="ulkeAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Ülke</SortTh>
              <SortTh colKey="yetkiliAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Yetkili</SortTh>
              <SortTh colKey="ogrenciKapasite" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center">Kapasite</SortTh>
              <SortTh colKey="toplamTutar" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Tutar</SortTh>
              <SortTh colKey="tarih" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Tarih</SortTh>
              <SortTh colKey="durum" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center">Durum</SortTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sayfadakiler.map((s: Siparis) => (
              <tr
                key={s.id}
                onClick={() => setSeciliSiparis(s)}
                className="cursor-pointer odd:bg-white even:bg-slate-50/40 hover:bg-purple-50/50 transition-colors">
                <td className="px-4 py-2.5">
                  <span className="font-medium text-slate-800">{s.kurumAdi ?? '—'}</span>
                  {s.kurumId == null && (
                    <span className="ml-2 px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-medium align-middle">LEAD</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{s.ulkeAdi ?? '—'}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{s.yetkiliAdi ?? '—'}</td>
                <td className="px-4 py-2.5 text-center tabular-nums text-slate-700">{s.ogrenciKapasite}</td>
                <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{euro(s.toplamTutar)}</td>
                <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{new Date(s.tarih).toLocaleDateString('tr-TR')}</td>
                <td className="px-4 py-2.5 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${DURUM_RENK[s.durum] ?? 'bg-slate-100 text-slate-600'}`}>
                    {DURUM_ETIKET[s.durum] ?? s.durum}
                  </span>
                </td>
              </tr>
            ))}
            {!isLoading && sayfadakiler.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-xs text-slate-400">
                  {arama || durum !== 'Tumu' ? 'Filtreye uyan sipariş yok' : 'Henüz sipariş yok'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>

    <Sayfalama sayfa={guvenliSayfa} totalPages={totalPages} toplam={gorunen.length} sayfaBoyutu={SAYFA_BOYUTU} onSayfa={setSayfa} />

    <SiparisDetaySlideOver siparis={seciliSiparis} onClose={() => setSeciliSiparis(null)} />
    </>
  );
}

// ─── Sipariş Detayı + Hızlı İşlemler (SlideOver şablonu) ─────────────────────

function SiparisDetaySlideOver({ siparis: s, onClose }: { siparis: Siparis | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [hata, setHata] = useState<string | null>(null);
  const [kapasite, setKapasite] = useState('');
  const [kapasiteBaslangic, setKapasiteBaslangic] = useState('');
  const [tutar, setTutar] = useState('');
  const [duzenleAcik, setDuzenleAcik] = useState(false);
  const [kapasiteDebounced, setKapasiteDebounced] = useState('');

  const lead = s?.kurumId == null;
  const beklemede = s?.durum === 'Beklemede';

  // Kapasite değişince 400ms sonra tutarı otomatik hesapla (hacim indirimi/kampanya dahil).
  useEffect(() => {
    const t = setTimeout(() => setKapasiteDebounced(kapasite), 400);
    return () => clearTimeout(t);
  }, [kapasite]);

  const kapasiteSayi = Number(kapasiteDebounced);
  // Sadece kapasite AÇILIŞTAKİ değerden farklıysa hesapla — formu sadece görüntülemek/
  // tutarı elle değiştirmek isteyen admin'in mevcut tutarı sessizce ezilmesin.
  const { data: fiyatOnerisi, isFetching: fiyatHesaplaniyor } = useQuery({
    queryKey: ['fiyat-hesapla', s?.dersKitabiId, kapasiteSayi],
    queryFn: () => api.get('/api/katalog/fiyat-hesapla', {
      params: { kitapIdler: s!.dersKitabiId, ogrenciSayisi: kapasiteSayi },
    }).then(r => r.data),
    enabled: duzenleAcik && !!s?.dersKitabiId && kapasiteSayi > 0 && kapasiteDebounced !== kapasiteBaslangic,
  });

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['sa-siparisler'] });
    qc.invalidateQueries({ queryKey: ['sa-siparisler-bekleyen'] });
    qc.invalidateQueries({ queryKey: ['sa-istatistikler'] });
  }

  const onaylaMutation = useMutation({
    mutationFn: () => api.put(`/api/super-admin/siparis/${s!.id}/onayla`),
    onMutate: () => setHata(null),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
  });
  const iptalMutation = useMutation({
    mutationFn: () => api.put(`/api/super-admin/siparis/${s!.id}/iptal`),
    onMutate: () => setHata(null),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
  });
  const kaydetMutation = useMutation({
    mutationFn: () => api.put(`/api/super-admin/siparis/${s!.id}`, {
      ogrenciKapasite: Number(kapasite),
      toplamTutar: Math.round(Number(tutar) * 100), // input EUR gösterir, backend cent bekler
    }),
    onMutate: () => setHata(null),
    onSuccess: () => { setDuzenleAcik(false); invalidate(); onClose(); },
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
  });

  // Öneri gelince tutarı otomatik doldur (EUR, cent değil) — admin sonrasında elle üzerine yazabilir.
  useEffect(() => {
    if (fiyatOnerisi) setTutar(String(fiyatOnerisi.toplamEurCent / 100));
  }, [fiyatOnerisi]);

  function acDuzenle() {
    if (!s) return;
    const baslangic = String(s.ogrenciKapasite ?? '');
    setKapasite(baslangic);
    setKapasiteBaslangic(baslangic);
    setKapasiteDebounced(baslangic);
    setTutar(String((s.toplamTutar ?? 0) / 100));
    setDuzenleAcik(v => !v);
  }

  function kapat() {
    setDuzenleAcik(false);
    setHata(null);
    onClose();
  }

  const bilgi = (label: string, val: React.ReactNode, aciklama?: string) => (
    <div className="flex justify-between gap-3 py-1.5 border-b border-slate-50 text-sm">
      <span
        className={`text-slate-500 shrink-0 ${aciklama ? 'cursor-help border-b border-dotted border-slate-300' : ''}`}
        title={aciklama}>
        {label}
      </span>
      <span className="text-slate-800 text-right min-w-0">{val ?? '—'}</span>
    </div>
  );

  return (
    <SlideOver
      open={!!s}
      onClose={kapat}
      title={s?.kurumAdi ?? 'Sipariş'}
      subtitle={`Sipariş #${s?.id ?? ''}`}
      width="md"
      footer={beklemede ? (
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={acDuzenle}
            className={`px-3 py-2 text-sm rounded-lg border transition-colors ${duzenleAcik ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {duzenleAcik ? 'Düzenlemeyi Kapat' : 'Düzenle'}
          </button>
          <button onClick={() => iptalMutation.mutate()} disabled={iptalMutation.isPending}
            className="px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors">
            İptal Et
          </button>
          {!lead && (
            <button onClick={() => onaylaMutation.mutate()} disabled={onaylaMutation.isPending}
              className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
              {onaylaMutation.isPending ? 'Onaylanıyor…' : 'Onayla'}
            </button>
          )}
        </div>
      ) : undefined}
    >
      {s && (
        <div className="space-y-4">
          {lead && beklemede && (
            <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              Lead sipariş — onaylanmadan önce kuruma dönüştürülmeli (ülke temsilcisi paneli).
            </p>
          )}

          <div>
            {bilgi('Durum', <span className={`px-2 py-0.5 rounded-full text-xs ${DURUM_RENK[s.durum] ?? ''}`}>{DURUM_ETIKET[s.durum] ?? s.durum}</span>)}
            {bilgi('Kitap', s.urunAdi ?? s.dersKitabiId)}
            {bilgi('Kapasite', `${s.ogrenciKapasite} lisans`, 'Satın alınan / onaylanan lisans üst limiti — sisteme şu an eklenmiş öğrenci sayısı değil')}
            {bilgi('Tutar', euro(s.toplamTutar))}
            {bilgi('Eğitim Yılı', s.egitimYili)}
            {bilgi('Tarih', new Date(s.tarih).toLocaleString('tr-TR'))}
            {bilgi('Ülke', s.ulkeAdi)}
            {bilgi('Yetkili', s.yetkiliAdi, 'Sipariş formuna girilen iletişim kişisi — sistemdeki bir kullanıcı hesabıyla otomatik bağlantılı değil')}
            {bilgi('E-posta', s.yetkiliEmail)}
            {bilgi('Telefon', s.telefon
              ? <a href={`tel:${s.telefon}`} className="text-purple-700 hover:underline">{s.telefon}</a>
              : '—')}
            {!lead && bilgi('Kurum Yöneticisi', s.kurumYoneticisiEmail === s.yetkiliEmail
              ? <span className="text-slate-400 italic">Yetkili ile aynı</span>
              : s.kurumYoneticisiAdi
                ? `${s.kurumYoneticisiAdi} (${s.kurumYoneticisiEmail})`
                : 'Atanmamış')}
            {bilgi('Ülke Temsilcisi', s.ulkeTemsilcisiAdi ? `${s.ulkeTemsilcisiAdi} (${s.ulkeTemsilcisiEmail})` : 'Atanmamış')}
            {bilgi('Sınıf Sayısı', s.sinifSayisi, 'Bu kurumda bu kitaba atanmış sınıf adedi')}
            {bilgi('Aktif Öğrenci', s.aktifOgrenci, 'O sınıflardaki, sisteme şu an aktif olarak eklenmiş öğrenci sayısı')}
            {bilgi('Mevcut Lisans', s.mevcutLisansTipi, 'Onay öncesi kurumun bu kitap için halihazırda sahip olduğu lisans tipi (Deneme / Ücretli)')}
          </div>

          {duzenleAcik && (
            <div className="flex flex-wrap items-end gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2.5">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Öğrenci Kapasitesi</label>
                <input type="number" min={1} value={kapasite} onChange={e => setKapasite(e.target.value)}
                  className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Tutar (EUR)</label>
                <input type="number" min={0} step="0.01" value={tutar} onChange={e => setTutar(e.target.value)}
                  className="w-32 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
              </div>
              <button
                onClick={() => kaydetMutation.mutate()}
                disabled={kaydetMutation.isPending || kapasite === '' || tutar === ''}
                className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors">
                {kaydetMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
              </button>
              {fiyatHesaplaniyor && <span className="text-[11px] text-slate-400 w-full">Tutar hesaplanıyor…</span>}
              {!fiyatHesaplaniyor && fiyatOnerisi && (
                <span className="text-[11px] text-slate-500 w-full">
                  Otomatik: {fiyatOnerisi.toplamGosterim} ({fiyatOnerisi.ogrenciSayisi} öğrenci × €{(fiyatOnerisi.birimFiyatEurCent / 100).toFixed(2)}
                  {fiyatOnerisi.hacimIndirimiOrani ? `, hacim indirimi %${fiyatOnerisi.hacimIndirimiOrani}` : ''}
                  {fiyatOnerisi.kampanyaIndirimOrani ? `, kampanya %${fiyatOnerisi.kampanyaIndirimOrani}` : ''}) — üzerine elle yazılabilir
                </span>
              )}
            </div>
          )}

          {hata && <p role="alert" className="text-xs text-red-600">{hata}</p>}
        </div>
      )}
    </SlideOver>
  );
}
