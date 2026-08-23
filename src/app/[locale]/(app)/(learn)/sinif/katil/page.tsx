'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { CheckCircle, Users } from 'lucide-react';
import { useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { hasSessionHint } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface KatilResponse {
  id: number;
  name: string;
  mesaj: string;
}

function SinifKatilContent() {
  const t = useTranslations('sinifKatil');
  const searchParams = useSearchParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const [kod, setKod] = useState('');
  const [joined, setJoined] = useState<KatilResponse | null>(null);
  const autoFiredRef = useRef(false);

  const katilMutation = useMutation({
    mutationFn: (k: string) =>
      api.post<KatilResponse>(`/api/sinif/katil?kod=${encodeURIComponent(k)}`).then((r) => r.data),
    onSuccess: (data) => setJoined(data),
  });

  // Kayıt/giriş sonrası otomatik katılım denemesi ayrı bir mutation: token'ın henüz
  // taze oturumla senkron olmadığı anlık bir 401 yarışına düşerse sessizce bir kez
  // tekrar dener. react-query'nin yerleşik retry'ı boyunca isPending true kalır ve
  // error sadece TÜM denemeler tükenince set edilir — kullanıcıya korkutucu bir hata
  // yanıp sönmeden gösterilir. Sadece 401'de retry (`error.response.status`) — geçersiz/
  // süresi dolmuş/dolu kod gibi kalıcı hatalar hemen gösterilir, gizlenmez. Elle kod
  // girilen manuel denemede (katilMutation, retry yok) hata her zaman anında gösterilir.
  const autoKatilMutation = useMutation({
    mutationFn: (k: string) =>
      api.post<KatilResponse>(`/api/sinif/katil?kod=${encodeURIComponent(k)}`).then((r) => r.data),
    onSuccess: (data) => setJoined(data),
    retry: (failureCount, error) =>
      failureCount < 1 && (error as { response?: { status?: number } }).response?.status === 401,
    retryDelay: 700,
  });

  // Giriş yapılmamış ziyaretçi kayıt formuna gönderilmeden önce kodun gerçekten var
  // olduğunu doğrular — daha önce bu kontrol hiç yapılmıyordu, rastgele bir kod bile
  // kayıt sayfasında "başarıyla girdin" mesajı gösteriyordu (asıl doğrulama ancak
  // hesap oluşturulduktan sonra arka planda yapılıyordu).
  const dogrulaMutation = useMutation({
    mutationFn: (k: string) => api.get(`/api/sinif/dogrula?kod=${encodeURIComponent(k)}`),
    onSuccess: async (_data, k) => {
      // await şart: logout() sunucuda hasSession/refreshToken cookie'lerini siler.
      // Await edilmeden kayıt sayfasına geçilirse, kayıt formu gönderildiğinde
      // /api/auth/register YENİ bu cookie'leri set eder — ama gecikmeli dönen
      // logout yanıtı register'dan SONRA gelirse taze oturumu siler (aynı cookie
      // adı/path'i). Sonuç: kayıt sonrası sinif/katil'e dönüşte oturum geçersiz
      // görünüp otomatik katılım 401 ile patlıyordu (kısa süreli "bir şeyler ters
      // gitti" hatası, ardından bazen ikinci denemede başarı).
      await useAuthStore.getState().logout();
      const returnTo = encodeURIComponent(`${window.location.pathname}?kod=${encodeURIComponent(k)}`);
      router.push(`/kayit?tip=bireysel&redirect=${returnTo}` as Parameters<typeof router.push>[0]);
    },
  });

  useEffect(() => {
    const urlKod = searchParams.get('kod');
    if (urlKod) setKod(urlKod.toUpperCase());
  }, [searchParams]);

  // Giriş/kayıt sonrası geri dönüldüğünde URL'deki kodu otomatik gönder
  useEffect(() => {
    const urlKod = searchParams.get('kod');
    if (urlKod && _hasHydrated && user && !joined && !autoFiredRef.current) {
      autoFiredRef.current = true;
      autoKatilMutation.mutate(urlKod.toUpperCase());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const k = kod.trim().toUpperCase();
    if (k.length < 4) return;

    // Giriş yapılmamışsa: önce kodu doğrula, geçerliyse kayıt sayfasına yönlendir.
    // !user: hiç kullanıcı yok. user && !hasSessionHint(): localStorage'ta stale user
    // var ama geçerli oturum cookie'si yok — yine bu dala düşer.
    if (_hasHydrated && (!user || !hasSessionHint())) {
      dogrulaMutation.mutate(k);
      return;
    }

    katilMutation.mutate(k);
  }

  if (joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-sm w-full text-center shadow-lg">
          <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('successTitle')}</h1>
          <p className="text-muted-foreground mb-8">{joined.name}</p>
          <Button className="w-full h-14 text-lg font-semibold" onClick={() => router.push('/pano')}>
            {t('goToDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  const errorMsg = (() => {
    const error = katilMutation.error ?? autoKatilMutation.error ?? dogrulaMutation.error;
    if (!error) return null;
    const d = (error as { response?: { data?: unknown } }).response?.data;
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') {
      const obj = d as Record<string, unknown>;
      return (obj.mesaj ?? obj.message ?? t('errorGeneric')) as string;
    }
    return t('errorGeneric');
  })();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full shadow-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            value={kod}
            onChange={(e) => setKod(e.target.value.toUpperCase())}
            placeholder="ABCD12"
            maxLength={10}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="characters"
            className="h-16 text-3xl text-center font-mono tracking-widest border-2 font-bold"
          />

          {errorMsg && (
            <p className="text-sm text-destructive text-center font-medium">{errorMsg}</p>
          )}

          <Button
            type="submit"
            disabled={kod.trim().length < 4 || katilMutation.isPending || autoKatilMutation.isPending || dogrulaMutation.isPending}
            className="w-full h-14 text-lg font-semibold"
          >
            {katilMutation.isPending || autoKatilMutation.isPending || dogrulaMutation.isPending ? t('joining') : t('joinButton')}
          </Button>
        </form>

        {_hasHydrated && !user && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            {t('hintNoAccount')}
          </p>
        )}
      </div>
    </div>
  );
}

export default function SinifKatilPage() {
  return (
    <Suspense>
      <SinifKatilContent />
    </Suspense>
  );
}
