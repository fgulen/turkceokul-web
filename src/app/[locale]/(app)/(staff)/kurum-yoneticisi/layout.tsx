'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';

// /kurum-yoneticisi/* sayfalarının ortak yetki bariyeri — admin/ulke-temsilcisi ile aynı desen.
export default function KurumYoneticisiLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuthGuard('Ogretmen');
  if (!ready || !user) return null;
  return <>{children}</>;
}
