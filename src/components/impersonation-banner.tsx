'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useAuthStore, impersonation } from '@/stores/auth';

// Impersonation aktifken StaffShell'in tepesinde her sayfada görünen bant.
// sessionStorage'a SSR'da erişilemez — mounted guard şart.
export function ImpersonationBanner() {
  const { user, setAuth } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !impersonation.isActive()) return null;

  function handleReturn() {
    const backup = impersonation.restore();
    if (!backup) return;
    setAuth(backup.user, backup.accessToken, backup.refreshToken);
    impersonation.clear();
    router.push('/super-admin');
  }

  return (
    <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <AlertCircle className="size-4 text-amber-600 shrink-0" />
      <span className="text-sm text-amber-800 flex-1 truncate">
        Şu an <strong>{user?.name} {user?.surname}</strong> hesabındasınız (impersonation)
      </span>
      <button onClick={handleReturn} className="text-sm font-medium text-amber-700 hover:text-amber-900 shrink-0">
        Kendi hesabına dön →
      </button>
    </div>
  );
}
