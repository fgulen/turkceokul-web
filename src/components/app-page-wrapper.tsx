'use client';

import { useAuthStore } from '@/stores/auth';
import { usePathname } from '@/navigation';
import { cn } from '@/lib/utils';

export function AppPageWrapper({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const pathname = usePathname();
  const hasMobileBar = hydrated && (
    user?.role === 'Ogrenci' ||
    user?.role === 'Ogretmen' ||
    user?.role === 'KurumYoneticisi' ||
    user?.role === 'UlkeTemsilcisi'
  );
  // Ders sayfası kendi fixed-height layout'unu yönetiyor, pb-14 body scroll yaratır
  const isFixedLayout = pathname?.startsWith('/ders/') || pathname?.startsWith('/etkinlik/');

  return (
    <div className={cn(hasMobileBar && !isFixedLayout && 'pb-14 md:pb-0')}>
      {children}
    </div>
  );
}
