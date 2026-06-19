'use client';

import { useAuthStore } from '@/stores/auth';
import { cn } from '@/lib/utils';

export function AppPageWrapper({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const hasMobileBar = hydrated && (
    user?.role === 'Ogrenci' ||
    user?.role === 'Ogretmen' ||
    user?.role === 'KurumYoneticisi' ||
    user?.role === 'UlkeTemsilcisi'
  );

  return (
    <div className={cn(hasMobileBar && 'pb-14 md:pb-0')}>
      {children}
    </div>
  );
}
