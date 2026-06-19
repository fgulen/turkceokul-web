'use client';

import { use, useEffect, useState } from 'react';
import { useRouter, useLocale } from '@/navigation';
import { Loader2, XCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

// Route: /qr-login/[userId]/[qrToken]
// QR badge'lerinden gelen deep link handler
export default function QrLoginPage({ params }: { params: Promise<{ params: string[] }> }) {
  const { params: segments } = use(params);
  const [userId, qrToken] = segments ?? [];
  const router = useRouter();
  const locale = useLocale();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [hata, setHata] = useState('');

  useEffect(() => {
    if (!userId || !qrToken) {
      setHata('Geçersiz QR kodu.');
      return;
    }

    api.post('/api/auth/qr-login', { userId: parseInt(userId), qrToken })
      .then(({ data }) => {
        setAuth(data.user, data.accessToken, data.refreshToken);
        router.push('/pano', { locale });
      })
      .catch(() => setHata('QR kodu geçersiz veya süresi dolmuş. Öğretmeninizden yeni badge isteyin.'));
  }, [userId, qrToken]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-[100dvh] bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-xs text-center">
        <div className="flex justify-center mb-10">
          <Logo size="md" />
        </div>

        {!hata ? (
          <>
            <Loader2 className="size-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">QR kodu doğrulanıyor...</p>
          </>
        ) : (
          <>
            <XCircle className="size-12 text-red-400 mx-auto mb-4" />
            <p className="font-semibold text-slate-800 mb-1">Giriş Başarısız</p>
            <p className="text-muted-foreground text-sm">{hata}</p>
          </>
        )}
      </div>
    </div>
  );
}
