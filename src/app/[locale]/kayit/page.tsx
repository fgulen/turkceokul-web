"use client";

import { useState } from 'react';
import { Link, useLocale, useRouter } from '@/navigation';
import { BookOpen, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';

export default function KayitPage() {
  const router = useRouter();
  const locale = useLocale();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [form, setForm] = useState({ name: '', surname: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const field = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/api/auth/register', form);
       setAuth(data.user, data.accessToken, data.refreshToken);
       router.push('/pano', { locale });
    } catch (err) {
      const d = (err as { response?: { data?: unknown } }).response?.data;
      setError(typeof d === 'string' ? d : 'Kayıt başarısız. Lütfen tekrar dene.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 font-bold text-xl text-primary mb-8"
        >
          <BookOpen className="size-5" />
          TürkçeOkulu
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-1">Hesap Oluştur</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Ücretsiz başla, hemen öğrenmeye başla.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Ad</label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={field('name')}
                  required
                  placeholder="Ahmet"
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Soyad</label>
                <Input
                  type="text"
                  value={form.surname}
                  onChange={field('surname')}
                  required
                  placeholder="Yılmaz"
                  autoComplete="family-name"
                />
              </div>
            </div>
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
                  placeholder="En az 6 karakter"
                  autoComplete="new-password"
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

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Kaydediliyor…' : 'Kayıt Ol'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Zaten hesabın var mı?{' '}
          <Link href="/giris" className="text-primary font-medium hover:underline">
            Giriş yap
          </Link>
        </p>
      </div>
    </div>
  );
}
