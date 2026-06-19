'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2, GraduationCap, Users, CheckCircle, XCircle,
  Clock, BookOpen, Share2, Mail, ChevronRight
} from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppNav } from '@/components/app-nav';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface PanelOgretmen {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  isApproved: boolean;
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

type Sekme = 'ozet' | 'ogretmenler' | 'siniflar';

export default function KurumYoneticisiPage() {
  const { user, ready } = useAuthGuard('Ogretmen');
  const qc = useQueryClient();
  const [sekme, setSekme] = useState<Sekme>('ozet');
  const [davetUrl, setDavetUrl] = useState<string | null>(null);
  const [davetYukleniyor, setDavetYukleniyor] = useState(false);

  const { data: panel, isLoading } = useQuery<KurumPanel>({
    queryKey: ['kurum-yoneticisi-panel'],
    queryFn: () => api.get('/api/kurum-yoneticisi/panel').then(r => r.data),
    enabled: !!user && user.role === 'KurumYoneticisi',
  });

  const onaylaMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/kurum-yoneticisi/ogretmen/${id}/onayla`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kurum-yoneticisi-panel'] }),
  });

  const reddetMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/kurum-yoneticisi/ogretmen/${id}/reddet`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kurum-yoneticisi-panel'] }),
  });

  async function davetOlustur() {
    setDavetYukleniyor(true);
    try {
      const res = await api.post('/api/davet/olustur', { hedefRol: 'Ogretmen' });
      setDavetUrl(res.data.url);
    } finally {
      setDavetYukleniyor(false);
    }
  }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  const bekleyenSayisi = panel?.ogretmenler.filter(o => !o.isApproved).length ?? 0;

  const tabs: { key: Sekme; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'ozet', label: 'Özet', icon: <Building2 className="size-4" /> },
    { key: 'ogretmenler', label: 'Öğretmenler', icon: <GraduationCap className="size-4" />, badge: bekleyenSayisi },
    { key: 'siniflar', label: 'Sınıflar', icon: <BookOpen className="size-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AppNav />
      <main className="max-w-[900px] mx-auto px-4 py-8">
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

        {/* Tab navigasyonu */}
        <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-1 mb-6">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setSekme(t.key)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-medium transition-colors',
                sekme === t.key
                  ? 'bg-primary text-white'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
              )}
            >
              {t.icon}
              {t.label}
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

        {/* ÖZET TAB */}
        {sekme === 'ozet' && (
          <div className="space-y-4">
            {/* Bekleyen onaylar */}
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
                <button onClick={() => setSekme('ogretmenler')} className="mt-3 text-xs text-amber-700 font-medium hover:underline">
                  Tümünü gör →
                </button>
              </div>
            )}

            {/* Davet linki */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                <Share2 className="size-4 text-primary" />
                Öğretmen Davet Et
              </h2>
              <p className="text-xs text-slate-400 mb-4">Kurumunuza öğretmen eklemek için davet linki oluşturun.</p>
              {!davetUrl ? (
                <button
                  onClick={davetOlustur}
                  disabled={davetYukleniyor}
                  className="w-full py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors disabled:opacity-50"
                >
                  {davetYukleniyor ? 'Oluşturuluyor...' : 'Davet Linki Oluştur'}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="px-3 py-2 bg-slate-50 rounded-xl text-xs text-slate-600 break-all font-mono border border-slate-200">
                    {davetUrl}
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Merhaba! Kurumunuza öğretmen olarak davet edildiniz. Kayıt için: ${davetUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 transition-colors"
                    >
                      <Share2 className="size-3.5" />
                      WhatsApp
                    </a>
                    <a
                      href={`mailto:?subject=Öğretmen Daveti&body=${encodeURIComponent(`Merhaba!\n\nKurumunuza öğretmen olarak davet edildiniz.\n\nKayıt linkiniz: ${davetUrl}`)}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-600 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
                    >
                      <Mail className="size-3.5" />
                      E-posta
                    </a>
                    <button
                      onClick={() => setDavetUrl(null)}
                      className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Yeni
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Son sınıflar */}
            {(panel?.siniflar.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="size-4 text-slate-400" />
                    <h2 className="font-semibold text-slate-900">Sınıflar</h2>
                  </div>
                  <button onClick={() => setSekme('siniflar')} className="text-xs text-primary font-medium hover:underline">
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
                        <a href={`/ogretmen/sinif/${s.id}`} className="text-primary hover:text-primary/80">
                          <ChevronRight className="size-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ÖĞRETMENLER TAB */}
        {sekme === 'ogretmenler' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <GraduationCap className="size-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Öğretmenler</h2>
            </div>
            {isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
            ) : !panel?.ogretmenler.length ? (
              <p className="text-slate-400 text-sm text-center py-12">Henüz öğretmen yok.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {panel.ogretmenler.map(o => (
                  <div key={o.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {o.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-800">{o.name} {o.surname}</div>
                        <div className="text-xs text-slate-400">{o.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!o.isApproved ? (
                        <>
                          <button
                            onClick={() => reddetMutation.mutate(o.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="size-3.5" />
                            Reddet
                          </button>
                          <button
                            onClick={() => onaylaMutation.mutate(o.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors"
                          >
                            <CheckCircle className="size-3.5" />
                            Onayla
                          </button>
                        </>
                      ) : (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700">
                          Onaylı
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* SINIFLAR TAB */}
        {sekme === 'siniflar' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <BookOpen className="size-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900">Sınıflar</h2>
            </div>
            {isLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}</div>
            ) : !panel?.siniflar.length ? (
              <p className="text-slate-400 text-sm text-center py-12">Henüz sınıf yok.</p>
            ) : (
              <div className="divide-y divide-slate-50">
                {panel.siniflar.map(s => (
                  <a
                    key={s.id}
                    href={`/ogretmen/sinif/${s.id}`}
                    className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center">
                        <BookOpen className="size-4 text-slate-500" />
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-800">{s.name}</div>
                        {s.ogretmenAdi && <div className="text-xs text-slate-400">{s.ogretmenAdi}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        <Users className="size-3.5" />
                        {s.ogrenciSayisi}
                      </div>
                      <ChevronRight className="size-4 text-slate-300" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
