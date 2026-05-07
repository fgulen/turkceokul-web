import { useEffect } from 'react';
import { useRouter, useLocale } from '@/navigation';
import { useAuthStore } from '@/stores/auth';

export function useAuthGuard(requiredRole?: 'Ogretmen' | 'Admin') {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace('/giris'); return; }

    // Role bazlı redirect
    if (requiredRole) {
      const yetkili =
        requiredRole === 'Admin'
          ? user.role === 'Admin'
          : user.role === 'Ogretmen' || user.role === 'Admin';
      if (!yetkili) { router.replace('/pano'); return; }
    }

    // Öğretmen /pano'ya gelmesin, öğrenci /ogretmen'e gelmesin
    if (user.role === 'Ogretmen') {
      router.replace('/ogretmen');
    } else if (user.role === 'Admin') {
      router.replace('/admin');
    }
  }, [hydrated, user, router, locale, requiredRole]);

  return { user, ready: hydrated };
}
