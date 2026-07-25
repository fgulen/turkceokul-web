'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';

// /ulke-temsilcisi/* sayfalarının ortak yetki bariyeri — admin/super-admin ile aynı desen.
// useAuthGuard hook'u 'UlkeTemsilcisi' değerini desteklemiyor (en gevşek 'Ogretmen' tier'ı
// kullanılıyor); sayfa/sorgu seviyesinde zaten user.role === 'UlkeTemsilcisi' kontrolü var.
export default function UlkeTemsilcisiLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuthGuard('Ogretmen');
  if (!ready || !user) return null;
  return <>{children}</>;
}
