'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';

// /admin/* sayfalarının ortak yetki bariyeri — super-admin/editor ile aynı desen.
// Tekil sayfalar zaten kendi useAuthGuard('Koordinator') çağrısını yapıyor; bu katman
// unutulan bir sayfa için ikinci savunma hattı + hydration flash'ını burada keser.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuthGuard('Koordinator');
  if (!ready || !user) return null;
  return <>{children}</>;
}
