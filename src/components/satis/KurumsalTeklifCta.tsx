// web/src/components/satis/KurumsalTeklifCta.tsx
// Sayfadaki TEK "Teklif Al" giriş noktası — nav CTA'sı bu bölüme `#teklif` ile
// ankor edilir, buradaki büyük banner de aynı DemoTalepModal'ı açar. KatalogContent
// (server component) içinde yalnızca bu küçük yaprak 'use client' — geri kalan katalog
// render'ı server-side kalır (fiyatlar SSR HTML'de kalmalı, bkz. page.tsx SEO notu).
'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import type { KatalogKitap } from '@/lib/katalog-api';
import { DemoTalepModal } from '@/components/satis/DemoTalepModal';

const C = {
  tr: {
    title: 'Kurumunuz için teklif alın',
    sub: 'Kartlardaki fiyatlar öğrenci başınadır — tek bir yıllık lisans tüm kataloğu kapsar, kitap başına ayrı ücret yoktur. Satış ekibimiz 48 saat içinde sizinle iletişime geçer. Ödeme: havale.',
    button: 'Teklif Al',
  },
  en: {
    title: 'Get a quote for your institution',
    sub: 'Prices on the cards are per student — a single annual licence covers the whole catalogue, there is no separate charge per book. Our sales team will reach out within 48 hours. Payment: bank transfer.',
    button: 'Request a Quote',
  },
};

export function KurumsalTeklifCta({ locale, kitaplar }: { locale: string; kitaplar: KatalogKitap[] }) {
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div id="teklif" className="mt-4 scroll-mt-24 rounded-[20px] bg-gradient-to-br from-[#1e3a5f] via-primary to-sky-500 px-6 py-12 text-center">
      <h2 className="mb-2.5 text-2xl font-extrabold tracking-tight text-white">{c.title}</h2>
      <p className="mx-auto mb-6 max-w-md text-sm text-white/75">{c.sub}</p>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-2 rounded-[10px] bg-white px-7 py-3.5 text-[15px] font-bold text-primary"
      >
        {c.button} <ArrowRight className="h-4 w-4" />
      </button>

      {modalOpen && (
        <DemoTalepModal kitaplar={kitaplar} locale={locale} onClose={() => setModalOpen(false)} />
      )}
    </div>
  );
}
