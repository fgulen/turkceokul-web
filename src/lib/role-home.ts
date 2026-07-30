import type { UserRole } from '@/stores/auth';

export function homePathForRole(role: UserRole): string {
  switch (role) {
    case 'SuperAdmin': return '/super-admin';
    case 'Koordinator': return '/admin';
    case 'KurumYoneticisi': return '/kurum-yoneticisi';
    case 'UlkeTemsilcisi': return '/ulke-temsilcisi';
    case 'Ogretmen': return '/ogretmen';
    default: return '/pano';
  }
}
