// web/src/app/[locale]/iletisim/page.tsx
import type { Metadata } from 'next';
import { Link } from '@/navigation';
import { ArrowRight } from 'lucide-react';
import { LandingNav } from '@/components/landing-nav';
import { LandingFooter } from '@/components/landing-footer';
import { BrainstormPlaceholder } from '@/components/brainstorm-placeholder';

const BASE = 'https://turkceokulu.com';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const path = `/${locale}/iletisim`;

  return isEn ? {
    title: 'Contact — Türkçe Okulu',
    description: 'Get in touch with the Türkçe Okulu team — official contact details and institutional sales.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { en: `${BASE}/en/iletisim`, tr: `${BASE}/tr/iletisim` } },
    openGraph: {
      title: 'Contact — Türkçe Okulu',
      description: 'Get in touch with the Türkçe Okulu team.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'en_GB',
      alternateLocale: ['tr_TR'],
    },
  } : {
    title: 'İletişim — Türkçe Okulu',
    description: 'Türkçe Okulu ekibiyle iletişime geçin — resmî iletişim bilgileri ve kurumsal satış.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { tr: `${BASE}/tr/iletisim`, en: `${BASE}/en/iletisim` } },
    openGraph: {
      title: 'İletişim — Türkçe Okulu',
      description: 'Türkçe Okulu ekibiyle iletişime geçin.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'tr_TR',
      alternateLocale: ['en_GB'],
    },
  };
}

const C = {
  tr: {
    h1: 'İletişim',
    sub: 'Bize aşağıdaki bilgilerle ulaşabilirsiniz.',
    kurumsalText: 'Kurumsal talepler için',
    kurumsalCta: 'Teklif Al',
  },
  en: {
    h1: 'Contact',
    sub: 'You can reach us with the details below.',
    kurumsalText: 'For institutional requests,',
    kurumsalCta: 'Get a Quote',
  },
};

export default async function IletisimPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;

  return (
    <div className="bg-white text-slate-900">
      <LandingNav locale={locale} alternateHref={isEn ? '/tr/iletisim' : '/en/iletisim'} />

      <section className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center md:px-10 md:pt-24">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{c.h1}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">{c.sub}</p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-10 md:px-10">
        <BrainstormPlaceholder alan="İletişim Bilgileri (resmî e-posta / adres / telefon)" />
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 text-center md:px-10">
        <p className="text-sm text-slate-500">
          {c.kurumsalText}{' '}
          <Link href="/kurumsal-satis" className="inline-flex items-center gap-1 font-semibold text-primary">
            {c.kurumsalCta} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </section>

      <LandingFooter locale={locale} />
    </div>
  );
}
