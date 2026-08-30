'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocale } from '@/navigation';
import { toast } from 'sonner';
import {
  ArrowLeft, BookOpen, Users, ClipboardList, Megaphone,
  Trophy, Copy, Check, Trash2, Plus, Wifi, UserPlus, Download, X, AlertTriangle, Pencil, QrCode, Info, Gift,
  KeyRound, RotateCw, UserX,
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { getClientApiUrl } from '@/lib/api-url';
import { cn } from '@/lib/utils';
import { KatilimKoduDavet } from '@/components/katilim-kodu-davet';
import { ContextBreadcrumb } from '@/components/context-breadcrumb';

interface Sinif {
  id: number;
  name: string;
  katilimKodu: string;
  dersKitabiId: string | null;
  ogrenciSayisi: number;
  kurumAdi: string | null;
  ulkeAdi: string | null;
  okumaKitabiVarMi: boolean;
  kaliciSilmeSerbestMi: boolean;
}

interface OgrenciOzet {
  userId: number;
  ad: string;
  katilimTarihi: string;
  toplamPuan: number;
  tamamlananUnite: number;
  sonAktivite: string | null;
  sonGirisTarihi: string | null;
  pinKullanici: boolean;
  email: string | null;
  kullaniciAdi: string | null;
  isActive: boolean;
  etkinlikYaptiMi: boolean;
}

interface TopluEkleSonuc {
  userId: number;
  ad: string;
  kullaniciAdi: string;
  pin: string;
  qrToken: string;
}

interface Odev {
  id: number;
  baslik: string;
  aciklama: string | null;
  uniteId: string | null;
  teslimTarihi: string | null;
  olusturmaTarihi: string;
}

interface Duyuru {
  id: number;
  icerik: string;
  olusturmaTarihi: string;
  yorumSayisi: number;
}

type Tab = 'genel' | 'ogrenciler' | 'raporlar' | 'odevler' | 'duyurular' | 'okuma';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'genel', label: 'Genel', icon: BookOpen },
  { key: 'ogrenciler', label: 'Öğrenciler', icon: Users },
  { key: 'raporlar', label: 'Raporlar', icon: Trophy },
  { key: 'odevler', label: 'Ödevler', icon: ClipboardList },
  { key: 'okuma', label: 'Okuma', icon: BookOpen },
  { key: 'duyurular', label: 'Duyurular', icon: Megaphone },
];

interface WordIntensityDto {
  word: string;
  totalLookups: number;
  uniqueStudents: number;
  classPercentage: number;
  difficulty: 'high' | 'medium' | 'low';
}

type DifficultyFilter = 'all' | 'high' | 'medium' | 'low';

const DIFFICULTY_TABS: { key: DifficultyFilter; label: string; color: string; activeClass: string; tooltip: string }[] = [
  { key: 'all',    label: 'Tümü',  color: 'text-slate-600',   activeClass: 'bg-slate-700 text-white',   tooltip: 'Tüm kelimeler (sınıfın en az 1 öğrencisi baktı)' },
  { key: 'high',   label: 'Zor',   color: 'text-red-600',     activeClass: 'bg-red-500 text-white',     tooltip: 'Zor — sınıfın %60\'ından fazlası bu kelimeye baktı' },
  { key: 'medium', label: 'Orta',  color: 'text-amber-600',   activeClass: 'bg-amber-500 text-white',   tooltip: 'Orta — sınıfın %30–59\'u bu kelimeye baktı' },
  { key: 'low',    label: 'Kolay', color: 'text-emerald-600', activeClass: 'bg-emerald-500 text-white', tooltip: 'Kolay — sınıfın %30\'undan azı bu kelimeye baktı' },
];

function WordIntensityPanel({ sinifId, enabled }: { sinifId: number; enabled: boolean }) {
  const [filter, setFilter] = useState<DifficultyFilter>('all');

  const { data: words = [], isLoading, isError } = useQuery<WordIntensityDto[]>({
    queryKey: ['word-intensity', sinifId],
    queryFn: () => api.get(`/api/okuma/word-intensity?classId=${sinifId}`).then(r => r.data),
    enabled,
  });

  const filtered = filter === 'all' ? words : words.filter(w => w.difficulty === filter);

  const counts = {
    high:   words.filter(w => w.difficulty === 'high').length,
    medium: words.filter(w => w.difficulty === 'medium').length,
    low:    words.filter(w => w.difficulty === 'low').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-10 justify-center text-slate-400 text-sm">
        <div className="size-4 rounded-full border-2 border-slate-300 border-t-transparent animate-spin" />
        Yükleniyor...
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-red-500 py-4">Kelime verisi yüklenemedi.</p>;
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-slate-500 text-sm font-medium">Henüz kelime verisi yok.</p>
        <p className="text-slate-400 text-xs mt-1">Öğrenciler okuma sırasında kelimeye tıkladığında burada görünür.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtre tabları */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {DIFFICULTY_TABS.map(t => {
          const count = t.key === 'all' ? words.length : counts[t.key as 'high' | 'medium' | 'low'];
          const isActive = filter === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              title={t.tooltip}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
                isActive ? t.activeClass : `bg-slate-100 ${t.color} hover:bg-slate-200`,
              )}
            >
              {t.label}
              <span className={cn(
                'text-[10px] px-1.5 py-0.5 rounded-full font-bold',
                isActive ? 'bg-white/20' : 'bg-white text-slate-500',
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tablo */}
      {filtered.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-6">Bu kategoride kelime yok.</p>
      ) : (
        <div className="rounded-xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left py-3 px-4 font-medium text-slate-500">Kelime</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">Bakış</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">Sınıf %</th>
                <th className="text-right py-3 px-4 font-medium text-slate-500">
                  <span
                    className="inline-flex items-center justify-end gap-1 cursor-default"
                    title="Zorluk = sınıfın kaçı bu kelimeye baktı: Zor ≥%60 · Orta %30–59 · Kolay <%30"
                  >
                    Zorluk
                    <Info className="size-3 text-slate-400" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(w => (
                <tr key={w.word} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800">{w.word}</td>
                  <td className="py-3 px-4 text-right text-slate-600">{w.totalLookups}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            w.difficulty === 'high' ? 'bg-red-400' :
                            w.difficulty === 'medium' ? 'bg-amber-400' : 'bg-emerald-400',
                          )}
                          style={{ width: `${Math.min(w.classPercentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-slate-500 tabular-nums w-8 text-right">{w.classPercentage}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-semibold',
                      w.difficulty === 'high'   ? 'bg-red-100 text-red-700' :
                      w.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                                                  'bg-emerald-100 text-emerald-700',
                    )}>
                      {w.difficulty === 'high' ? 'Zor' : w.difficulty === 'medium' ? 'Orta' : 'Kolay'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SinifDetayPage({ params }: { params: Promise<{ sinifId: string }> }) {
  const { sinifId } = use(params);
  const id = parseInt(sinifId);
  const { user, ready } = useAuthGuard('Ogretmen');
  const locale = useLocale();
  const accessToken = useAuthStore((s) => s.accessToken);
  const [tab, setTab] = useState<Tab>('genel');
  const [kodKopyalandi, setKodKopyalandi] = useState(false);
  const qc = useQueryClient();

  const { data: sinif } = useQuery<Sinif>({
    queryKey: ['sinif', id],
    queryFn: () => api.get(`/api/ogretmen/sinif/${id}`).then(r => r.data),
    enabled: !!user,
  });

  const { data: ogrenciler } = useQuery<OgrenciOzet[]>({
    queryKey: ['sinif-ogrenciler', id],
    queryFn: () => api.get(`/api/ogretmen/sinif/${id}/rapor`).then(r => r.data.ogrenciler),
    enabled: !!user && tab === 'ogrenciler',
  });

  const { data: odevler } = useQuery<Odev[]>({
    queryKey: ['sinif-odevler', id],
    queryFn: () => api.get(`/api/ogretmen/sinif/${id}/odevler`).then(r => r.data),
    enabled: !!user && tab === 'odevler',
  });

  const { data: duyurular } = useQuery<Duyuru[]>({
    queryKey: ['sinif-duyurular', id],
    queryFn: () => api.get(`/api/ogretmen/sinif/${id}/duyurular`).then(r => r.data),
    enabled: !!user && tab === 'duyurular',
  });

  const [yeniOdev, setYeniOdev] = useState({ baslik: '', aciklama: '', teslimTarihi: '' });
  const [yeniDuyuru, setYeniDuyuru] = useState('');
  const [ogrenciEmail, setOgrenciEmail] = useState('');
  const [qrModalAcik, setQrModalAcik] = useState(false);
  const [duzenleOdevId, setDuzenleOdevId] = useState<number | null>(null);
  const [duzenleOdevForm, setDuzenleOdevForm] = useState({ baslik: '', aciklama: '', teslimTarihi: '' });
  const [duzenleOgrenciId, setDuzenleOgrenciId] = useState<number | null>(null);
  const [duzenleOgrenciForm, setDuzenleOgrenciForm] = useState({ ad: '', soyad: '', kullaniciAdi: '' });
  const [duzenleOgrenciHata, setDuzenleOgrenciHata] = useState<string | null>(null);

  // Toplu öğrenci ekleme
  const [topluModalAcik, setTopluModalAcik] = useState(false);
  const [isimler, setIsimler] = useState('');
  const [topluSonuclar, setTopluSonuclar] = useState<TopluEkleSonuc[]>([]);
  const [kapasiteHatasi, setKapasiteHatasi] = useState<string | null>(null);
  // null = lisans hatası değil (buton yok), true/false = kurum/ülke sorumlusuna
  // bildirim daha önce gönderildi mi (backend 402 body'sindeki kapasiteTalebiGonderildiMi
  // VEYA talebiGonderildiMi). talebiTipi hangi uç noktanın çağrılacağını ayırt eder —
  // kapasite dolu (Ücretli/Sponsorlu) ile deneme süresi doldu (Deneme) farklı
  // backend endpoint'leri kullanır (bkz. OgretmenController.LisansArtirTalebi/LisansSuresiTalebi).
  const [kapasiteTalebiDurumu, setKapasiteTalebiDurumu] = useState<boolean | null>(null);
  const [topluTalebiTipi, setTopluTalebiTipi] = useState<'kapasite' | 'sure' | null>(null);
  const [tekliHata, setTekliHata] = useState<string | null>(null);
  const [tekliKapasiteTalebiDurumu, setTekliKapasiteTalebiDurumu] = useState<boolean | null>(null);
  const [tekliTalebiTipi, setTekliTalebiTipi] = useState<'kapasite' | 'sure' | null>(null);

  const odevMutation = useMutation({
    mutationFn: () => api.post(`/api/ogretmen/sinif/${id}/odev`, {
      baslik: yeniOdev.baslik,
      aciklama: yeniOdev.aciklama || null,
      teslimTarihi: yeniOdev.teslimTarihi || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sinif-odevler', id] });
      setYeniOdev({ baslik: '', aciklama: '', teslimTarihi: '' });
    },
  });

  const duyuruMutation = useMutation({
    mutationFn: () => api.post(`/api/ogretmen/sinif/${id}/duyuru`, { icerik: yeniDuyuru }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sinif-duyurular', id] });
      setYeniDuyuru('');
    },
  });

  const ogrenciEkleMutation = useMutation({
    mutationFn: (email: string) => api.post(`/api/ogretmen/sinif/${id}/ogrenci-ekle`, { email }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sinif-ogrenciler', id] });
      qc.invalidateQueries({ queryKey: ['sinif', id] });
      setOgrenciEmail('');
      setTekliHata(null);
      setTekliKapasiteTalebiDurumu(null);
      setTekliTalebiTipi(null);
    },
    onError: (err: { response?: { data?: { mesaj?: string; kapasiteTalebiGonderildiMi?: boolean; talebiGonderildiMi?: boolean } | string } }) => {
      const data = err.response?.data;
      const mesaj = typeof data === 'string' ? data : data?.mesaj;
      setTekliHata(mesaj ?? 'Bir hata oluştu.');
      if (typeof data === 'object' && typeof data?.kapasiteTalebiGonderildiMi === 'boolean') {
        setTekliKapasiteTalebiDurumu(data.kapasiteTalebiGonderildiMi);
        setTekliTalebiTipi('kapasite');
      } else if (typeof data === 'object' && typeof data?.talebiGonderildiMi === 'boolean') {
        setTekliKapasiteTalebiDurumu(data.talebiGonderildiMi);
        setTekliTalebiTipi('sure');
      } else {
        setTekliKapasiteTalebiDurumu(null);
        setTekliTalebiTipi(null);
      }
    },
  });

  // Tek mutation, iki backend endpoint'i — kapasite dolu (Ücretli/Sponsorlu) ile
  // lisans süresi doldu (Deneme veya yenilenmemiş Ücretli/Sponsorlu) 402'leri farklı
  // uç noktalara gider, ama "kurum/ülke sorumlusuna bildir" davranışı aynı.
  const kurumSorumlusunaBildirMutation = useMutation({
    mutationFn: (tip: 'kapasite' | 'sure') =>
      api.post(`/api/ogretmen/sinif/${id}/${tip === 'sure' ? 'lisans-suresi-talebi' : 'lisans-artir-talebi'}`),
    onSuccess: () => {
      toast.success('Kurum/ülke sorumlusuna bildirildi.');
      setKapasiteTalebiDurumu(true);
      setTekliKapasiteTalebiDurumu(true);
    },
    onError: (err: { response?: { data?: string } }) => {
      toast.error(typeof err.response?.data === 'string' ? err.response.data : 'Bildirim gönderilemedi.');
    },
  });

  const odevSilMutation = useMutation({
    mutationFn: (odevId: number) => api.delete(`/api/ogretmen/odev/${odevId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sinif-odevler', id] }),
  });

  const odevGuncellemeMutation = useMutation({
    mutationFn: (odevId: number) => api.put(`/api/ogretmen/odev/${odevId}`, {
      baslik: duzenleOdevForm.baslik,
      aciklama: duzenleOdevForm.aciklama || null,
      teslimTarihi: duzenleOdevForm.teslimTarihi || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sinif-odevler', id] });
      setDuzenleOdevId(null);
    },
  });

  const duyuruSilMutation = useMutation({
    mutationFn: (duyuruId: number) => api.delete(`/api/ogretmen/duyuru/${duyuruId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sinif-duyurular', id] }),
  });

  const topluEkleMutation = useMutation({
    mutationFn: (isimListesi: string[]) =>
      api.post(`/api/ogretmen/sinif/${id}/ogrenci-toplu-ekle`, { isimler: isimListesi }),
    onSuccess: (res) => {
      setTopluSonuclar(res.data.eklenenler ?? []);
      setIsimler('');
      setKapasiteHatasi(null);
      setKapasiteTalebiDurumu(null);
      setTopluTalebiTipi(null);
      qc.invalidateQueries({ queryKey: ['sinif-ogrenciler', id] });
      qc.invalidateQueries({ queryKey: ['sinif', id] });
    },
    onError: (err: { response?: { data?: { mesaj?: string; kapasiteTalebiGonderildiMi?: boolean; talebiGonderildiMi?: boolean } } }) => {
      const data = err.response?.data;
      setKapasiteHatasi(data?.mesaj ?? 'Bir hata oluştu.');
      if (typeof data?.kapasiteTalebiGonderildiMi === 'boolean') {
        setKapasiteTalebiDurumu(data.kapasiteTalebiGonderildiMi);
        setTopluTalebiTipi('kapasite');
      } else if (typeof data?.talebiGonderildiMi === 'boolean') {
        setKapasiteTalebiDurumu(data.talebiGonderildiMi);
        setTopluTalebiTipi('sure');
      } else {
        setKapasiteTalebiDurumu(null);
        setTopluTalebiTipi(null);
      }
    },
  });

  const ogrenciSilMutation = useMutation({
    mutationFn: (ogrenciId: number) => api.delete(`/api/ogretmen/sinif/${id}/ogrenci/${ogrenciId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sinif-ogrenciler', id] });
      qc.invalidateQueries({ queryKey: ['sinif', id] });
    },
  });

  const yenidenAktifMutation = useMutation({
    mutationFn: (ogrenciId: number) => api.put(`/api/ogretmen/sinif/${id}/ogrenci/${ogrenciId}/yeniden-aktif`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sinif-ogrenciler', id] });
      toast.success('Öğrenci yeniden aktif edildi.');
    },
    onError: () => toast.error('Öğrenci yeniden aktif edilemedi.'),
  });

  const kaliciSilMutation = useMutation({
    mutationFn: (ogrenciId: number) => api.delete(`/api/ogretmen/sinif/${id}/ogrenci/${ogrenciId}/kalici`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sinif-ogrenciler', id] });
      qc.invalidateQueries({ queryKey: ['sinif', id] });
      toast.success('Öğrenci kalıcı olarak silindi.');
    },
    onError: (err: { response?: { data?: string | { hata?: string } } }) => {
      const data = err.response?.data;
      const mesaj = typeof data === 'string' ? data : data?.hata;
      toast.error(mesaj ?? 'Öğrenci silinemedi.');
    },
  });

  const ogrenciDuzenleMutation = useMutation({
    mutationFn: (ogrenciId: number) => api.put(`/api/ogretmen/ogrenci/${ogrenciId}/duzenle`, {
      ad: duzenleOgrenciForm.ad,
      soyad: duzenleOgrenciForm.soyad || null,
      kullaniciAdi: duzenleOgrenciForm.kullaniciAdi || null,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sinif-ogrenciler', id] });
      setDuzenleOgrenciId(null);
      setDuzenleOgrenciHata(null);
    },
    onError: (err: { response?: { data?: string | { hata?: string } } }) => {
      const data = err.response?.data;
      const mesaj = typeof data === 'string' ? data : data?.hata;
      setDuzenleOgrenciHata(mesaj ?? 'Kaydedilemedi.');
    },
  });

  // PIN/QR sıfırlama — sonuç (yeni PIN) tek seferlik bir modalda gösterilir, plaintext
  // hiçbir yerde saklanmadığı için bu modal kapanınca bir daha görüntülenemez.
  const [pinSifirlaSonuc, setPinSifirlaSonuc] = useState<{ userId: number; ad: string; pin: string } | null>(null);
  const pinYenileMutation = useMutation({
    mutationFn: (ogrenciId: number) => api.put<{ pin: string }>(`/api/ogretmen/ogrenci/${ogrenciId}/pin-yenile`),
    onSuccess: (res, ogrenciId) => {
      const ad = ogrenciler?.find(o => o.userId === ogrenciId)?.ad ?? '';
      setPinSifirlaSonuc({ userId: ogrenciId, ad, pin: res.data.pin });
    },
    onError: (err: { response?: { data?: unknown } }) => {
      toast.error(typeof err.response?.data === 'string' ? err.response.data : 'PIN sıfırlanamadı.');
    },
  });
  const qrYenileMutation = useMutation({
    mutationFn: (ogrenciId: number) => api.put(`/api/ogretmen/ogrenci/${ogrenciId}/qr-yenile`),
    onError: () => toast.error('QR kodu yenilenemedi.'),
  });

  async function badgePdfIndir() {
    const base = getClientApiUrl();
    try {
      const res = await fetch(`${base}/api/ogretmen/sinif/${id}/badge-pdf`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        // Backend "öğrenci yok" gibi durumlarda 400 + açıklayıcı düz metin dönüyor —
        // öğretmen "neden indiremiyorum" diye sormasın diye jenerik hata yerine göster.
        // Yalnızca 400'de: 500/502 gibi durumlarda gövde proxy/altyapı hata sayfası
        // olabilir, ham metni kullanıcıya sızdırmamak için jenerik `HTTP {status}`'a düşülür.
        const mesaj = res.status === 400 ? await res.text().catch(() => '') : '';
        throw new Error(mesaj || `HTTP ${res.status}`);
      }
      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sinif-${id}-badge.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      console.error('Badge PDF indirilemedi:', e);
      const mesaj = e instanceof Error && e.message && !/^HTTP \d+$/.test(e.message)
        ? e.message
        : 'PDF indirilemedi. Lütfen tekrar deneyin.';
      toast.error(mesaj);
    }
  }

  function startOdevDuzenle(odev: Odev) {
    setDuzenleOdevId(odev.id);
    setDuzenleOdevForm({
      baslik: odev.baslik,
      aciklama: odev.aciklama ?? '',
      teslimTarihi: odev.teslimTarihi ? odev.teslimTarihi.slice(0, 10) : '',
    });
  }

  function startOgrenciDuzenle(o: OgrenciOzet) {
    const [ad, ...soyadParcalari] = o.ad.split(' ');
    setDuzenleOgrenciId(o.userId);
    setDuzenleOgrenciForm({ ad, soyad: soyadParcalari.join(' '), kullaniciAdi: o.kullaniciAdi ?? '' });
    setDuzenleOgrenciHata(null);
  }

  function topluEkleGonder() {
    const liste = isimler.split('\n').map(s => s.trim()).filter(Boolean);
    if (!liste.length) return;
    setKapasiteHatasi(null);
    setKapasiteTalebiDurumu(null);
    setTopluTalebiTipi(null);
    setTopluSonuclar([]);
    topluEkleMutation.mutate(liste);
  }

  function kopyala() {
    if (!sinif) return;
    navigator.clipboard.writeText(sinif.katilimKodu);
    setKodKopyalandi(true);
    setTimeout(() => setKodKopyalandi(false), 2000);
  }

  if (!ready) return <div className="py-24 flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="bg-[#F3F4F6]">

      <main className="max-w-[1000px] mx-auto px-4 py-8">
        {/* Geri */}
        <Link href="/ogretmen" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="size-4" />
          Panele dön
        </Link>

        {/* Başlık */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center shrink-0">
              <BookOpen className="size-6 text-primary" />
            </div>
            <div className="min-w-0">
              {sinif ? (
                <ContextBreadcrumb
                  crumbs={[
                    sinif.ulkeAdi ? { level: 'ulke', label: sinif.ulkeAdi } : null,
                    sinif.kurumAdi ? { level: 'kurum', label: sinif.kurumAdi } : null,
                    { level: 'sinif', label: sinif.name },
                  ]}
                />
              ) : (
                <p className="text-sm text-slate-400">Yükleniyor...</p>
              )}
              <p className="text-slate-500 text-sm mt-1">{sinif?.ogrenciSayisi ?? 0} öğrenci</p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2">
              <span className="font-mono font-bold text-lg tracking-widest text-slate-700">
                {sinif?.katilimKodu ?? '------'}
              </span>
              <button onClick={kopyala} className="text-slate-400 hover:text-primary transition-colors">
                {kodKopyalandi ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
              </button>
            </div>
            <Link
              href={`/ogretmen/sinif/${id}/canli`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-semibold hover:bg-emerald-600 transition-colors"
            >
              <Wifi className="size-4" />
              Canlı Kahoot
            </Link>
          </div>
        </div>

        {/* Sekmeler */}
        <div className="flex gap-1 mb-6 bg-white rounded-2xl border border-slate-100 p-1 shadow-sm overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors flex-1 justify-center',
                tab === t.key
                  ? 'bg-primary text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab içerikleri */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">

          {/* Genel */}
          {tab === 'genel' && (
            <div className="space-y-4">
              {sinif && !sinif.okumaKitabiVarMi && (
                <Link
                  href={`/ogretmen/sinif/${id}/okuma`}
                  className="flex items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
                      <Gift className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 text-sm">Bu sınıfa henüz okuma kitabı atanmadı</div>
                      <div className="text-xs text-slate-500 mt-0.5">Ders kitabı lisansınız kapsamında okuma kitabı PDF&apos;leri ücretsiz — hemen atayın</div>
                    </div>
                  </div>
                  <ArrowLeft className="size-5 text-slate-300 group-hover:text-primary rotate-180 transition-colors shrink-0" />
                </Link>
              )}
              <h2 className="font-semibold text-slate-900">Sınıf Bilgileri</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Öğrenci', value: sinif?.ogrenciSayisi ?? 0, color: 'bg-blue-50 text-blue-600' },
                  { label: 'Katılım Kodu', value: sinif?.katilimKodu ?? '---', color: 'bg-slate-50 text-slate-600' },
                ].map(item => (
                  <div key={item.label} className={cn('rounded-xl p-4', item.color)}>
                    <div className="text-xs font-medium opacity-70 mb-1">{item.label}</div>
                    <div className="font-bold text-lg">{item.value}</div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500">
                Öğrencileriniz <strong>{sinif?.katilimKodu}</strong> kodunu kullanarak sınıfa katılabilir.
              </p>
            </div>
          )}

          {/* Öğrenciler */}
          {tab === 'ogrenciler' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">Öğrenciler</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setQrModalAcik(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <QrCode className="size-3.5" /> QR ile Katıl
                  </button>
                  <button
                    onClick={badgePdfIndir}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    <Download className="size-3.5" /> Badge PDF
                  </button>
                  <button
                    onClick={() => { setTopluModalAcik(true); setTopluSonuclar([]); setKapasiteHatasi(null); setKapasiteTalebiDurumu(null); setTopluTalebiTipi(null); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <UserPlus className="size-3.5" /> Toplu Ekle
                  </button>
                </div>
              </div>

              {/* E-posta ile tek öğrenci ekleme */}
              <div className="flex gap-2 mb-5">
                <input
                  type="email"
                  value={ogrenciEmail}
                  onChange={e => setOgrenciEmail(e.target.value)}
                  placeholder="öğrenci@email.com (e-posta ile ekle)"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={() => ogrenciEmail && ogrenciEkleMutation.mutate(ogrenciEmail)}
                  disabled={!ogrenciEmail || ogrenciEkleMutation.isPending}
                  className="px-4 py-2 bg-slate-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Plus className="size-4" /> Ekle
                </button>
              </div>
              {tekliHata && (
                <div className="flex flex-col items-start gap-2 mb-3">
                  <p className="text-red-500 text-sm">{tekliHata}</p>
                  {tekliKapasiteTalebiDurumu !== null && (
                    <button
                      onClick={() => kurumSorumlusunaBildirMutation.mutate(tekliTalebiTipi === 'sure' ? 'sure' : 'kapasite')}
                      disabled={tekliKapasiteTalebiDurumu || kurumSorumlusunaBildirMutation.isPending}
                      className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50 disabled:bg-slate-400 transition-colors"
                    >
                      {tekliKapasiteTalebiDurumu
                        ? 'Gönderildi ✓'
                        : kurumSorumlusunaBildirMutation.isPending ? 'Gönderiliyor...' : 'Kurum/Ülke sorumlusuna bildir'}
                    </button>
                  )}
                </div>
              )}

              {!ogrenciler?.length ? (
                <p className="text-slate-400 text-sm text-center py-10">Henüz öğrenci yok.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {ogrenciler.map(o => {
                    const gunOnce = o.sonGirisTarihi
                      ? Math.round((Date.now() - new Date(o.sonGirisTarihi).getTime()) / 86400000)
                      : null;
                    return (
                    duzenleOgrenciId === o.userId ? (
                      <div key={o.userId} className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2 my-1">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={duzenleOgrenciForm.ad}
                            onChange={e => setDuzenleOgrenciForm(p => ({ ...p, ad: e.target.value }))}
                            placeholder="Ad *"
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                          />
                          <input
                            type="text"
                            value={duzenleOgrenciForm.soyad}
                            onChange={e => setDuzenleOgrenciForm(p => ({ ...p, soyad: e.target.value }))}
                            placeholder="Soyad"
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                          />
                        </div>
                        {o.pinKullanici && (
                          <input
                            type="text"
                            value={duzenleOgrenciForm.kullaniciAdi}
                            onChange={e => setDuzenleOgrenciForm(p => ({ ...p, kullaniciAdi: e.target.value }))}
                            placeholder="Kullanıcı adı"
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                          />
                        )}
                        {duzenleOgrenciHata && <p className="text-xs text-red-500">{duzenleOgrenciHata}</p>}
                        <div className="flex gap-2">
                          <button
                            onClick={() => ogrenciDuzenleMutation.mutate(o.userId)}
                            disabled={!duzenleOgrenciForm.ad || ogrenciDuzenleMutation.isPending}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => { setDuzenleOgrenciId(null); setDuzenleOgrenciHata(null); }}
                            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                    <div key={o.userId} className={cn('flex items-center justify-between py-3 group', !o.isActive && 'opacity-60')}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                          {o.ad.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-slate-800 flex items-center gap-2">
                            {o.ad}
                            {!o.isActive && (
                              <span className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                Dondu
                              </span>
                            )}
                          </div>
                          {(o.pinKullanici ? o.kullaniciAdi : o.email) && (
                            <div className="text-xs text-slate-400 font-mono truncate" title={o.pinKullanici ? o.kullaniciAdi! : o.email!}>
                              {o.pinKullanici ? o.kullaniciAdi : o.email}
                            </div>
                          )}
                          <div className="text-xs text-slate-400">
                            {o.tamamlananUnite} ünite tamamlandı · {o.toplamPuan} XP
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-400">
                          {gunOnce === null ? 'Hiç girmedi' : gunOnce === 0 ? 'Bugün' : `${gunOnce} gün önce`}
                        </div>
                        {!o.isActive ? (
                          <button
                            title="Yeniden Aktif Et"
                            onClick={() => yenidenAktifMutation.mutate(o.userId)}
                            className="size-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            <RotateCw className="size-3.5" />
                          </button>
                        ) : (
                          <>
                            {o.isActive && (
                              <button
                                title="Düzenle"
                                onClick={() => startOgrenciDuzenle(o)}
                                className="size-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                              >
                                <Pencil className="size-3.5" />
                              </button>
                            )}
                            {o.pinKullanici && (
                              <button
                                title="PIN'i sıfırla"
                                onClick={() => {
                                  if (confirm(`${o.ad} için yeni bir PIN üretilecek, eski PIN geçersiz olacak. Devam edilsin mi?`))
                                    pinYenileMutation.mutate(o.userId);
                                }}
                                className="size-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                              >
                                <KeyRound className="size-3.5" />
                              </button>
                            )}
                            <button
                              title="Dondur"
                              onClick={() => {
                                if (confirm('Öğrenci dondurulacak, listede soluk görünecek ve derslere giremeyecek.\n\nNot: Lisans kotası iade edilmez. "Yeniden Aktif Et" ile geri alabilirsiniz.'))
                                  ogrenciSilMutation.mutate(o.userId);
                              }}
                              className="size-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-amber-600 hover:bg-amber-50 transition-colors opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </>
                        )}
                        {((sinif?.kaliciSilmeSerbestMi ?? false) || !o.etkinlikYaptiMi) && (
                          <button
                            title="Kalıcı Sil"
                            onClick={() => {
                              if (confirm(`${o.ad} kalıcı olarak silinecek. Bu işlem GERİ ALINAMAZ. Devam edilsin mi?`))
                                kaliciSilMutation.mutate(o.userId);
                            }}
                            className="size-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                          >
                            <UserX className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    )
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Raporlar */}
          {tab === 'raporlar' && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-4">İlerleme Raporu</h2>
              <div className="space-y-3">
                <Link
                  href={`/ogretmen/sinif/${id}/raporlar`}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <div>
                    <div className="font-medium text-slate-800">Öğrenci × Ünite Heatmap</div>
                    <div className="text-sm text-slate-500 mt-0.5">Her öğrencinin her ünitedeki ilerleme oranını görün</div>
                  </div>
                  <ArrowLeft className="size-5 text-slate-300 group-hover:text-primary rotate-180 transition-colors" />
                </Link>
              </div>
            </div>
          )}

          {/* Ödevler */}
          {tab === 'odevler' && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-4">Ödevler</h2>
              <div className="bg-slate-50 rounded-xl p-4 mb-5 space-y-3">
                <input
                  type="text"
                  value={yeniOdev.baslik}
                  onChange={e => setYeniOdev(p => ({ ...p, baslik: e.target.value }))}
                  placeholder="Ödev başlığı *"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                />
                <textarea
                  value={yeniOdev.aciklama}
                  onChange={e => setYeniOdev(p => ({ ...p, aciklama: e.target.value }))}
                  placeholder="Açıklama (opsiyonel)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-white"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={yeniOdev.teslimTarihi}
                    onChange={e => setYeniOdev(p => ({ ...p, teslimTarihi: e.target.value }))}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                  />
                  <button
                    onClick={() => yeniOdev.baslik && odevMutation.mutate()}
                    disabled={!yeniOdev.baslik || odevMutation.isPending}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                  >
                    Oluştur
                  </button>
                </div>
              </div>

              {!odevler?.length ? (
                <p className="text-slate-400 text-sm text-center py-8">Henüz ödev yok.</p>
              ) : (
                <div className="space-y-2">
                  {odevler.map(o => (
                    duzenleOdevId === o.id ? (
                      <div key={o.id} className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                        <input
                          type="text"
                          value={duzenleOdevForm.baslik}
                          onChange={e => setDuzenleOdevForm(p => ({ ...p, baslik: e.target.value }))}
                          placeholder="Ödev başlığı *"
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                        />
                        <textarea
                          value={duzenleOdevForm.aciklama}
                          onChange={e => setDuzenleOdevForm(p => ({ ...p, aciklama: e.target.value }))}
                          placeholder="Açıklama (opsiyonel)"
                          rows={2}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-white"
                        />
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={duzenleOdevForm.teslimTarihi}
                            onChange={e => setDuzenleOdevForm(p => ({ ...p, teslimTarihi: e.target.value }))}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
                          />
                          <button
                            onClick={() => odevGuncellemeMutation.mutate(o.id)}
                            disabled={!duzenleOdevForm.baslik || odevGuncellemeMutation.isPending}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                          >
                            Kaydet
                          </button>
                          <button
                            onClick={() => setDuzenleOdevId(null)}
                            className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200 transition-colors"
                          >
                            İptal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={o.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100">
                        <div>
                          <div className="font-medium text-sm text-slate-800">{o.baslik}</div>
                          {o.teslimTarihi && (
                            <div className="text-xs text-slate-400 mt-0.5">
                              Son teslim: {new Date(o.teslimTarihi).toLocaleDateString('tr')}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startOdevDuzenle(o)}
                            className="size-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Düzenle"
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            onClick={() => odevSilMutation.mutate(o.id)}
                            className="size-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                            title="Sil"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Okuma */}
          {tab === 'okuma' && (
            <div className="space-y-6">
              {/* Okuma raporu linki */}
              <div>
                <h2 className="font-semibold text-slate-900 mb-3">Okuma Takibi</h2>
                <Link
                  href={`/ogretmen/sinif/${id}/okuma`}
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                      <BookOpen className="size-4 text-blue-500" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-800 text-sm">Okuma İlerleme Raporu</div>
                      <div className="text-xs text-slate-500 mt-0.5">Öğrenci × bölüm grid, risk uyarıları, bölüm açma ve kitap atama</div>
                    </div>
                  </div>
                  <ArrowLeft className="size-5 text-slate-300 group-hover:text-primary rotate-180 transition-colors shrink-0" />
                </Link>
              </div>

              {/* Kelime zorlukları */}
              <div>
                <div className="mb-3">
                  <h2 className="font-semibold text-slate-900">Kelime Zorlukları</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Öğrencilerin en çok çeviri baktığı kelimeler — zordan kolaya sıralı
                  </p>
                </div>
                <WordIntensityPanel sinifId={id} enabled={tab === 'okuma'} />
              </div>
            </div>
          )}

          {/* Duyurular */}
          {tab === 'duyurular' && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-4">Duyurular</h2>
              <div className="mb-5">
                <textarea
                  value={yeniDuyuru}
                  onChange={e => setYeniDuyuru(e.target.value)}
                  placeholder="Sınıfa duyuru yaz..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => yeniDuyuru.trim() && duyuruMutation.mutate()}
                    disabled={!yeniDuyuru.trim() || duyuruMutation.isPending}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
                  >
                    Yayınla
                  </button>
                </div>
              </div>

              {!duyurular?.length ? (
                <p className="text-slate-400 text-sm text-center py-8">Henüz duyuru yok.</p>
              ) : (
                <div className="space-y-3">
                  {duyurular.map(d => (
                    <div key={d.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 group">
                      <p className="text-sm text-slate-700 leading-relaxed">{d.icerik}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span>{new Date(d.olusturmaTarihi).toLocaleDateString('tr')}</span>
                          <span>{d.yorumSayisi} yorum</span>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Bu duyuruyu silmek istediğinizden emin misiniz?'))
                              duyuruSilMutation.mutate(d.id);
                          }}
                          className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-60 group-hover:opacity-100 focus-visible:opacity-100"
                          title="Duyuruyu Sil"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </main>

      {/* QR Kod Modalı */}
      {qrModalAcik && sinif && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">QR ile Sınıfa Katıl</h2>
              <button
                onClick={() => setQrModalAcik(false)}
                className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6">
              <KatilimKoduDavet katilimKodu={sinif.katilimKodu} locale={locale} />
            </div>
          </div>
        </div>
      )}

      {/* PIN Sıfırlama Sonucu Modalı */}
      {pinSifirlaSonuc && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Yeni PIN Üretildi</h2>
              <button
                onClick={() => { setPinSifirlaSonuc(null); qrYenileMutation.reset(); }}
                className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">{pinSifirlaSonuc.ad} için yeni PIN — sadece şimdi görünür, bir daha gösterilemez.</p>
              <div className="text-center py-4 bg-slate-50 rounded-xl">
                <span className="font-mono font-bold text-3xl text-primary tracking-[0.3em]">{pinSifirlaSonuc.pin}</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs">
                <AlertTriangle className="size-3.5 shrink-0" />
                <span>Eski PIN artık geçersiz. Öğrenciye sözlü/yazılı iletin. Badge&apos;de PIN yazmaz, sadece QR — QR de kaybolduysa aşağıdan yenileyin.</span>
              </div>
              {/* qrYenileMutation.isSuccess: PDF sadece QR gerçekten yenilendiyse anlamlı —
                  aksi halde badge zaten geçerli, gereksiz class-genelinde bir indirme tetiklenmesin. */}
              {!qrYenileMutation.isSuccess && (
                <button
                  onClick={() => {
                    if (confirm('Badge de mi kayboldu? Bu öğrencinin QR kodu da yenilenecek, eski badge çalışmaz olacak.'))
                      qrYenileMutation.mutate(pinSifirlaSonuc.userId);
                  }}
                  disabled={qrYenileMutation.isPending}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
                >
                  <RotateCw className="size-3.5" /> Badge de kayboldu, QR&apos;yu da yenile
                </button>
              )}
              {qrYenileMutation.isSuccess ? (
                <button
                  onClick={() => { setPinSifirlaSonuc(null); qrYenileMutation.reset(); badgePdfIndir(); }}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Download className="size-4" /> Yeni QR için Badge PDF İndir (Sınıfın Tamamı)
                </button>
              ) : (
                <button
                  onClick={() => { setPinSifirlaSonuc(null); qrYenileMutation.reset(); }}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Kapat
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toplu Öğrenci Ekleme Modalı */}
      {topluModalAcik && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
            {/* Başlık */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Toplu Öğrenci Ekle</h2>
                <p className="text-xs text-slate-400 mt-0.5">Her satıra bir isim yazın</p>
              </div>
              <button
                onClick={() => setTopluModalAcik(false)}
                className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-5 space-y-4">
              {/* Sonuçlar gelmediyse giriş ekranı */}
              {!topluSonuclar.length && (
                <>
                  <textarea
                    value={isimler}
                    onChange={e => setIsimler(e.target.value)}
                    placeholder={"Ali Yılmaz\nAyşe Kaya\nMehmet Demir"}
                    rows={8}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none font-mono"
                  />

                  {kapasiteHatasi && (
                    <div className="flex flex-col gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                        <span>{kapasiteHatasi}</span>
                      </div>
                      {kapasiteTalebiDurumu !== null && (
                        <button
                          onClick={() => kurumSorumlusunaBildirMutation.mutate(topluTalebiTipi === 'sure' ? 'sure' : 'kapasite')}
                          disabled={kapasiteTalebiDurumu || kurumSorumlusunaBildirMutation.isPending}
                          className="self-start px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50 disabled:bg-slate-400 transition-colors"
                        >
                          {kapasiteTalebiDurumu
                            ? 'Gönderildi ✓'
                            : kurumSorumlusunaBildirMutation.isPending ? 'Gönderiliyor...' : 'Kurum/Ülke sorumlusuna bildir'}
                        </button>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span>Her öğrenci için bir lisans koltuğu tüketilir. Öğrenciyi silerseniz koltuk iade edilmez.</span>
                  </div>
                </>
              )}

              {/* Sonuçlar tablosu */}
              {topluSonuclar.length > 0 && (
                <>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm">
                    <Check className="size-4 shrink-0" />
                    <span><strong>{topluSonuclar.length} öğrenci</strong> başarıyla eklendi. PIN&apos;ler yalnızca şimdi görünür — Badge PDF ile yazdırın.</span>
                  </div>

                  <div className="rounded-xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>
                          <th className="text-left px-3 py-2">Ad</th>
                          <th className="text-left px-3 py-2">Kullanıcı Adı</th>
                          <th className="text-left px-3 py-2 font-bold text-slate-700">PIN</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {topluSonuclar.map(s => (
                          <tr key={s.userId} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-medium text-slate-800">{s.ad}</td>
                            <td className="px-3 py-2 font-mono text-slate-600">{s.kullaniciAdi}</td>
                            <td className="px-3 py-2 font-mono font-bold text-primary tracking-widest">{s.pin}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-slate-100 flex gap-2 justify-end">
              {topluSonuclar.length > 0 ? (
                <>
                  <button
                    onClick={() => { setTopluSonuclar([]); setIsimler(''); }}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Yeni Grup Ekle
                  </button>
                  <button
                    onClick={() => { badgePdfIndir(); setTopluModalAcik(false); }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    <Download className="size-4" /> Badge PDF İndir
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setTopluModalAcik(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    İptal
                  </button>
                  <button
                    onClick={topluEkleGonder}
                    disabled={!isimler.trim() || topluEkleMutation.isPending}
                    className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {topluEkleMutation.isPending && (
                      <div className="size-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    Hesapları Oluştur
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
