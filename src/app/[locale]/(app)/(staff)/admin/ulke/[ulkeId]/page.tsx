'use client';

// Ülke detayı (Koordinator/SuperAdmin) — admin/page.tsx'teki Ülkeler sekmesi
// satırından tıklanır. Kurumlar/Öğretmenler/Öğrenciler/Sınıflar, admin panelinin
// zaten çektiği global listelerin bu ülkeye filtrelenmiş hali (aynı query key'ler,
// cache paylaşılır — admin sayfasından gelindiyse ek fetch olmaz).
// İsim değiştirme/silme kasıtlı olarak Super Admin'de kalır (bkz. admin/page.tsx
// üstündeki not); buradaki tek yazma aksiyonu temsilci atama/değiştirme.

import { use, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Globe, GraduationCap, Building2, Users, BookOpen, UserCog, X } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import {
  PersonelListesi, SiniflarTab, KurumlarTab,
  type OgretmenSatiri, type OgrenciSatiri, type SinifSatiri, type KurumSatiri,
} from '@/components/staff/kurum-raporlama-tablari';
import type { Ulke } from '../../page';

type Bolum = 'kurumlar' | 'ogretmenler' | 'ogrenciler' | 'siniflar';

export default function UlkeDetayPage({ params }: { params: Promise<{ ulkeId: string }> }) {
  const { ulkeId: ulkeIdParam } = use(params);
  const ulkeId = parseInt(ulkeIdParam, 10);
  const { user, ready } = useAuthGuard('Koordinator');
  const qc = useQueryClient();

  const [bolum, setBolum] = useState<Bolum>('kurumlar');
  const [temsilciFormAcik, setTemsilciFormAcik] = useState(false);
  const [ogretmenQuery, setOgretmenQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [seciliOgretmen, setSeciliOgretmen] = useState<{ id: number; ad: string } | null>(null);

  const { data: ulkelerData, isLoading: ulkelerYukleniyor } = useQuery<{ liste: Ulke[] }>({
    queryKey: ['admin-ulkeler'],
    queryFn: () => api.get('/api/admin/ulkeler').then(r => r.data),
    enabled: !!user,
  });
  const ulke = ulkelerData?.liste.find(u => u.id === ulkeId);

  const { data: kurumlar, isLoading: kurumlarYukleniyor } = useQuery<KurumSatiri[]>({
    queryKey: ['admin-kurumlar'],
    queryFn: () => api.get('/api/admin/kurumlar').then(r => r.data),
    enabled: !!user,
  });

  const { data: ogretmenler, isLoading: ogretmenlerYukleniyor } = useQuery<OgretmenSatiri[]>({
    queryKey: ['admin-ogretmenler-hepsi'],
    queryFn: () => api.get('/api/admin/ogretmenler/hepsi').then(r => r.data),
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

  // Kurumlar/Öğretmenler UlkeId taşıyor; Öğrenciler/Sınıflar yalnızca UlkeAdi
  // taşıyor (bkz. AdminController) — ülke adı benzersiz olduğundan isim eşleşmesi
  // güvenli (resolve-or-create akışının da dayandığı varsayım).
  const kurumlarBu = useMemo(() => (kurumlar ?? []).filter(k => k.ulkeId === ulkeId), [kurumlar, ulkeId]);
  const ogretmenlerBu = useMemo(() => (ogretmenler ?? []).filter(o => o.ulkeId === ulkeId), [ogretmenler, ulkeId]);
  const ogrencilerBu = useMemo(
    () => ulke ? (ogrenciler ?? []).filter(o => o.ulkeAdi === ulke.name) : [],
    [ogrenciler, ulke],
  );
  const siniflarBu = useMemo(
    () => ulke ? (siniflar ?? []).filter(s => s.ulkeAdi === ulke.name) : [],
    [siniflar, ulke],
  );

  const adaylar = useMemo(() => {
    if (!ogretmenler || !ogretmenQuery.trim()) return [];
    const q = ogretmenQuery.toLocaleLowerCase('tr');
    return ogretmenler
      .filter(o => o.isApproved)
      .filter(o => `${o.name} ${o.surname ?? ''}`.toLocaleLowerCase('tr').includes(q) || o.email.toLocaleLowerCase('tr').includes(q))
      .slice(0, 8);
  }, [ogretmenler, ogretmenQuery]);

  const temsilciMutation = useMutation({
    mutationFn: (userId: number) => api.put(`/api/admin/ulke/${ulkeId}/temsilci`, { userId }),
    onSuccess: (res) => {
      toast.success(`${res.data.name} ${res.data.surname ?? ''} artık "${ulke?.name}" temsilcisi.`.trim());
      qc.invalidateQueries({ queryKey: ['admin-ulkeler'] });
      qc.invalidateQueries({ queryKey: ['admin-ogretmenler-hepsi'] });
      setTemsilciFormAcik(false);
      setOgretmenQuery('');
      setShowDropdown(false);
      setSeciliOgretmen(null);
    },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  function temsilciFormuKapat() {
    setTemsilciFormAcik(false);
    setOgretmenQuery('');
    setSeciliOgretmen(null);
  }

  if (!ready) return <div className="py-24 flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  const tabs: { key: Bolum; label: string; icon: React.ReactNode; badge: number }[] = [
    { key: 'kurumlar', label: 'Kurumlar', icon: <Building2 className="size-4" />, badge: kurumlarBu.length },
    { key: 'ogretmenler', label: 'Öğretmenler', icon: <GraduationCap className="size-4" />, badge: ogretmenlerBu.length },
    { key: 'ogrenciler', label: 'Öğrenciler', icon: <Users className="size-4" />, badge: ogrencilerBu.length },
    { key: 'siniflar', label: 'Sınıflar', icon: <BookOpen className="size-4" />, badge: siniflarBu.length },
  ];

  return (
    <div className="bg-[#F3F4F6]">
      <main className="max-w-[1400px] px-4 py-8 mx-auto">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="size-4" />
          Admin paneline dön
        </Link>

        {ulkelerYukleniyor ? (
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-white animate-pulse" />
            <div className="h-64 rounded-2xl bg-white animate-pulse" />
          </div>
        ) : !ulke ? (
          <p className="text-slate-400 text-center py-20">Ülke bulunamadı.</p>
        ) : (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <Globe className="size-7 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-bold text-slate-900">{ulke.name}</h1>
                      <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', ulke.visible ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                        {ulke.visible ? 'Aktif' : 'Pasif'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm mt-0.5">
                      Ülke Temsilcisi: {ulke.ogretmenAdi ?? 'Atanmadı'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => (temsilciFormAcik ? temsilciFormuKapat() : setTemsilciFormAcik(true))}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 border border-primary/20 transition-colors"
                >
                  <UserCog className="size-4" />
                  {ulke.ogretmenAdi ? 'Temsilciyi Değiştir' : 'Temsilci Ata'}
                </button>
              </div>

              {temsilciFormAcik && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  {/* Seç → onayla iki adımlı: dropdown'dan tıklayınca doğrudan rol
                      değiştirmez, bkz. code review — bu, benzer isimli bir adayın
                      kazayla seçilip rolünün geri dönüşsüz değişmesini önler. */}
                  <p className="text-xs text-slate-500 mb-2">
                    Seçilen öğretmenin rolü <strong>Ülke Temsilcisi</strong>&apos;ne çevrilir, ülkesi
                    bu ülke olarak ayarlanır ve kendisine bilgilendirme e-postası gönderilir.
                  </p>
                  {seciliOgretmen ? (
                    <div className="flex items-center gap-2 mb-2 max-w-sm px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg">
                      <span className="text-xs font-medium text-purple-800 flex-1">{seciliOgretmen.ad}</span>
                      <button type="button" onClick={() => { setSeciliOgretmen(null); setOgretmenQuery(''); }}
                        className="text-purple-400 hover:text-purple-600">
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative max-w-sm">
                      <input
                        value={ogretmenQuery}
                        onChange={e => { setOgretmenQuery(e.target.value); setShowDropdown(true); }}
                        onFocus={() => setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
                        autoFocus
                        placeholder="Öğretmen ara (isim veya e-posta)…"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
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
                              className="w-full text-left px-3 py-2 hover:bg-primary/5 flex items-baseline gap-1 transition-colors"
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
                    <p className="text-xs text-slate-400 mt-1.5">Yalnızca onaylı öğretmenler arasından seçilebilir.</p>
                  )}
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => seciliOgretmen && temsilciMutation.mutate(seciliOgretmen.id)}
                      disabled={!seciliOgretmen || temsilciMutation.isPending}
                      className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      {temsilciMutation.isPending ? 'Atanıyor…' : 'Ata'}
                    </button>
                    <button
                      type="button"
                      onClick={temsilciFormuKapat}
                      className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                    >
                      <X className="size-3" /> Vazgeç
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Building2 className="size-5 text-primary mx-auto mb-1" />
                  <div className="text-2xl font-bold text-slate-700">{kurumlarYukleniyor ? '…' : kurumlarBu.length}</div>
                  <div className="text-xs text-slate-500">Kurum</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <GraduationCap className="size-5 text-slate-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-slate-700">{ogretmenlerYukleniyor ? '…' : ogretmenlerBu.length}</div>
                  <div className="text-xs text-slate-500">Öğretmen</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Users className="size-5 text-slate-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-slate-700">{ogrencilerYukleniyor ? '…' : ogrencilerBu.length}</div>
                  <div className="text-xs text-slate-500">Öğrenci</div>
                </div>
              </div>
            </div>

            <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-1 overflow-x-auto scrollbar-none">
              {tabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setBolum(t.key)}
                  className={cn(
                    'flex-1 shrink-0 sm:shrink flex items-center justify-center gap-1.5 py-2.5 px-2.5 sm:px-4 rounded-xl text-sm font-medium transition-colors whitespace-nowrap',
                    bolum === t.key
                      ? 'bg-primary text-white'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {t.icon}
                  <span className="hidden sm:inline">{t.label}</span>
                  {t.badge > 0 && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-full text-xs font-bold',
                      bolum === t.key ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
                    )}>
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {bolum === 'kurumlar' && (
              <KurumlarTab veri={kurumlarBu} yukleniyor={kurumlarYukleniyor} kurumHref={id => `/admin/kurum/${id}`} />
            )}

            {bolum === 'ogretmenler' && (
              <PersonelListesi
                baslik="Öğretmenler"
                veri={ogretmenlerBu}
                yukleniyor={ogretmenlerYukleniyor}
                bosMesaj="Bu ülkede öğretmen yok."
                ikincilKolonBaslik="Kurum"
                ikincilKolonRender={o => (o as OgretmenSatiri).kurumAdi}
                sonKolonBaslik="Durum"
                sonKolonRender={o => (
                  <span className={cn(
                    'text-xs px-2.5 py-1 rounded-full font-medium',
                    (o as OgretmenSatiri).isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  )}>
                    {(o as OgretmenSatiri).isApproved ? 'Onaylı' : 'Bekliyor'}
                  </span>
                )}
              />
            )}

            {bolum === 'ogrenciler' && (
              <PersonelListesi
                baslik="Öğrenciler"
                veri={ogrencilerBu}
                yukleniyor={ogrencilerYukleniyor}
                bosMesaj="Bu ülkede öğrenci yok."
                ikincilKolonBaslik="Kurum · Sınıf · Öğretmen"
                ikincilKolonRender={o => `${o.kurumAdi ?? '—'} · ${(o as OgrenciSatiri).sinifAdi ?? '—'} · ${(o as OgrenciSatiri).ogretmenAdi ?? '—'}`}
              />
            )}

            {bolum === 'siniflar' && (
              <SiniflarTab veri={siniflarBu} yukleniyor={siniflarYukleniyor} ulkeGoster={false} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
