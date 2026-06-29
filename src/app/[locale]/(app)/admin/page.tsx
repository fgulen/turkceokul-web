'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Plus, Users, Building2, Clock, CheckCircle, XCircle, ChevronRight, Share2, Mail } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Ogretmen {
  id: number;
  email: string;
  name: string;
  surname: string | null;
  insertDate: string;
  sinifSayisi: number;
  isApproved?: boolean;
}

interface Kurum {
  id: number;
  name: string;
  sehir: string | null;
  ulkeId: number | null;
  sinifSayisi: number;
}

type Sekme = 'ogretmenler' | 'bekleyen' | 'kurumlar';

export default function AdminPage() {
  const { user, ready } = useAuthGuard('Koordinator');
  const qc = useQueryClient();

  const [sekme, setSekme] = useState<Sekme>('ogretmenler');
  const [form, setForm] = useState({ email: '', name: '', surname: '' });
  const [kurumForm, setKurumForm] = useState({ name: '', sehir: '' });
  const [mesaj, setMesaj] = useState('');
  const [davetUrl, setDavetUrl] = useState<string | null>(null);
  const [davetYukleniyor, setDavetYukleniyor] = useState(false);

  async function davetOlustur() {
    setDavetYukleniyor(true);
    try {
      const res = await api.post('/api/davet/olustur', { hedefRol: 'Ogretmen' });
      setDavetUrl(res.data.url);
    } finally {
      setDavetYukleniyor(false);
    }
  }

  const { data: ogretmenler, isLoading: ogLoading } = useQuery<Ogretmen[]>({
    queryKey: ['admin-ogretmenler-hepsi'],
    queryFn: () => api.get('/api/admin/ogretmenler/hepsi').then(r => r.data),
    enabled: !!user,
  });

  const { data: bekleyenler, isLoading: bekLoading } = useQuery<Ogretmen[]>({
    queryKey: ['admin-bekleyen'],
    queryFn: () => api.get('/api/admin/bekleyen-ogretmenler').then(r => r.data),
    enabled: !!user,
  });

  const { data: kurumlar, isLoading: kurumLoading } = useQuery<Kurum[]>({
    queryKey: ['admin-kurumlar'],
    queryFn: () => api.get('/api/admin/kurumlar').then(r => r.data),
    enabled: !!user,
  });

  const olusturMutation = useMutation({
    mutationFn: () => api.post('/api/admin/ogretmen-olustur', form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-ogretmenler-hepsi'] });
      setMesaj(`Öğretmen oluşturuldu. Geçici şifre: ${res.data.tempSifre}`);
      setForm({ email: '', name: '', surname: '' });
    },
    onError: (e: Error) => setMesaj('Hata: ' + e.message),
  });

  const kurumOlusturMutation = useMutation({
    mutationFn: () => api.post('/api/admin/kurum-olustur', kurumForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-kurumlar'] });
      setKurumForm({ name: '', sehir: '' });
    },
  });

  const onaylaMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/admin/ogretmen/${id}/onayla`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bekleyen'] });
      qc.invalidateQueries({ queryKey: ['admin-ogretmenler-hepsi'] });
    },
  });

  const reddetMutation = useMutation({
    mutationFn: (id: number) => api.put(`/api/admin/ogretmen/${id}/reddet`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-bekleyen'] });
      qc.invalidateQueries({ queryKey: ['admin-ogretmenler-hepsi'] });
    },
  });

  if (!ready) return <div className="min-h-[100dvh] flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  const tabs: { key: Sekme; label: string; icon: React.ReactNode; badge?: number }[] = [
    { key: 'ogretmenler', label: 'Öğretmenler', icon: <GraduationCap className="size-4" /> },
    { key: 'bekleyen', label: 'Bekleyen Onay', icon: <Clock className="size-4" />, badge: bekleyenler?.length },
    { key: 'kurumlar', label: 'Kurumlar', icon: <Building2 className="size-4" /> },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6]">
      <TurkishLetterBackdrop variant="admin" opacity={0.04} />
      <main className="max-w-[1200px] mx-auto px-4 py-10" style={{ position: 'relative', zIndex: 1 }}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Admin Paneli</h1>
          <p className="text-slate-500 text-sm mt-1">Öğretmen ve kurum yönetimi</p>
        </div>

        {/* İstatistikler */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-primary">{ogretmenler?.length ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Öğretmen</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className={cn('text-2xl font-bold', (bekleyenler?.length ?? 0) > 0 ? 'text-amber-500' : 'text-slate-700')}>
              {bekleyenler?.length ?? 0}
            </div>
            <div className="text-xs text-slate-500 mt-1">Bekleyen Onay</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-slate-700">{kurumlar?.length ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Kurum</div>
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

        {/* ÖĞRETMENLER TAB */}
        {sekme === 'ogretmenler' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                Yeni Öğretmen Oluştur
              </h2>
              <div className="space-y-3">
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="E-posta *"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Ad *"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  <input
                    type="text"
                    value={form.surname}
                    onChange={e => setForm(p => ({ ...p, surname: e.target.value }))}
                    placeholder="Soyad"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <button
                  onClick={() => olusturMutation.mutate()}
                  disabled={!form.email || !form.name || olusturMutation.isPending}
                  className="w-full px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Plus className="size-4" />
                  Öğretmen Oluştur
                </button>
                {mesaj && (
                  <p className="text-xs p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">{mesaj}</p>
                )}
              </div>
            </div>

            {/* WhatsApp / E-posta davet */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                <Share2 className="size-4 text-primary" />
                Davet Linki Oluştur
              </h2>
              <p className="text-xs text-slate-400 mb-4">Öğretmeni sisteme davet etmek için link oluştur, WhatsApp veya e-posta ile paylaş.</p>
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
                      href={`https://wa.me/?text=${encodeURIComponent(`Merhaba! TürkçeOkulu platformuna öğretmen olarak davet edildiniz. Kayıt için: ${davetUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-green-500 text-white rounded-xl text-xs font-semibold hover:bg-green-600 transition-colors"
                    >
                      <Share2 className="size-3.5" />
                      WhatsApp
                    </a>
                    <a
                      href={`mailto:?subject=TürkçeOkulu Öğretmen Daveti&body=${encodeURIComponent(`Merhaba!\n\nTürkçeOkulu platformuna öğretmen olarak davet edildiniz.\n\nKayıt linkiniz: ${davetUrl}\n\nİyi çalışmalar!`)}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-600 text-white rounded-xl text-xs font-semibold hover:bg-slate-700 transition-colors"
                    >
                      <Mail className="size-3.5" />
                      E-posta
                    </a>
                    <button
                      onClick={() => { setDavetUrl(null); }}
                      className="px-3 py-2 text-xs text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                      Yeni
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Users className="size-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">Tüm Öğretmenler</h2>
              </div>
              {ogLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>
              ) : !ogretmenler?.length ? (
                <p className="text-slate-400 text-sm text-center py-10">Henüz öğretmen yok.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {ogretmenler.map(o => (
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
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          o.isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        )}>
                          {o.isApproved ? 'Onaylı' : 'Bekliyor'}
                        </span>
                        <span className="text-xs text-slate-400">{o.sinifSayisi} sınıf</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BEKLEYEN ONAY TAB */}
        {sekme === 'bekleyen' && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <Clock className="size-4 text-amber-500" />
              <h2 className="font-semibold text-slate-900">Onay Bekleyen Öğretmenler</h2>
            </div>
            {bekLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}</div>
            ) : !bekleyenler?.length ? (
              <div className="text-center py-16">
                <CheckCircle className="size-10 text-emerald-400 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">Bekleyen öğretmen yok</p>
                <p className="text-slate-400 text-sm mt-1">Tüm kayıtlar onaylandı.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {bekleyenler.map(o => (
                  <div key={o.id} className="flex items-center justify-between px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-sm">
                        {o.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-slate-800">{o.name} {o.surname}</div>
                        <div className="text-xs text-slate-400">{o.email}</div>
                        <div className="text-xs text-slate-300 mt-0.5">
                          Başvuru: {new Date(o.insertDate).toLocaleDateString('tr')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => reddetMutation.mutate(o.id)}
                        disabled={reddetMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        <XCircle className="size-3.5" />
                        Reddet
                      </button>
                      <button
                        onClick={() => onaylaMutation.mutate(o.id)}
                        disabled={onaylaMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="size-3.5" />
                        Onayla
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KURUMLAR TAB */}
        {sekme === 'kurumlar' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Plus className="size-4 text-primary" />
                Yeni Kurum Ekle
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={kurumForm.name}
                  onChange={e => setKurumForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="Kurum adı *"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <input
                  type="text"
                  value={kurumForm.sehir}
                  onChange={e => setKurumForm(p => ({ ...p, sehir: e.target.value }))}
                  placeholder="Şehir"
                  className="w-36 px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  onClick={() => kurumOlusturMutation.mutate()}
                  disabled={!kurumForm.name || kurumOlusturMutation.isPending}
                  className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="size-4" />
                  Ekle
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <Building2 className="size-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">Kurumlar</h2>
              </div>
              {kurumLoading ? (
                <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}</div>
              ) : !kurumlar?.length ? (
                <p className="text-slate-400 text-sm text-center py-10">Henüz kurum yok.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {kurumlar.map(k => (
                    <a
                      key={k.id}
                      href={`/admin/kurum/${k.id}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center">
                          <Building2 className="size-4 text-slate-500" />
                        </div>
                        <div>
                          <div className="font-medium text-sm text-slate-800">{k.name}</div>
                          {k.sehir && <div className="text-xs text-slate-400">{k.sehir}</div>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-slate-400">{k.sinifSayisi} sınıf</span>
                        <ChevronRight className="size-4 text-slate-300" />
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
