import { useEffect } from 'react';
import { useRouter, useLocale } from '@/navigation';
import { useAuthStore } from '@/stores/auth';
import { homePathForRole } from '@/lib/role-home';

export function useAuthGuard(
  requiredRole?: 'Ogretmen' | 'Koordinator' | 'SuperAdmin' | 'Editor',
  noRoleRedirect?: boolean,
) {
  const user = useAuthStore((s) => s.user);
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      const returnTo = typeof window !== 'undefined'
        ? encodeURIComponent(window.location.pathname + window.location.search)
        : '';
      router.replace(returnTo ? `/giris?redirect=${returnTo}` : '/giris');
      return;
    }

    if (requiredRole) {
      let yetkili = false;
      if (requiredRole === 'SuperAdmin') {
        yetkili = user.role === 'SuperAdmin';
      } else if (requiredRole === 'Koordinator') {
        yetkili = user.role === 'Koordinator' || user.role === 'SuperAdmin';
      } else if (requiredRole === 'Editor') {
        yetkili = user.role === 'Koordinator' || user.role === 'SuperAdmin' || user.role === 'Editor';
      } else {
        yetkili = ['Ogretmen', 'Koordinator', 'KurumYoneticisi', 'UlkeTemsilcisi', 'SuperAdmin'].includes(user.role);
      }
      if (!yetkili) { router.replace('/pano'); return; }
    }

    // noRoleRedirect=true: içerik sayfaları (okuma, ders) — rol yönlendirmesi yapma.
    // Diğer durumda (ör. /pano, /lig, /kahoot/katil) herkes kendi rol home'una döner —
    // Ogretmen/staff rolleri öğrenci pano'sunda kalamaz.
    if (!requiredRole && !noRoleRedirect) {
      const home = homePathForRole(user.role);
      if (home !== '/pano') router.replace(home);
    }
  }, [hydrated, user, router, locale, requiredRole, noRoleRedirect]);

  return { user, ready: hydrated };
}
