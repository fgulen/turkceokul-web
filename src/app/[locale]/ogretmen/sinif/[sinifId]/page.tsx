'use client';

import { use, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from '@/navigation';
import {
  ArrowLeft, BookOpen, Users, ClipboardList, Megaphone,
  Trophy, Copy, Check, Trash2, Plus, Wifi, UserPlus, Download, X, AlertTriangle, Pencil, QrCode,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useAuthStore } from '@/stores/auth';
import { AppNav } from '@/components/app-nav';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Sinif {
  id: number;
  name: string;
  katilimKodu: string;
  dersKitabiId: string | null;
  ogrenciSayisi: number;
}

interface OgrenciOzet {
  userId: number;
  ad: string;
  katilimTarihi: string;
  toplamPuan: number;
  tamamlananUnite: number;
  sonAktivite: string | null;
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

type Tab = 'genel' | 'ogrenciler' | 'raporlar' | 'odevler' | 'duyurular';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'genel', label: 'Genel', icon: BookOpen },
  { key: 'ogrenciler', label: 'Öğrenciler', icon: Users },
  { key: 'raporlar', label: 'Raporlar', icon: Trophy },
  { key: 'odevler', label: 'Ödevler', icon: ClipboardList },
  { key: 'duyurular', label: 'Duyurular', icon: Megaphone },
];

interface WordIntensityDto {
  word: string;
  totalLookups: number;
  uniqueStudents: number;
  classPercentage: number;
  difficulty: 'high' | 'medium' | 'low';
}

function WordIntensityTable({ sinifId, bookId }: { sinifId: number; bookId: string }) {
  const [words, setWords] = useState<WordIntensityDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/okuma/kitap/${bookId}/word-intensity?classId=${sinifId}`)
      .then(r => setWords(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [sinifId, bookId]);

  if (loading) return <p className="text-sm text-muted-foreground">Yükleniyor...</p>;
  if (words.length === 0) return <p className="text-sm text-muted-foreground">Henüz kelime verisi yok.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 pr-4">Kelime</th>
            <th className="text-left py-2 pr-4">Toplam Bakış</th>
            <th className="text-left py-2 pr-4">Sınıf %</th>
            <th className="text-left py-2">Zorluk</th>
          </tr>
        </thead>
        <tbody>
          {words.map(w => (
            <tr key={w.word} className="border-b hover:bg-muted/40">
              <td className="py-2 pr-4 font-medium">{w.word}</td>
              <td className="py-2 pr-4">{w.totalLookups}</td>
              <td className="py-2 pr-4">{w.classPercentage}%</td>
              <td className="py-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  w.difficulty === 'high' ? 'bg-red-100 text-red-700' :
                  w.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {w.difficulty === 'high' ? 'Zor' : w.difficulty === 'medium' ? 'Orta' : 'Kolay'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SinifDetayPage({ params }: { params: Promise<{ sinifId: string }> }) {
  const { sinifId } = use(params);
  const id = parseInt(sinifId);
  const { user, ready } = useAuthGuard('Ogretmen');
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

  // Toplu öğrenci ekleme
  const [topluModalAcik, setTopluModalAcik] = useState(false);
  const [isimler, setIsimler] = useState('');
  const [topluSonuclar, setTopluSonuclar] = useState<TopluEkleSonuc[]>([]);
  const [kapasiteHatasi, setKapasiteHatasi] = useState<string | null>(null);

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
      qc.invalidateQueries({ queryKey: ['sinif-ogrenciler', id] });
      qc.invalidateQueries({ queryKey: ['sinif', id] });
    },
    onError: (err: { response?: { data?: { mesaj?: string } } }) => {
      const mesaj = err.response?.data?.mesaj;
      setKapasiteHatasi(mesaj ?? 'Bir hata oluştu.');
    },
  });

  const ogrenciSilMutation = useMutation({
    mutationFn: (ogrenciId: number) => api.delete(`/api/ogretmen/sinif/${id}/ogrenci/${ogrenciId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sinif-ogrenciler', id] });
      qc.invalidateQueries({ queryKey: ['sinif', id] });
    },
  });

  async function badgePdfIndir() {
    const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5221';
    try {
      const res = await fetch(`${base}/api/ogretmen/sinif/${id}/badge-pdf`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
      alert('PDF indirilemedi. Lütfen tekrar deneyin.');
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

  function topluEkleGonder() {
    const liste = isimler.split('\n').map(s => s.trim()).filter(Boolean);
    if (!liste.length) return;
    setKapasiteHatasi(null);
    setTopluSonuclar([]);
    topluEkleMutation.mutate(liste);
  }

  function kopyala() {
    if (!sinif) return;
    navigator.clipboard.writeText(sinif.katilimKodu);
    setKodKopyalandi(true);
    setTimeout(() => setKodKopyalandi(false), 2000);
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AppNav />

      <main className="max-w-[1000px] mx-auto px-4 py-8">
        {/* Geri */}
        <Link href="/ogretmen" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="size-4" />
          Panele dön
        </Link>

        {/* Başlık */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="size-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <BookOpen className="size-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{sinif?.name ?? '...'}</h1>
              <p className="text-slate-500 text-sm mt-0.5">{sinif?.ogrenciSayisi ?? 0} öğrenci</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
                    onClick={() => { setTopluModalAcik(true); setTopluSonuclar([]); setKapasiteHatasi(null); }}
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
              {ogrenciEkleMutation.isError && (
                <p className="text-red-500 text-sm mb-3">{(ogrenciEkleMutation.error as Error).message}</p>
              )}

              {!ogrenciler?.length ? (
                <p className="text-slate-400 text-sm text-center py-10">Henüz öğrenci yok.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {ogrenciler.map(o => (
                    <div key={o.userId} className="flex items-center justify-between py-3 group">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                          {o.ad.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-800">{o.ad}</div>
                          <div className="text-xs text-slate-400">
                            {o.tamamlananUnite} ünite tamamlandı · {o.toplamPuan} XP
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-slate-400">
                          {o.sonAktivite ? new Date(o.sonAktivite).toLocaleDateString('tr') : 'Hiç girmedi'}
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('Öğrenciyi sınıftan çıkarmak istediğinizden emin misiniz?\n\nNot: Lisans kotası iade edilmez. Yanlış sildiyseniz yönetici ile iletişime geçin.'))
                              ogrenciSilMutation.mutate(o.userId);
                          }}
                          className="size-7 flex items-center justify-center rounded-lg text-slate-200 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
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

          {/* Raporlar */}
          {tab === 'raporlar' && (
            <div>
              <h2 className="font-semibold text-slate-900 mb-4">İlerleme Raporu</h2>
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
                          className="size-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
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

        {/* Kelime Yoğunluğu — OkuGec */}
        <section className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Okuma: Kelime Zorlukları</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Öğrencilerin en çok çeviri baktığı kelimeler — quiz oluşturmak için kullanabilirsiniz.
          </p>
          <WordIntensityTable sinifId={id} bookId="guliverin-seyahatleri" />
        </section>
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
            <div className="p-6 flex flex-col items-center gap-5">
              <QRCodeSVG
                value={sinif.katilimKodu}
                size={200}
                bgColor="#ffffff"
                fgColor="#1a1a2e"
                level="M"
              />
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Katılım Kodu</p>
                <span className="font-mono font-bold text-3xl tracking-widest text-slate-800">
                  {sinif.katilimKodu}
                </span>
              </div>
              <p className="text-xs text-slate-400 text-center">
                Öğrenciler bu QR kodu tarayarak veya kodu girerek sınıfa katılabilir.
              </p>
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
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                      <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                      <span>{kapasiteHatasi}</span>
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
