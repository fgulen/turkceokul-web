// web/src/components/satis/KatalogContent.tsx
// Server Component — veri `/kurumsal-satis` sayfasında server-side getKatalog() ile
// çekilip prop olarak buraya geçiriliyor (SEO: içerik ilk HTML'de hazır olmalı).
// Bu bileşende client-side interaktivite (useState/onClick) yok; 'use client' gerekmiyor.
import { ArrowRight, TrendingDown } from 'lucide-react';
import { Link } from '@/navigation';
import type { Katalog } from '@/lib/katalog-api';
import { KampanyaBanner } from '@/components/satis/KampanyaBanner';
import { KitapKarti } from '@/components/satis/KitapKarti';
import { PaketKarti } from '@/components/satis/PaketKarti';

const C = {
  tr: {
    error: 'Katalog şu anda yüklenemedi. Lütfen daha sonra tekrar deneyin.',
    unitPricePrefix: 'Öğrenci başına',
    unitPriceSuffix: '/ yıl · hacim indirimleri uygulanır',
    hacimTitle: 'Hacim İndirimleri',
    hacimSuffix: 'öğrenci →',
    hacimDiscount: 'indirim',
    paketlerTitle: 'Paketler',
    kitaplarOther: 'Diğer Kitaplar',
    okumaKitaplariTitle: 'Okuma Kitapları',
    ctaTitle: 'Kurumunuz için teklif alın',
    ctaSub: 'Satış ekibimiz 48 saat içinde sizinle iletişime geçer. Ödeme: havale.',
    ctaButton: 'Teklif Al',
  },
  en: {
    error: 'The catalogue could not be loaded right now. Please try again later.',
    unitPricePrefix: 'Per student',
    unitPriceSuffix: '/ year · volume discounts apply',
    hacimTitle: 'Volume Discounts',
    hacimSuffix: 'students →',
    hacimDiscount: 'discount',
    paketlerTitle: 'Packages',
    kitaplarOther: 'Other Books',
    okumaKitaplariTitle: 'Reading Books',
    ctaTitle: 'Get a quote for your institution',
    ctaSub: 'Our sales team will reach out within 48 hours. Payment: bank transfer.',
    ctaButton: 'Request a Quote',
  },
};

export function KatalogContent({ locale, katalog }: { locale: string; katalog: Katalog | null }) {
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;

  if (!katalog) {
    return (
      <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 0', textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#dc2626' }}>{c.error}</p>
      </div>
    );
  }

  const dersKitaplari = katalog.kitaplar.filter((k) => k.kitapTuru !== 'OkumaKitabi');
  const okumaKitaplari = katalog.kitaplar.filter((k) => k.kitapTuru === 'OkumaKitabi');

  const seriler = Array.from(new Set(dersKitaplari.map((k) => k.seri).filter(Boolean))) as string[];
  const seriGrouplu = dersKitaplari.filter((k) => k.seri);
  const seriGruplusuz = dersKitaplari.filter((k) => !k.seri);

  return (
    <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 0 80px' }}>
      {/* Birim fiyat */}
      <p style={{ fontSize: 15, color: '#717882', marginBottom: 28, textAlign: 'center' }}>
        {c.unitPricePrefix}{' '}
        <strong style={{ color: '#1e1b1c' }}>€{(katalog.birimFiyatEurCent / 100).toFixed(2)}</strong>{' '}
        {c.unitPriceSuffix}
      </p>

      {/* Kampanya banner */}
      {katalog.aktifKampanya && (
        <div style={{ marginBottom: 32 }}>
          <KampanyaBanner kampanya={katalog.aktifKampanya} locale={locale} />
        </div>
      )}

      {/* Hacim indirim tablosu */}
      {katalog.hacimKademeler.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingDown style={{ width: 18, height: 18, color: '#16a34a' }} />
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#1e1b1c' }}>{c.hacimTitle}</h2>
          </div>
          <div className="flex flex-wrap" style={{ gap: 12 }}>
            {katalog.hacimKademeler.map((k) => (
              <div
                key={k.minOgrenci}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  padding: '10px 16px',
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 800, color: '#4f46e5' }}>{k.minOgrenci}+</span>{' '}
                <span style={{ color: '#717882' }}>{c.hacimSuffix}</span>{' '}
                <span style={{ fontWeight: 700, color: '#16a34a' }}>%{k.indirimOrani} {c.hacimDiscount}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Paketler */}
      {katalog.paketler.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b1c', marginBottom: 16 }}>{c.paketlerTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 16 }}>
            {katalog.paketler.map((p) => (
              <PaketKarti key={p.id} paket={p} birimFiyatEurCent={katalog.birimFiyatEurCent} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Kitaplar — seri bazlı */}
      {seriler.map((seri) => (
        <section key={seri} style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b1c', marginBottom: 16 }}>{seri}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ gap: 16 }}>
            {seriGrouplu.filter((k) => k.seri === seri).map((k) => (
              <KitapKarti key={k.id} kitap={k} birimFiyatEurCent={katalog.birimFiyatEurCent} locale={locale} />
            ))}
          </div>
        </section>
      ))}

      {/* Seri bilgisi olmayan kitaplar */}
      {seriGruplusuz.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b1c', marginBottom: 16 }}>{c.kitaplarOther}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ gap: 16 }}>
            {seriGruplusuz.map((k) => (
              <KitapKarti key={k.id} kitap={k} birimFiyatEurCent={katalog.birimFiyatEurCent} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Okuma kitapları — ders kitapları serilerinden ayrı gösterilir */}
      {okumaKitaplari.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b1c', marginBottom: 16 }}>{c.okumaKitaplariTitle}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4" style={{ gap: 16 }}>
            {okumaKitaplari.map((k) => (
              <KitapKarti key={k.id} kitap={k} birimFiyatEurCent={katalog.birimFiyatEurCent} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* CTA — Faz 2'de sepet/sipariş formuna bağlanacak */}
      <div
        style={{
          marginTop: 16,
          background: 'linear-gradient(135deg,#1e3a5f 0%,#1b75bc 60%,#0ea5e9 100%)',
          borderRadius: 20,
          padding: '48px 24px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 10 }}>{c.ctaTitle}</h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 24 }}>{c.ctaSub}</p>
        <Link
          href="/kayit?tip=kurumsal-pro"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#fff',
            color: '#1b75bc',
            fontSize: 15,
            fontWeight: 700,
            padding: '14px 28px',
            borderRadius: 10,
            textDecoration: 'none',
          }}
        >
          {c.ctaButton} <ArrowRight style={{ width: 16, height: 16 }} />
        </Link>
      </div>
    </div>
  );
}
