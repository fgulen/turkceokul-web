import { useEffect } from 'react';
import { useRouter, useLocale } from '@/navigation';
import { useAuthStore } from '@/stores/auth';

export function useAuthGuard(requiredRole?: 'Ogretmen' | 'Admin' | 'SuperAdmin' | 'Editor') {
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
      } else if (requiredRole === 'Editor') {
        yetkili = user.role === 'Admin' || user.role === 'SuperAdmin' || user.role === 'Editor';
      } else {
        yetkili = ['Ogretmen', 'Admin', 'KurumYoneticisi', 'UlkeTemsilcisi', 'SuperAdmin'].includes(user.role);
      }
      if (!yetkili) { router.replace('/pano'); return; }
    }

    if (!requiredRole) {
      if (user.role === 'SuperAdmin') {
        router.replace('/super-admin');
      } else if (user.role === 'KurumYoneticisi') {
        router.replace('/kurum-yoneticisi');
      } else if (user.role === 'Admin') {
        router.replace('/admin');
      }
      // Ogretmen ve UlkeTemsilcisi /pano'ya erişebilir (öğrenci görünümünü test etmek için)
    }
  }, [hydrated, user, router, locale, requiredRole]);

  return { user, ready: hydrated };
}
