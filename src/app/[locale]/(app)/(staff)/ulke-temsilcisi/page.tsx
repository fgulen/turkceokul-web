'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, GraduationCap, Users, Clock, ArrowRightCircle, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';
import { SlideOver } from '@/components/slide-over';
import { LisansKart, type LisansKarti } from '@/components/lisans-kart';

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
  kurumId: number;
  kurumAdi: string;
}

interface OgrenciSatiri {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  lastLoginDate: string | null;
  kurumAdi: string;
  sinifAdi: string;
}

function sonGirisMetni(tarih: string | null) {
  if (!tarih) return 'Hiç giriş yapmadı';
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const SALT_OKUNUR_BUTON_METIN: Record<string, string> = {
  SatinAl: 'Satın Alma — kurum yöneticisi',
  Inceleniyor: 'Talebi inceleniyor',
  EkLisans: 'Ek lisans — kurum yöneticisi',
};

export default function UlkeTemsilcisiPage() {
  const { user, ready } = useAuthGuard('Ogretmen');
  const queryClient = useQueryClient();
  const [donusturuluyorId, setDonusturuluyorId] = useState<number | null>(null);
  const [acikKurum, setAcikKurum] = useState<{ id: number; name: string } | null>(null);
  const [lisansMesaj, setLisansMesaj] = useState<{ id: string; mesaj: string } | null>(null);
  const [acikListe, setAcikListe] = useState<'ogretmen' | 'ogrenci' | null>(null);

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
  // /api/katalog public'tir, temsilci de görebilir; yalnızca ad eşlemesi için kullanılıyor.
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
    enabled: acikListe === 'ogretmen',
  });

  const { data: ogrenciler, isLoading: ogrencilerYukleniyor } = useQuery<OgrenciSatiri[]>({
    queryKey: ['ulke-temsilcisi-ogrenciler'],
    queryFn: () => api.get('/api/ulke-temsilcisi/ogrenciler').then(r => r.data),
    enabled: acikListe === 'ogrenci',
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

  const kurumLisanslarKey = ['ulke-temsilcisi-kurum-lisanslar', acikKurum?.id];

  const { data: kurumLisanslari, isLoading: kurumLisanslariYukleniyor, error: kurumLisanslariHatasi } = useQuery<LisansKarti[]>({
    queryKey: kurumLisanslarKey,
    queryFn: () => api.get(`/api/ulke-temsilcisi/kurum/${acikKurum!.id}/lisanslar`).then(r => r.data),
    enabled: !!acikKurum,
  });

  const denemeMutation = useMutation({
    mutationFn: (dersKitabiId: string) =>
      api.post(`/api/ulke-temsilcisi/kurum/${acikKurum!.id}/deneme-baslat`, { dersKitabiId }),
    onMutate: () => setLisansMesaj(null),
    onSuccess: (res) => {
      toast.success(res.data?.mesaj ?? 'Deneme başlatıldı.');
      queryClient.invalidateQueries({ queryKey: kurumLisanslarKey });
    },
    onError: (err, dersKitabiId) => {
      const hata = apiHataMesaji(err);
      setLisansMesaj({ id: dersKitabiId, mesaj: hata });
      toast.error(hata);
    },
  });

  function kapatKurumPaneli() {
    setAcikKurum(null);
    setLisansMesaj(null);
  }

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

        {!talepYukleniyor && !!talepler?.length && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
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

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-primary">{panel?.kurumlar.length ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Kurum</div>
          </div>
          <button
            onClick={() => setAcikListe('ogretmen')}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="text-2xl font-bold text-slate-700">{panel?.toplamOgretmen ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Öğretmen</div>
          </button>
          <button
            onClick={() => setAcikListe('ogrenci')}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:bg-slate-50 transition-colors"
          >
            <div className="text-2xl font-bold text-slate-700">{panel?.toplamOgrenci ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Öğrenci</div>
          </button>
        </div>

        <RoleScopedUserForm
          baslik="Kurum Yöneticisi Davet Et"
          aciklama="Ülkenizde yeni bir okul için kurum yöneticisi davet edin."
          hedefRolSecenekleri={[{ value: 'KurumYoneticisi', label: 'Kurum Yöneticisi' }]}
        />

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mt-6">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Building2 className="size-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Kurumlar</h2>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : !panel?.kurumlar.length ? (
            <p className="text-slate-400 text-sm text-center py-12">Henüz kurum yok.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {panel.kurumlar.map(k => (
                <button
                  key={k.id}
                  onClick={() => setAcikKurum({ id: k.id, name: k.name })}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
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
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <SlideOver
        open={!!acikKurum}
        onClose={kapatKurumPaneli}
        title={acikKurum?.name ?? ''}
        subtitle="Lisans Durumu"
        width="md"
      >
        {kurumLisanslariYukleniyor ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
        ) : kurumLisanslariHatasi ? (
          <p className="text-slate-500 text-sm text-center py-12">{apiHataMesaji(kurumLisanslariHatasi)}</p>
        ) : !kurumLisanslari?.length ? (
          <p className="text-slate-400 text-sm text-center py-12">Kitap bulunamadı.</p>
        ) : (
          <div className="divide-y divide-slate-50 -mx-6">
            {kurumLisanslari.map(k => {
              const denemeBaslatilabilir = k.buton === 'UcretsizDene';
              const gonderiliyor = denemeMutation.isPending && denemeMutation.variables === k.id;
              const kartMesaj = lisansMesaj?.id === k.id
                ? { tip: 'hata' as const, metin: lisansMesaj.mesaj }
                : null;

              return (
                <LisansKart
                  key={k.id}
                  kitap={k}
                  mesaj={kartMesaj}
                  aksiyon={denemeBaslatilabilir ? (
                    <button
                      disabled={gonderiliyor}
                      onClick={() => denemeMutation.mutate(k.id)}
                      className={cn(
                        'shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors bg-emerald-500 text-white hover:bg-emerald-600',
                        gonderiliyor && 'opacity-60 cursor-wait',
                      )}
                    >
                      {gonderiliyor ? 'Başlatılıyor…' : 'Ücretsiz Dene'}
                    </button>
                  ) : (
                    <span className="shrink-0 text-xs text-slate-400 italic text-right">
                      {SALT_OKUNUR_BUTON_METIN[k.buton]}
                    </span>
                  )}
                />
              );
            })}
          </div>
        )}
      </SlideOver>

      <SlideOver
        open={acikListe === 'ogretmen'}
        onClose={() => setAcikListe(null)}
        title="Öğretmenler"
        subtitle={panel?.name}
        width="lg"
      >
        <div className="mb-5 pb-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Öğretmen Davet Et</h3>
          <RoleScopedUserForm
            bare
            baslik="Öğretmen Davet Et"
            aciklama=""
            hedefRolSecenekleri={[{ value: 'Ogretmen', label: 'Öğretmen' }]}
            onOlusturuldu={() => {
              queryClient.invalidateQueries({ queryKey: ['ulke-temsilcisi-ogretmenler'] });
              queryClient.invalidateQueries({ queryKey: ['ulke-temsilcisi-panel'] });
            }}
          />
        </div>
        {ogretmenlerYukleniyor ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
        ) : !ogretmenler?.length ? (
          <p className="text-slate-400 text-sm text-center py-12">Henüz öğretmen yok.</p>
        ) : (
          <div className="divide-y divide-slate-50 -mx-6">
            {ogretmenler.map(o => (
              <div key={o.id} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{o.name} {o.surname ?? ''}</div>
                  <div className="text-xs text-slate-400 truncate">{o.email} · {o.kurumAdi}</div>
                </div>
                <div className="shrink-0 text-xs text-slate-400 text-right">{sonGirisMetni(o.lastLoginDate)}</div>
              </div>
            ))}
          </div>
        )}
      </SlideOver>

      <SlideOver
        open={acikListe === 'ogrenci'}
        onClose={() => setAcikListe(null)}
        title="Öğrenciler"
        subtitle={panel?.name}
        width="lg"
      >
        {ogrencilerYukleniyor ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
        ) : !ogrenciler?.length ? (
          <p className="text-slate-400 text-sm text-center py-12">Henüz öğrenci yok.</p>
        ) : (
          <div className="divide-y divide-slate-50 -mx-6">
            {ogrenciler.map(o => (
              <div key={o.id} className="flex items-center justify-between px-6 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{o.name} {o.surname ?? ''}</div>
                  <div className="text-xs text-slate-400 truncate">{o.email} · {o.kurumAdi} · {o.sinifAdi}</div>
                </div>
                <div className="shrink-0 text-xs text-slate-400 text-right">{sonGirisMetni(o.lastLoginDate)}</div>
              </div>
            ))}
          </div>
        )}
      </SlideOver>
    </div>
  );
}
