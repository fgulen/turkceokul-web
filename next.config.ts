import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from 'next-intl/plugin';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5221';

// EN locale redirect helper — "currentCulture=en-US" parametreli eski URL'leri /en/... hedefine yönlendirir
type RedirectEntry = {
  source: string;
  has?: { type: 'query'; key: string; value: string }[];
  destination: string;
  permanent: boolean;
};

function enRedirect(source: string, enDest: string): RedirectEntry {
  return {
    source,
    has: [{ type: 'query', key: 'currentCulture', value: 'en-US' }],
    destination: enDest,
    permanent: true,
  };
}

const nextConfig: NextConfig = {
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
    ],
  },
  outputFileTracingRoot: __dirname,

  async redirects(): Promise<RedirectEntry[]> {
    return [
      // ----------------------------------------------------------------
      // 0. SEO HUB KISA URL'LER — locale prefix olmadan erişim
      // /turkce-ogren         → /tr/turkce-ogren
      // /learn-turkish-online → /en/learn-turkish-online
      // /ogretmenler          → /tr/ogretmenler
      // /for-teachers         → /en/for-teachers
      // /sinif/katil          → /tr/sinif/katil (QR kodu kısa link)
      // ----------------------------------------------------------------
      { source: '/turkce-ogren',         destination: '/tr/turkce-ogren',         permanent: true },
      { source: '/learn-turkish-online', destination: '/en/learn-turkish-online', permanent: true },
      { source: '/ogretmenler',          destination: '/tr/ogretmenler',          permanent: true },
      { source: '/for-teachers',         destination: '/en/for-teachers',         permanent: true },
      { source: '/sinif/katil',          destination: '/tr/sinif/katil',          permanent: false },

      // ----------------------------------------------------------------
      // 1. ÖĞRENCI PANELİ
      // Social.aspx = öğrenci puan tablosu + öğretmen mesajı sayfasıydı
      // (auth-required — Google'da 48K gösterim/yıl vardı, noindex edilmeli)
      // ----------------------------------------------------------------
      enRedirect('/Social.aspx', '/en/pano'),
      { source: '/Social.aspx', destination: '/tr/pano', permanent: true },

      enRedirect('/Ogrenci.aspx', '/en/pano'),
      { source: '/Ogrenci.aspx', destination: '/tr/pano', permanent: true },

      { source: '/Dashboard.aspx', destination: '/tr/pano', permanent: true },
      { source: '/Mesajlar.aspx', destination: '/tr/pano', permanent: true },

      // ----------------------------------------------------------------
      // 2. AUTH SAYFALARI
      // ----------------------------------------------------------------
      enRedirect('/uyelik.aspx', '/en/kayit'),
      { source: '/uyelik.aspx', destination: '/tr/kayit', permanent: true },
      // Büyük-U varyantı (eski sitede her ikisi de görünüyordu)
      { source: '/Uyelik.aspx', destination: '/tr/kayit', permanent: true },

      { source: '/SifremiUnuttum.aspx', destination: '/tr/giris', permanent: true },
      { source: '/SifreDegistir.aspx', destination: '/tr/profil', permanent: true },
      { source: '/EmailDegistir.aspx', destination: '/tr/profil', permanent: true },
      { source: '/FotoYukle.aspx', destination: '/tr/profil', permanent: true },

      enRedirect('/Profile.aspx', '/en/profil'),
      { source: '/Profile.aspx', destination: '/tr/profil', permanent: true },

      // ----------------------------------------------------------------
      // 3. İÇERİK / STATİK SAYFALAR
      // Content.aspx?item=X eski statik sayfa sistemi.
      // item=6  → what_is_turkce_okulu   (21.474 yıllık gösterim — en büyük)
      // item=12 → why_turkce_okulu
      // item=25 → (2.459 gösterim — bilinmiyor)
      // item=23 → (441 gösterim — bilinmiyor)
      // Şimdilik hepsi ana sayfaya; ilerleyen fazda /hakkimizda, /iletisim
      // sayfaları oluşturulunca burası güncellenecek.
      // ----------------------------------------------------------------
      enRedirect('/Content.aspx', '/en'),
      { source: '/Content.aspx', destination: '/tr', permanent: true },

      // /content/about_us/what_is_turkce_okulu__6.aspx gibi tam yol varyantları
      enRedirect('/content/:path*', '/en'),
      { source: '/content/:path*', destination: '/tr', permanent: true },

      // ----------------------------------------------------------------
      // 4. DİĞER ESKİ SAYFALAR
      // ----------------------------------------------------------------
      { source: '/EtkinlikTurleri.aspx', destination: '/tr', permanent: true },
      { source: '/Unite.aspx',           destination: '/tr', permanent: true },
      { source: '/Editor.aspx',          destination: '/tr', permanent: true },

      // ----------------------------------------------------------------
      // 5. ?currentCulture=en-US GENEL YAKALAYICI
      // Yukarıdaki kurallara girmeyen eski sayfalardaki dil parametresi
      // ----------------------------------------------------------------
      {
        source: '/:path*',
        has: [{ type: 'query', key: 'currentCulture', value: 'en-US' }],
        destination: '/en',
        permanent: true,
      },
    ];
  },

  async headers() {
    // Auth gerektiren sayfalar Google'a kapatılıyor.
    // Eski Social.aspx (puan tablosu + mesaj) 48K gösterim/yıl almıştı — gizlilik riski.
    // Public sayfalar (/, /kayit, /giris) buraya girmiyor — indexlenmeye devam eder.
    const noindexHeader = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }];

    const privatePaths = [
      '/(tr|en)/pano',
      '/(tr|en)/profil',
      '/(tr|en)/lig',
      '/(tr|en)/ogretmen/:path*',
      '/(tr|en)/admin/:path*',
      '/(tr|en)/super-admin/:path*',
      '/(tr|en)/kurum-yoneticisi',
      '/(tr|en)/ders/:path*',
      '/(tr|en)/etkinlik/:path*',
      '/(tr|en)/okuma/:path*',
      '/(tr|en)/kahoot/:path*',
      '/(tr|en)/seviye-testi',
      '/(tr|en)/davet/:path*',
      '/(tr|en)/qr-login/:path*',
      '/(tr|en)/pin-login',
    ];

    return privatePaths.map(source => ({ source, headers: noindexHeader }));
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withSentryConfig(withNextIntl(nextConfig), {
  org: "your-org",
  project: "turkceokulu-web",
  silent: true,
});
