'use client';

import { useState } from 'react';
import { Link, useLocale, useRouter } from '@/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';

export default function GirisPage() {
  const router = useRouter();
  const locale = useLocale();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const field = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/login', form);
      setAuth(data.user, data.accessToken, data.refreshToken);
      // Redirect param'ı kontrol et (QR tarama, korumalı sayfa yönlendirmesi için)
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        window.location.href = redirect;
        return;
      }
      const role = data.user?.role;
      if (role === 'SuperAdmin') router.push('/super-admin', { locale });
      else if (role === 'Koordinator') router.push('/admin', { locale });
      else if (role === 'KurumYoneticisi') router.push('/kurum-yoneticisi', { locale });
      else if (role === 'Ogretmen' || role === 'UlkeTemsilcisi') router.push('/ogretmen', { locale });
      else router.push('/pano', { locale });
    } catch (err) {
      const d = (err as { response?: { data?: unknown } }).response?.data;
      setError(typeof d === 'string' ? d : 'E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-muted flex items-center justify-center p-4">
      <TurkishLetterBackdrop variant="giris" />

      <div className="w-full max-w-sm" style={{ position: 'relative', zIndex: 1 }}>
        <Link href="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-1">Giriş Yap</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Hesabına erişmek için bilgilerini gir.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">E-posta</label>
              <Input
                type="email"
                value={form.email}
                onChange={field('email')}
                required
                placeholder="ornek@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium">Şifre</label>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => router.push('/sifremi-unuttum', { locale })}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  Şifremi unuttum
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={form.password}
                  onChange={field('password')}
                  required
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full h-12 text-base" disabled={loading}>
              {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Hesabın yok mu?{' '}
          <a
            href="/kayit"
            onClick={(e) => {
              e.preventDefault();
              const red = new URLSearchParams(window.location.search).get('redirect');
              const href = red ? `/kayit?redirect=${encodeURIComponent(red)}` : '/kayit';
              router.push(href, { locale });
            }}
            className="text-primary font-medium hover:underline cursor-pointer"
          >
            Ücretsiz kayıt ol
          </a>
        </p>
      </div>
    </div>
  );
}
