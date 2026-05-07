'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { GraduationCap, Plus, Users, Building2 } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppNav } from '@/components/app-nav';
import { api } from '@/lib/api';

interface Ogretmen {
  id: number;
  email: string;
  name: string;
  surname: string | null;
  insertDate: string;
  sinifSayisi: number;
}

export default function AdminPage() {
  const { user, ready } = useAuthGuard('Admin');
  const qc = useQueryClient();

  const [form, setForm] = useState({ email: '', name: '', surname: '' });
  const [mesaj, setMesaj] = useState('');

  const { data: ogretmenler, isLoading } = useQuery<Ogretmen[]>({
    queryKey: ['admin-ogretmenler'],
    queryFn: () => api.get('/api/admin/ogretmenler').then(r => r.data),
    enabled: !!user,
  });

  const olusturMutation = useMutation({
    mutationFn: () => api.post('/api/admin/ogretmen-olustur', form),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['admin-ogretmenler'] });
      setMesaj(`Öğretmen oluşturuldu. Geçici şifre: ${res.data.tempSifre}`);
      setForm({ email: '', name: '', surname: '' });
    },
    onError: (e: Error) => setMesaj('Hata: ' + e.message),
  });

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AppNav />
      <main className="max-w-[1000px] mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Paneli</h1>
          <p className="text-slate-500 text-sm mt-1">Öğretmen ve kurum yönetimi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Öğretmen oluştur */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <GraduationCap className="size-5 text-primary" />
              Öğretmen Oluştur
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
                <p className="text-xs p-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  {mesaj}
                </p>
              )}
            </div>
          </div>

          {/* Hızlı istatistikler */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 className="size-5 text-slate-400" />
              Genel Bakış
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-primary/5 rounded-xl p-4">
                <div className="text-2xl font-bold text-primary">{ogretmenler?.length ?? 0}</div>
                <div className="text-xs text-slate-500 mt-1">Öğretmen</div>
              </div>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="text-2xl font-bold text-slate-700">
                  {ogretmenler?.reduce((a, o) => a + o.sinifSayisi, 0) ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">Toplam Sınıf</div>
              </div>
            </div>
          </div>
        </div>

        {/* Öğretmen listesi */}
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Users className="size-4 text-slate-400" />
            <h2 className="font-semibold text-slate-900">Öğretmenler</h2>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
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
                  <div className="text-xs text-slate-400">{o.sinifSayisi} sınıf</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
