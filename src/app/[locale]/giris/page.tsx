'use client';

import { useState } from 'react';
import { Link, useLocale, useRouter } from '@/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

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
      const role = data.user?.role;
      if (role === 'SuperAdmin') router.push('/super-admin', { locale });
      else if (role === 'Admin') router.push('/admin', { locale });
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

  const CHARS: { ch: string; top: string; left: string; size: number; rotate: number }[] = [
    { ch: 'Ğ', top: '8%',  left: '6%',  size: 160, rotate: -18 },
    { ch: 'Ş', top: '12%', left: '82%', size: 140, rotate: 14  },
    { ch: 'Ü', top: '55%', left: '3%',  size: 180, rotate: -8  },
    { ch: 'Ö', top: '72%', left: '88%', size: 150, rotate: 20  },
    { ch: 'İ', top: '82%', left: '18%', size: 130, rotate: -22 },
    { ch: 'Ç', top: '38%', left: '91%', size: 170, rotate: 10  },
    { ch: 'Â', top: '25%', left: '2%',  size: 120, rotate: 30  },
    { ch: 'Ğ', top: '90%', left: '70%', size: 110, rotate: -12 },
  ];

  return (
    <div className="min-h-[100dvh] bg-muted flex items-center justify-center p-4" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Dekoratif Türkçe harfler */}
      {CHARS.map((c, i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: c.top,
            left: c.left,
            fontSize: c.size,
            fontWeight: 900,
            lineHeight: 1,
            color: '#1b75bc',
            opacity: 0.055,
            transform: `rotate(${c.rotate}deg)`,
            userSelect: 'none',
            pointerEvents: 'none',
            fontFamily: 'inherit',
          }}
        >
          {c.ch}
        </span>
      ))}

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
              <label className="block text-sm font-medium mb-1.5">Şifre</label>
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
          <Link href="/kayit" className="text-primary font-medium hover:underline">
            Ücretsiz kayıt ol
          </Link>
        </p>
      </div>
    </div>
  );
}
