'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

const ONAY_KEY = 'cerezOnayi';

export function CookieBanner() {
  const t = useTranslations('cerezBanner');
  // İlk render'da (SSR + hydration) gizli varsayılır, mount'ta localStorage kontrolü
  // yapılır — aksi halde sunucu/istemci içeriği uyuşmazlığı (hydration mismatch) olur.
  const [gorunur, setGorunur] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGorunur(!localStorage.getItem(ONAY_KEY));
  }, []);

  function karar(deger: 'kabul' | 'red') {
    localStorage.setItem(ONAY_KEY, deger);
    setGorunur(false);
  }

  // Banner'ın gerçek yüksekliğini --cerez-banner-h'e yazar — perde-giris.tsx gibi
  // fixed-bottom aksiyon butonları bunu pay bırakıp banner'ın altında kalmaz (z-index
  // banner'da daha yüksek olduğu için tıklamayı banner yakalıyordu, bkz. e2e a11y bulgusu).
  useEffect(() => {
    if (!gorunur) {
      document.documentElement.style.setProperty('--cerez-banner-h', '0px');
      return;
    }
    const el = ref.current;
    if (!el) return;
    const guncelle = () => document.documentElement.style.setProperty('--cerez-banner-h', `${el.offsetHeight}px`);
    guncelle();
    const ro = new ResizeObserver(guncelle);
    ro.observe(el);
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty('--cerez-banner-h', '0px');
    };
  }, [gorunur]);

  if (!gorunur) return null;

  return (
    <div
      ref={ref}
      role="region"
      aria-label={t('mesaj')}
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-slate-200 bg-white/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-sm text-slate-600">
          {t('mesaj')}{' '}
          <Link href="/gizlilik" className="font-semibold text-slate-900 underline underline-offset-2 hover:text-blue-700">
            {t('gizlilikLink')}
          </Link>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => karar('red')}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            {t('reddet')}
          </button>
          <button
            type="button"
            onClick={() => karar('kabul')}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {t('kabulEt')}
          </button>
        </div>
      </div>
    </div>
  );
}
