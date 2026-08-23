'use client';

import { use, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useLocale } from '@/navigation';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { homePathForRole } from '@/lib/role-home';

// Route: /qr-login/[userId]/[qrToken]
// QR badge'lerinden gelen deep link handler
export default function QrLoginPage({ params }: { params: Promise<{ params: string[] }> }) {
  const { params: segments } = use(params);
  const [userId, qrToken] = segments ?? [];
  const t = useTranslations('pinLogin');
  const router = useRouter();
  const locale = useLocale();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [hata, setHata] = useState('');
  // Öğrenci PIN'ini/kullanıcı adını tarayıcı dışında bir yerden (ör. sadece badge)
  // görmüyor — QR süresiz/rotasyonsuz olduğu için badge kaybolursa tek geri dönüş
  // yolu bu kullanıcı adı + /pin-login. Bu yüzden her cihazda İLK QR taramasında
  // (localStorage bayrağı) panoya düşmeden önce bunu bir kere hatırlatıyoruz.
  const [kullaniciAdi, setKullaniciAdi] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !qrToken) {
      setHata('Geçersiz QR kodu.');
      return;
    }

    // Cookie/localStorage tarayıcı genelinde paylaşıldığı için (tab-scoped değil),
    // bu link öğretmenin/adminin kendi sekmesi dahil TÜM sekmelerdeki oturumu
    // değiştirir — badge önizlemesinde QR linkini "test etmek" için tıklarsa kendi
    // oturumundan habersizce atılmış olur. Devam etmeden önce bilinçli onay iste.
    const mevcutKullanici = useAuthStore.getState().user;
    if (mevcutKullanici && mevcutKullanici.role !== 'Ogrenci' && !confirm(t('staffSwitchWarning'))) {
      router.replace(homePathForRole(mevcutKullanici.role), { locale });
      return;
    }

    api.post('/api/auth/qr-login', { userId: parseInt(userId), qrToken })
      .then(({ data }) => {
        setAuth(data.user, data.accessToken);
        const flagKey = `qr-welcome-seen:${data.user.id}`;
        let seen = true;
        try { seen = localStorage.getItem(flagKey) === '1'; } catch { /* private mode vb. */ }
        if (!seen && data.user.kullaniciAdi) {
          try { localStorage.setItem(flagKey, '1'); } catch { /* private mode vb. */ }
          setKullaniciAdi(data.user.kullaniciAdi);
          return;
        }
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

        {kullaniciAdi ? (
          <div className="bg-card border border-border rounded-2xl p-6">
            <CheckCircle2 className="size-12 text-green-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-800 mb-3">{t('qrWelcomeTitle')}</p>
            <p className="text-xs text-muted-foreground mb-1">{t('qrWelcomeBody')}</p>
            <p className="font-mono font-bold text-lg text-primary tracking-wide mb-4">{kullaniciAdi}</p>
            <p className="text-xs text-muted-foreground mb-5">{t('qrWelcomeHint')}</p>
            <Button className="w-full" onClick={() => router.push('/pano', { locale })}>
              {t('qrWelcomeContinue')}
            </Button>
          </div>
        ) : !hata ? (
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
