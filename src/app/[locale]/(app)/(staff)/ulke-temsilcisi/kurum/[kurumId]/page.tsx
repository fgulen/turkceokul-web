'use client';

// Kurum detayı — eski "Lisans Durumu" SlideOver'ın yerini alıyor: URL-first,
// bookmarklanabilir (bkz. proje notu: SlideOver'da context/URL kaybı şikayeti).

import { use, useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, GraduationCap, BookOpen, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import { SlideOver } from '@/components/slide-over';
import { LisansKart, type LisansKarti } from '@/components/lisans-kart';

interface PanelKurum {
  id: number;
  name: string;
  sehir: string | null;
}
interface UlkePanel {
  id: number;
  name: string;
  kurumlar: PanelKurum[];
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

interface SinifSatiri {
  id: number;
  name: string;
  kurumId: number;
  ogrenciSayisi: number;
}

const SATIN_AL_BUTON_METIN: Record<string, string> = {
  SatinAl: 'Satın Al',
  EkLisans: 'Ek Lisans Al / Kapasiteyi Artır',
};
const SALT_OKUNUR_BUTON_METIN: Record<string, string> = {
  Inceleniyor: 'Talebi inceleniyor',
};

function sonGirisMetni(tarih: string | null) {
  if (!tarih) return 'Hiç giriş yapmadı';
  return new Date(tarih).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function KurumDetayPage({ params }: { params: Promise<{ kurumId: string }> }) {
  const { kurumId } = use(params);
  const id = Number(kurumId);
  const { user, ready } = useAuthGuard('Ogretmen');
  const qc = useQueryClient();
  const [lisansMesaj, setLisansMesaj] = useState<{ id: string; mesaj: string } | null>(null);

  const [duzenleAcik, setDuzenleAcik] = useState(false);

  const { data: panel } = useQuery<UlkePanel>({
    queryKey: ['ulke-temsilcisi-panel'],
    queryFn: () => api.get('/api/ulke-temsilcisi/panel').then(r => r.data),
    enabled: !!user && user.role === 'UlkeTemsilcisi',
  });
  const kurum = panel?.kurumlar.find(k => k.id === id);

  const { data: tumSiniflar, isLoading: siniflarYukleniyor } = useQuery<SinifSatiri[]>({
    queryKey: ['ulke-temsilcisi-siniflar'],
    queryFn: () => api.get('/api/ulke-temsilcisi/siniflar').then(r => r.data),
    enabled: !!user && user.role === 'UlkeTemsilcisi',
  });
  const siniflar = useMemo(() => (tumSiniflar ?? []).filter(s => s.kurumId === id), [tumSiniflar, id]);

  const duzenleMutation = useMutation({
    mutationFn: (form: { name: string; sehir: string }) =>
      api.put(`/api/ulke-temsilcisi/kurum/${id}`, { name: form.name, sehir: form.sehir || null }),
    onSuccess: () => {
      toast.success('Kurum güncellendi');
      qc.invalidateQueries({ queryKey: ['ulke-temsilcisi-panel'] });
      setDuzenleAcik(false);
    },
    onError: (err: unknown) => toast.error(apiHataMesaji(err)),
  });

  const lisanslarKey = ['ulke-temsilcisi-kurum-lisanslar', id];
  const { data: lisanslar, isLoading: lisanslarYukleniyor, error: lisanslarHatasi } = useQuery<LisansKarti[]>({
    queryKey: lisanslarKey,
    queryFn: () => api.get(`/api/ulke-temsilcisi/kurum/${id}/lisanslar`).then(r => r.data),
    enabled: !!user && user.role === 'UlkeTemsilcisi',
  });

  const { data: tumOgretmenler, isLoading: ogretmenlerYukleniyor } = useQuery<OgretmenSatiri[]>({
    queryKey: ['ulke-temsilcisi-ogretmenler'],
    queryFn: () => api.get('/api/ulke-temsilcisi/ogretmenler').then(r => r.data),
    enabled: !!user && user.role === 'UlkeTemsilcisi',
  });
  const ogretmenler = useMemo(() => (tumOgretmenler ?? []).filter(o => o.kurumId === id), [tumOgretmenler, id]);

  const denemeMutation = useMutation({
    mutationFn: (dersKitabiId: string) =>
      api.post(`/api/ulke-temsilcisi/kurum/${id}/deneme-baslat`, { dersKitabiId }),
    onMutate: () => setLisansMesaj(null),
    onSuccess: (res) => {
      toast.success(res.data?.mesaj ?? 'Deneme başlatıldı.');
      qc.invalidateQueries({ queryKey: lisanslarKey });
    },
    onError: (err, dersKitabiId) => setLisansMesaj({ id: dersKitabiId, mesaj: apiHataMesaji(err) }),
  });

  const satinAlMutation = useMutation({
    mutationFn: (dersKitabiId: string) =>
      api.post(`/api/ulke-temsilcisi/kurum/${id}/satin-al`, { dersKitabiId }),
    onMutate: () => setLisansMesaj(null),
    onSuccess: (res) => {
      toast.success(res.data?.mesaj ?? 'Talebiniz alındı.');
      qc.invalidateQueries({ queryKey: lisanslarKey });
    },
    onError: (err, dersKitabiId) => setLisansMesaj({ id: dersKitabiId, mesaj: apiHataMesaji(err) }),
  });

  if (!ready) return (
    <div className="py-24 flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="bg-[#F3F4F6]">
      <main className="px-4 py-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link
            href="/ulke-temsilcisi?tab=kurumlar"
            className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-white transition-colors shrink-0">
            <ArrowLeft className="size-4" />
          </Link>
          <h1 className="text-xl font-bold text-slate-900 flex-1">{kurum?.name ?? '...'}</h1>
          <button
            onClick={() => setDuzenleAcik(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 text-xs rounded-lg hover:bg-white transition-colors shrink-0">
            <Pencil className="size-3.5" /> Düzenle
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-6">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Lisans Durumu</h2>
          </div>
          {lisanslarYukleniyor ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : lisanslarHatasi ? (
            <p className="text-slate-500 text-sm text-center py-12">{apiHataMesaji(lisanslarHatasi)}</p>
          ) : !lisanslar?.length ? (
            <p className="text-slate-400 text-sm text-center py-12">Kitap bulunamadı.</p>
          ) : (
            <div className="divide-y divide-slate-50 px-2">
              {lisanslar.map(k => {
                const denemeBaslatilabilir = k.buton === 'UcretsizDene';
                const satinAlinabilir = k.buton === 'SatinAl' || k.buton === 'EkLisans';
                const denemeGonderiliyor = denemeMutation.isPending && denemeMutation.variables === k.id;
                const satinAlGonderiliyor = satinAlMutation.isPending && satinAlMutation.variables === k.id;
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
                        disabled={denemeGonderiliyor}
                        onClick={() => denemeMutation.mutate(k.id)}
                        className={cn(
                          'shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors bg-emerald-500 text-white hover:bg-emerald-600',
                          denemeGonderiliyor && 'opacity-60 cursor-wait',
                        )}
                      >
                        {denemeGonderiliyor ? 'Başlatılıyor…' : 'Ücretsiz Dene'}
                      </button>
                    ) : satinAlinabilir ? (
                      <button
                        disabled={satinAlGonderiliyor}
                        onClick={() => satinAlMutation.mutate(k.id)}
                        className={cn(
                          'shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors bg-primary text-white hover:bg-primary/90',
                          satinAlGonderiliyor && 'opacity-60 cursor-wait',
                        )}
                      >
                        {satinAlGonderiliyor ? 'Gönderiliyor…' : SATIN_AL_BUTON_METIN[k.buton]}
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
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <GraduationCap className="size-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Öğretmenler</h2>
            <span className="ml-auto text-xs text-slate-400 tabular-nums">{ogretmenler.length}</span>
          </div>
          {ogretmenlerYukleniyor ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : !ogretmenler.length ? (
            <p className="text-slate-400 text-sm text-center py-12">Bu kurumda öğretmen yok.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {ogretmenler.map(o => (
                <div key={o.id} className="flex items-center justify-between px-6 py-3">
                  <div className="min-w-0">
                    <div className="font-medium text-sm text-slate-800 truncate">{o.name} {o.surname ?? ''}</div>
                    <div className="text-xs text-slate-400 truncate">{o.email}</div>
                  </div>
                  <div className="shrink-0 text-xs text-slate-400 text-right">{sonGirisMetni(o.lastLoginDate)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mt-6">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <BookOpen className="size-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Sınıflar</h2>
            <span className="ml-auto text-xs text-slate-400 tabular-nums">{siniflar.length}</span>
          </div>
          {siniflarYukleniyor ? (
            <div className="p-6 space-y-3">{[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
          ) : !siniflar.length ? (
            <p className="text-slate-400 text-sm text-center py-12">Bu kurumda sınıf yok.</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {siniflar.map(s => (
                <div key={s.id} className="flex items-center justify-between px-6 py-3">
                  <div className="font-medium text-sm text-slate-800">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.ogrenciSayisi} öğrenci</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <KurumDuzenleSlideOver
        open={duzenleAcik}
        kurum={kurum ?? null}
        onClose={() => setDuzenleAcik(false)}
        onKaydet={form => duzenleMutation.mutate(form)}
        kaydediliyor={duzenleMutation.isPending}
      />
    </div>
  );
}

function KurumDuzenleSlideOver({ open, kurum, onClose, onKaydet, kaydediliyor }: {
  open: boolean;
  kurum: PanelKurum | null;
  onClose: () => void;
  onKaydet: (form: { name: string; sehir: string }) => void;
  kaydediliyor: boolean;
}) {
  const [form, setForm] = useState({ name: '', sehir: '' });

  useEffect(() => {
    if (open && kurum) setForm({ name: kurum.name, sehir: kurum.sehir ?? '' });
  }, [open, kurum]);

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title="Kurumu Düzenle"
      width="sm"
      footer={
        <button
          form="kurum-detay-duzenle-form"
          type="submit"
          disabled={kaydediliyor || !form.name.trim()}
          className="w-full px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {kaydediliyor ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      }
    >
      <form
        id="kurum-detay-duzenle-form"
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
    </SlideOver>
  );
}
