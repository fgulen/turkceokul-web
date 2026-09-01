'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Building2, GraduationCap, Users, ArrowRightCircle,
  UserPlus, BookOpen, KeyRound, Bell, BarChart3,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useRouter, usePathname } from '@/navigation';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import { SlideOver } from '@/components/slide-over';
import { ConfirmActionModal } from '@/components/confirm-action-modal';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { KurumOlusturSlideOver, KurumDuzenleSlideOver } from '@/components/staff/kurum-form-slideover';
import {
  PersonelListesi, SiniflarTab, DersKitaplariTab, KurumRaporlarTab, KurumlarTab,
  type OgretmenSatiri, type OgrenciSatiri, type SinifSatiri, type KurumRaporOzeti, type KurumLisansGrubu, type KurumSatiri,
} from '@/components/staff/kurum-raporlama-tablari';
import { KurumLisansDurumu } from './kurum-lisans-durumu';

interface UlkePanel {
  id: number;
  name: string;
  kurumlar: KurumSatiri[];
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

type Tab = 'kurumlar' | 'ogretmenler' | 'ogrenciler' | 'siniflar' | 'lisanslar' | 'raporlar';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'kurumlar', label: 'Kurumlar', icon: Building2 },
  { key: 'ogretmenler', label: 'Öğretmenler', icon: GraduationCap },
  { key: 'ogrenciler', label: 'Öğrenciler', icon: Users },
  { key: 'siniflar', label: 'Sınıflar', icon: BookOpen },
  { key: 'lisanslar', label: 'Ders Kitapları', icon: KeyRound },
  { key: 'raporlar', label: 'Raporlar', icon: BarChart3 },
];

export default function UlkeTemsilcisiPage() {
  const { user, ready } = useAuthGuard('Ogretmen');
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: Tab = (searchParams?.get('tab') as Tab) ?? 'ogretmenler';

  const [donusturuluyorId, setDonusturuluyorId] = useState<number | null>(null);
  const [kurumDavetAcik, setKurumDavetAcik] = useState(false);
  const [kurumOlusturAcik, setKurumOlusturAcik] = useState(false);
  const [ogretmenDavetAcik, setOgretmenDavetAcik] = useState(false);
  const [duzenlenecekKurum, setDuzenlenecekKurum] = useState<KurumSatiri | null>(null);
  const [talepPanelAcik, setTalepPanelAcik] = useState(false);
  const [lisansKurumu, setLisansKurumu] = useState<KurumSatiri | null>(null);

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

  const kurumOlusturMutation = useMutation({
    mutationFn: (form: { name: string; sehir: string }) =>
      api.post('/api/ulke-temsilcisi/kurum', { name: form.name, sehir: form.sehir || null })
        .then(r => r.data as { id: number; name: string }),
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
          <KurumlarTab
            veri={panel?.kurumlar}
            yukleniyor={isLoading}
            kurumHref={id => `/ulke-temsilcisi/kurum/${id}`}
            onYeniKurum={() => setKurumOlusturAcik(true)}
            onDuzenle={setDuzenlenecekKurum}
            onLisans={setLisansKurumu}
            ekstraAksiyon={
              <button onClick={() => setKurumDavetAcik(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap">
                <UserPlus className="size-3.5" /> Yeni Kurum Yöneticisi
              </button>
            }
          />
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
          <SiniflarTab veri={siniflar} yukleniyor={siniflarYukleniyor} ulkeGoster={false} />
        )}

        {tab === 'lisanslar' && (
          <DersKitaplariTab gruplar={lisansGruplari} yukleniyor={lisanslarYukleniyor}
            kurumHref={id => `/ulke-temsilcisi/kurum/${id}`} />
        )}

        {tab === 'raporlar' && (
          <KurumRaporlarTab veri={raporlar} yukleniyor={raporlarYukleniyor}
            kurumHref={id => `/ulke-temsilcisi/kurum/${id}/raporlar`} />
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

      <KurumOlusturSlideOver
        open={kurumOlusturAcik}
        onClose={() => setKurumOlusturAcik(false)}
        onOlustur={form => kurumOlusturMutation.mutateAsync(form)}
        olusturuluyor={kurumOlusturMutation.isPending}
        onTamamlandi={() => {
          toast.success('Kurum oluşturuldu.');
          // sinif-form-data: RoleScopedUserForm'un (Yeni Kurum Yöneticisi daveti) ve
          // SinifFormSlideOver'ın Kurum dropdown'u bu query'den besleniyor — invalidate
          // edilmezse yeni kurum orada görünmeye başlaması sayfa yenilenene kadar gecikir.
          queryClient.invalidateQueries({ queryKey: ['ulke-temsilcisi-panel'] });
          queryClient.invalidateQueries({ queryKey: ['ulke-temsilcisi-ogretmenler'] });
          queryClient.invalidateQueries({ queryKey: ['sinif-form-data'] });
        }}
        ulkeAdi={panel?.name}
        ogretmenler={ogretmenler}
        yoneticiApiBase="/api/ulke-temsilcisi"
      />

      {/* Kurum satırından tek tıkla lisans onayı — tam kurum detay sayfasına gitmeye
          gerek kalmadan (o sayfa Öğretmenler/Sınıflar dahil tüm görünüm için kalıyor). */}
      <SlideOver
        open={!!lisansKurumu}
        onClose={() => setLisansKurumu(null)}
        title="Kitaplar"
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
  const [donusturOnayTalep, setDonusturOnayTalep] = useState<BekleyenTalep | null>(null);

  if (!talepler.length) {
    return <p className="text-slate-400 text-sm text-center py-12">Bekleyen talep yok.</p>;
  }

  return (
    <>
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
                onClick={() => setDonusturOnayTalep(t)}
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

    <ConfirmActionModal
      open={!!donusturOnayTalep}
      tone="primary"
      title="Kuruma dönüştür"
      message={
        <>
          <strong>{donusturOnayTalep?.kurumAdi}</strong> adlı demo talebi kalıcı bir <strong>Kurum</strong> kaydına
          dönüştürülecek ve otomatik bir deneme lisansı açılacak. Bu işlem geri alınamaz — devam etmeden önce
          kurum adını ve yetkiliyi bir kez daha kontrol edin.
        </>
      }
      confirmLabel="Evet, dönüştür"
      onConfirm={() => {
        if (!donusturOnayTalep) return;
        const id = donusturOnayTalep.id;
        setDonusturOnayTalep(null);
        onDonustur(id);
      }}
      onCancel={() => setDonusturOnayTalep(null)}
    />
    </>
  );
}
