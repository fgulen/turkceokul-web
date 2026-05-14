'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useLocale } from '@/navigation';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Logo } from '@/components/logo';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';

interface DavetBilgi {
  gecerli: boolean;
  suresiDoldu?: boolean;
  zatenKullanildi?: boolean;
  hedefRol?: string;
  kurumAdi?: string;
  sinifAdi?: string;
  hedefEmail?: string;
}

const ROL_LABELS: Record<string, string> = {
  Ogretmen: 'Öğretmen',
  KurumYoneticisi: 'Kurum Yöneticisi',
  UlkeTemsilcisi: 'Ülke Temsilcisi',
};

export default function DavetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const locale = useLocale();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [bilgi, setBilgi] = useState<DavetBilgi | null>(null);
  const [bilgiYukleniyor, setBilgiYukleniyor] = useState(true);
  const [form, setForm] = useState({ ad: '', soyad: '', sifre: '', email: '', kurumAdi: '' });
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [tamamlandi, setTamamlandi] = useState(false);

  useEffect(() => {
    api.get(`/api/davet/${token}/bilgi`)
      .then(r => setBilgi(r.data))
      .catch(err => {
        const status = err.response?.status;
        if (status === 410) setBilgi({ gecerli: false, suresiDoldu: true });
        else if (status === 404) setBilgi({ gecerli: false });
        else setBilgi({ gecerli: false });
      })
      .finally(() => setBilgiYukleniyor(false));
  }, [token]);

  const field = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);
    try {
      const body: Record<string, string | undefined> = {
        ad: form.ad,
        soyad: form.soyad || undefined,
        sifre: form.sifre,
        email: form.email || undefined,
        kurumAdi: bilgi?.hedefRol === 'KurumYoneticisi' ? form.kurumAdi : undefined,
      };
      const { data } = await api.post(`/api/davet/${token}/kabul`, body);
      setAuth(data.user, data.accessToken, data.refreshToken);
      setTamamlandi(true);
      setTimeout(() => {
        const role = data.user?.role;
        if (role === 'KurumYoneticisi') router.push('/ogretmen', { locale });
        else if (role === 'Ogretmen') router.push('/ogretmen', { locale });
        else router.push('/pano', { locale });
      }, 1500);
    } catch (err) {
      const d = (err as { response?: { data?: unknown } }).response?.data;
      setHata(typeof d === 'string' ? d : 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setYukleniyor(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Logo size="md" />
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          {bilgiYukleniyor && (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          )}

          {!bilgiYukleniyor && (!bilgi?.gecerli) && (
            <div className="text-center py-6">
              <XCircle className="size-12 text-red-400 mx-auto mb-3" />
              <h2 className="font-bold text-lg mb-1">Davet Geçersiz</h2>
              <p className="text-muted-foreground text-sm">
                {bilgi?.suresiDoldu
                  ? 'Bu davet bağlantısının süresi dolmuş. Yeni bir davet isteyin.'
                  : bilgi?.zatenKullanildi
                  ? 'Bu davet bağlantısı zaten kullanılmış.'
                  : 'Davet bağlantısı bulunamadı.'}
              </p>
            </div>
          )}

          {!bilgiYukleniyor && bilgi?.gecerli && !tamamlandi && (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold mb-1">Hoş Geldiniz</h1>
                <p className="text-muted-foreground text-sm">
                  <strong>{ROL_LABELS[bilgi.hedefRol ?? ''] ?? bilgi.hedefRol}</strong> olarak davet edildiniz.
                  {bilgi.kurumAdi && <> · {bilgi.kurumAdi}</>}
                  {bilgi.sinifAdi && <> · {bilgi.sinifAdi}</>}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Ad *</label>
                    <input
                      required
                      value={form.ad}
                      onChange={field('ad')}
                      placeholder="Adınız"
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Soyad</label>
                    <input
                      value={form.soyad}
                      onChange={field('soyad')}
                      placeholder="Soyadınız"
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">
                    E-posta {bilgi.hedefEmail ? '' : '*'}
                  </label>
                  <input
                    type="email"
                    required={!bilgi.hedefEmail}
                    value={form.email || bilgi.hedefEmail || ''}
                    onChange={field('email')}
                    placeholder={bilgi.hedefEmail ?? 'ornek@email.com'}
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Şifre *</label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={form.sifre}
                    onChange={field('sifre')}
                    placeholder="En az 6 karakter"
                    className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  />
                </div>

                {bilgi.hedefRol === 'KurumYoneticisi' && (
                  <div>
                    <label className="block text-xs font-medium mb-1">Kurum Adı *</label>
                    <input
                      required
                      value={form.kurumAdi}
                      onChange={field('kurumAdi')}
                      placeholder="Okulunuzun / kurumunuzun adı"
                      className="w-full px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    />
                  </div>
                )}

                {hata && <p className="text-red-500 text-xs">{hata}</p>}

                <button
                  type="submit"
                  disabled={yukleniyor}
                  className="w-full py-2.5 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {yukleniyor && <Loader2 className="size-4 animate-spin" />}
                  Hesabı Oluştur
                </button>
              </form>
            </>
          )}

          {tamamlandi && (
            <div className="text-center py-6">
              <CheckCircle className="size-12 text-emerald-500 mx-auto mb-3" />
              <h2 className="font-bold text-lg mb-1">Hesap Oluşturuldu</h2>
              <p className="text-muted-foreground text-sm">Yönlendiriliyorsunuz...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
