// web/src/app/[locale]/hakkimizda/page.tsx
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
  const path = `/${locale}/hakkimizda`;

  return isEn ? {
    title: 'About Us — Türkçe Okulu',
    description: 'The story behind Türkçe Okulu and Nevai Publishers — our mission to bring real Turkish curriculum to the world.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { en: `${BASE}/en/hakkimizda`, tr: `${BASE}/tr/hakkimizda` } },
    openGraph: {
      title: 'About Us — Türkçe Okulu',
      description: 'The story behind Türkçe Okulu and Nevai Publishers.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'en_GB',
      alternateLocale: ['tr_TR'],
    },
  } : {
    title: 'Hakkımızda — Türkçe Okulu',
    description: 'Türkçe Okulu ve Nevai Yayınları\'nın hikayesi — dünyaya gerçek bir Türkçe müfredatı taşıma misyonumuz.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { tr: `${BASE}/tr/hakkimizda`, en: `${BASE}/en/hakkimizda` } },
    openGraph: {
      title: 'Hakkımızda — Türkçe Okulu',
      description: 'Türkçe Okulu ve Nevai Yayınları\'nın hikayesi.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'tr_TR',
      alternateLocale: ['en_GB'],
    },
  };
}

const C = {
  tr: {
    h1: 'Hakkımızda',
    sub: 'Türkçe Okulu\'nun ve Nevai Yayınları ile olan bağının hikayesini burada anlatacağız.',
  },
  en: {
    h1: 'About Us',
    sub: 'The story of Türkçe Okulu and its connection to Nevai Publishers, coming soon.',
  },
};

export default async function HakkimizdaPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;

  return (
    <div className="bg-white text-slate-900">
      <LandingNav locale={locale} alternateHref={isEn ? '/tr/hakkimizda' : '/en/hakkimizda'} />

      <section className="mx-auto max-w-3xl px-4 pt-16 pb-8 text-center md:px-10 md:pt-24">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">{c.h1}</h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-500">{c.sub}</p>
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-20 md:px-10">
        <BrainstormPlaceholder alan="Hakkımızda — Nevai + platform hikayesi" />
      </section>

      <LandingFooter locale={locale} />
    </div>
  );
}
