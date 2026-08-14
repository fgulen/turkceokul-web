'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  GraduationCap, Users, Building2, Clock, BookOpen, KeyRound, BarChart3, Globe, Bell, Plus, Hourglass,
  Share2, Mail, X,
} from 'lucide-react';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useRouter, usePathname } from '@/navigation';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';
import { SlideOver } from '@/components/slide-over';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import { AramaInput, Sayfalama, SortTh, useSiralama, trSirala } from '@/components/staff/table-kit';
import { BekleyenSiparisRow, type Siparis } from '@/components/staff/bekleyen-siparis-row';
import { KurumOlusturSlideOver, KurumDuzenleSlideOver } from '@/components/staff/kurum-form-slideover';
import {
  PersonelListesi, SiniflarTab, DersKitaplariTab, KurumRaporlarTab, KurumlarTab, OnayDurumuAksiyon,
  type OgretmenSatiri, type OgrenciSatiri, type SinifSatiri, type KurumRaporOzeti, type KurumLisansGrubu, type KurumSatiri,
} from '@/components/staff/kurum-raporlama-tablari';

interface Ulke {
  id: number;
  name: string;
  visible: boolean;
  ogretmenId: number | null;
  ogretmenAdi: string | null;
  kurumSayisi: number;
  ogretmenSayisi: number;
  ogrenciSayisi: number;
}

type Sekme = 'ulkeler' | 'kurumlar' | 'ogretmenler' | 'bekleyen' | 'ogrenciler' | 'siniflar' | 'lisanslar' | 'raporlar' | 'bekleme-listesi';

export default function AdminPage() {
  const { user, ready } = useAuthGuard('Koordinator');
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const sekme: Sekme = (searchParams?.get('tab') as Sekme) ?? 'ulkeler';

  function setSekme(t: Sekme) {
    router.replace(t === 'ulkeler' ? pathname : `${pathname}?tab=${t}`);
  }

  const [siparisPanelAcik, setSiparisPanelAcik] = useState(false);
  const [ogretmenDavetAcik, setOgretmenDavetAcik] = useState(false);
  const [kurumOlusturAcik, setKurumOlusturAcik] = useState(false);
  const [duzenlenecekKurum, setDuzenlenecekKurum] = useState<KurumSatiri | null>(null);
  const [ulkeOlusturAcik, setUlkeOlusturAcik] = useState(false);

  // "Yeni Kurum" formundaki Ülke dropdown'u — Ülkeler sekmesindeki zengin listeden
  // ayrı, sadece id/name.
  const { data: davetUlkeler } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['davet-ulkeler'],
    queryFn: () => api.get('/api/davet/ulkeler').then(r => r.data),
    enabled: !!user,
  });

  const { data: ulkelerData, isLoading: ulkelerYukleniyor } = useQuery<{ liste: Ulke[] }>({
    queryKey: ['admin-ulkeler'],
    queryFn: () => api.get('/api/admin/ulkeler').then(r => r.data),
    enabled: !!user,
  });
  const ulkelerListe = ulkelerData?.liste ?? [];

  const { data: bekleyenSiparisler, isLoading: siparislerYukleniyor } = useQuery<Siparis[]>({
    queryKey: ['admin-siparisler-bekleyen'],
    queryFn: () => api.get('/api/admin/siparisler', { params: { durum: 'Beklemede' } }).then(r => r.data),
    enabled: !!user,
  });

  // Ülke-temsilcisi panelindeki tab'ların ülke-scope'suz (tüm ülkeler) hali —
  // bkz. kurum-raporlama-tablari.tsx paylaşılan bileşenler.
  const { data: ogretmenler, isLoading: ogretmenlerYukleniyor } = useQuery<OgretmenSatiri[]>({
    queryKey: ['admin-ogretmenler-hepsi'],
    queryFn: () => api.get('/api/admin/ogretmenler/hepsi').then(r => r.data),
    enabled: !!user,
  });

  const { data: bekleyenler, isLoading: bekleyenlerYukleniyor } = useQuery<OgretmenSatiri[]>({
    queryKey: ['admin-bekleyen'],
    queryFn: () => api.get('/api/admin/bekleyen-ogretmenler').then(r => r.data),
    enabled: !!user,
  });

  const { data: kurumlar, isLoading: kurumlarYukleniyor } = useQuery<KurumSatiri[]>({
    queryKey: ['admin-kurumlar'],
    queryFn: () => api.get('/api/admin/kurumlar').then(r => r.data),
    enabled: !!user,
  });

  const { data: ogrenciler, isLoading: ogrencilerYukleniyor } = useQuery<OgrenciSatiri[]>({
    queryKey: ['admin-ogrenciler'],
    queryFn: () => api.get('/api/admin/ogrenciler').then(r => r.data),
    enabled: !!user,
  });

  const { data: siniflar, isLoading: siniflarYukleniyor } = useQuery<SinifSatiri[]>({
    queryKey: ['admin-siniflar'],
    queryFn: () => api.get('/api/admin/siniflar').then(r => r.data),
    enabled: !!user,
  });

  const { data: lisansGruplari, isLoading: lisanslarYukleniyor } = useQuery<KurumLisansGrubu[]>({
    queryKey: ['admin-lisanslar'],
    queryFn: () => api.get('/api/admin/lisanslar').then(r => r.data),
    enabled: !!user && sekme === 'lisanslar',
  });

  const { data: raporlar, isLoading: raporlarYukleniyor } = useQuery<KurumRaporOzeti[]>({
    queryKey: ['admin-raporlar'],
    queryFn: () => api.get('/api/admin/raporlar').then(r => r.data),
    enabled: !!user && sekme === 'raporlar',
  });

  const kurumOlusturMutation = useMutation({
    mutationFn: (form: { name: string; sehir: string; ulkeId?: string }) => api.post('/api/admin/kurum-olustur', {
      name: form.name,
      sehir: form.sehir || undefined,
      ulkeId: form.ulkeId ? Number(form.ulkeId) : undefined,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-kurumlar'] });
      setKurumOlusturAcik(false);
    },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  const kurumDuzenleMutation = useMutation({
    mutationFn: (form: { name: string; sehir: string }) =>
      api.put(`/api/admin/kurum/${duzenlenecekKurum!.id}`, { name: form.name, sehir: form.sehir || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-kurumlar'] });
      setDuzenlenecekKurum(null);
    },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  const onaylaMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/admin/ogretmen/${id}/onayla`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bekleyen'] });
      qc.invalidateQueries({ queryKey: ['admin-ogretmenler-hepsi'] });
    },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  const reddetMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/admin/ogretmen/${id}/reddet`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bekleyen'] });
      qc.invalidateQueries({ queryKey: ['admin-ogretmenler-hepsi'] });
    },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  if (!ready) return <div className="py-24 flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  const tabs: { key: Sekme; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'ulkeler', label: 'Ülkeler', icon: <Globe className="size-4" />, badge: ulkelerListe.length },
    { key: 'kurumlar', label: 'Kurumlar', icon: <Building2 className="size-4" />, badge: kurumlar?.length },
    { key: 'ogretmenler', label: 'Öğretmenler', icon: <GraduationCap className="size-4" />, badge: ogretmenler?.length },
    { key: 'bekleyen', label: 'Bekleyen Onay', icon: <Clock className="size-4" />, badge: bekleyenler?.length },
    { key: 'ogrenciler', label: 'Öğrenciler', icon: <Users className="size-4" />, badge: ogrenciler?.length },
    { key: 'siniflar', label: 'Sınıflar', icon: <BookOpen className="size-4" />, badge: siniflar?.length },
    { key: 'lisanslar', label: 'Ders Kitapları', icon: <KeyRound className="size-4" /> },
    { key: 'raporlar', label: 'Raporlar', icon: <BarChart3 className="size-4" /> },
    { key: 'bekleme-listesi', label: 'Bekleme Listesi', icon: <Hourglass className="size-4" /> },
  ];

  const siparisSayisi = bekleyenSiparisler?.length ?? 0;

  return (
    <div className="bg-[#F3F4F6]">
      <TurkishLetterBackdrop variant="admin" opacity={0.04} />
      <main className="px-4 py-10" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Paneli</h1>
            <p className="text-slate-500 text-sm mt-1">Öğretmen ve kurum yönetimi</p>
          </div>
          {!siparislerYukleniyor && siparisSayisi > 0 && (
            <motion.button
              onClick={() => setSiparisPanelAcik(true)}
              title="Bekleyen Siparişler"
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
                {siparisSayisi}
              </motion.span>
            </motion.button>
          )}
        </div>

        {/* Tab navigasyonu — URL'e yazılır (?tab=), geri/ileri ve bookmark çalışır
            (bkz. ulke-temsilcisi/page.tsx). 9 sekme tek satırda sığmaz, mobilde (sm
            altı) sadece ikon gösterilir ve gerekirse yatay kaydırılır. */}
        <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-1 mb-6 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setSekme(t.key)}
              className={cn(
                'flex-1 shrink-0 sm:shrink flex items-center justify-center gap-1.5 py-2.5 px-2.5 sm:px-4 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                sekme === t.key
                  ? 'bg-primary text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
              {(t.badge ?? 0) > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs font-bold',
                  sekme === t.key ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700'
                )}>
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ÜLKELER TAB — silme/düzenleme Super Admin'de kalır, Koordinator ekleyebilir */}
        {sekme === 'ulkeler' && (
          <UlkelerTab veri={ulkelerListe} yukleniyor={ulkelerYukleniyor} onYeniUlke={() => setUlkeOlusturAcik(true)} />
        )}

        {/* KURUMLAR TAB */}
        {sekme === 'kurumlar' && (
          <KurumlarTab
            veri={kurumlar}
            yukleniyor={kurumlarYukleniyor}
            kurumHref={id => `/admin/kurum/${id}`}
            onYeniKurum={() => setKurumOlusturAcik(true)}
            onDuzenle={setDuzenlenecekKurum}
          />
        )}

        {/* ÖĞRETMENLER TAB */}
        {sekme === 'ogretmenler' && (
          <PersonelListesi
            baslik="Öğretmenler"
            veri={ogretmenler}
            yukleniyor={ogretmenlerYukleniyor}
            bosMesaj="Henüz öğretmen yok."
            ikincilKolonBaslik="Kurum"
            ikincilKolonRender={o => (o as OgretmenSatiri).kurumAdi}
            ucuncuKolonBaslik="Ülke"
            ucuncuKolonRender={o => (o as OgretmenSatiri).ulkeAdi ?? '—'}
            ekleButonu={{ etiket: 'Yeni Öğretmen', onClick: () => setOgretmenDavetAcik(true) }}
            sonKolonBaslik="Durum"
            sonKolonRender={o => (
              <OnayDurumuAksiyon
                onaylandi={!!(o as OgretmenSatiri).isApproved}
                onOnayla={() => onaylaMutation.mutate(o.id)}
                onReddet={() => reddetMutation.mutate(o.id)}
              />
            )}
          />
        )}

        {/* BEKLEYEN ONAY TAB — aynı Öğretmenler tablosu, sadece onaysız kayıtlarla */}
        {sekme === 'bekleyen' && (
          <PersonelListesi
            baslik="Bekleyen Onay"
            veri={bekleyenler}
            yukleniyor={bekleyenlerYukleniyor}
            bosMesaj="Bekleyen öğretmen yok."
            ikincilKolonBaslik="Kurum"
            ikincilKolonRender={o => (o as OgretmenSatiri).kurumAdi}
            ucuncuKolonBaslik="Ülke"
            ucuncuKolonRender={o => (o as OgretmenSatiri).ulkeAdi ?? '—'}
            sonKolonBaslik="Durum"
            sonKolonRender={o => (
              <OnayDurumuAksiyon
                onaylandi={false}
                onOnayla={() => onaylaMutation.mutate(o.id)}
                onReddet={() => reddetMutation.mutate(o.id)}
              />
            )}
          />
        )}

        {/* ÖĞRENCİLER TAB */}
        {sekme === 'ogrenciler' && (
          <PersonelListesi
            baslik="Öğrenciler"
            veri={ogrenciler}
            yukleniyor={ogrencilerYukleniyor}
            bosMesaj="Henüz öğrenci yok."
            ikincilKolonBaslik="Kurum · Sınıf"
            ikincilKolonRender={o => `${o.kurumAdi} · ${(o as OgrenciSatiri).sinifAdi}`}
            ucuncuKolonBaslik="Ülke"
            ucuncuKolonRender={o => (o as OgrenciSatiri).ulkeAdi ?? '—'}
          />
        )}

        {/* SINIFLAR TAB */}
        {sekme === 'siniflar' && (
          <SiniflarTab veri={siniflar} yukleniyor={siniflarYukleniyor} />
        )}

        {/* DERS KİTAPLARI (LİSANS) TAB */}
        {sekme === 'lisanslar' && (
          <DersKitaplariTab gruplar={lisansGruplari} yukleniyor={lisanslarYukleniyor}
            kurumHref={id => `/admin/kurum/${id}`} />
        )}

        {/* RAPORLAR TAB */}
        {sekme === 'raporlar' && (
          <KurumRaporlarTab veri={raporlar} yukleniyor={raporlarYukleniyor}
            kurumHref={id => `/admin/kurum/${id}`} />
        )}

        {/* BEKLEME LİSTESİ TAB — sınıfsız (bireysel) öğrenciler, server-paginated
            (liste büyüyecek; diğer sekmelerin fetch-all + client-sort desenini kullanmıyor). */}
        {sekme === 'bekleme-listesi' && <BeklemeListesiTab enabled={!!user} />}
      </main>

      {/* Yeni Ekle standardı: buton → SlideOver (bkz. table-kit.tsx başlık yorumu) */}
      <SlideOver open={ogretmenDavetAcik} onClose={() => setOgretmenDavetAcik(false)} title="Yeni Öğretmen" width="sm">
        <RoleScopedUserForm
          bare
          baslik="Öğretmen Davet Et"
          aciklama="Öğretmeni sisteme davet etmek için link oluştur, WhatsApp veya e-posta ile paylaş."
          hedefRolSecenekleri={[{ value: 'Ogretmen', label: 'Öğretmen' }]}
          onOlusturuldu={() => {
            qc.invalidateQueries({ queryKey: ['admin-ogretmenler-hepsi'] });
            setOgretmenDavetAcik(false);
          }}
        />
      </SlideOver>

      <KurumOlusturSlideOver
        open={kurumOlusturAcik}
        onClose={() => setKurumOlusturAcik(false)}
        onOlustur={form => kurumOlusturMutation.mutate(form)}
        olusturuluyor={kurumOlusturMutation.isPending}
        ulkeSecenekleri={davetUlkeler}
      />

      <KurumDuzenleSlideOver
        kurum={duzenlenecekKurum}
        onClose={() => setDuzenlenecekKurum(null)}
        onKaydet={form => kurumDuzenleMutation.mutate(form)}
        kaydediliyor={kurumDuzenleMutation.isPending}
      />

      <UlkeOlusturSlideOver
        open={ulkeOlusturAcik}
        onClose={() => setUlkeOlusturAcik(false)}
        onOlusturuldu={() => {
          qc.invalidateQueries({ queryKey: ['admin-ulkeler'] });
          qc.invalidateQueries({ queryKey: ['davet-ulkeler'] });
          qc.invalidateQueries({ queryKey: ['admin-ogretmenler-hepsi'] });
        }}
        ogretmenler={ogretmenler}
      />

      {/* Bekleyen siparişler — SuperAdmin dashboard'undaki panelin birebir aynısı
          (fiyat/kapasite düzenleme dahil), sadece Koordinator'a açık uç noktalar üzerinden. */}
      <SlideOver open={siparisPanelAcik} onClose={() => setSiparisPanelAcik(false)} title="Bekleyen Siparişler" width="md">
        {!bekleyenSiparisler?.length ? (
          <p className="text-slate-400 text-sm text-center py-12">Bekleyen sipariş yok.</p>
        ) : (
          <div className="space-y-3">
            {bekleyenSiparisler.map(s => (
              <BekleyenSiparisRow key={s.id} siparis={s}
                siparisEndpoint="/api/admin"
                bekleyenQueryKey={['admin-siparisler-bekleyen']} />
            ))}
          </div>
        )}
      </SlideOver>
    </div>
  );
}

function UlkelerTab({ veri, yukleniyor, onYeniUlke }: { veri: Ulke[]; yukleniyor: boolean; onYeniUlke: () => void }) {
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const { sortKey, sortDir, toggleSort } = useSiralama<'name' | 'ogretmenAdi' | 'kurumSayisi' | 'ogretmenSayisi' | 'ogrenciSayisi'>('name', () => setSayfa(1));

  const filtreli = useMemo(() => {
    if (!arama) return veri;
    const q = arama.toLocaleLowerCase('tr');
    return veri.filter(u => u.name.toLocaleLowerCase('tr').includes(q) || (u.ogretmenAdi ?? '').toLocaleLowerCase('tr').includes(q));
  }, [veri, arama]);
  const sirali = useMemo(() => trSirala(filtreli, sortKey, sortDir), [filtreli, sortKey, sortDir]);
  const toplam = sirali.length;
  const SAYFA_BOYUTU = 20;
  const totalPages = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));
  const sayfalik = sirali.slice((sayfa - 1) * SAYFA_BOYUTU, sayfa * SAYFA_BOYUTU);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Ülkeler</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{toplam}</span>
          <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Ülke, sorumlu öğretmen ara..." />
          <button onClick={onYeniUlke}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90 transition-opacity whitespace-nowrap">
            <Plus className="size-3.5" /> Yeni Ülke
          </button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Ülke</SortTh>
              <SortTh colKey="ogretmenAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden sm:table-cell">Sorumlu Öğretmen</SortTh>
              <SortTh colKey="kurumSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Kurum</SortTh>
              <SortTh colKey="ogretmenSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Öğretmen</SortTh>
              <SortTh colKey="ogrenciSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Öğrenci</SortTh>
              <th className="px-4 py-2.5 text-right font-medium text-slate-600">Durum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yukleniyor ? (
              [1, 2, 3].map(i => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>)
            ) : sayfalik.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Kayıt bulunamadı.</td></tr>
            ) : (
              sayfalik.map(u => (
                <tr key={u.id} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2 font-medium text-slate-900">{u.name}</td>
                  <td className="px-4 py-2 text-xs text-slate-500 hidden sm:table-cell">{u.ogretmenAdi ?? '—'}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-600">{u.kurumSayisi}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-600">{u.ogretmenSayisi}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-600">{u.ogrenciSayisi}</td>
                  <td className="px-4 py-2 text-right">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', u.visible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {u.visible ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
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

interface BeklemeSatiri {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  beklemeUlke: string | null;
  seviye: 'Baslangic' | 'Orta' | 'Ileri' | null;
  yasGrubu: 'Cocuk' | 'Genc' | 'Yetiskin' | null;
  insertDate: string;
}

const SEVIYE_ETIKET: Record<string, string> = { Baslangic: 'Yeni başlıyor', Orta: 'Biraz biliyor', Ileri: 'İleri seviye' };
const YAS_ETIKET: Record<string, string> = { Cocuk: 'Çocuk (6-12)', Genc: 'Genç (13-17)', Yetiskin: '18 yaş ve üzeri' };

// Sınıfsız (bireysel) öğrenci bekleme listesi — kayıt sırasında toplanan ülke/seviye/
// yaş bilgisiyle, bireysel plan açıldığında iletişim için. Diğer admin sekmelerinin
// aksine server-side sayfalanır (liste büyüyecek, fetch-all + client-sort ölçeklenmez).
function BeklemeListesiTab({ enabled }: { enabled: boolean }) {
  const [sayfa, setSayfa] = useState(1);
  const SAYFA_BOYUTU = 50;

  const { data, isLoading } = useQuery<{ toplam: number; liste: BeklemeSatiri[] }>({
    queryKey: ['admin-bekleme-listesi', sayfa],
    queryFn: () => api.get('/api/admin/bekleme-listesi', { params: { sayfa, sayfaBoyutu: SAYFA_BOYUTU } }).then(r => r.data),
    enabled,
  });

  const toplam = data?.toplam ?? 0;
  const totalPages = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Bekleme Listesi</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{toplam}</span>
          <p className="ml-auto text-xs text-slate-400">Sınıfına bağlı olmayan bireysel öğrenciler</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">Ad Soyad</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600">E-posta</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 hidden sm:table-cell">Ülke</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 hidden sm:table-cell">Seviye</th>
              <th className="px-4 py-2.5 text-left font-medium text-slate-600 hidden md:table-cell">Yaş Grubu</th>
              <th className="px-4 py-2.5 text-right font-medium text-slate-600">Kayıt Tarihi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [1, 2, 3].map(i => <tr key={i}><td colSpan={6} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>)
            ) : !data?.liste.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Bekleme listesinde kimse yok.</td></tr>
            ) : (
              data.liste.map(o => (
                <tr key={o.id} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2 font-medium text-slate-900">{o.name} {o.surname}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">{o.email}</td>
                  <td className="px-4 py-2 text-xs text-slate-600 hidden sm:table-cell">{o.beklemeUlke ?? '—'}</td>
                  <td className="px-4 py-2 text-xs text-slate-600 hidden sm:table-cell">{o.seviye ? SEVIYE_ETIKET[o.seviye] : '—'}</td>
                  <td className="px-4 py-2 text-xs text-slate-600 hidden md:table-cell">{o.yasGrubu ? YAS_ETIKET[o.yasGrubu] : '—'}</td>
                  <td className="px-4 py-2 text-right text-xs text-slate-500">{new Date(o.insertDate).toLocaleDateString('tr-TR')}</td>
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

function UlkeOlusturSlideOver({ open, onClose, onOlusturuldu, ogretmenler }: {
  open: boolean;
  onClose: () => void;
  /** Ülke oluşturulduğunda çağrılır — temsilci adımı ayrı başarısız olsa bile
   *  ülke zaten var olduğu için parent cache'i tazelemeli. */
  onOlusturuldu: () => void;
  /** "Mevcut kullanıcıdan seç" araması bu listeden client-side filtrelenir. */
  ogretmenler: OgretmenSatiri[] | undefined;
}) {
  const [name, setName] = useState('');
  const [temsilciMod, setTemsilciMod] = useState<'yok' | 'mevcut' | 'davet'>('yok');
  const [ogretmenQuery, setOgretmenQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [seciliOgretmen, setSeciliOgretmen] = useState<{ id: number; ad: string } | null>(null);
  const [asama, setAsama] = useState<'form' | 'davet-hazir'>('form');
  const [davetEmail, setDavetEmail] = useState('');
  const [davetUrl, setDavetUrl] = useState<string | null>(null);
  const [davetMailGonderildi, setDavetMailGonderildi] = useState(false);
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setTemsilciMod('yok');
    setOgretmenQuery('');
    setShowDropdown(false);
    setSeciliOgretmen(null);
    setAsama('form');
    setDavetEmail('');
    setDavetUrl(null);
    setDavetMailGonderildi(false);
    setGonderiliyor(false);
    setHata(null);
  }, [open]);

  const adaylar = useMemo(() => {
    if (!ogretmenler || !ogretmenQuery.trim()) return [];
    const q = ogretmenQuery.toLocaleLowerCase('tr');
    return ogretmenler
      .filter(o => o.isApproved)
      .filter(o => `${o.name} ${o.surname ?? ''}`.toLocaleLowerCase('tr').includes(q) || o.email.toLocaleLowerCase('tr').includes(q))
      .slice(0, 8);
  }, [ogretmenler, ogretmenQuery]);

  async function gonder() {
    setHata(null);
    setGonderiliyor(true);

    let ulkeId: number;
    let ulkeAdi: string;
    try {
      const res = await api.post('/api/admin/ulke', { name: name.trim() });
      ulkeId = res.data.id;
      ulkeAdi = res.data.name;
    } catch (err) {
      setGonderiliyor(false);
      setHata(apiHataMesaji(err));
      return;
    }

    onOlusturuldu();

    if (temsilciMod === 'yok') {
      setGonderiliyor(false);
      onClose();
      return;
    }

    try {
      if (temsilciMod === 'mevcut' && seciliOgretmen) {
        await api.put(`/api/admin/ulke/${ulkeId}/temsilci`, { userId: seciliOgretmen.id });
        toast.success(`${seciliOgretmen.ad} artık "${ulkeAdi}" temsilcisi`);
        onOlusturuldu();
        setGonderiliyor(false);
        onClose();
        return;
      }

      const davetRes = await api.post('/api/davet/olustur', {
        hedefRol: 'UlkeTemsilcisi',
        ulkeId,
        hedefEmail: davetEmail.trim() || undefined,
      });
      setGonderiliyor(false);
      setDavetUrl(davetRes.data.url);
      setDavetMailGonderildi(!!davetEmail.trim() && davetRes.data.mailGonderildi);
      setAsama('davet-hazir');
    } catch (err) {
      setGonderiliyor(false);
      toast.error(`"${ulkeAdi}" oluşturuldu ama temsilci ataması başarısız oldu: ${apiHataMesaji(err)}. Ülkeler listesinden tekrar deneyebilirsiniz.`);
      onClose();
    }
  }

  const gonderilebilir = !!name.trim() && !(temsilciMod === 'mevcut' && !seciliOgretmen);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={asama === 'davet-hazir' ? 'Davet Linki Hazır' : 'Yeni Ülke'}
      width="sm"
      footer={
        asama === 'davet-hazir' ? (
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
          >
            Kapat
          </button>
        ) : (
          <button
            form="ulke-olustur-form"
            type="submit"
            disabled={gonderiliyor || !gonderilebilir}
            className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {gonderiliyor ? 'Oluşturuluyor…' : 'Oluştur'}
          </button>
        )
      }
    >
      {asama === 'davet-hazir' && davetUrl ? (
        <div className="space-y-3">
          {davetEmail.trim() && (
            davetMailGonderildi ? (
              <p className="text-xs text-emerald-600 font-medium">✓ {davetEmail.trim()} adresine gönderildi.</p>
            ) : (
              <p className="text-xs text-amber-600 font-medium">
                {davetEmail.trim()} adresine gönderilemedi — linki aşağıdan manuel paylaşın.
              </p>
            )
          )}
          <div className="px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-600 break-all font-mono border border-slate-200">
            {davetUrl}
          </div>
          <div className="flex gap-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Merhaba! Ülke temsilcisi olarak davet edildiniz. Kayıt için: ${davetUrl}`)}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 transition-colors"
            >
              <Share2 className="size-3.5" />
              WhatsApp
            </a>
            {!davetMailGonderildi && (
              <a
                href={`mailto:?subject=Davet&body=${encodeURIComponent(`Merhaba!\n\nÜlke temsilcisi olarak davet edildiniz.\n\nKayıt linkiniz: ${davetUrl}`)}`}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-600 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
              >
                <Mail className="size-3.5" />
                E-posta
              </a>
            )}
          </div>
        </div>
      ) : (
        <form
          id="ulke-olustur-form"
          onSubmit={e => { e.preventDefault(); gonder(); }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Ülke Adı *</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Ülke Temsilcisi</label>
            <div className="flex gap-1.5 mb-2">
              {([
                { key: 'yok', label: 'Şimdi atama' },
                { key: 'mevcut', label: 'Mevcut kullanıcı' },
                { key: 'davet', label: 'Davet oluştur' },
              ] as const).map(o => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setTemsilciMod(o.key)}
                  className={cn(
                    'flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    temsilciMod === o.key
                      ? 'bg-primary text-white border-primary'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50',
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {temsilciMod === 'mevcut' && (
              <div>
                {seciliOgretmen ? (
                  <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
                    <span className="text-xs font-medium text-purple-800 flex-1">{seciliOgretmen.ad}</span>
                    <button type="button" onClick={() => { setSeciliOgretmen(null); setOgretmenQuery(''); }}
                      className="text-purple-400 hover:text-purple-600">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      value={ogretmenQuery}
                      onChange={e => { setOgretmenQuery(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                      placeholder="Öğretmen ara (isim veya e-posta)…"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                    />
                    {showDropdown && adaylar.length > 0 && (
                      <div className="absolute z-20 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-40 overflow-y-auto">
                        {adaylar.map(o => (
                          <button
                            key={o.id}
                            type="button"
                            onMouseDown={e => e.preventDefault()}
                            onClick={() => {
                              setSeciliOgretmen({ id: o.id, ad: `${o.name} ${o.surname ?? ''}`.trim() });
                              setOgretmenQuery('');
                              setShowDropdown(false);
                            }}
                            className="w-full text-left px-3 py-2 hover:bg-purple-50 flex items-baseline gap-1 transition-colors"
                          >
                            <span className="text-xs font-medium text-slate-800">{o.name} {o.surname}</span>
                            <span className="text-[11px] text-slate-400">({o.email})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {!seciliOgretmen && (
                  <p className="text-xs text-slate-400 mt-1">Yalnızca onaylı öğretmenler arasından seçilebilir.</p>
                )}
              </div>
            )}

            {temsilciMod === 'davet' && (
              <div>
                <input
                  type="email"
                  value={davetEmail}
                  onChange={e => setDavetEmail(e.target.value)}
                  placeholder="temsilci@ornek.com (opsiyonel)"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
                />
                <p className="text-xs text-slate-400 mt-1">
                  {davetEmail.trim()
                    ? 'Oluştur\'a bastığınızda davet sistem tarafından bu adrese gönderilir.'
                    : 'Boş bırakırsanız Oluştur\'a bastığınızda WhatsApp/e-posta ile kendiniz paylaşabileceğiniz bir link üretilir.'}
                </p>
              </div>
            )}

            {temsilciMod === 'yok' && (
              <p className="text-xs text-slate-400">Temsilci ataması sonra Ülkeler listesinden de yapılabilir.</p>
            )}
          </div>

          {hata && <p role="alert" className="text-xs text-red-600">{hata}</p>}
        </form>
      )}
    </SlideOver>
  );
}
