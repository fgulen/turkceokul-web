import { useEffect } from 'react';
import { useRouter, useLocale } from '@/navigation';
import { useAuthStore } from '@/stores/auth';

export function useAuthGuard(requiredRole?: 'Ogretmen' | 'Admin' | 'SuperAdmin') {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) { router.replace('/giris'); return; }

    if (requiredRole) {
      let yetkili = false;
      if (requiredRole === 'SuperAdmin') {
        yetkili = user.role === 'SuperAdmin';
      } else if (requiredRole === 'Admin') {
        yetkili = user.role === 'Admin' || user.role === 'SuperAdmin';
      } else {
        yetkili = ['Ogretmen', 'Admin', 'KurumYoneticisi', 'UlkeTemsilcisi', 'SuperAdmin'].includes(user.role);
      }
      if (!yetkili) { router.replace('/pano'); return; }
    }

    if (!requiredRole) {
      if (user.role === 'SuperAdmin') {
        router.replace('/super-admin');
      } else if (user.role === 'Ogretmen' || user.role === 'KurumYoneticisi' || user.role === 'UlkeTemsilcisi') {
        router.replace('/ogretmen');
      } else if (user.role === 'Admin') {
        router.replace('/admin');
      }
    }
  }, [hydrated, user, router, locale, requiredRole]);

  return { user, ready: hydrated };
}
