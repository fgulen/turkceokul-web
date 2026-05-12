'use client';

import { useState } from 'react';
import { useRouter, useLocale } from '@/navigation';
import { BookOpen, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

export default function PinLoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [pin, setPin] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);
    try {
      const { data } = await api.post('/api/auth/pin-login', { kullaniciAdi, pin });
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push('/pano', { locale });
    } catch {
      setHata('Kullanıcı adı veya PIN hatalı.');
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-center gap-2 font-bold text-xl text-primary mb-8">
          <BookOpen className="size-5" />
          TürkçeOkulu
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <h1 className="text-2xl font-bold mb-1">Giriş Yap</h1>
          <p className="text-muted-foreground text-sm mb-6">Kullanıcı adı ve PIN'ini gir</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Kullanıcı Adı</label>
              <input
                required
                value={kullaniciAdi}
                onChange={e => setKullaniciAdi(e.target.value)}
                placeholder="ali.veli.4823"
                autoComplete="username"
                className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">PIN</label>
              <input
                required
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background tracking-[0.5em] text-center"
              />
            </div>

            {hata && <p className="text-red-500 text-xs">{hata}</p>}

            <button
              type="submit"
              disabled={yukleniyor}
              className="w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {yukleniyor && <Loader2 className="size-4 animate-spin" />}
              Giriş Yap
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
