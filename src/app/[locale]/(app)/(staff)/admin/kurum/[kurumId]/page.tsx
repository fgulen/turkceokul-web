'use client';

// Kurum detayı — "Kurum Detay şablonu" (dışardan-bakan roller: admin, ülke-temsilcisi)
// ulke-temsilcisi/kurum/[kurumId] ile aynı 3-sütun kart yapısını paylaşır (Lisans
// Durumu/Öğretmenler/Sınıflar). Lisans Durumu'ndaki tek yazma aksiyonu kapasite
// düzeltmesi (onaylanan siparişte sayı yanlış girildiyse); satın alma/deneme başlatma
// gibi akışlar bu yüzeyde yok, LisansKart'a rozet veriliyor.

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Users, GraduationCap, BookOpen, CheckCircle, Save, Pencil } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import { LisansKart, type LisansKarti } from '@/components/lisans-kart';

interface KurumOgretmen {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  isApproved: boolean;
}

interface KurumSinif {
  id: number;
  name: string;
  ogrenciSayisi: number;
}

interface KurumDetay {
  id: number;
  name: string;
  sehir: string | null;
  ulkeId: number | null;
  ogretmenler: KurumOgretmen[];
  siniflar?: KurumSinif[];
  ogrenciSayisi: number;
}

// Kapasite düzenleme dışında salt-okunur — LisansKart'ın aksiyon alanına durum rozeti
// verilir (bkz. kurum-lisans-durumu.tsx'teki SALT_OKUNUR_BUTON_METIN deseni).
const BUTON_ROZET_METIN: Record<LisansKarti['buton'], string> = {
  SatinAl: 'Satın alınmadı',
  Inceleniyor: 'Talep inceleniyor',
  EkLisans: 'Lisanslı',
  UcretsizDene: 'Denenmedi',
};

// Kapasite yalnızca hiç koltuk tüketilmemiş ücretli/sponsorlu lisansta düzeltilebilir —
// API'deki SuperAdminService.GuncelleLisansKapasite guard'ının aynısı. Bir öğrenci bile
// koltuk aldıysa düzenleme kapalı; artırım normal sipariş akışından geçer.
function kapasiteDuzenlenebilir(k: LisansKarti) {
  return (k.lisansTipi === 'Ucretli' || k.lisansTipi === 'Sponsorlu') && k.kullanilanLisans === 0;
}

export default function KurumDetayPage({ params }: { params: Promise<{ kurumId: string }> }) {
  const { kurumId } = use(params);
  const id = parseInt(kurumId);
  const { user, ready } = useAuthGuard('Koordinator');
  const qc = useQueryClient();

  const [duzenleme, setDuzenleme] = useState(false);
  const [form, setForm] = useState({ name: '', sehir: '' });
  const [kaydedildi, setKaydedildi] = useState(false);
  // Aynı anda tek kart düzenlenir: hangi kitabın kapasitesi ve o input'un ham değeri.
  const [kapasiteForm, setKapasiteForm] = useState<{ id: string; deger: string } | null>(null);
  const [kapasiteMesaj, setKapasiteMesaj] = useState<{ id: string; mesaj: string } | null>(null);

  const { data: kurum, isLoading } = useQuery<KurumDetay>({
    queryKey: ['admin-kurum', id],
    queryFn: () => api.get(`/api/admin/kurum/${id}`).then(r => r.data),
    enabled: !!user,
  });

  const { data: lisanslar, isLoading: lisanslarYukleniyor, error: lisanslarHata } = useQuery<LisansKarti[]>({
    queryKey: ['admin-kurum-lisanslar', id],
    queryFn: () => api.get(`/api/admin/kurum/${id}/lisanslar`).then(r => r.data),
    enabled: !!user,
  });

  function duzenlemeyiAc() {
    setForm({ name: kurum?.name ?? '', sehir: kurum?.sehir ?? '' });
    setDuzenleme(true);
    setKaydedildi(false);
  }

  const guncelleM = useMutation({
    mutationFn: () => api.put(`/api/admin/kurum/${id}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-kurum', id] });
      qc.invalidateQueries({ queryKey: ['admin-kurumlar'] });
      setDuzenleme(false);
      setKaydedildi(true);
      setTimeout(() => setKaydedildi(false), 3000);
    },
  });

  const kapasiteM = useMutation({
    mutationFn: ({ dersKitabiId, toplamLisans }: { dersKitabiId: string; toplamLisans: number }) =>
      api.put(`/api/admin/kurum/${id}/lisans/${dersKitabiId}/kapasite`, { toplamLisans }),
    onMutate: () => setKapasiteMesaj(null),
    onSuccess: (res) => {
      toast.success(res.data?.mesaj ?? 'Kapasite güncellendi.');
      qc.invalidateQueries({ queryKey: ['admin-kurum-lisanslar', id] });
      setKapasiteForm(null);
    },
    onError: (err, degiskenler) =>
      setKapasiteMesaj({ id: degiskenler.dersKitabiId, mesaj: apiHataMesaji(err) }),
  });

  if (!ready) return <div className="py-24 flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="bg-[#F3F4F6]">
      <main className="max-w-[1400px] px-4 py-8 mx-auto">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="size-4" />
          Admin paneline dön
        </Link>

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-32 rounded-2xl bg-white animate-pulse" />
            <div className="h-64 rounded-2xl bg-white animate-pulse" />
          </div>
        ) : !kurum ? (
          <p className="text-slate-400 text-center py-20">Kurum bulunamadı.</p>
        ) : (
          <div className="space-y-6">
            {/* Kurum bilgi kartı */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-primary/5 flex items-center justify-center">
                    <Building2 className="size-7 text-primary" />
                  </div>
                  <div>
                    {duzenleme ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={form.name}
                          onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                          placeholder="Kurum adı"
                          className="block w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <input
                          type="text"
                          value={form.sehir}
                          onChange={e => setForm(p => ({ ...p, sehir: e.target.value }))}
                          placeholder="Şehir"
                          className="block w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    ) : (
                      <>
                        <h1 className="text-xl font-bold text-slate-900">{kurum.name}</h1>
                        {kurum.sehir && <p className="text-slate-500 text-sm mt-0.5">{kurum.sehir}</p>}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {kaydedildi && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                      <CheckCircle className="size-3.5" />
                      Kaydedildi
                    </span>
                  )}
                  {duzenleme ? (
                    <>
                      <button
                        onClick={() => setDuzenleme(false)}
                        className="px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:bg-slate-100 transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={() => guncelleM.mutate()}
                        disabled={!form.name || guncelleM.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-50"
                      >
                        <Save className="size-3.5" />
                        Kaydet
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={duzenlemeyiAc}
                      className="px-4 py-1.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 border border-primary/20 transition-colors"
                    >
                      Düzenle
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <GraduationCap className="size-5 text-primary mx-auto mb-1" />
                  <div className="text-2xl font-bold text-slate-700">{kurum.ogretmenler.length}</div>
                  <div className="text-xs text-slate-500">Öğretmen</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <Users className="size-5 text-slate-400 mx-auto mb-1" />
                  <div className="text-2xl font-bold text-slate-700">{kurum.ogrenciSayisi}</div>
                  <div className="text-xs text-slate-500">Öğrenci</div>
                </div>
              </div>
            </div>

            <div className="grid xl:grid-cols-3 gap-6 items-start">
              {/* Lisans Durumu — salt okunur */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900">Lisans Durumu</h2>
                </div>
                {lisanslarYukleniyor ? (
                  <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}</div>
                ) : lisanslarHata ? (
                  <p className="text-slate-500 text-sm text-center py-12">{apiHataMesaji(lisanslarHata)}</p>
                ) : !lisanslar?.length ? (
                  <p className="text-slate-400 text-sm text-center py-12">Kitap bulunamadı.</p>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {lisanslar.map(k => {
                      const duzenlenebilir = kapasiteDuzenlenebilir(k);
                      const acik = kapasiteForm?.id === k.id;
                      const gonderiliyor = kapasiteM.isPending && kapasiteM.variables?.dersKitabiId === k.id;

                      return (
                        <LisansKart
                          key={k.id}
                          kitap={k}
                          mesaj={kapasiteMesaj?.id === k.id
                            ? { tip: 'hata' as const, metin: kapasiteMesaj.mesaj }
                            : null}
                          aksiyon={acik ? (
                            <form
                              className="shrink-0 flex items-center gap-1.5"
                              onSubmit={(e) => {
                                e.preventDefault();
                                const deger = parseInt(kapasiteForm.deger, 10);
                                if (!Number.isFinite(deger) || deger <= 0) {
                                  setKapasiteMesaj({ id: k.id, mesaj: 'Kapasite 0’dan büyük bir sayı olmalı.' });
                                  return;
                                }
                                kapasiteM.mutate({ dersKitabiId: k.id, toplamLisans: deger });
                              }}
                            >
                              <input
                                type="number"
                                min={1}
                                autoFocus
                                value={kapasiteForm.deger}
                                onChange={(e) => setKapasiteForm({ id: k.id, deger: e.target.value })}
                                className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-primary/30"
                                aria-label={`${k.name} lisans kapasitesi`}
                              />
                              <button
                                type="submit"
                                disabled={gonderiliyor}
                                className={cn(
                                  'px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors',
                                  gonderiliyor && 'opacity-60 cursor-wait',
                                )}
                              >
                                {gonderiliyor ? '…' : 'Kaydet'}
                              </button>
                              <button
                                type="button"
                                onClick={() => { setKapasiteForm(null); setKapasiteMesaj(null); }}
                                className="px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700"
                              >
                                İptal
                              </button>
                            </form>
                          ) : (
                            <div className="shrink-0 flex items-center gap-2">
                              <span className="text-xs text-slate-400 italic text-right">
                                {BUTON_ROZET_METIN[k.buton]}
                              </span>
                              {duzenlenebilir && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setKapasiteMesaj(null);
                                    setKapasiteForm({ id: k.id, deger: String(k.toplamLisans) });
                                  }}
                                  title="Lisans kapasitesini düzelt"
                                  aria-label={`${k.name} lisans kapasitesini düzelt`}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
                                >
                                  <Pencil className="size-3.5" />
                                </button>
                              )}
                            </div>
                          )}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Öğretmenler */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <GraduationCap className="size-4 text-slate-400" />
                  <h2 className="font-semibold text-slate-900">Öğretmenler</h2>
                  <span className="ml-auto text-xs text-slate-400 tabular-nums">{kurum.ogretmenler.length}</span>
                </div>
                {!kurum.ogretmenler.length ? (
                  <p className="text-slate-400 text-sm text-center py-12">Bu kuruma bağlı öğretmen yok.</p>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {kurum.ogretmenler.map(o => (
                      <div key={o.id} className="flex items-center justify-between px-6 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                            {o.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm text-slate-800 truncate">{o.name} {o.surname ?? ''}</div>
                            <div className="text-xs text-slate-400 truncate">{o.email}</div>
                          </div>
                        </div>
                        <span className={cn(
                          'shrink-0 text-xs px-2.5 py-1 rounded-full font-medium',
                          o.isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        )}>
                          {o.isApproved ? 'Onaylı' : 'Bekliyor'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sınıflar */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                  <BookOpen className="size-4 text-slate-400" />
                  <h2 className="font-semibold text-slate-900">Sınıflar</h2>
                  <span className="ml-auto text-xs text-slate-400 tabular-nums">{(kurum.siniflar ?? []).length}</span>
                </div>
                {!kurum.siniflar?.length ? (
                  <p className="text-slate-400 text-sm text-center py-12">Bu kurumda sınıf yok.</p>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {kurum.siniflar.map(s => (
                      <div key={s.id} className="flex items-center justify-between px-6 py-3">
                        <div className="font-medium text-sm text-slate-800">{s.name}</div>
                        <div className="text-xs text-slate-400">{s.ogrenciSayisi} öğrenci</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
