'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';
import { Logo } from '@/components/logo';
import { Globe } from 'lucide-react';

interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

interface LandingNavProps {
  locale: string;
  alternateHref: string; // current page in the other locale
  links?: NavLink[];     // omit = full landing nav
  ctaLabel?: string;
  ctaHref?: string;
}

const NAV_LINKS: NavLink[] = [
  { label: 'nav.platform', href: '/#platform' },
  { label: 'nav.books', href: '/#kitaplar' },
  { label: 'nav.pricing', href: '/#fiyatlar' },
  { label: 'nav.howItWorks', href: '/nasil-calisir' },
  { label: 'nav.teachers', href: '/ogretmenler' },
];

export function LandingNav({ alternateHref, links, ctaLabel, ctaHref }: LandingNavProps) {
  const t = useTranslations();
  const navLinks = links ?? NAV_LINKS;

  return (
    <nav
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(192,199,210,0.35)',
      }}
    >
      <div
        className="px-4 md:px-10"
        style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}>
          <Logo size="md" />
        </Link>

        {navLinks.length > 0 && (
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 24 }}>
            {navLinks.map((l) => {
              const label = t(l.label);
              return l.href.startsWith('#') ? (
                <a
                  key={l.label}
                  href={l.href}
                  style={{ fontSize: 14, fontWeight: l.active ? 600 : 500, color: l.active ? '#1b75bc' : '#414751', textDecoration: 'none' }}
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  style={{ fontSize: 14, fontWeight: l.active ? 600 : 500, color: l.active ? '#1b75bc' : '#414751', textDecoration: 'none' }}
                >
                  {label}
                </Link>
              );
            })}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <a
            href={alternateHref}
            title={t('nav.switchTitle')}
            className="hidden md:flex"
            style={{
              alignItems: 'center',
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: '#414751',
              textDecoration: 'none',
              background: '#f3f4f6',
              border: '1px solid #e5e7eb',
              borderRadius: 7,
              padding: '5px 10px',
            }}
          >
            <Globe style={{ width: 13, height: 13 }} />
            {t('nav.switchLocale')}
          </a>

          <Link
            href="/giris"
            style={{ fontSize: 14, fontWeight: 500, color: '#414751', textDecoration: 'none' }}
          >
            <span className="hidden md:inline">{t('nav.logIn')}</span>
            <span className="md:hidden">{t('nav.logInShort')}</span>
          </Link>

          <Link
            href={ctaHref ?? '/kayit'}
            style={{
              background: '#1b75bc',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: 8,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {ctaLabel ?? t('nav.startFree')}
          </Link>
        </div>
      </div>
    </nav>
  );
}
