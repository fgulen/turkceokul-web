'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link, useLocale, useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Eye, EyeOff, KeyRound, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';

function SifreSifirlaForm() {
  const t = useTranslations('sifremiSifirla');
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const router = useRouter();
  const locale = useLocale();

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const field = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-destructive text-sm mb-4">{t('invalidToken')}</p>
        <Button className="w-full h-11" onClick={() => router.push('/sifremi-unuttum', { locale })}>
          {t('requestNewLink')}
        </Button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 8) { setError(t('errorMinLength')); return; }
    if (form.password !== form.confirm) { setError(t('errorMismatch')); return; }
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/reset-password', { token, newPassword: form.password });
      setDone(true);
    } catch (err) {
      const d = (err as { response?: { data?: unknown } }).response?.data;
      setError(typeof d === 'string' ? d : t('errorToken'));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <CheckCircle2 className="size-12 text-green-500" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t('successTitle')}</h2>
        <p className="text-muted-foreground text-sm mb-6">
          {t('successDesc')}
        </p>
        <Button className="w-full h-11" onClick={() => router.push('/giris', { locale })}>
          {t('loginButton')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-5">
        <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <KeyRound style={{ width: 18, height: 18, color: '#1b75bc' }} />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-tight">{t('title')}</h1>
          <p className="text-muted-foreground text-xs">{t('subtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">{t('newPasswordLabel')}</label>
          <div className="relative">
            <Input
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={field('password')}
              required
              placeholder={t('newPasswordPlaceholder')}
              autoComplete="new-password"
              autoFocus
              className="pr-10"
            />
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1.5">{t('confirmLabel')}</label>
          <Input
            type={showPass ? 'text' : 'password'}
            value={form.confirm}
            onChange={field('confirm')}
            required
            placeholder={t('confirmPlaceholder')}
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
          {loading ? t('saving') : t('submit')}
        </Button>
      </form>
    </>
  );
}

export default function SifreSifirlaPage() {
  const t = useTranslations('sifremiSifirla');
  return (
    <div className="min-h-[100dvh] bg-muted flex items-center justify-center p-4">
      <TurkishLetterBackdrop variant="sifremi-sifirla" />

      <div className="w-full max-w-sm" style={{ position: 'relative', zIndex: 1 }}>
        <Link href="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8">
          <Suspense fallback={<div className="h-40" />}>
            <SifreSifirlaForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          <Link href="/giris" className="text-primary hover:underline font-medium">
            {t('backToLogin')}
          </Link>
        </p>
      </div>
    </div>
  );
}
