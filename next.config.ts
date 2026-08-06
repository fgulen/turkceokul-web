import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from 'next-intl/plugin';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5221';

// next/image remote loader — CSP img-src/media-src ile AYNI kaynaktan türetilmeli (next.config.ts
// içinde aşağıda ayrıca bkz: r2Origin). Sabit '*.r2.dev' pattern'i local dev'i (NEXT_PUBLIC_R2_URL=
// http://localhost:5221) ve r2.dev dışı bir prod R2 custom domain'ini kaçırır — next/image o zaman
// "hostname not configured" hatasıyla resmi hiç yüklemez.
function r2RemotePattern(): { protocol: 'http' | 'https'; hostname: string; port?: string } {
  const raw = process.env.NEXT_PUBLIC_R2_URL ?? 'http://localhost:5221';
  const url = new URL(raw);
  return {
    protocol: url.protocol === 'https:' ? 'https' : 'http',
    hostname: url.hostname,
    ...(url.port ? { port: url.port } : {}),
  };
}

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
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.r2.dev' },
      { protocol: 'https', hostname: 'pub-*.r2.dev' },
      r2RemotePattern(),
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
      '/(tr|en)/davet/:path*',
      '/(tr|en)/qr-login/:path*',
      '/(tr|en)/pin-login',
      // O9: bu 4'ü middleware korumalı ama noindex eksikti
      '/(tr|en)/kutuphane/:path*',
      '/(tr|en)/sinif/:path*',
      '/(tr|en)/editor/:path*',
      '/(tr|en)/ulke-temsilcisi/:path*',
    ];

    // SignalR (Kahoot) tarayıcıda getClientApiUrl() → yalnızca NEXT_PUBLIC_API_URL kullanır
    // (rewrite ile proxy'lenmiyor, doğrudan bağlanır). CSP bu YÜZDEN API_URL (server-side,
    // private API_URL'i önceliklendirir — rewrite hedefi) değil, NEXT_PUBLIC_API_URL'den
    // türetilmeli: ikisi prod'da farklı olabilir (internal vs public Railway domain),
    // yanlış olan connect-src Kahoot'u sessizce kırar.
    const clientApiOrigin = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5221';
    const apiOrigin = clientApiOrigin;
    const apiWsOrigin = clientApiOrigin.replace(/^http/, 'ws');

    // Kitap kapakları + tüm telaffuz/dinleme sesi R2'den serve edilir (toMediaUrl → NEXT_PUBLIC_R2_URL).
    // img-src ve media-src bu YÜZDEN NEXT_PUBLIC_R2_URL'den türetilir: local'de bu API origin'i (localhost:5221),
    // prod'da gerçek R2 domain'i (ör. https://r2.turkceokulu.com). Sabit *.r2.dev pattern'i her ikisini de kaçırırdı.
    const r2Origin = process.env.NEXT_PUBLIC_R2_URL ?? 'http://localhost:5221';

    // NOT: 'unsafe-inline' script-src'de XSS'i tam kapatmıyor — Next.js App Router + next-intl + Sentry
    // olmadan nonce-based strict CSP bu aşamada pratik değil. Asıl XSS koruması InputSanitizer/DOMPurify'da
    // kalıyor; bu CSP clickjacking/mixed-content/veri-sızıntısı gibi diğer sınıfları kapatıyor. Post-MVP: nonce'a geç.
    // 'unsafe-eval' SADECE dev'de: Next.js dev bundler'ı (webpack eval-source-map / React Refresh)
    // modülleri eval() ile sarıyor — prod build'de gerekmiyor, prod'a asla sızmamalı.
    // okuma/pdf-flipbook.tsx (OkumaKitabi PDF görüntüleyici) pdf.js kütüphanesini ve
    // worker'ını bundle'a dahil etmek yerine cdn.jsdelivr.net'ten dinamik yüklüyor —
    // script-src ve worker-src bu YÜZDEN bu origin'i içermeli, yoksa CSP tarayıcıda
    // sessizce engelliyor ve kullanıcıya "PDF yüklenemedi." hatası dönüyor.
    const PDFJS_CDN = 'https://cdn.jsdelivr.net';
    const scriptSrc = process.env.NODE_ENV === 'development'
      ? `script-src 'self' 'unsafe-inline' 'unsafe-eval' ${PDFJS_CDN}`
      : `script-src 'self' 'unsafe-inline' ${PDFJS_CDN}`;
    const csp = [
      "default-src 'self'",
      scriptSrc,
      `worker-src 'self' ${PDFJS_CDN}`,
      "style-src 'self' 'unsafe-inline'",
      `img-src 'self' data: ${r2Origin}`,
      `media-src 'self' ${r2Origin}`,
      "font-src 'self' data:",
      `connect-src 'self' ${apiOrigin} ${apiWsOrigin} https://*.sentry.io https://*.ingest.sentry.io https://*.ingest.us.sentry.io`,
      // İletişim sayfasındaki Google Maps embed'i için — default-src bunu kapsamaz, frame-src ayrı belirtilmeli.
      "frame-src https://www.google.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ].join('; ');

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      // includeSubDomains/preload eklenmedi — api. alt domaini HTTPS-hazır doğrulanmadan
      // includeSubDomains geridönüşü zor bir taahhüt (preload listesinden çıkmak yavaş).
      { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
    ];

    return [
      { source: '/(.*)', headers: securityHeaders },
      ...privatePaths.map(source => ({ source, headers: noindexHeader })),
    ];
  },

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
      {
        source: '/Medya/:path*',
        destination: `${API_URL}/Medya/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withSentryConfig(withNextIntl(nextConfig), {
  org: process.env.SENTRY_ORG,
  project: "turkceokulu-web",
  silent: true,
});
