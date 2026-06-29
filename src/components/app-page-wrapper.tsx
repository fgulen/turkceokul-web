'use client';

import { useAuthStore } from '@/stores/auth';
import { usePathname } from '@/navigation';
import { cn } from '@/lib/utils';

export function AppPageWrapper({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const pathname = usePathname();
  // Alt nav mobilde tüm roller için görünüyor (SuperAdmin/Koordinator da dahil)
  const hasMobileBar = hydrated && !!user;
  const isFixedLayout = pathname?.startsWith('/ders/') || pathname?.startsWith('/kahoot') || pathname?.endsWith('/canli');

  return (
    <div className={cn(hasMobileBar && !isFixedLayout && 'pb-14 md:pb-0')}>
      {children}
    </div>
  );
}
