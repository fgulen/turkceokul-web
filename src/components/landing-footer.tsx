import { Link } from '@/navigation';
import { ArrowRight } from 'lucide-react';

interface LandingFooterProps {
  locale: string;
}

interface FooterLink {
  label: string;
  href: string;
}

const CONTENT = {
  tr: {
    tagline: 'Nevai Yayınları\'nın 25+ yıllık birikimini modern teknoloji ile buluşturan platform.',
    cta: 'Ücretsiz Başla',
    platform: 'PLATFORM',
    platformLinks: [
      { label: 'AI Stüdyo', href: '/ogretmenler' },
      { label: 'Gamification', href: '/turkce-ogren' },
      { label: 'Analitik', href: '/ogretmenler' },
      { label: 'Multiplayer', href: '/#platform' },
      { label: 'Nasıl Çalışır?', href: '/nasil-calisir' },
    ] as FooterLink[],
    institutional: 'KURUMSAL',
    institutionalLinks: [
      { label: 'Fiyatlandırma', href: '/#fiyatlar' },
      { label: 'Kitap Serisi', href: '/kurumsal-satis' },
      { label: 'Demo Talep Et', href: '/kurumsal-satis' },
      { label: 'İletişim', href: '/iletisim' },
    ] as FooterLink[],
    copyright: '©2026 Türkçe Okulu — Nevai Yayınları',
    legal: [
      { label: 'Gizlilik', href: '/gizlilik' },
      { label: 'Kullanım Koşulları', href: '/kullanim-kosullari' },
      { label: 'İletişim', href: '/iletisim' },
    ] as FooterLink[],
  },
  en: {
    tagline: 'Bringing 25+ years of Nevai Publishers expertise together with modern technology.',
    cta: 'Start Free',
    platform: 'PLATFORM',
    platformLinks: [
      { label: 'AI Studio', href: '/for-teachers' },
      { label: 'Gamification', href: '/learn-turkish-online' },
      { label: 'Analytics', href: '/for-teachers' },
      { label: 'Multiplayer', href: '/#platform' },
      { label: 'How It Works', href: '/nasil-calisir' },
    ] as FooterLink[],
    institutional: 'INSTITUTIONAL',
    institutionalLinks: [
      { label: 'Pricing', href: '/#fiyatlar' },
      { label: 'Book Series', href: '/kurumsal-satis' },
      { label: 'Request a Demo', href: '/kurumsal-satis' },
      { label: 'Contact', href: '/iletisim' },
    ] as FooterLink[],
    copyright: '©2026 Türkçe Okulu — Nevai Publishers',
    legal: [
      { label: 'Privacy', href: '/gizlilik' },
      { label: 'Terms of Use', href: '/kullanim-kosullari' },
      { label: 'Contact', href: '/iletisim' },
    ] as FooterLink[],
  },
};

export function LandingFooter({ locale }: LandingFooterProps) {
  const C = locale === 'en' ? CONTENT.en : CONTENT.tr;

  return (
    <footer className="bg-[#1e1b1c] pt-[60px] pb-7">
      <div className="mx-auto max-w-[1200px] px-4 md:px-10">
        <div className="mb-11 grid grid-cols-1 gap-10 md:grid-cols-3">

          {/* Brand */}
          <div>
            <div className="mb-3 inline-flex select-none items-baseline leading-none">
              <span className="text-[19px] font-black text-primary">[</span>
              <span className="text-sm font-extrabold tracking-tight text-white">TÜRKÇEOKULU</span>
              <span className="text-[19px] font-black text-primary">]</span>
            </div>
            <p className="mb-[18px] max-w-[240px] text-[13px] leading-5 text-white/40">
              {C.tagline}
            </p>
            <Link
              href="/kayit"
              className="inline-flex items-center gap-[7px] rounded-[7px] bg-primary px-4 py-[9px] text-xs font-semibold text-white no-underline"
            >
              {C.cta} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Platform links */}
          <div>
            <div className="mb-3.5 text-[10px] font-bold tracking-[0.1em] text-white/30">{C.platform}</div>
            <ul className="m-0 list-none p-0">
              {C.platformLinks.map((item) => (
                <li key={item.label} className="mb-2">
                  <Link href={item.href} className="text-[13px] text-white/50 no-underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Institutional links */}
          <div>
            <div className="mb-3.5 text-[10px] font-bold tracking-[0.1em] text-white/30">{C.institutional}</div>
            <ul className="m-0 list-none p-0">
              {C.institutionalLinks.map((item) => (
                <li key={item.label} className="mb-2">
                  <Link href={item.href} className="text-[13px] text-white/50 no-underline">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-white/[0.06] pt-5">
          <div className="text-[11px] text-white/20">{C.copyright}</div>
          <div className="flex gap-4">
            {C.legal.map((item) => (
              <Link key={item.label} href={item.href} className="text-[11px] text-white/30 no-underline">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
