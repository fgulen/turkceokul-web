import type { MetadataRoute } from 'next';

const BASE = 'https://turkceokulu.com';
const NOW = new Date('2026-07-16');

function tr(path: string) { return `${BASE}/tr${path}`; }
function en(path: string) { return `${BASE}/en${path}`; }
function alt(trPath: string, enPath?: string): MetadataRoute.Sitemap[number]['alternates'] {
  return {
    languages: {
      tr: tr(trPath),
      en: en(enPath ?? trPath),
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Ana Sayfa ──────────────────────────────────────────────
    {
      url: tr(''),
      lastModified: NOW,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages: { tr: tr(''), en: en('') } },
    },
    {
      url: en(''),
      lastModified: NOW,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages: { tr: tr(''), en: en('') } },
    },

    // ── SEO Hub Sayfaları ──────────────────────────────────────
    {
      url: tr('/turkce-ogren'),
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.95,
      alternates: alt('/turkce-ogren', '/learn-turkish-online'),
    },
    {
      url: en('/learn-turkish-online'),
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.95,
      alternates: { languages: { tr: tr('/turkce-ogren'), en: en('/learn-turkish-online') } },
    },

    // ── Öğretmen Landing ───────────────────────────────────────
    {
      url: tr('/ogretmenler'),
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.85,
      alternates: { languages: { tr: tr('/ogretmenler'), en: en('/for-teachers') } },
    },
    {
      url: en('/for-teachers'),
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.85,
      alternates: { languages: { tr: tr('/ogretmenler'), en: en('/for-teachers') } },
    },

    // ── Kurumsal Satış ─────────────────────────────────────────
    {
      url: tr('/kurumsal-satis'),
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: alt('/kurumsal-satis'),
    },
    {
      url: en('/kurumsal-satis'),
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.9,
      alternates: alt('/kurumsal-satis'),
    },

    // ── Seviye Testi ───────────────────────────────────────────
    {
      url: tr('/seviye-testi'),
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: alt('/seviye-testi'),
    },
    {
      url: en('/seviye-testi'),
      lastModified: NOW,
      changeFrequency: 'monthly',
      priority: 0.7,
      alternates: alt('/seviye-testi'),
    },

    // ── Auth Sayfaları ─────────────────────────────────────────
    {
      url: tr('/kayit'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.8,
      alternates: alt('/kayit'),
    },
    {
      url: en('/kayit'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.8,
      alternates: alt('/kayit'),
    },
    {
      url: tr('/giris'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.6,
      alternates: alt('/giris'),
    },
    {
      url: en('/giris'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.6,
      alternates: alt('/giris'),
    },

    // ── Kurumsal / Statik Sayfalar ───────────────────────────────
    {
      url: tr('/hakkimizda'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.5,
      alternates: alt('/hakkimizda'),
    },
    {
      url: en('/hakkimizda'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.5,
      alternates: alt('/hakkimizda'),
    },
    {
      url: tr('/iletisim'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.5,
      alternates: alt('/iletisim'),
    },
    {
      url: en('/iletisim'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.5,
      alternates: alt('/iletisim'),
    },

    // ── Yasal Sayfalar ───────────────────────────────────────────
    {
      url: tr('/gizlilik'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: alt('/gizlilik'),
    },
    {
      url: en('/gizlilik'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: alt('/gizlilik'),
    },
    {
      url: tr('/kullanim-kosullari'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: alt('/kullanim-kosullari'),
    },
    {
      url: en('/kullanim-kosullari'),
      lastModified: NOW,
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: alt('/kullanim-kosullari'),
    },
  ];
}
