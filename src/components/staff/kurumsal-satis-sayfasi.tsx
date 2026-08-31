'use client';

// Kurumsal Satış — Siparişler (4 Şablon Kuralı: Liste=DataTable + SlideOver detay).
// SuperAdmin ve Admin (Koordinator) panelleri aynı sayfayı kullanır — BekleyenSiparisRow'daki
// "endpoint prop olarak geçilir" deseniyle aynı: apiBase farkı dışında ikisi birebir aynı.
// Sipariş çok bölümlü bir entity olmadığı için detay route yerine SlideOver kullanılır.
// API tüm listeyi döner; durum filtresi/arama/sıralama/sayfalama client-side.

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, Package } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { SlideOver } from '@/components/slide-over';
import { ConfirmActionModal } from '@/components/confirm-action-modal';
import { AramaInput, SortTh, Sayfalama, trSirala, csvIndir, useSiralama } from '@/components/staff/table-kit';
import { apiHataMesaji, waLink } from '@/lib/utils';
import { useSiparisOnayHazirlik } from './use-siparis-onay-hazirlik';

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
  ulkeAdi: string | null;
  yeniUlkeAdi: string | null;
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

// "Tümü" varsayılan iken Beklemede/Onaylandı arasına eski (İptal/Dönüştürüldü) siparişler
// karışıp listeyi kalabalıklaştırıyordu. Varsayılan artık yalnızca aktif (eylem
// gerektirebilecek) siparişleri gösteren "Aktif" — arşiv görmek için ek tık gerekiyor.
type DurumFiltre = 'Aktif' | 'Beklemede' | 'Onaylandi' | 'Arsiv';
type SortKey = 'kurumAdi' | 'ulkeAdi' | 'yetkiliAdi' | 'ogrenciKapasite' | 'toplamTutar' | 'tarih' | 'durum';

const AKTIF_DURUMLAR: Siparis['durum'][] = ['Beklemede', 'Onaylandi'];
const ARSIV_DURUMLAR: Siparis['durum'][] = ['Iptal', 'Donusturuldu'];

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

interface Props {
  /** SuperAdmin: /api/super-admin, Admin (Koordinator): /api/admin */
  apiBase: string;
  /** Bu sayfanın kendi liste sorgusu için react-query anahtarı — panel başına ayrı olmalı. */
  listQueryKey: unknown[];
  /** Sipariş değiştiğinde tazelenmesi gereken başka cache'ler (dashboard bekleyen-sipariş widget'ı vb.) */
  extraInvalidateKeys?: unknown[][];
}

export function KurumsalSatisSayfasi({ apiBase, listQueryKey, extraInvalidateKeys }: Props) {

  const [durum, setDurum] = useState<DurumFiltre>('Aktif');
  const [sadeceUlkesiEksik, setSadeceUlkesiEksik] = useState(false);
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const { sortKey, sortDir, toggleSort } = useSiralama<SortKey>('tarih', () => setSayfa(1), 'desc');
  const [seciliSiparis, setSeciliSiparis] = useState<Siparis | null>(null);

  const { data: siparisler = [], isLoading } = useQuery({
    queryKey: listQueryKey,
    queryFn: () => api.get(`${apiBase}/siparisler`).then(r => r.data),
  });

  const durumSayilari = useMemo(() => {
    const s: Record<string, number> = { Aktif: 0, Arsiv: 0 };
    for (const sp of siparisler as Siparis[]) {
      s[sp.durum] = (s[sp.durum] ?? 0) + 1;
      s[AKTIF_DURUMLAR.includes(sp.durum) ? 'Aktif' : 'Arsiv']++;
    }
    return s;
  }, [siparisler]);

  const gorunen = useMemo(() => {
    const q = arama.trim().toLocaleLowerCase('tr');
    let liste = (siparisler as Siparis[]).filter(s => {
      if (durum === 'Aktif') return AKTIF_DURUMLAR.includes(s.durum);
      if (durum === 'Arsiv') return ARSIV_DURUMLAR.includes(s.durum);
      return s.durum === durum;
    });
    if (sadeceUlkesiEksik) liste = liste.filter(s => !s.ulkeAdi && s.yeniUlkeAdi);
    if (q) {
      liste = liste.filter(s =>
        [s.kurumAdi, s.ulkeAdi, s.yetkiliAdi, s.yetkiliEmail]
          .some(v => (v ?? '').toLocaleLowerCase('tr').includes(q)));
    }
    return trSirala(liste, sortKey, sortDir);
  }, [siparisler, durum, arama, sortKey, sortDir, sadeceUlkesiEksik]);

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
        {(['Aktif', 'Beklemede', 'Onaylandi', 'Arsiv'] as DurumFiltre[]).map(d => (
          <button key={d}
            onClick={() => { setDurum(d); setSayfa(1); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              durum === d ? 'bg-purple-100 text-purple-700' : 'text-slate-500 hover:bg-slate-100'
            }`}>
            {d === 'Aktif' ? 'Aktif' : d === 'Arsiv' ? 'Arşiv' : DURUM_ETIKET[d]}
            <span className="tabular-nums text-[11px] opacity-70">{durumSayilari[d] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
          <input type="checkbox" checked={sadeceUlkesiEksik}
            onChange={e => { setSadeceUlkesiEksik(e.target.checked); setSayfa(1); }}
            className="rounded border-slate-300" />
          Sadece Ülkesi Eksik
        </label>
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
                <td className="px-4 py-2.5 text-xs text-slate-500">
                  {s.ulkeAdi ?? (
                    s.yeniUlkeAdi
                      ? <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[10px] font-medium">⚠ Ülkesi Eksik: {s.yeniUlkeAdi}</span>
                      : '—'
                  )}
                </td>
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
                  {arama || durum !== 'Aktif' ? 'Filtreye uyan sipariş yok' : 'Henüz aktif sipariş yok'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>

    <Sayfalama sayfa={guvenliSayfa} totalPages={totalPages} toplam={gorunen.length} sayfaBoyutu={SAYFA_BOYUTU} onSayfa={setSayfa} />

    <SiparisDetaySlideOver
      apiBase={apiBase}
      siparis={seciliSiparis}
      onClose={() => setSeciliSiparis(null)}
      listQueryKey={listQueryKey}
      extraInvalidateKeys={extraInvalidateKeys}
    />
    </>
  );
}

// ─── Sipariş Detayı + Hızlı İşlemler (SlideOver şablonu) ─────────────────────

function SiparisDetaySlideOver({ apiBase, siparis: s, onClose, listQueryKey, extraInvalidateKeys }: {
  apiBase: string;
  siparis: Siparis | null;
  onClose: () => void;
  listQueryKey: unknown[];
  extraInvalidateKeys?: unknown[][];
}) {
  const qc = useQueryClient();
  const [hata, setHata] = useState<string | null>(null);
  const [kapasite, setKapasite] = useState('');
  const [kapasiteBaslangic, setKapasiteBaslangic] = useState('');
  const [tutar, setTutar] = useState('');
  const [duzenleAcik, setDuzenleAcik] = useState(false);
  const [kapasiteDebounced, setKapasiteDebounced] = useState('');
  const [iptalOnayAcik, setIptalOnayAcik] = useState(false);
  const [silOnayAcik, setSilOnayAcik] = useState(false);
  const isSuperAdmin = useAuthStore(st => st.user?.role === 'SuperAdmin');

  const lead = s?.kurumId == null;
  const beklemede = s?.durum === 'Beklemede';
  const iptalEdilmis = s?.durum === 'Iptal';
  const donusturulmus = s?.durum === 'Donusturuldu';
  const ulkesiEksik = lead && beklemede && !s?.ulkeAdi && !!s?.yeniUlkeAdi;
  const [baglaAcik, setBaglaAcik] = useState(false);
  const [seciliUlkeId, setSeciliUlkeId] = useState('');

  const { data: ulkelerListesi = [] } = useQuery({
    queryKey: ['ulkeler-tumu', apiBase],
    queryFn: () => api.get(`${apiBase}/ulkeler`, { params: { pageSize: 500 } }).then(r => r.data.liste as { id: number; name: string }[]),
    enabled: baglaAcik,
  });

  const ulkeBaglaMutation = useMutation({
    mutationFn: () => api.put(`${apiBase}/siparis/${s!.id}/ulke-bagla`, { ulkeId: Number(seciliUlkeId) }),
    onMutate: () => setHata(null),
    onSuccess: (res) => {
      setBaglaAcik(false);
      setSeciliUlkeId('');
      invalidate();
      if (res.data.temsilciVarMi) {
        onClose();
      } else {
        setSonucMesaji({ mesaj: 'Bu ülkenin henüz temsilcisi yok, talep kimsenin kuyruğuna düşmeyecek.', tone: 'warning' });
      }
    },
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
  });

  const [yeniUlkeAcikMi, setYeniUlkeAcikMi] = useState(false);
  const [yeniUlkeAdi, setYeniUlkeAdi] = useState('');
  const [sonucMesaji, setSonucMesaji] = useState<{ mesaj: string; davetUrl?: string; tone?: 'success' | 'warning' } | null>(null);

  const yeniUlkeMutation = useMutation({
    mutationFn: () => api.post(`${apiBase}/siparis/${s!.id}/yeni-ulke-ve-temsilci`, { ulkeAdi: yeniUlkeAdi }),
    onMutate: () => setHata(null),
    onSuccess: (res) => {
      const { ulkeAdi: acilanUlke, davetUrl, baglanmisLeadSayisi, mailGonderildi } = res.data;
      setYeniUlkeAcikMi(false);
      invalidate();
      if (mailGonderildi) {
        setSonucMesaji({ mesaj: `${acilanUlke} açıldı, ${baglanmisLeadSayisi} talep bağlandı, davet ${s!.yetkiliEmail} adresine gönderildi.` });
      } else {
        setSonucMesaji({ mesaj: `${acilanUlke} açıldı, ${baglanmisLeadSayisi} talep bağlandı. Mail gönderilemedi — linki kopyalayıp manuel paylaşın:`, davetUrl });
      }
    },
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
  });

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
    qc.invalidateQueries({ queryKey: listQueryKey });
    extraInvalidateKeys?.forEach(k => qc.invalidateQueries({ queryKey: k }));
  }

  const onayHazirlik = useSiparisOnayHazirlik({
    siparisId: s?.id ?? 0, dersKitabiId: s?.dersKitabiId, ogrenciKapasite: s?.ogrenciKapasite,
    toplamTutar: s?.toplamTutar, siparisEndpoint: apiBase, invalidate, setHata, onBasarili: onClose,
  });

  const onaylaMutation = useMutation({
    mutationFn: () => api.put(`${apiBase}/siparis/${s!.id}/onayla`),
    onMutate: () => setHata(null),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
  });
  const iptalMutation = useMutation({
    mutationFn: () => api.put(`${apiBase}/siparis/${s!.id}/iptal`),
    onMutate: () => setHata(null),
    onSuccess: () => { setIptalOnayAcik(false); invalidate(); onClose(); },
    onError: (err: unknown) => { setIptalOnayAcik(false); setHata(apiHataMesaji(err)); },
  });
  const geriAlMutation = useMutation({
    mutationFn: () => api.put(`${apiBase}/siparis/${s!.id}/geri-al`),
    onMutate: () => setHata(null),
    onSuccess: () => { invalidate(); onClose(); },
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
  });
  const silMutation = useMutation({
    mutationFn: () => api.delete(`${apiBase}/siparis/${s!.id}`),
    onMutate: () => setHata(null),
    onSuccess: () => { setSilOnayAcik(false); invalidate(); onClose(); },
    onError: (err: unknown) => { setSilOnayAcik(false); setHata(apiHataMesaji(err)); },
  });
  const kaydetMutation = useMutation({
    mutationFn: () => api.put(`${apiBase}/siparis/${s!.id}`, {
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
    onayHazirlik.kapat();
    setDuzenleAcik(v => !v);
  }

  function onaylaTiklandi() {
    if (!s) return;
    if (onayHazirlik.acik) { onayHazirlik.kapat(); return; }
    if (onayHazirlik.tutarBelirsiz) {
      if (!onayHazirlik.hesaplanabilir) { acDuzenle(); return; } // Paket siparisi: otomatik hesap yok, Duzenle'de manuel tutar var
      setDuzenleAcik(false);
      onayHazirlik.ac();
    } else {
      onaylaMutation.mutate();
    }
  }

  function kapat() {
    setDuzenleAcik(false);
    onayHazirlik.kapat();
    setHata(null);
    setSonucMesaji(null);
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
    <>
    <SlideOver
      open={!!s}
      onClose={kapat}
      title={s?.kurumAdi ?? 'Sipariş'}
      subtitle={`Sipariş #${s?.id ?? ''}`}
      width="md"
      footer={
        beklemede ? (
          <div className="flex flex-wrap gap-2 justify-end">
            <button onClick={acDuzenle}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${duzenleAcik ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              {duzenleAcik ? 'Düzenlemeyi Kapat' : 'Düzenle'}
            </button>
            <button onClick={() => setIptalOnayAcik(true)} disabled={iptalMutation.isPending}
              className="px-3 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 disabled:opacity-50 transition-colors">
              İptal Et
            </button>
            {!lead && (
              <button onClick={onaylaTiklandi} disabled={onaylaMutation.isPending || onayHazirlik.onaylaMutation.isPending}
                className={`px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 ${onayHazirlik.acik ? 'border border-green-300 bg-green-50 text-green-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                {(onaylaMutation.isPending || onayHazirlik.onaylaMutation.isPending) ? 'Onaylanıyor…' : onayHazirlik.acik ? 'Onay Panelini Kapat' : 'Onayla'}
              </button>
            )}
          </div>
        ) : iptalEdilmis ? (
          <div className="flex justify-end gap-2">
            {isSuperAdmin && (
              <button onClick={() => setSilOnayAcik(true)} disabled={silMutation.isPending}
                className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
                Sil
              </button>
            )}
            <button onClick={() => geriAlMutation.mutate()} disabled={geriAlMutation.isPending}
              className="px-3 py-2 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors">
              {geriAlMutation.isPending ? 'Geri alınıyor…' : "Geri Al (Beklemede'ye döndür)"}
            </button>
          </div>
        ) : donusturulmus && isSuperAdmin ? (
          <div className="flex justify-end">
            <button onClick={() => setSilOnayAcik(true)} disabled={silMutation.isPending}
              className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
              Sil
            </button>
          </div>
        ) : undefined
      }
    >
      {s && (
        <div className="space-y-4">
          {lead && beklemede && (
            <p className="text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              Lead sipariş — onaylanmadan önce kuruma dönüştürülmeli (ülke temsilcisi paneli).
            </p>
          )}

          {ulkesiEksik && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 space-y-2">
              <p className="text-xs text-orange-700">
                Bu talebin ülkesi eşleşmedi: <strong>{s!.yeniUlkeAdi}</strong>
              </p>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setBaglaAcik(v => !v)}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-100 transition-colors">
                  Mevcut Ülkeye Bağla
                </button>
                <button type="button" onClick={() => { setYeniUlkeAcikMi(v => !v); setYeniUlkeAdi(s!.yeniUlkeAdi ?? ''); }}
                  className="px-2.5 py-1.5 text-xs rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-100 transition-colors">
                  Yeni Ülke Aç + Temsilci Yap
                </button>
              </div>
              {baglaAcik && (
                <div className="flex items-center gap-2 pt-1">
                  <select value={seciliUlkeId} onChange={e => setSeciliUlkeId(e.target.value)}
                    className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs">
                    <option value="">Ülke seçin…</option>
                    {ulkelerListesi.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => ulkeBaglaMutation.mutate()}
                    disabled={!seciliUlkeId || ulkeBaglaMutation.isPending}
                    className="px-2.5 py-1.5 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors">
                    {ulkeBaglaMutation.isPending ? 'Bağlanıyor…' : 'Onayla'}
                  </button>
                </div>
              )}
              {yeniUlkeAcikMi && (
                <div className="space-y-2 pt-1 border-t border-orange-200 mt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-orange-700 mb-0.5">Ülke Adı</label>
                    <input type="text" value={yeniUlkeAdi} onChange={e => setYeniUlkeAdi(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-xs" />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Temsilci daveti şu adrese gönderilecek: <strong>{s!.yetkiliEmail}</strong>
                  </p>
                  <button type="button" onClick={() => yeniUlkeMutation.mutate()}
                    disabled={!yeniUlkeAdi.trim() || yeniUlkeMutation.isPending}
                    className="px-2.5 py-1.5 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors">
                    {yeniUlkeMutation.isPending ? 'Oluşturuluyor…' : 'Ülkeyi Aç ve Daveti Gönder'}
                  </button>
                </div>
              )}
            </div>
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
            {bilgi('WhatsApp', s.telefon
              ? <a href={waLink(s.telefon, s.kurumAdi ?? '')} target="_blank" rel="noreferrer" className="text-green-700 hover:underline">{s.telefon}</a>
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

          {onayHazirlik.acik && (
            <div className="flex flex-wrap items-end gap-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2.5">
              <div className="w-full text-[11px] text-slate-600">
                İleride kayıt olacak öğrenciler için şimdiden ek koltuk eklemek ister misiniz?
                İstemiyorsanız kapasiteyi değiştirmeden onaylayabilirsiniz.
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">Öğrenci Kapasitesi</label>
                <input type="number" min={1} value={onayHazirlik.kapasite} onChange={e => onayHazirlik.setKapasite(e.target.value)}
                  className="w-28 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-green-300" />
              </div>
              <button
                onClick={() => onayHazirlik.onaylaMutation.mutate()}
                disabled={onayHazirlik.onaylaMutation.isPending || onayHazirlik.hesaplaniyor || onayHazirlik.kapasiteSayi <= 0 || !onayHazirlik.fiyatOnerisi}
                className="px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors">
                {onayHazirlik.onaylaMutation.isPending ? 'Onaylanıyor…' : 'Onayla'}
              </button>
              <button onClick={onayHazirlik.kapat}
                className="px-3 py-1.5 text-slate-600 text-xs rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                Vazgeç
              </button>
              {onayHazirlik.hesaplaniyor && <span className="text-[11px] text-slate-400 w-full">Tutar hesaplanıyor…</span>}
              {!onayHazirlik.hesaplaniyor && onayHazirlik.fiyatOnerisi && (
                <span className="text-[11px] text-slate-500 w-full">
                  Otomatik hesaplanan tutar: {onayHazirlik.fiyatOnerisi.toplamGosterim} ({onayHazirlik.fiyatOnerisi.ogrenciSayisi} öğrenci × €{(onayHazirlik.fiyatOnerisi.birimFiyatEurCent / 100).toFixed(2)}
                  {onayHazirlik.fiyatOnerisi.hacimIndirimiOrani ? `, hacim indirimi %${onayHazirlik.fiyatOnerisi.hacimIndirimiOrani}` : ''}
                  {onayHazirlik.fiyatOnerisi.kampanyaIndirimOrani ? `, kampanya %${onayHazirlik.fiyatOnerisi.kampanyaIndirimOrani}` : ''})
                </span>
              )}
            </div>
          )}

          {sonucMesaji && (
            <div className={`border rounded-lg px-3 py-2.5 text-xs space-y-1.5 ${
              sonucMesaji.tone === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>
              <p>{sonucMesaji.mesaj}</p>
              {sonucMesaji.davetUrl && (
                <div className="flex items-center gap-2">
                  <input readOnly value={sonucMesaji.davetUrl}
                    className="flex-1 border border-green-300 rounded px-2 py-1 text-[11px] bg-white" />
                  <button type="button" onClick={() => navigator.clipboard.writeText(sonucMesaji.davetUrl!)}
                    className="px-2 py-1 text-[11px] bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                    Kopyala
                  </button>
                </div>
              )}
            </div>
          )}

          {hata && <p role="alert" className="text-xs text-red-600">{hata}</p>}
        </div>
      )}
    </SlideOver>

    <ConfirmActionModal
      open={iptalOnayAcik}
      tone="danger"
      title="Siparişi iptal et"
      message={
        <>
          <strong>{s?.kurumAdi}</strong> için {DURUM_ETIKET[s?.durum ?? ''] ?? s?.durum} durumundaki bu sipariş
          {' '}<strong>İptal</strong> durumuna geçecek. İptal edilen sipariş &quot;Geri Al&quot; ile tekrar
          Beklemede&apos;ye döndürülebilir, ama devam etmeden önce durumu bir kez daha kontrol edin.
        </>
      }
      confirmLabel={iptalMutation.isPending ? 'İptal ediliyor…' : 'Evet, iptal et'}
      onConfirm={() => iptalMutation.mutate()}
      onCancel={() => setIptalOnayAcik(false)}
      loading={iptalMutation.isPending}
    />

    <ConfirmActionModal
      open={silOnayAcik}
      tone="danger"
      title="Siparişi kalıcı sil"
      message={
        <>
          <strong>{s?.kurumAdi}</strong> için {DURUM_ETIKET[s?.durum ?? ''] ?? s?.durum} durumundaki bu sipariş
          {' '}kalıcı olarak silinecek. Bu işlem geri alınamaz.
        </>
      }
      confirmLabel={silMutation.isPending ? 'Siliniyor…' : 'Evet, kalıcı sil'}
      onConfirm={() => silMutation.mutate()}
      onCancel={() => setSilOnayAcik(false)}
      loading={silMutation.isPending}
    />
    </>
  );
}
