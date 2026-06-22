'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, Users } from 'lucide-react';
import { useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface KatilResponse {
  id: number;
  name: string;
  mesaj: string;
}

function SinifKatilContent() {
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

  useEffect(() => {
    const urlKod = searchParams.get('kod');
    if (urlKod) setKod(urlKod.toUpperCase());
  }, [searchParams]);

  // Giriş/kayıt sonrası geri dönüldüğünde URL'deki kodu otomatik gönder
  useEffect(() => {
    const urlKod = searchParams.get('kod');
    if (urlKod && _hasHydrated && user && !joined && !autoFiredRef.current) {
      autoFiredRef.current = true;
      katilMutation.mutate(urlKod.toUpperCase());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [_hasHydrated, user]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const k = kod.trim().toUpperCase();
    if (k.length < 4) return;

    // Giriş yapılmamışsa kayıt sayfasına yönlendir; redirect ile kod korunur
    if (_hasHydrated && !user) {
      const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/kayit?tip=bireysel&redirect=${returnTo}` as Parameters<typeof router.push>[0]);
      return;
    }

    katilMutation.mutate(k);
  }

  if (joined) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="bg-card border border-border rounded-2xl p-10 max-w-sm w-full text-center shadow-lg">
          <CheckCircle className="size-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Sınıfa katıldın!</h1>
          <p className="text-muted-foreground mb-8">{joined.name}</p>
          <Button className="w-full h-14 text-lg font-semibold" onClick={() => router.push('/pano')}>
            Panoya Git →
          </Button>
        </div>
      </div>
    );
  }

  const errorMsg = (() => {
    if (!katilMutation.error) return null;
    const d = (katilMutation.error as { response?: { data?: unknown } }).response?.data;
    if (typeof d === 'string') return d;
    if (d && typeof d === 'object') {
      const obj = d as Record<string, unknown>;
      return (obj.mesaj ?? obj.message ?? 'Bir hata oluştu.') as string;
    }
    return 'Bir hata oluştu.';
  })();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <div className="bg-card border border-border rounded-2xl p-8 max-w-sm w-full shadow-lg">
        <div className="flex items-center gap-3 mb-8">
          <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Users className="size-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Sınıfa Katıl</h1>
            <p className="text-sm text-muted-foreground">Öğretmeninden aldığın kodu gir</p>
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
            disabled={kod.trim().length < 4 || katilMutation.isPending}
            className="w-full h-14 text-lg font-semibold"
          >
            {katilMutation.isPending ? 'Katılınıyor…' : 'Sınıfa Katıl'}
          </Button>
        </form>

        {_hasHydrated && !user && (
          <p className="text-center text-xs text-muted-foreground mt-4">
            Kodu gir ve butona tıkla — hesabın yoksa seni kayıt sayfasına yönlendireceğiz.
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
