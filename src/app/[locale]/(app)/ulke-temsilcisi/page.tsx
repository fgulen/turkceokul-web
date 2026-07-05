'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, GraduationCap, Users } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { RoleScopedUserForm } from '@/components/role-scoped-user-form';

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

export default function UlkeTemsilcisiPage() {
  const { user, ready } = useAuthGuard('Ogretmen');

  const { data: panel, isLoading } = useQuery<UlkePanel>({
    queryKey: ['ulke-temsilcisi-panel'],
    queryFn: () => api.get('/api/ulke-temsilcisi/panel').then(r => r.data),
    enabled: !!user && user.role === 'UlkeTemsilcisi',
  });

  if (!ready) return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="min-h-[100dvh] bg-[#F3F4F6]">
      <main className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {isLoading ? '...' : panel?.name ?? 'Ülke Paneli'}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Ülke Temsilcisi Paneli</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-primary">{panel?.kurumlar.length ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Kurum</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-slate-700">{panel?.toplamOgretmen ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Öğretmen</div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <div className="text-2xl font-bold text-slate-700">{panel?.toplamOgrenci ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Öğrenci</div>
          </div>
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
                <div key={k.id} className="flex items-center justify-between px-6 py-4">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
