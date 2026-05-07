'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BookOpen, GraduationCap, Plus, Users, ClipboardList, ArrowRight } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppNav } from '@/components/app-nav';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface Sinif {
  id: number;
  name: string;
  katilimKodu: string;
  dersKitabiId: string | null;
  ogrenciSayisi: number;
  odevSayisi: number;
  olusturmaTarihi: string;
}

export default function OgretmenDashboard() {
  const { user, ready } = useAuthGuard('Ogretmen');
  const qc = useQueryClient();
  const [yeniSinifAdi, setYeniSinifAdi] = useState('');
  const [formAcik, setFormAcik] = useState(false);

  const { data: siniflar, isLoading } = useQuery<Sinif[]>({
    queryKey: ['siniflarim'],
    queryFn: () => api.get('/api/ogretmen/siniflarim').then(r => r.data),
    enabled: !!user,
  });

  const olusturMutation = useMutation({
    mutationFn: (name: string) => api.post('/api/ogretmen/sinif', { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['siniflarim'] });
      setYeniSinifAdi('');
      setFormAcik(false);
    },
  });

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AppNav />

      <main className="max-w-[1200px] mx-auto px-4 py-10">
        {/* Başlık */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">İyi günler, {user.name}!</h1>
            <p className="text-slate-500 text-sm mt-1">Öğretmen Paneli</p>
          </div>
          <button
            onClick={() => setFormAcik(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" />
            Yeni Sınıf
          </button>
        </div>

        {/* Yeni sınıf formu */}
        {formAcik && (
          <div className="mb-6 p-5 bg-white rounded-2xl border border-border shadow-sm">
            <h3 className="font-semibold mb-3">Yeni Sınıf Oluştur</h3>
            <div className="flex gap-3">
              <input
                type="text"
                value={yeniSinifAdi}
                onChange={e => setYeniSinifAdi(e.target.value)}
                placeholder="Sınıf adı (örn: A1 Grubu)"
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={e => e.key === 'Enter' && yeniSinifAdi.trim() && olusturMutation.mutate(yeniSinifAdi.trim())}
              />
              <button
                onClick={() => yeniSinifAdi.trim() && olusturMutation.mutate(yeniSinifAdi.trim())}
                disabled={!yeniSinifAdi.trim() || olusturMutation.isPending}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                Oluştur
              </button>
              <button
                onClick={() => { setFormAcik(false); setYeniSinifAdi(''); }}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm"
              >
                İptal
              </button>
            </div>
          </div>
        )}

        {/* Sınıf kartları */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-white animate-pulse" />)}
          </div>
        ) : !siniflar?.length ? (
          <div className="text-center py-20">
            <GraduationCap className="size-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">Henüz sınıf oluşturmadınız.</p>
            <p className="text-slate-400 text-sm mt-1">Yukarıdan yeni bir sınıf ekleyin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {siniflar.map(sinif => (
              <a
                key={sinif.id}
                href={`/ogretmen/sinif/${sinif.id}`}
                className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="size-11 bg-primary/10 rounded-xl flex items-center justify-center">
                    <BookOpen className="size-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full font-mono">
                    {sinif.katilimKodu}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 group-hover:text-primary transition-colors mb-3">
                  {sinif.name}
                </h3>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {sinif.ogrenciSayisi} öğrenci
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="size-3.5" />
                    {sinif.odevSayisi} ödev
                  </span>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                  Sınıfa git <ArrowRight className="size-3.5" />
                </div>
              </a>
            ))}

            {/* Yeni sınıf kart */}
            <button
              onClick={() => setFormAcik(true)}
              className="p-5 bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-primary min-h-[160px]"
            >
              <Plus className="size-8" />
              <span className="text-sm font-medium">Yeni Sınıf</span>
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
