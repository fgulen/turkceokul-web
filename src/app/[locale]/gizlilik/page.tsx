// web/src/app/[locale]/gizlilik/page.tsx
import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing-nav';
import { LandingFooter } from '@/components/landing-footer';
import { BrainstormPlaceholder } from '@/components/brainstorm-placeholder';

const BASE = 'https://turkceokulu.com';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const path = `/${locale}/gizlilik`;

  return isEn ? {
    title: 'Privacy Policy — Türkçe Okulu',
    description: 'How Türkçe Okulu collects, uses and protects your personal data, including GDPR rights.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { en: `${BASE}/en/gizlilik`, tr: `${BASE}/tr/gizlilik` } },
    openGraph: {
      title: 'Privacy Policy — Türkçe Okulu',
      description: 'How Türkçe Okulu collects, uses and protects your personal data.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'en_GB',
      alternateLocale: ['tr_TR'],
    },
  } : {
    title: 'Gizlilik Politikası — Türkçe Okulu',
    description: 'Türkçe Okulu kişisel verilerinizi nasıl topluyor, kullanıyor ve koruyor — GDPR hakları dahil.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { tr: `${BASE}/tr/gizlilik`, en: `${BASE}/en/gizlilik` } },
    openGraph: {
      title: 'Gizlilik Politikası — Türkçe Okulu',
      description: 'Türkçe Okulu kişisel verilerinizi nasıl topluyor, kullanıyor ve koruyor.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'tr_TR',
      alternateLocale: ['en_GB'],
    },
  };
}

const C = {
  tr: {
    h1: 'Gizlilik Politikası',
    sub: 'Verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu bu sayfada detaylı olarak açıklayacağız.',
  },
  en: {
    h1: 'Privacy Policy',
    sub: 'How your data is collected, used and protected — full details coming soon.',
  },
};

export default async function GizlilikPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;

  return (
    <div className="bg-white text-slate-900">
      <LandingNav locale={locale} alternateHref={isEn ? '/tr/gizlilik' : '/en/gizlilik'} />

      <section className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center md:px-10 md:pt-24">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{c.h1}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">{c.sub}</p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 md:px-10">
        <BrainstormPlaceholder alan="GDPR Uyumlu Gizlilik Politikası Metni" />
      </section>

      <LandingFooter locale={locale} />
    </div>
  );
}
