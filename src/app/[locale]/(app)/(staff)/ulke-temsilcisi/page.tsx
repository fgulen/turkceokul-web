'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Building2, GraduationCap, Users, ArrowRightCircle, ChevronRight,
  UserPlus, BookOpen, KeyRound, Pencil, Bell, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useRouter, usePathname, Link } from '@/navigation';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import { SlideOver } from '@/components/slide-over';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { LISANS_TIPI_METIN, LISANS_TIPI_ROZET, type LisansKarti } from '@/components/lisans-kart';
import { AramaInput, Sayfalama, SortTh, useSiralama, trSirala } from '@/components/staff/table-kit';
import { KurumLisansDurumu } from './kurum-lisans-durumu';

interface PanelKurum {
  id: number;
  name: string;
  sehir: string | null;
  ogretmenSayisi: number;
  ogrenciSayisi: number;
  kurumYoneticisiAdi: string | null;
}

interface UlkePanel {
  id: number;
  name: string;
  kurumlar: PanelKurum[];
  toplamOgretmen: number;
  toplamOgrenci: number;
}

interface BekleyenTalep {
  id: number;
  kurumId: number | null;
  kurumAdi: string;
  lead: boolean;
  dersKitabiId: string | null;
  ogrenciKapasite: number;
  yetkiliAdi: string | null;
  yetkiliEmail: string | null;
  telefon: string | null;
  tarih: string;
}

interface KatalogKitapAd {
  id: string;
  ad: string;
}

interface OgretmenSatiri {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  lastLoginDate: string | null;
  insertDate: string;
  kurumId: number;
  kurumAdi: string;
}

interface OgrenciSatiri {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  lastLoginDate: string | null;
  insertDate: string;
  kurumAdi: string;
  sinifAdi: string;
}

interface SinifSatiri {
  id: number;
  name: string;
  kurumId: number;
  kurumAdi: string;
  ogrenciSayisi: number;
  dersKitabiId: string | null;
}

interface KurumRaporOzeti {
  kurumId: number;
  kurumAdi: string;
  sehir: string | null;
  ogrenciSayisi: number;
  aktifOgrenciSayisi: number;
  ortalamaIlerleme: number;
  ortalamaPuan: number;
  sonAktivite: string | null;
}

interface KurumLisansGrubu {
  kurumId: number;
  kurumAdi: string;
  kitaplar: LisansKarti[];
}

interface LisansSatiri {
  kurumId: number;
  kurumAdi: string;
  kitap: LisansKarti;
}

type Tab = 'kurumlar' | 'ogretmenler' | 'ogrenciler' | 'siniflar' | 'lisanslar' | 'raporlar';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'kurumlar', label: 'Kurumlar', icon: Building2 },
  { key: 'ogretmenler', label: 'Öğretmenler', icon: GraduationCap },
  { key: 'ogrenciler', label: 'Öğrenciler', icon: Users },
  { key: 'siniflar', label: 'Sınıflar', icon: BookOpen },
  { key: 'lisanslar', label: 'Ders Kitapları', icon: KeyRound },
  { key: 'raporlar', label: 'Raporlar', icon: BarChart3 },
];

const SAYFA_BOYUTU = 20;

function sonGirisMetni(tarih: string | null) {
  if (!tarih) return 'Hiç giriş yapmadı';
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function kayitTarihiMetni(tarih: string) {
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Türkçe case-fold ile ad/e-posta/kurum üzerinde basit arama (client-side; bu ölçekte
// sunucu tarafı sayfalama gerekmiyor — bkz. proje notu: ülke başına birkaç yüz kaydı
// geçmesi uzun vadede beklenmiyor, geçerse tek endpoint server-side'a yükseltilir).
function metinEslesiyorMu(alanlar: (string | null)[], arama: string) {
  if (!arama) return true;
  const q = arama.toLocaleLowerCase('tr');
  return alanlar.some(a => (a ?? '').toLocaleLowerCase('tr').includes(q));
}

export default function UlkeTemsilcisiPage() {
  const { user, ready } = useAuthGuard('Ogretmen');
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: Tab = (searchParams?.get('tab') as Tab) ?? 'ogretmenler';

  const [donusturuluyorId, setDonusturuluyorId] = useState<number | null>(null);
  const [kurumDavetAcik, setKurumDavetAcik] = useState(false);
  const [ogretmenDavetAcik, setOgretmenDavetAcik] = useState(false);
  const [duzenlenecekKurum, setDuzenlenecekKurum] = useState<PanelKurum | null>(null);
  const [talepPanelAcik, setTalepPanelAcik] = useState(false);
  const [lisansKurumu, setLisansKurumu] = useState<PanelKurum | null>(null);

  const gecerli = !!user && user.role === 'UlkeTemsilcisi';

  function setTab(t: Tab) {
    router.replace(t === 'ogretmenler' ? pathname : `${pathname}?tab=${t}`);
  }

  const { data: panel, isLoading } = useQuery<UlkePanel>({
    queryKey: ['ulke-temsilcisi-panel'],
    queryFn: () => api.get('/api/ulke-temsilcisi/panel').then(r => r.data),
    enabled: gecerli,
  });

  const { data: talepler, isLoading: talepYukleniyor } = useQuery<BekleyenTalep[]>({
    queryKey: ['ulke-temsilcisi-bekleyen-talepler'],
    queryFn: () => api.get('/api/ulke-temsilcisi/bekleyen-talepler').then(r => r.data),
    enabled: gecerli,
  });

  // Kitap adları — bekleyen taleplerdeki dersKitabiId'yi okunabilir isme çevirmek için.
  const { data: katalog } = useQuery<{ kitaplar: KatalogKitapAd[] }>({
    queryKey: ['ulke-temsilcisi-katalog-kitap-adlari'],
    queryFn: () => api.get('/api/katalog').then(r => r.data),
    enabled: gecerli,
    staleTime: 5 * 60 * 1000,
  });
  const kitapAdi = (id: string | null) =>
    (id && katalog?.kitaplar.find(k => k.id === id)?.ad) || id || '—';

  const { data: ogretmenler, isLoading: ogretmenlerYukleniyor } = useQuery<OgretmenSatiri[]>({
    queryKey: ['ulke-temsilcisi-ogretmenler'],
    queryFn: () => api.get('/api/ulke-temsilcisi/ogretmenler').then(r => r.data),
    enabled: gecerli,
  });

  const { data: ogrenciler, isLoading: ogrencilerYukleniyor } = useQuery<OgrenciSatiri[]>({
    queryKey: ['ulke-temsilcisi-ogrenciler'],
    queryFn: () => api.get('/api/ulke-temsilcisi/ogrenciler').then(r => r.data),
    enabled: gecerli,
  });

  const { data: siniflar, isLoading: siniflarYukleniyor } = useQuery<SinifSatiri[]>({
    queryKey: ['ulke-temsilcisi-siniflar'],
    queryFn: () => api.get('/api/ulke-temsilcisi/siniflar').then(r => r.data),
    enabled: gecerli,
  });

  // Ulke geneli lisans ozeti — N+1 (kurum basina bir cagri) backend'de yapiliyor,
  // sadece bu sekmeye girildiginde cekilir.
  const { data: lisansGruplari, isLoading: lisanslarYukleniyor } = useQuery<KurumLisansGrubu[]>({
    queryKey: ['ulke-temsilcisi-lisanslar'],
    queryFn: () => api.get('/api/ulke-temsilcisi/lisanslar').then(r => r.data),
    enabled: gecerli && tab === 'lisanslar',
  });

  const { data: raporlar, isLoading: raporlarYukleniyor } = useQuery<KurumRaporOzeti[]>({
    queryKey: ['ulke-temsilcisi-raporlar'],
    queryFn: () => api.get('/api/ulke-temsilcisi/raporlar').then(r => r.data),
    enabled: gecerli && tab === 'raporlar',
  });

  const donusturMutation = useMutation({
    mutationFn: (id: number) =>
      api.post(`/api/ulke-temsilcisi/talep/${id}/kuruma-donustur`, { egitimYili: null }).then(r => r.data),
    onMutate: (id: number) => setDonusturuluyorId(id),
    onSuccess: (data: { mesaj?: string }) => {
      toast.success(data?.mesaj ?? 'Kurum oluşturuldu.');
      queryClient.invalidateQueries({ queryKey: ['ulke-temsilcisi-bekleyen-talepler'] });
      queryClient.invalidateQueries({ queryKey: ['ulke-temsilcisi-panel'] });
    },
    onError: (err: unknown) => {
      const hata = (err as { response?: { data?: { hata?: string } } })?.response?.data?.hata
        ?? 'Dönüştürme başarısız. Lütfen tekrar deneyin.';
      toast.error(hata);
    },
    onSettled: () => setDonusturuluyorId(null),
  });

  const kurumDuzenleMutation = useMutation({
    mutationFn: (form: { name: string; sehir: string }) =>
      api.put(`/api/ulke-temsilcisi/kurum/${duzenlenecekKurum!.id}`, { name: form.name, sehir: form.sehir || null }),
    onSuccess: () => {
      toast.success('Kurum güncellendi');
      queryClient.invalidateQueries({ queryKey: ['ulke-temsilcisi-panel'] });
      setDuzenlenecekKurum(null);
    },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  if (!ready) return (
    <div className="py-24 flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  const talepSayisi = talepler?.length ?? 0;
  const rozetSayisi: Partial<Record<Tab, number>> = {
    kurumlar: panel?.kurumlar.length,
    ogretmenler: panel?.toplamOgretmen,
    ogrenciler: panel?.toplamOgrenci,
    siniflar: siniflar?.length,
  };

  return (
    <div className="bg-[#F3F4F6]">
      <main className="px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isLoading ? '...' : panel?.name ?? 'Ülke Paneli'}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Ülke Temsilcisi Paneli</p>
          </div>
          {!talepYukleniyor && talepSayisi > 0 && (
            <motion.button
              onClick={() => setTalepPanelAcik(true)}
              title="Bekleyen Talepler"
              className="relative shrink-0 size-11 flex items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm text-amber-500 hover:bg-amber-50 transition-colors"
              animate={{ rotate: [0, -14, 11, -8, 5, -2, 0] }}
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
            >
              <Bell className="size-5" />
              <motion.span
                className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-amber-500 text-white text-[11px] font-bold"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
              >
                {talepSayisi}
              </motion.span>
            </motion.button>
          )}
        </div>

        {/* Tab navigasyonu — URL'e yazılır (?tab=), geri/ileri ve bookmark çalışır.
            Mobilde (sm altı) sadece ikon, metin gizlenir — 6 sekme tek satırda sığmaz. */}
        <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-1 mb-6 overflow-x-auto scrollbar-none">
          {TABS.map(t => {
            const normalBadge = rozetSayisi[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={cn(
                  'flex-1 shrink-0 sm:shrink flex items-center justify-center gap-1.5 py-2.5 px-2.5 sm:px-4 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                  tab === t.key ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
              >
                <t.icon className="size-4 shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
                {normalBadge != null ? (
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs font-bold',
                    tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                  )}>
                    {normalBadge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        {tab === 'kurumlar' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="size-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">Kurumlar</h2>
                <span className="text-xs text-slate-400 tabular-nums">{panel?.kurumlar.length ?? 0}</span>
                <button onClick={() => setKurumDavetAcik(true)}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90 transition-opacity">
                  <UserPlus className="size-3.5" /> Yeni Kurum Yöneticisi
                </button>
              </div>
              {isLoading ? (
                <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
              ) : !panel?.kurumlar.length ? (
                <p className="text-slate-400 text-sm text-center py-12">Henüz kurum yok.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {panel.kurumlar.map(k => (
                    <div key={k.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group">
                      <Link href={`/ulke-temsilcisi/kurum/${k.id}`} className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-slate-800">{k.name}</div>
                        <div className="text-xs text-slate-400">
                          {k.kurumYoneticisiAdi ?? 'Kurum yöneticisi atanmamış'}
                        </div>
                      </Link>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <GraduationCap className="size-3.5" /> {k.ogretmenSayisi}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Users className="size-3.5" /> {k.ogrenciSayisi}
                        </span>
                        <button
                          onClick={() => setLisansKurumu(k)}
                          className="size-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-primary hover:bg-primary/10 transition-all"
                          title="Lisans Durumu"
                        >
                          <KeyRound className="size-3.5" />
                        </button>
                        <button
                          onClick={() => setDuzenlenecekKurum(k)}
                          className="size-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all"
                          title="Düzenle"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <Link href={`/ulke-temsilcisi/kurum/${k.id}`}>
                          <ChevronRight className="size-4 text-slate-300" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'ogretmenler' && (
          <PersonelListesi
            baslik="Öğretmenler"
            veri={ogretmenler}
            yukleniyor={ogretmenlerYukleniyor}
            bosMesaj="Henüz öğretmen yok."
            ikincilKolonBaslik="Kurum"
            ikincilKolonRender={o => o.kurumAdi}
            ekleButonu={{ etiket: 'Yeni Öğretmen', onClick: () => setOgretmenDavetAcik(true) }}
          />
        )}

        {tab === 'ogrenciler' && (
          <PersonelListesi
            baslik="Öğrenciler"
            veri={ogrenciler}
            yukleniyor={ogrencilerYukleniyor}
            bosMesaj="Henüz öğrenci yok."
            ikincilKolonBaslik="Kurum · Sınıf"
            ikincilKolonRender={o => `${o.kurumAdi} · ${(o as OgrenciSatiri).sinifAdi}`}
          />
        )}

        {tab === 'siniflar' && (
          <SiniflarTab veri={siniflar} yukleniyor={siniflarYukleniyor} />
        )}

        {tab === 'lisanslar' && (
          <DersKitaplariTab gruplar={lisansGruplari} yukleniyor={lisanslarYukleniyor} />
        )}

        {tab === 'raporlar' && (
          <UlkeRaporlarTab veri={raporlar} yukleniyor={raporlarYukleniyor} />
        )}
      </main>

      {/* Yeni Ekle standardı: buton → SlideOver (bkz. table-kit.tsx başlık yorumu) */}
      <SlideOver open={kurumDavetAcik} onClose={() => setKurumDavetAcik(false)} title="Yeni Kurum Yöneticisi" width="sm">
        <RoleScopedUserForm
          bare
          baslik="Kurum Yöneticisi Davet Et"
          aciklama="Ülkenizde yeni bir okul için kurum yöneticisi davet edin."
          hedefRolSecenekleri={[{ value: 'KurumYoneticisi', label: 'Kurum Yöneticisi' }]}
          onOlusturuldu={() => {
            toast.success('Davet linki oluşturuldu');
            queryClient.invalidateQueries({ queryKey: ['ulke-temsilcisi-panel'] });
          }}
        />
      </SlideOver>

      <SlideOver open={ogretmenDavetAcik} onClose={() => setOgretmenDavetAcik(false)} title="Yeni Öğretmen" width="sm">
        <RoleScopedUserForm
          bare
          baslik="Öğretmen Davet Et"
          aciklama="Ülkenizdeki bir okul için öğretmen davet edin."
          hedefRolSecenekleri={[{ value: 'Ogretmen', label: 'Öğretmen' }]}
          onOlusturuldu={() => {
            toast.success('Davet linki oluşturuldu');
            queryClient.invalidateQueries({ queryKey: ['ulke-temsilcisi-ogretmenler'] });
            queryClient.invalidateQueries({ queryKey: ['ulke-temsilcisi-panel'] });
          }}
        />
      </SlideOver>

      <KurumDuzenleSlideOver
        kurum={duzenlenecekKurum}
        onClose={() => setDuzenlenecekKurum(null)}
        onKaydet={form => kurumDuzenleMutation.mutate(form)}
        kaydediliyor={kurumDuzenleMutation.isPending}
      />

      {/* Kurum satırından tek tıkla lisans onayı — tam kurum detay sayfasına gitmeye
          gerek kalmadan (o sayfa Öğretmenler/Sınıflar dahil tüm görünüm için kalıyor). */}
      <SlideOver
        open={!!lisansKurumu}
        onClose={() => setLisansKurumu(null)}
        title="Lisans Durumu"
        subtitle={lisansKurumu?.name}
        width="md"
      >
        {lisansKurumu && <KurumLisansDurumu kurumId={lisansKurumu.id} />}
      </SlideOver>

      {/* Bildirim/aksiyon kutusu — 4 Şablon Kuralı'nın "SlideOver = hızlı düzenleme"
          varsayılanına bilinçli istisna: burada tekil kayıt değil, zamana duyarlı
          bir liste (bekleyen talepler) gösteriliyor. */}
      <SlideOver open={talepPanelAcik} onClose={() => setTalepPanelAcik(false)} title="Bekleyen Talepler" width="md">
        <BekleyenTaleplerPanel
          talepler={talepler ?? []}
          kitapAdi={kitapAdi}
          donusturuluyorId={donusturuluyorId}
          onDonustur={id => donusturMutation.mutate(id)}
        />
      </SlideOver>
    </div>
  );
}

function BekleyenTaleplerPanel({ talepler, kitapAdi, donusturuluyorId, onDonustur }: {
  talepler: BekleyenTalep[];
  kitapAdi: (id: string | null) => string;
  donusturuluyorId: number | null;
  onDonustur: (id: number) => void;
}) {
  if (!talepler.length) {
    return <p className="text-slate-400 text-sm text-center py-12">Bekleyen talep yok.</p>;
  }

  return (
    <div className="divide-y divide-slate-100 -mx-6">
      {talepler.map(t => (
        <div key={t.id} className="flex flex-col gap-3 px-6 py-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-slate-800">{t.kurumAdi}</span>
              {t.lead ? (
                <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                  Demo Talebi
                </span>
              ) : (
                <span className="text-[10px] font-bold uppercase tracking-wide text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Satın Alma
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {t.yetkiliAdi ?? '—'} · {t.yetkiliEmail ?? '—'}{t.telefon ? ` · ${t.telefon}` : ''}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {kitapAdi(t.dersKitabiId)} · {new Date(t.tarih).toLocaleDateString('tr-TR')}
            </div>
          </div>
          <div className="shrink-0">
            {t.lead ? (
              <button
                onClick={() => onDonustur(t.id)}
                disabled={donusturuluyorId === t.id}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <ArrowRightCircle className="size-3.5" />
                {donusturuluyorId === t.id ? 'Dönüştürülüyor...' : 'Kuruma Dönüştür'}
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic">Onay: SuperAdmin paneli</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function KurumDuzenleSlideOver({ kurum, onClose, onKaydet, kaydediliyor }: {
  kurum: PanelKurum | null;
  onClose: () => void;
  onKaydet: (form: { name: string; sehir: string }) => void;
  kaydediliyor: boolean;
}) {
  const [form, setForm] = useState({ name: '', sehir: '' });

  useEffect(() => {
    if (kurum) setForm({ name: kurum.name, sehir: kurum.sehir ?? '' });
  }, [kurum]);

  return (
    <SlideOver
      open={!!kurum}
      onClose={onClose}
      title="Kurumu Düzenle"
      width="sm"
      footer={
        <button
          form="kurum-duzenle-form"
          type="submit"
          disabled={kaydediliyor || !form.name.trim()}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      }
    >
      {kurum && (
        <form
          id="kurum-duzenle-form"
          onSubmit={e => { e.preventDefault(); onKaydet(form); }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Kurum Adı</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Şehir</label>
            <input
              value={form.sehir}
              onChange={e => setForm(f => ({ ...f, sehir: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>
        </form>
      )}
    </SlideOver>
  );
}

function SiniflarTab({ veri, yukleniyor }: { veri: SinifSatiri[] | undefined; yukleniyor: boolean }) {
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const { sortKey, sortDir, toggleSort } = useSiralama<'name' | 'kurumAdi' | 'ogrenciSayisi'>('name', () => setSayfa(1));

  const filtreli = useMemo(() => {
    const ham = veri ?? [];
    if (!arama) return ham;
    return ham.filter(s => metinEslesiyorMu([s.name, s.kurumAdi], arama));
  }, [veri, arama]);
  const sirali = useMemo(() => trSirala(filtreli, sortKey, sortDir), [filtreli, sortKey, sortDir]);
  const toplam = sirali.length;
  const totalPages = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));
  const sayfalik = sirali.slice((sayfa - 1) * SAYFA_BOYUTU, sayfa * SAYFA_BOYUTU);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Sınıflar</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{toplam}</span>
          <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Sınıf, kurum ara..." />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Sınıf</SortTh>
              <SortTh colKey="kurumAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden sm:table-cell">Kurum</SortTh>
              <SortTh colKey="ogrenciSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Öğrenci</SortTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yukleniyor ? (
              [1, 2, 3].map(i => <tr key={i}><td colSpan={3} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>)
            ) : sayfalik.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Bu ülkede sınıf yok.</td></tr>
            ) : (
              sayfalik.map(s => (
                <tr key={s.id} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2 font-medium text-slate-900">{s.name}</td>
                  <td className="px-4 py-2 text-xs text-slate-500 hidden sm:table-cell">{s.kurumAdi}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-600">{s.ogrenciSayisi}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sayfalama sayfa={sayfa} totalPages={totalPages} toplam={toplam} sayfaBoyutu={SAYFA_BOYUTU} onSayfa={setSayfa} />
    </div>
  );
}

function DersKitaplariTab({ gruplar, yukleniyor }: { gruplar: KurumLisansGrubu[] | undefined; yukleniyor: boolean }) {
  const [arama, setArama] = useState('');
  const { sortKey, sortDir, toggleSort } = useSiralama<'kurumAdi' | 'kitapAdi'>('kurumAdi');

  const satirlar: (LisansSatiri & { kitapAdi: string })[] = useMemo(() =>
    (gruplar ?? []).flatMap(g => g.kitaplar.map(k => ({ kurumId: g.kurumId, kurumAdi: g.kurumAdi, kitap: k, kitapAdi: k.name }))),
  [gruplar]);

  const filtreli = useMemo(() => {
    if (!arama) return satirlar;
    return satirlar.filter(s => metinEslesiyorMu([s.kurumAdi, s.kitapAdi], arama));
  }, [satirlar, arama]);
  const sirali = useMemo(() => trSirala(filtreli, sortKey, sortDir), [filtreli, sortKey, sortDir]);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-slate-800">Ders Kitapları</h2>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{sirali.length}</span>
        <AramaInput value={arama} onChange={setArama} placeholder="Kurum, kitap ara..." />
        <span className="ml-auto text-xs text-slate-400">Aksiyon için kurum sayfasına gidin</span>
      </div>
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr>
            <SortTh colKey="kurumAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kurum</SortTh>
            <SortTh colKey="kitapAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Kitap</SortTh>
            <th className="px-4 py-2.5 text-right font-medium text-slate-600">Durum</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {yukleniyor ? (
            [1, 2, 3].map(i => <tr key={i}><td colSpan={3} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>)
          ) : sirali.length === 0 ? (
            <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400 text-sm">Kayıt bulunamadı.</td></tr>
          ) : (
            sirali.map(s => (
              <tr key={`${s.kurumId}-${s.kitap.id}`} className="odd:bg-white even:bg-slate-50/40">
                <td className="px-4 py-2">
                  <Link href={`/ulke-temsilcisi/kurum/${s.kurumId}`} className="text-slate-900 hover:text-primary transition-colors">
                    {s.kurumAdi}
                  </Link>
                </td>
                <td className="px-4 py-2 text-slate-700">{s.kitapAdi} <span className="text-xs text-slate-400">{s.kitap.seviye}</span></td>
                <td className="px-4 py-2 text-right">
                  {s.kitap.lisansTipi ? (
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', LISANS_TIPI_ROZET[s.kitap.lisansTipi])}>
                      {LISANS_TIPI_METIN[s.kitap.lisansTipi]}
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">Lisans Yok</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

type PersonelSatir = OgretmenSatiri | OgrenciSatiri;
type PersonelSortKey = 'name' | 'kurumAdi' | 'insertDate' | 'lastLoginDate';

function PersonelListesi({ baslik, veri, yukleniyor, bosMesaj, ikincilKolonBaslik, ikincilKolonRender, ekleButonu }: {
  baslik: string;
  veri: PersonelSatir[] | undefined;
  yukleniyor: boolean;
  bosMesaj: string;
  ikincilKolonBaslik: string;
  ikincilKolonRender: (satir: PersonelSatir) => string;
  ekleButonu?: { etiket: string; onClick: () => void };
}) {
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const { sortKey, sortDir, toggleSort } = useSiralama<PersonelSortKey>('name', () => setSayfa(1));

  const filtreli = useMemo(() => {
    const ham = veri ?? [];
    if (!arama) return ham;
    return ham.filter(o => metinEslesiyorMu(
      [o.name, o.surname, o.email, ikincilKolonRender(o)],
      arama,
    ));
  }, [veri, arama, ikincilKolonRender]);

  const sirali = useMemo(() => trSirala(filtreli, sortKey, sortDir), [filtreli, sortKey, sortDir]);
  const toplam = sirali.length;
  const totalPages = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));
  const sayfalik = sirali.slice((sayfa - 1) * SAYFA_BOYUTU, sayfa * SAYFA_BOYUTU);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">{baslik}</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{toplam}</span>
          <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Ad, e-posta ara..." />
          {ekleButonu && (
            <button onClick={ekleButonu.onClick}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
              <UserPlus className="size-3.5" /> {ekleButonu.etiket}
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Ad Soyad</SortTh>
              <SortTh colKey="kurumAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden sm:table-cell">{ikincilKolonBaslik}</SortTh>
              <SortTh colKey="insertDate" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell">Kayıt Tarihi</SortTh>
              <SortTh colKey="lastLoginDate" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Son Giriş</SortTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yukleniyor ? (
              [1, 2, 3].map(i => (
                <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>
              ))
            ) : sayfalik.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">{bosMesaj}</td></tr>
            ) : (
              sayfalik.map(o => (
                <tr key={o.id} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-900 truncate">{o.name} {o.surname ?? ''}</div>
                    <div className="text-xs text-slate-400 truncate">{o.email}</div>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500 hidden sm:table-cell">
                    {ikincilKolonRender(o)}
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500 hidden md:table-cell">{kayitTarihiMetni(o.insertDate)}</td>
                  <td className="px-4 py-2 text-xs text-slate-500 text-right">{sonGirisMetni(o.lastLoginDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Sayfalama sayfa={sayfa} totalPages={totalPages} toplam={toplam} sayfaBoyutu={SAYFA_BOYUTU} onSayfa={setSayfa} />
    </div>
  );
}

function ilerlemeRengi(pct: number): string {
  if (pct >= 80) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-amber-400';
  if (pct >= 20) return 'bg-orange-300';
  return 'bg-slate-200';
}

function sonAktiviteMetni(tarih: string | null) {
  if (!tarih) return 'Hiç aktivite yok';
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const SEHIR_BELIRTILMEMIS = 'Şehir belirtilmemiş';

function UlkeRaporlarTab({ veri, yukleniyor }: { veri: KurumRaporOzeti[] | undefined; yukleniyor: boolean }) {
  const [arama, setArama] = useState('');

  const filtreli = useMemo(() => {
    const ham = veri ?? [];
    if (!arama) return ham;
    return ham.filter(k => metinEslesiyorMu([k.kurumAdi, k.sehir], arama));
  }, [veri, arama]);

  // Sehir'e gore gruplama — sehri olanlar alfabetik, "Sehir belirtilmemiş" en altta.
  // Sadece gorsel/siralama amacli: tek /raporlar cevabi client'ta bolunur.
  const gruplar = useMemo(() => {
    const map = new Map<string, KurumRaporOzeti[]>();
    for (const k of filtreli) {
      const anahtar = k.sehir?.trim() || SEHIR_BELIRTILMEMIS;
      if (!map.has(anahtar)) map.set(anahtar, []);
      map.get(anahtar)!.push(k);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => {
        if (a === SEHIR_BELIRTILMEMIS) return 1;
        if (b === SEHIR_BELIRTILMEMIS) return -1;
        return a.localeCompare(b, 'tr');
      })
      .map(([sehir, kurumlar]) => ({
        sehir,
        kurumlar: trSirala(kurumlar, 'kurumAdi', 'asc'),
        ortalamaIlerleme: kurumlar.reduce((t, k) => t + k.ortalamaIlerleme, 0) / kurumlar.length,
      }));
  }, [filtreli]);

  if (yukleniyor) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>;
  }

  return (
    <div className="space-y-4">
      <AramaInput value={arama} onChange={setArama} placeholder="Kurum, şehir ara..." />
      {gruplar.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-12">Henüz veri yok.</p>
      ) : (
        gruplar.map(g => (
          <div key={g.sehir} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <h2 className="text-sm font-semibold text-slate-800">{g.sehir}</h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{g.kurumlar.length} kurum</span>
              {g.sehir !== SEHIR_BELIRTILMEMIS && (
                <span className="ml-auto text-xs text-slate-400">Şehir ort.: %{Math.round(g.ortalamaIlerleme)}</span>
              )}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-600">Kurum</th>
                  <th className="px-4 py-2.5 text-center font-medium text-slate-600 hidden sm:table-cell">Öğrenci</th>
                  <th className="px-4 py-2.5 text-left font-medium text-slate-600">İlerleme</th>
                  <th className="px-4 py-2.5 text-right font-medium text-slate-600 hidden sm:table-cell">Son Aktivite</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {g.kurumlar.map(k => (
                  <tr key={k.kurumId} className="odd:bg-white even:bg-slate-50/40">
                    <td className="px-4 py-2 font-medium text-slate-900">{k.kurumAdi}</td>
                    <td className="px-4 py-2 text-center text-xs text-slate-600 hidden sm:table-cell">
                      {k.aktifOgrenciSayisi}/{k.ogrenciSayisi} aktif
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn('h-full rounded-full transition-all', ilerlemeRengi(k.ortalamaIlerleme))} style={{ width: `${Math.round(k.ortalamaIlerleme)}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-500 w-9 text-right">%{Math.round(k.ortalamaIlerleme)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-slate-400 hidden sm:table-cell">{sonAktiviteMetni(k.sonAktivite)}</td>
                    <td className="px-4 py-2">
                      <Link href={`/ulke-temsilcisi/kurum/${k.kurumId}/raporlar`}>
                        <ChevronRight className="size-4 text-slate-300" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
      <p className="text-xs text-slate-400 px-1">
        Bu sıralama farklı sayıda etkinlik atanmış kurumları birebir kıyaslamaz, genel eğilimi gösterir.
      </p>
    </div>
  );
}
