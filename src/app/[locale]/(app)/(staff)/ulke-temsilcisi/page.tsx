'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, GraduationCap, Users, Clock, ArrowRightCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useRouter, usePathname, Link } from '@/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { AramaInput, Sayfalama, SortTh, useSiralama, trSirala } from '@/components/staff/table-kit';

interface PanelKurum {
  id: number;
  name: string;
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

type Tab = 'ozet' | 'kurumlar' | 'ogretmenler' | 'ogrenciler';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'ozet', label: 'Özet', icon: Clock },
  { key: 'kurumlar', label: 'Kurumlar', icon: Building2 },
  { key: 'ogretmenler', label: 'Öğretmenler', icon: GraduationCap },
  { key: 'ogrenciler', label: 'Öğrenciler', icon: Users },
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
  const tab: Tab = (searchParams?.get('tab') as Tab) ?? 'ozet';

  const [donusturuluyorId, setDonusturuluyorId] = useState<number | null>(null);

  function setTab(t: Tab) {
    router.replace(t === 'ozet' ? pathname : `${pathname}?tab=${t}`);
  }

  const { data: panel, isLoading } = useQuery<UlkePanel>({
    queryKey: ['ulke-temsilcisi-panel'],
    queryFn: () => api.get('/api/ulke-temsilcisi/panel').then(r => r.data),
    enabled: !!user && user.role === 'UlkeTemsilcisi',
  });

  const { data: talepler, isLoading: talepYukleniyor } = useQuery<BekleyenTalep[]>({
    queryKey: ['ulke-temsilcisi-bekleyen-talepler'],
    queryFn: () => api.get('/api/ulke-temsilcisi/bekleyen-talepler').then(r => r.data),
    enabled: !!user && user.role === 'UlkeTemsilcisi',
  });

  // Kitap adları — bekleyen taleplerdeki dersKitabiId'yi okunabilir isme çevirmek için.
  const { data: katalog } = useQuery<{ kitaplar: KatalogKitapAd[] }>({
    queryKey: ['ulke-temsilcisi-katalog-kitap-adlari'],
    queryFn: () => api.get('/api/katalog').then(r => r.data),
    enabled: !!user && user.role === 'UlkeTemsilcisi',
    staleTime: 5 * 60 * 1000,
  });
  const kitapAdi = (id: string | null) =>
    (id && katalog?.kitaplar.find(k => k.id === id)?.ad) || id || '—';

  const { data: ogretmenler, isLoading: ogretmenlerYukleniyor } = useQuery<OgretmenSatiri[]>({
    queryKey: ['ulke-temsilcisi-ogretmenler'],
    queryFn: () => api.get('/api/ulke-temsilcisi/ogretmenler').then(r => r.data),
    enabled: !!user && user.role === 'UlkeTemsilcisi',
  });

  const { data: ogrenciler, isLoading: ogrencilerYukleniyor } = useQuery<OgrenciSatiri[]>({
    queryKey: ['ulke-temsilcisi-ogrenciler'],
    queryFn: () => api.get('/api/ulke-temsilcisi/ogrenciler').then(r => r.data),
    enabled: !!user && user.role === 'UlkeTemsilcisi',
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

  if (!ready) return (
    <div className="py-24 flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="bg-[#F3F4F6]">
      <main className="px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {isLoading ? '...' : panel?.name ?? 'Ülke Paneli'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Ülke Temsilcisi Paneli</p>
        </div>

        {/* Tab navigasyonu — URL'e yazılır (?tab=), geri/ileri ve bookmark çalışır */}
        <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-1 mb-6 overflow-x-auto scrollbar-none">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 shrink-0 sm:shrink flex items-center justify-center gap-2 py-2.5 px-3 sm:px-4 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                tab === t.key ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              )}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'ozet' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => setTab('kurumlar')}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:bg-slate-50 transition-colors">
                <div className="text-2xl font-bold text-primary">{panel?.kurumlar.length ?? 0}</div>
                <div className="text-xs text-slate-500 mt-1">Kurum</div>
              </button>
              <button onClick={() => setTab('ogretmenler')}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:bg-slate-50 transition-colors">
                <div className="text-2xl font-bold text-slate-700">{panel?.toplamOgretmen ?? 0}</div>
                <div className="text-xs text-slate-500 mt-1">Öğretmen</div>
              </button>
              <button onClick={() => setTab('ogrenciler')}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:bg-slate-50 transition-colors">
                <div className="text-2xl font-bold text-slate-700">{panel?.toplamOgrenci ?? 0}</div>
                <div className="text-xs text-slate-500 mt-1">Öğrenci</div>
              </button>
            </div>

            {!talepYukleniyor && !!talepler?.length && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <Clock className="size-4 text-amber-500" />
                  <h2 className="font-semibold text-slate-900">Bekleyen Talepler</h2>
                  <span className="ml-auto text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    {talepler.length}
                  </span>
                </div>
                <div className="divide-y divide-slate-50">
                  {talepler.map(t => (
                    <div key={t.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-6 py-4">
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
                            onClick={() => donusturMutation.mutate(t.id)}
                            disabled={donusturuluyorId === t.id}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
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
              </div>
            )}
          </div>
        )}

        {tab === 'kurumlar' && (
          <div className="space-y-4">
            <RoleScopedUserForm
              baslik="Kurum Yöneticisi Davet Et"
              aciklama="Ülkenizde yeni bir okul için kurum yöneticisi davet edin."
              hedefRolSecenekleri={[{ value: 'KurumYoneticisi', label: 'Kurum Yöneticisi' }]}
            />

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="size-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">Kurumlar</h2>
                <span className="ml-auto text-xs text-slate-400 tabular-nums">{panel?.kurumlar.length ?? 0}</span>
              </div>
              {isLoading ? (
                <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
              ) : !panel?.kurumlar.length ? (
                <p className="text-slate-400 text-sm text-center py-12">Henüz kurum yok.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {panel.kurumlar.map(k => (
                    <Link
                      key={k.id}
                      href={`/ulke-temsilcisi/kurum/${k.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-sm text-slate-800">{k.name}</div>
                        <div className="text-xs text-slate-400">
                          {k.kurumYoneticisiAdi ?? 'Kurum yöneticisi atanmamış'}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <GraduationCap className="size-3.5" /> {k.ogretmenSayisi}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Users className="size-3.5" /> {k.ogrenciSayisi}
                        </span>
                        <ChevronRight className="size-4 text-slate-300" />
                      </div>
                    </Link>
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
      </main>
    </div>
  );
}

type PersonelSatir = OgretmenSatiri | OgrenciSatiri;
type PersonelSortKey = 'name' | 'kurumAdi' | 'insertDate' | 'lastLoginDate';

function PersonelListesi({ baslik, veri, yukleniyor, bosMesaj, ikincilKolonBaslik, ikincilKolonRender }: {
  baslik: string;
  veri: PersonelSatir[] | undefined;
  yukleniyor: boolean;
  bosMesaj: string;
  ikincilKolonBaslik: string;
  ikincilKolonRender: (satir: PersonelSatir) => string;
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
