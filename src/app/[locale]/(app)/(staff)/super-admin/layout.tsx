'use client';

import { Shield } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';

// Tüm /super-admin/* sayfalarının ortak çerçevesi: yetki koruması, başlık, konteyner.
// Alt sayfalar yalnızca kendi içeriklerini render eder.
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuthGuard('SuperAdmin');
  if (!ready || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <TurkishLetterBackdrop variant="super-admin" opacity={0.04} />
      <main className="max-w-[1200px] mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="size-9 rounded-xl bg-purple-100 flex items-center justify-center">
            <Shield className="size-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Super Admin Paneli</h1>
            <p className="text-xs text-slate-500">Sistem yönetimi — {user.name} {user.surname}</p>
          </div>
        </div>
        {/* Tüm alt sayfalar aynı minimum yükseklikte görünür — menü geçişlerinde
            sayfa boyu zıplamasın (kısa içerikli sayfalar da tam alan kaplar) */}
        <div className="min-h-[calc(100dvh-15rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
