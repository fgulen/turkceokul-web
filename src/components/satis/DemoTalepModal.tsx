// web/src/components/satis/DemoTalepModal.tsx
// Public lead formu — /kurumsal-satis üzerindeki tek, konsolide "Teklif Al" CTA'sından
// açılır (nav + alt banner). Auth'suz düz `fetch` kullanır (bu sayfa server component +
// public ziyaretçi; api.ts'deki axios istemcisi yalnızca client'ta window varken relative
// URL'e düşüyor, aynı Next.js rewrite proxy'sini (next.config.ts: /api/:path* -> API_URL)
// plain fetch de kullanabiliyor — ekstra bağımlılık gerekmiyor). Yalnızca kullanıcı CTA'ya
// tıklayınca DOM'a girer; kapalıyken hiçbir öge render edilmez, bu yüzden sayfanın CLS'ine
// etkisi yok.
'use client';

import { useState } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import type { KatalogKitap } from '@/lib/katalog-api';

interface Props {
  kitaplar: KatalogKitap[];
  locale: string;
  onClose: () => void;
}

const C = {
  tr: {
    title: 'Demo / Teklif Talep Et',
    kitapLabel: 'İlgilendiğiniz kitaplar (opsiyonel)',
    kitapHint: 'Hiçbirini seçmezseniz genel/tüm katalog teklifi olarak iletilir.',
    kurumAdi: 'Kurum adı',
    yetkiliAdi: 'Yetkili adı soyadı',
    yetkiliEmail: 'E-posta',
    telefon: 'WhatsApp numarası (opsiyonel)',
    ulke: 'Ülke',
    submit: 'Gönder',
    submitting: 'Gönderiliyor...',
    success: 'Talebiniz alındı. Ülke temsilcimiz sizinle iletişime geçecek.',
    rateLimited: 'Çok fazla deneme yaptınız, lütfen daha sonra tekrar deneyin.',
    genericError: 'Talebiniz gönderilemedi. Lütfen tekrar deneyin.',
    close: 'Kapat',
    required: 'Zorunlu alan',
  },
  en: {
    title: 'Request a Demo / Quote',
    kitapLabel: 'Books you are interested in (optional)',
    kitapHint: 'Leave all unchecked to request a quote for the whole catalogue.',
    kurumAdi: 'Institution name',
    yetkiliAdi: 'Contact name',
    yetkiliEmail: 'Email',
    telefon: 'WhatsApp number (optional)',
    ulke: 'Country',
    submit: 'Send',
    submitting: 'Sending...',
    success: 'Your request has been received. Our country representative will contact you.',
    rateLimited: 'Too many attempts, please try again later.',
    genericError: 'Your request could not be sent. Please try again.',
    close: 'Close',
    required: 'Required field',
  },
};

export function DemoTalepModal({ kitaplar, locale, onClose }: Props) {
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;

  const [kurumAdi, setKurumAdi] = useState('');
  const [yetkiliAdi, setYetkiliAdi] = useState('');
  const [yetkiliEmail, setYetkiliEmail] = useState('');
  const [telefon, setTelefon] = useState('');
  const [ulkeAdi, setUlkeAdi] = useState('');
  const [secilenKitapIdleri, setSecilenKitapIdleri] = useState<string[]>([]);
  const [website, setWebsite] = useState(''); // honeypot

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function toggleKitap(id: string) {
    setSecilenKitapIdleri((prev) =>
      prev.includes(id) ? prev.filter((k) => k !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/katalog/demo-talep', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kurumAdi,
          yetkiliAdi,
          yetkiliEmail,
          telefon: telefon || undefined,
          ulkeAdi,
          ilgiliKitapIdleri: secilenKitapIdleri,
          website,
        }),
      });

      if (res.status === 429) {
        setError(c.rateLimited);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.hata ?? c.genericError);
        return;
      }
      const data = await res.json();
      setSuccess(data?.mesaj ?? c.success);
    } catch {
      setError(c.genericError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      role="dialog"
      aria-modal="true"
      aria-label={c.title}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-auto p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#1e1b1c]">{c.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 shrink-0"
            aria-label={c.close}
          >
            <X className="size-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center text-center gap-3 py-6">
            <CheckCircle2 className="size-10 text-green-500" />
            <p className="text-sm text-[#1e1b1c]">{success}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 px-5 py-2 rounded-xl bg-[#1b75bc] text-white text-sm font-semibold hover:bg-[#15619e] transition-colors"
            >
              {c.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1 text-[#414751]">{c.kurumAdi}</label>
              <input
                type="text"
                required
                maxLength={200}
                value={kurumAdi}
                onChange={(e) => setKurumAdi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b75bc]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-[#414751]">{c.yetkiliAdi}</label>
              <input
                type="text"
                required
                maxLength={200}
                value={yetkiliAdi}
                onChange={(e) => setYetkiliAdi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b75bc]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-[#414751]">{c.yetkiliEmail}</label>
              <input
                type="email"
                required
                maxLength={200}
                value={yetkiliEmail}
                onChange={(e) => setYetkiliEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b75bc]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-[#414751]">{c.telefon}</label>
              <input
                type="tel"
                maxLength={30}
                placeholder="+964 7XX XXX XXXX"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b75bc]/30"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1 text-[#414751]">{c.ulke}</label>
              <input
                type="text"
                required
                maxLength={100}
                value={ulkeAdi}
                onChange={(e) => setUlkeAdi(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1b75bc]/30"
              />
            </div>

            {kitaplar.length > 0 && (
              <div>
                <label className="block text-xs font-medium mb-1 text-[#414751]">{c.kitapLabel}</label>
                <p className="text-[11px] text-[#9ca3af] mb-1.5">{c.kitapHint}</p>
                <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 p-2 space-y-1">
                  {kitaplar.map((k) => (
                    <label
                      key={k.id}
                      className="flex items-center gap-2 rounded-lg px-1.5 py-1 text-[13px] text-[#414751] hover:bg-slate-50"
                    >
                      <input
                        type="checkbox"
                        checked={secilenKitapIdleri.includes(k.id)}
                        onChange={() => toggleKitap(k.id)}
                        className="rounded border-slate-300 text-[#1b75bc] focus:ring-[#1b75bc]/30"
                      />
                      {k.ad}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Honeypot — görsel olarak gizli, botlar doldurur. Autocomplete kapalı. */}
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              style={{ position: 'absolute', left: '-9999px', height: 0, width: 0, opacity: 0 }}
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full mt-1 py-2.5 rounded-xl bg-[#1b75bc] text-white text-sm font-semibold hover:bg-[#15619e] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {submitting ? c.submitting : c.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
