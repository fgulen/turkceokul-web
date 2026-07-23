'use client';

import { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { useAuthStore, impersonation, type AuthUser } from '@/stores/auth';

// Impersonation aktifken StaffShell'in tepesinde her sayfada görünen bant.
// sessionStorage'a SSR'da erişilemez — mounted guard şart.
export function ImpersonationBanner() {
  const { user, setAuth } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [returning, setReturning] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || !impersonation.isActive()) return null;

  async function handleReturn() {
    setReturning(true);
    try {
      // SuperAdmin'in orijinal refresh token'ı httpOnly cookie'de saklanıyor
      // (bkz. SuperAdminController.Impersonate) — burada sadece o cookie'yle
      // sunucudan yeni bir access token isteniyor, JS hiçbir token görmüyor.
      const { data } = await api.post<{ user: AuthUser; accessToken: string }>('/api/auth/impersonate-return');
      setAuth(data.user, data.accessToken);
      impersonation.clear();
      router.push('/super-admin');
    } catch {
      impersonation.clear();
      router.push('/giris');
    } finally {
      setReturning(false);
    }
  }

  return (
    <div className="flex items-center gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2.5">
      <AlertCircle className="size-4 text-amber-600 shrink-0" />
      <span className="text-sm text-amber-800 flex-1 truncate">
        Şu an <strong>{user?.name} {user?.surname}</strong> hesabındasınız (impersonation)
      </span>
      <button
        onClick={handleReturn}
        disabled={returning}
        className="text-sm font-medium text-amber-700 hover:text-amber-900 shrink-0 disabled:opacity-50"
      >
        {returning ? 'Dönülüyor…' : 'Kendi hesabına dön →'}
      </button>
    </div>
  );
}
