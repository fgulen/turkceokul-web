'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Building2, Users, GraduationCap, CheckCircle, Save } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface KurumOgretmen {
  id: number;
  name: string;
  surname: string | null;
  email: string;
  isApproved: boolean;
}

interface KurumDetay {
  id: number;
  name: string;
  sehir: string | null;
  ulkeId: number | null;
  ogretmenler: KurumOgretmen[];
  ogrenciSayisi: number;
}

export default function KurumDetayPage({ params }: { params: Promise<{ kurumId: string }> }) {
  const { kurumId } = use(params);
  const id = parseInt(kurumId);
  const { user, ready } = useAuthGuard('Koordinator');
  const qc = useQueryClient();

  const [duzenleme, setDuzenleme] = useState(false);
  const [form, setForm] = useState({ name: '', sehir: '' });
  const [kaydedildi, setKaydedildi] = useState(false);

  const { data: kurum, isLoading } = useQuery<KurumDetay>({
    queryKey: ['admin-kurum', id],
    queryFn: () => api.get(`/api/admin/kurum/${id}`).then(r => r.data),
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

  if (!ready) return <div className="min-h-[100dvh] flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6]">
      <main className="max-w-[800px] mx-auto px-4 py-8">
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

            {/* Öğretmenler listesi */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                <GraduationCap className="size-4 text-slate-400" />
                <h2 className="font-semibold text-slate-900">Bağlı Öğretmenler</h2>
              </div>
              {!kurum.ogretmenler.length ? (
                <p className="text-slate-400 text-sm text-center py-10">Bu kuruma bağlı öğretmen yok.</p>
              ) : (
                <div className="divide-y divide-slate-50">
                  {kurum.ogretmenler.map(o => (
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
                      <span className={cn(
                        'text-xs px-2.5 py-1 rounded-full font-medium',
                        o.isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      )}>
                        {o.isApproved ? 'Onaylı' : 'Bekliyor'}
                      </span>
                    </div>
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
