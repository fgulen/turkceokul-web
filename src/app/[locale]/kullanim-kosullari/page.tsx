// web/src/app/[locale]/kullanim-kosullari/page.tsx
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
  const path = `/${locale}/kullanim-kosullari`;

  return isEn ? {
    title: 'Terms of Use — Türkçe Okulu',
    description: 'The terms and conditions governing your use of the Türkçe Okulu platform.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { en: `${BASE}/en/kullanim-kosullari`, tr: `${BASE}/tr/kullanim-kosullari` } },
    openGraph: {
      title: 'Terms of Use — Türkçe Okulu',
      description: 'The terms and conditions governing your use of the Türkçe Okulu platform.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'en_GB',
      alternateLocale: ['tr_TR'],
    },
  } : {
    title: 'Kullanım Koşulları — Türkçe Okulu',
    description: 'Türkçe Okulu platformunu kullanımınızı düzenleyen şart ve koşullar.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { tr: `${BASE}/tr/kullanim-kosullari`, en: `${BASE}/en/kullanim-kosullari` } },
    openGraph: {
      title: 'Kullanım Koşulları — Türkçe Okulu',
      description: 'Türkçe Okulu platformunu kullanımınızı düzenleyen şart ve koşullar.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'tr_TR',
      alternateLocale: ['en_GB'],
    },
  };
}

const C = {
  tr: {
    h1: 'Kullanım Koşulları',
    sub: 'Platformumuzu kullanırken geçerli olan şart ve koşulları bu sayfada detaylı olarak açıklayacağız.',
  },
  en: {
    h1: 'Terms of Use',
    sub: 'The full terms and conditions for using our platform — coming soon.',
  },
};

export default async function KullanimKosullariPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;

  return (
    <div className="bg-white text-slate-900">
      <LandingNav locale={locale} alternateHref={isEn ? '/tr/kullanim-kosullari' : '/en/kullanim-kosullari'} />

      <section className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center md:px-10 md:pt-24">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{c.h1}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">{c.sub}</p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 md:px-10">
        <BrainstormPlaceholder alan="Kullanım Koşulları Hukuki Metni" />
      </section>

      <LandingFooter locale={locale} />
    </div>
  );
}
