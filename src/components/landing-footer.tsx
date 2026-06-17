import { Link } from '@/navigation';
import { ArrowRight } from 'lucide-react';

interface LandingFooterProps {
  locale: string;
}

const CONTENT = {
  tr: {
    tagline: 'Nevai Yayınları\'nın 25+ yıllık birikimini modern teknoloji ile buluşturan platform.',
    cta: 'Ücretsiz Başla',
    platform: 'PLATFORM',
    platformLinks: ['AI Stüdyo', 'Gamification', 'Analitik', 'Multiplayer'],
    institutional: 'KURUMSAL',
    institutionalLinks: ['Fiyatlandırma', 'Kitap Serisi', 'Demo Talep Et', 'İletişim'],
    copyright: '©2026 Türkçe Okulu — Nevai Yayınları',
    legal: ['Gizlilik', 'Kullanım Koşulları', 'İletişim'],
  },
  en: {
    tagline: 'Bringing 25+ years of Nevai Publishers expertise together with modern technology.',
    cta: 'Start Free',
    platform: 'PLATFORM',
    platformLinks: ['AI Studio', 'Gamification', 'Analytics', 'Multiplayer'],
    institutional: 'INSTITUTIONAL',
    institutionalLinks: ['Pricing', 'Book Series', 'Request a Demo', 'Contact'],
    copyright: '©2026 Türkçe Okulu — Nevai Publishers',
    legal: ['Privacy', 'Terms of Use', 'Contact'],
  },
};

export function LandingFooter({ locale }: LandingFooterProps) {
  const C = locale === 'en' ? CONTENT.en : CONTENT.tr;

  return (
    <footer style={{ background: '#1e1b1c', padding: '60px 0 28px' }}>
      <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 40, marginBottom: 44 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', userSelect: 'none', marginBottom: 12, lineHeight: 1 }}>
              <span style={{ fontSize: 19, fontWeight: 900, color: '#1b75bc' }}>[</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>TÜRKÇEOKULU</span>
              <span style={{ fontSize: 19, fontWeight: 900, color: '#1b75bc' }}>]</span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 240, lineHeight: '20px', marginBottom: 18 }}>
              {C.tagline}
            </p>
            <Link
              href="/kayit"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#1b75bc', color: '#fff', fontSize: 12, fontWeight: 600, padding: '9px 16px', borderRadius: 7, textDecoration: 'none' }}
            >
              {C.cta} <ArrowRight style={{ width: 12, height: 12 }} />
            </Link>
          </div>

          {/* Platform links */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.28)', marginBottom: 14 }}>{C.platform}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {C.platformLinks.map((item) => (
                <li key={item} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{item}</a>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional links */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.28)', marginBottom: 14 }}>{C.institutional}</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {C.institutionalLinks.map((item) => (
                <li key={item} style={{ marginBottom: 8 }}>
                  <a href="#" style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}>{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.22)' }}>{C.copyright}</div>
          <div style={{ display: 'flex', gap: 16 }}>
            {C.legal.map((item) => (
              <a key={item} href="#" style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>{item}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
