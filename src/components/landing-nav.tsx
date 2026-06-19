'use client';

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

const MAIN_LINKS: Record<string, NavLink[]> = {
  tr: [
    { label: 'Platform', href: '#platform' },
    { label: 'Kitaplar', href: '#kitaplar' },
    { label: 'Fiyatlar', href: '#fiyatlar' },
    { label: 'Öğretmenler', href: '/ogretmenler' },
  ],
  en: [
    { label: 'Platform', href: '#platform' },
    { label: 'Books', href: '#kitaplar' },
    { label: 'Pricing', href: '#fiyatlar' },
    { label: 'Teachers', href: '/for-teachers' },
  ],
};

const AUTH = {
  tr: { login: 'Giriş Yap', cta: 'Ücretsiz Başla', ctaHref: '/kayit' },
  en: { login: 'Log In', cta: 'Start Free', ctaHref: '/kayit' },
};

export function LandingNav({ locale, alternateHref, links, ctaLabel, ctaHref }: LandingNavProps) {
  const isEn = locale === 'en';
  const auth = isEn ? AUTH.en : AUTH.tr;
  const navLinks = links ?? (isEn ? MAIN_LINKS.en : MAIN_LINKS.tr);
  const otherLocale = isEn ? 'TR' : 'EN';

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

        {/* Nav links — masaüstünde görünür */}
        {navLinks.length > 0 && (
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: 24 }}>
            {navLinks.map((l) =>
              l.href.startsWith('#') ? (
                <a
                  key={l.label}
                  href={l.href}
                  style={{ fontSize: 14, fontWeight: l.active ? 600 : 500, color: l.active ? '#1b75bc' : '#414751', textDecoration: 'none' }}
                >
                  {l.label}
                </a>
              ) : (
                <Link
                  key={l.label}
                  href={l.href}
                  style={{ fontSize: 14, fontWeight: l.active ? 600 : 500, color: l.active ? '#1b75bc' : '#414751', textDecoration: 'none' }}
                >
                  {l.label}
                </Link>
              )
            )}
          </div>
        )}

        {/* Sağ: locale switcher + auth */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Locale switcher — sadece masaüstünde */}
          <a
            href={alternateHref}
            title={isEn ? 'Türkçeye geç' : 'Switch to English'}
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
            {otherLocale}
          </a>

          <Link
            href="/giris"
            style={{ fontSize: 14, fontWeight: 500, color: '#414751', textDecoration: 'none' }}
          >
            <span className="hidden md:inline">{auth.login}</span>
            <span className="md:hidden">{isEn ? 'Log In' : 'Giriş'}</span>
          </Link>

          <Link
            href={ctaHref ?? auth.ctaHref}
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
            {ctaLabel ?? auth.cta}
          </Link>
        </div>
      </div>
    </nav>
  );
}
