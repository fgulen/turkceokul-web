'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, GraduationCap, CheckCircle, XCircle,
  Clock, BookOpen, KeyRound, Pencil, Trash2
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useSinifSilMutation, sinifSilOnayi } from '@/hooks/use-sinif-sil-mutation';
import { useRouter, usePathname, Link } from '@/navigation';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { SinifFormSlideOver } from '@/components/sinif-form-slideover';
import { LisansKart, type LisansKarti } from '@/components/lisans-kart';
import { AramaInput, Sayfalama, SortTh, useSiralama, trSirala } from '@/components/staff/table-kit';

interface PanelOgretmen {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  isApproved: boolean;
  lastLoginDate: string | null;
  insertDate: string;
}

function sonGirisMetni(tarih: string | null) {
  if (!tarih) return 'Hiç giriş yapmadı';
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function kayitTarihiMetni(tarih: string) {
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function metinEslesiyorMu(alanlar: (string | null)[], arama: string) {
  if (!arama) return true;
  const q = arama.toLocaleLowerCase('tr');
  return alanlar.some(a => (a ?? '').toLocaleLowerCase('tr').includes(q));
}

interface PanelSinif {
  id: number;
  name: string;
  ogrenciSayisi: number;
  ogretmenAdi: string | null;
}

interface KurumPanel {
  id: number;
  name: string;
  sehir: string | null;
  ogretmenler: PanelOgretmen[];
  siniflar: PanelSinif[];
  ogrenciSayisi: number;
}

// buton degeri API'den gelir: SatinAl | Inceleniyor | EkLisans | UcretsizDene
const BUTON_METIN: Record<string, string> = {
  SatinAl: 'Satın Al',
  Inceleniyor: 'Talebiniz İnceleniyor',
  EkLisans: 'Ek Lisans Al / Kapasiteyi Artır',
  UcretsizDene: 'Ücretsiz Dene',
};

type Tab = 'ozet' | 'ogretmenler' | 'siniflar' | 'lisanslar';

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: 'ozet', label: 'Özet', icon: Building2 },
  { key: 'ogretmenler', label: 'Öğretmenler', icon: GraduationCap },
  { key: 'siniflar', label: 'Sınıflar', icon: BookOpen },
  { key: 'lisanslar', label: 'Ders Kitapları', icon: KeyRound },
];

const SAYFA_BOYUTU = 20;

export default function KurumYoneticisiPage() {
  const { user, ready } = useAuthGuard('Ogretmen');
  const qc = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab: Tab = (searchParams?.get('tab') as Tab) ?? 'ozet';

  function setTab(t: Tab) {
    router.replace(t === 'ozet' ? pathname : `${pathname}?tab=${t}`);
  }

  const [duzenlenecekSinifId, setDuzenlenecekSinifId] = useState<number | null>(null);

  const { data: panel, isLoading } = useQuery<KurumPanel>({
    queryKey: ['kurum-yoneticisi-panel'],
    queryFn: () => api.get('/api/kurum-yoneticisi/panel').then(r => r.data),
    enabled: !!user && user.role === 'KurumYoneticisi',
  });

  const sinifSilMutation = useSinifSilMutation(['kurum-yoneticisi-panel']);

  function handleSinifSil(sinifId: number, name: string) {
    if (sinifSilOnayi(name)) sinifSilMutation.mutate(sinifId);
  }

  const onaylaMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/kurum-yoneticisi/ogretmen/${id}/onayla`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kurum-yoneticisi-panel'] }),
  });

  const reddetMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/kurum-yoneticisi/ogretmen/${id}/reddet`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kurum-yoneticisi-panel'] }),
  });

  // Lisanslar — SuperAdmin policy'yi geçer ama kurumu yoksa API 400 döner; hata inline gösterilir.
  const {
    data: lisanslar,
    isLoading: lisanslarYukleniyor,
    error: lisanslarHatasi,
  } = useQuery<LisansKarti[]>({
    queryKey: ['kurum-yoneticisi-lisanslar'],
    queryFn: () => api.get('/api/kurum-yoneticisi/lisanslar').then(r => r.data),
    enabled: !!user && (user.role === 'KurumYoneticisi' || user.role === 'SuperAdmin'),
    retry: false,
  });

  const [lisansMesaj, setLisansMesaj] = useState<{ id: string; mesaj: string; tip: 'hata' | 'basari' } | null>(null);

  const satinAlMutation = useMutation({
    mutationFn: (dersKitabiId: string) => api.post('/api/kurum-yoneticisi/satin-al', { dersKitabiId }),
    onMutate: () => setLisansMesaj(null),
    onSuccess: (res, dersKitabiId) => {
      setLisansMesaj({ id: dersKitabiId, mesaj: res.data?.mesaj ?? 'Talebiniz alındı.', tip: 'basari' });
      qc.invalidateQueries({ queryKey: ['kurum-yoneticisi-lisanslar'] });
    },
    onError: (err, dersKitabiId) => setLisansMesaj({ id: dersKitabiId, mesaj: apiHataMesaji(err), tip: 'hata' }),
  });

  const denemeMutation = useMutation({
    mutationFn: (dersKitabiId: string) => api.post('/api/kurum-yoneticisi/deneme-baslat', { dersKitabiId }),
    onMutate: () => setLisansMesaj(null),
    onSuccess: (res, dersKitabiId) => {
      setLisansMesaj({ id: dersKitabiId, mesaj: res.data?.mesaj ?? 'Deneme başlatıldı.', tip: 'basari' });
      qc.invalidateQueries({ queryKey: ['kurum-yoneticisi-lisanslar'] });
    },
    onError: (err, dersKitabiId) => setLisansMesaj({ id: dersKitabiId, mesaj: apiHataMesaji(err), tip: 'hata' }),
  });

  if (!ready) return (
    <div className="py-24 flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  const bekleyenSayisi = panel?.ogretmenler.filter(o => !o.isApproved).length ?? 0;

  return (
    <div className="bg-[#F3F4F6]">
      <main className="px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {isLoading ? '...' : panel?.name ?? 'Kurum Paneli'}
          </h1>
          {panel?.sehir && <p className="text-slate-500 text-sm mt-0.5">{panel.sehir}</p>}
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-primary">{panel?.ogretmenler.length ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Öğretmen</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-slate-700">{panel?.siniflar.length ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Sınıf</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-slate-700">{panel?.ogrenciSayisi ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Öğrenci</div>
          </div>
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
              {t.key === 'ogretmenler' && bekleyenSayisi > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs font-bold',
                  tab === t.key ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700',
                )}>
                  {bekleyenSayisi}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'ozet' && (
          <div className="space-y-4">
            {bekleyenSayisi > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="size-4 text-amber-600" />
                  <p className="text-sm font-semibold text-amber-800">
                    {bekleyenSayisi} öğretmen onay bekliyor
                  </p>
                </div>
                <div className="space-y-2">
                  {panel?.ogretmenler.filter(o => !o.isApproved).map(o => (
                    <div key={o.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{o.name} {o.surname}</div>
                        <div className="text-xs text-slate-400">{o.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => reddetMutation.mutate(o.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="size-3.5" />
                        </button>
                        <button
                          onClick={() => onaylaMutation.mutate(o.id)}
                          className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors"
                        >
                          <CheckCircle className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => setTab('ogretmenler')} className="mt-3 text-xs text-amber-700 font-medium hover:underline">
                  Tümünü gör →
                </button>
              </div>
            )}

            <RoleScopedUserForm
              baslik="Öğretmen Davet Et"
              aciklama="Kurumunuza öğretmen eklemek için davet linki oluşturun."
              hedefRolSecenekleri={[{ value: 'Ogretmen', label: 'Öğretmen' }]}
              onOlusturuldu={() => qc.invalidateQueries({ queryKey: ['kurum-yoneticisi-panel'] })}
            />

            {(panel?.siniflar.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-slate-400" />
                    <h2 className="font-semibold text-slate-900">Sınıflar</h2>
                  </div>
                  <button onClick={() => setTab('siniflar')} className="text-xs text-primary font-medium hover:underline">
                    Tümü →
                  </button>
                </div>
                <div className="divide-y divide-slate-50">
                  {panel?.siniflar.slice(0, 5).map(s => (
                    <div key={s.id} className="flex items-center justify-between px-6 py-3">
                      <div>
                        <div className="text-sm font-medium text-slate-800">{s.name}</div>
                        {s.ogretmenAdi && <div className="text-xs text-slate-400">{s.ogretmenAdi}</div>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{s.ogrenciSayisi} öğrenci</span>
                        <Link href={`/ogretmen/sinif/${s.id}`} className="text-primary hover:text-primary/80">
                          →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'ogretmenler' && (
          <OgretmenlerTab
            veri={panel?.ogretmenler}
            yukleniyor={isLoading}
            onOnayla={id => onaylaMutation.mutate(id)}
            onReddet={id => reddetMutation.mutate(id)}
          />
        )}

        {tab === 'siniflar' && (
          <SiniflarTab
            veri={panel?.siniflar}
            yukleniyor={isLoading}
            onDuzenle={id => setDuzenlenecekSinifId(id)}
            onSil={handleSinifSil}
          />
        )}

        {tab === 'lisanslar' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <KeyRound className="size-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Ders Kitapları</h2>
            </div>
            {lisanslarYukleniyor ? (
              <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
            ) : lisanslarHatasi ? (
              <p className="text-slate-500 text-sm text-center py-12 px-6">
                {apiHataMesaji(lisanslarHatasi)}
              </p>
            ) : !lisanslar?.length ? (
              <p className="text-slate-400 text-sm text-center py-12">Kitap bulunamadı.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {lisanslar.map(k => {
                  const beklemede = k.buton === 'Inceleniyor';
                  const gonderiliyor =
                    (satinAlMutation.isPending && satinAlMutation.variables === k.id) ||
                    (denemeMutation.isPending && denemeMutation.variables === k.id);
                  const kartMesaj = lisansMesaj?.id === k.id
                    ? { tip: lisansMesaj.tip, metin: lisansMesaj.mesaj }
                    : null;

                  return (
                    <LisansKart
                      key={k.id}
                      kitap={k}
                      mesaj={kartMesaj}
                      aksiyon={
                        <button
                          disabled={beklemede || gonderiliyor}
                          onClick={() =>
                            k.buton === 'UcretsizDene'
                              ? denemeMutation.mutate(k.id)
                              : satinAlMutation.mutate(k.id)
                          }
                          className={cn(
                            'shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors',
                            beklemede
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : k.buton === 'UcretsizDene'
                                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                : 'bg-primary text-white hover:bg-primary/90',
                            gonderiliyor && 'opacity-60 cursor-wait',
                          )}
                        >
                          {gonderiliyor ? 'Gönderiliyor…' : BUTON_METIN[k.buton] ?? k.buton}
                        </button>
                      }
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      <SinifFormSlideOver
        open={duzenlenecekSinifId !== null}
        onClose={() => setDuzenlenecekSinifId(null)}
        mod="duzenle"
        sinifId={duzenlenecekSinifId ?? undefined}
        onBasarili={() => qc.invalidateQueries({ queryKey: ['kurum-yoneticisi-panel'] })}
      />
    </div>
  );
}

function OgretmenlerTab({ veri, yukleniyor, onOnayla, onReddet }: {
  veri: PanelOgretmen[] | undefined;
  yukleniyor: boolean;
  onOnayla: (id: number) => void;
  onReddet: (id: number) => void;
}) {
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const { sortKey, sortDir, toggleSort } = useSiralama<'name' | 'insertDate' | 'lastLoginDate' | 'isApproved'>('name', () => setSayfa(1));

  const filtreli = useMemo(() => {
    const ham = veri ?? [];
    if (!arama) return ham;
    return ham.filter(o => metinEslesiyorMu([o.name, o.surname, o.email], arama));
  }, [veri, arama]);

  const sirali = useMemo(() => trSirala(filtreli, sortKey, sortDir), [filtreli, sortKey, sortDir]);
  const toplam = sirali.length;
  const totalPages = Math.max(1, Math.ceil(toplam / SAYFA_BOYUTU));
  const sayfalik = sirali.slice((sayfa - 1) * SAYFA_BOYUTU, sayfa * SAYFA_BOYUTU);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <h2 className="text-sm font-semibold text-slate-800">Öğretmenler</h2>
          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs tabular-nums">{toplam}</span>
          <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Ad, e-posta ara..." />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Ad Soyad</SortTh>
              <SortTh colKey="insertDate" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden md:table-cell">Kayıt Tarihi</SortTh>
              <SortTh colKey="lastLoginDate" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden sm:table-cell">Son Giriş</SortTh>
              <SortTh colKey="isApproved" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right">Durum</SortTh>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yukleniyor ? (
              [1, 2, 3].map(i => (
                <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>
              ))
            ) : sayfalik.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">Henüz öğretmen yok.</td></tr>
            ) : (
              sayfalik.map(o => (
                <tr key={o.id} className="odd:bg-white even:bg-slate-50/40">
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {o.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900 truncate">{o.name} {o.surname ?? ''}</div>
                        <div className="text-xs text-slate-400 truncate">{o.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500 hidden md:table-cell">{kayitTarihiMetni(o.insertDate)}</td>
                  <td className="px-4 py-2 text-xs text-slate-500 hidden sm:table-cell">{sonGirisMetni(o.lastLoginDate)}</td>
                  <td className="px-4 py-2 text-right">
                    {!o.isApproved ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onReddet(o.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                        >
                          <XCircle className="size-3.5" />
                          Reddet
                        </button>
                        <button
                          onClick={() => onOnayla(o.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors"
                        >
                          <CheckCircle className="size-3.5" />
                          Onayla
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
                        Onaylı
                      </span>
                    )}
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

function SiniflarTab({ veri, yukleniyor, onDuzenle, onSil }: {
  veri: PanelSinif[] | undefined;
  yukleniyor: boolean;
  onDuzenle: (id: number) => void;
  onSil: (id: number, name: string) => void;
}) {
  const [arama, setArama] = useState('');
  const [sayfa, setSayfa] = useState(1);
  const { sortKey, sortDir, toggleSort } = useSiralama<'name' | 'ogrenciSayisi' | 'ogretmenAdi'>('name', () => setSayfa(1));

  const filtreli = useMemo(() => {
    const ham = veri ?? [];
    if (!arama) return ham;
    return ham.filter(s => metinEslesiyorMu([s.name, s.ogretmenAdi], arama));
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
          <AramaInput value={arama} onChange={v => { setArama(v); setSayfa(1); }} placeholder="Sınıf, öğretmen ara..." />
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <SortTh colKey="name" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort}>Sınıf</SortTh>
              <SortTh colKey="ogretmenAdi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="hidden sm:table-cell">Öğretmen</SortTh>
              <SortTh colKey="ogrenciSayisi" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="center">Öğrenci</SortTh>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {yukleniyor ? (
              [1, 2, 3].map(i => (
                <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-5 rounded bg-slate-100 animate-pulse" /></td></tr>
              ))
            ) : sayfalik.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm">Henüz sınıf yok.</td></tr>
            ) : (
              sayfalik.map(s => (
                <tr key={s.id} className="odd:bg-white even:bg-slate-50/40 group">
                  <td className="px-4 py-2">
                    <Link href={`/ogretmen/sinif/${s.id}`} className="font-medium text-slate-900 hover:text-primary transition-colors">
                      {s.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500 hidden sm:table-cell">{s.ogretmenAdi ?? '—'}</td>
                  <td className="px-4 py-2 text-center text-xs text-slate-600">{s.ogrenciSayisi}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onDuzenle(s.id)}
                        className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-primary hover:bg-primary/10 transition-colors"
                        title="Düzenle"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        onClick={() => onSil(s.id, s.name)}
                        className="size-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Sil"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
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

