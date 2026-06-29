'use client';

import { useState } from 'react';
import { Link, useLocale, useRouter } from '@/navigation';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';

export default function SifremiUnuttumPage() {
  const router = useRouter();
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/api/auth/forgot-password', { email });
      setSent(true);
    } catch {
      // Güvenlik: hangi durum olursa olsun başarı mesajı göster (email enumeration engeli)
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-muted flex items-center justify-center p-4">
      <TurkishLetterBackdrop variant="sifremi-unuttum" />

      <div className="w-full max-w-sm" style={{ position: 'relative', zIndex: 1 }}>
        <Link href="/" className="flex justify-center mb-8">
          <Logo size="md" />
        </Link>

        <div className="bg-card border border-border rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="size-12 text-green-500" />
              </div>
              <h1 className="text-xl font-bold mb-2">E-posta gönderildi</h1>
              <p className="text-muted-foreground text-sm mb-6" style={{ lineHeight: '1.6' }}>
                <strong>{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
                Gelen kutunuzu kontrol edin — 1 saat içinde geçerlidir.
              </p>
              <p className="text-xs text-muted-foreground mb-6">
                E-posta gelmediyse spam/önemsiz klasörünü kontrol edin.
              </p>
              <Button
                className="w-full h-11"
                onClick={() => router.push('/giris', { locale })}
              >
                Giriş sayfasına dön
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mail style={{ width: 18, height: 18, color: '#1b75bc' }} />
                </div>
                <div>
                  <h1 className="text-xl font-bold leading-tight">Şifremi unuttum</h1>
                  <p className="text-muted-foreground text-xs">Sıfırlama bağlantısı gönderelim</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-5" style={{ lineHeight: '1.6' }}>
                Hesabınızla ilişkili e-posta adresini girin. Şifrenizi sıfırlayabileceğiniz bir bağlantı göndereceğiz.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">E-posta adresi</label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="ornek@email.com"
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button type="submit" className="w-full h-11 text-sm font-semibold" disabled={loading}>
                  {loading ? 'Gönderiliyor…' : 'Sıfırlama Bağlantısı Gönder'}
                </Button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-5">
          <button
            type="button"
            onClick={() => router.push('/giris', { locale })}
            className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium"
          >
            <ArrowLeft className="size-3.5" />
            Giriş sayfasına dön
          </button>
        </p>
      </div>
    </div>
  );
}
