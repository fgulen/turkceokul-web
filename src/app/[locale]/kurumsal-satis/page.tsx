// web/src/app/[locale]/kurumsal-satis/page.tsx
import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing-nav';
import { LandingFooter } from '@/components/landing-footer';
import { KatalogContent } from '@/components/satis/KatalogContent';

const BASE = 'https://turkceokulu.com';

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const path = `/${locale}/kurumsal-satis`;

  return isEn ? {
    title: 'Institutional Sales | Turkish Licences for Schools — Türkçe Okulu',
    description: 'Buy a Turkish teaching licence for your school or institution. CEFR-aligned book series, bundles and volume discounts. Nevai Publishers content.',
    keywords: [
      'Turkish licence for schools', 'institutional Turkish course', 'buy Turkish curriculum',
      'CEFR Turkish textbooks', 'Nevai Publishers institutional', 'school Turkish licence pricing',
    ],
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { en: `${BASE}/en/kurumsal-satis`, tr: `${BASE}/tr/kurumsal-satis` } },
    openGraph: {
      title: 'Institutional Sales | Turkish Licences for Schools — Türkçe Okulu',
      description: 'CEFR-aligned Turkish book series, bundles and volume discounts for schools and institutions.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'en_GB',
      alternateLocale: ['tr_TR'],
    },
  } : {
    title: 'Kurumsal Satış | Okullar İçin Türkçe Öğretim Lisansı — Türkçe Okulu',
    description: 'Okulunuz veya kurumunuz için Türkçe öğretim lisansı satın alın. CEFR uyumlu kitap serisi, paketler ve hacim indirimleri. Nevai Yayınları içeriği.',
    keywords: [
      'kurumsal türkçe lisansı', 'okullar için türkçe kursu', 'türkçe müfredat satın al',
      'CEFR türkçe kitap', 'nevai yayınları kurumsal', 'okul türkçe lisans fiyatları',
    ],
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { tr: `${BASE}/tr/kurumsal-satis`, en: `${BASE}/en/kurumsal-satis` } },
    openGraph: {
      title: 'Kurumsal Satış | Okullar İçin Türkçe Öğretim Lisansı — Türkçe Okulu',
      description: 'CEFR uyumlu türkçe kitap serisi, paketler ve hacim indirimleri — okullar ve kurumlar için.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'tr_TR',
      alternateLocale: ['en_GB'],
    },
  };
}

// ─── Hero içeriği (TR / EN) ───────────────────────────────────────────────────

const C = {
  tr: {
    badge: 'OKULLAR VE KURUMLAR İÇİN',
    h1a: 'Sınıfınıza',
    h1b: 'gerçek bir Türkçe müfredatı',
    sub: 'CEFR uyumlu Nevai Yayınları kitap serisi + gamification\'lı dijital platform. Paket veya tekil kitap seçin, hacim indiriminden yararlanın.',
  },
  en: {
    badge: 'FOR SCHOOLS & INSTITUTIONS',
    h1a: 'A real Turkish curriculum',
    h1b: 'for your classroom',
    sub: 'CEFR-aligned Nevai Publishers book series + a gamified digital platform. Pick a bundle or individual books and unlock volume discounts.',
  },
};

export default async function KurumsalSatisPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;

  return (
    <div style={{ background: '#f9fafb', color: '#1e1b1c' }}>
      <LandingNav
        locale={locale}
        alternateHref={isEn ? '/tr/kurumsal-satis' : '/en/kurumsal-satis'}
        links={[
          { label: isEn ? 'Students' : 'Öğrenciler', href: isEn ? '/learn-turkish-online' : '/turkce-ogren' },
          { label: isEn ? 'Teachers' : 'Öğretmenler', href: isEn ? '/for-teachers' : '/ogretmenler' },
          { label: isEn ? 'Institutional Sales' : 'Kurumsal Satış', href: '/kurumsal-satis', active: true },
        ]}
        ctaLabel={isEn ? 'Get a Quote' : 'Teklif Al'}
        ctaHref="/kayit?tip=kurumsal-pro"
      />

      {/* Hero */}
      <section style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e3a5f 50%,#1b75bc 100%)', padding: '72px 0 56px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(87,223,254,0.10),transparent 65%)', pointerEvents: 'none' }} />
        <div className="px-4 md:px-10" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(87,223,254,0.12)', border: '1px solid rgba(87,223,254,0.22)', color: '#57dffe', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', padding: '4px 14px', borderRadius: 999, marginBottom: 20 }}>
            {c.badge}
          </div>
          <h1 style={{ fontSize: 'clamp(30px,5vw,52px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.15, color: '#fff', marginBottom: 18 }}>
            {c.h1a}<br />
            <span style={{ color: '#57dffe' }}>{c.h1b}</span>
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', maxWidth: 560, margin: '0 auto', lineHeight: '26px' }}>
            {c.sub}
          </p>
        </div>
      </section>

      {/* Katalog (client-side veri çekimi) */}
      <KatalogContent locale={locale} />

      <LandingFooter locale={locale} />
    </div>
  );
}
