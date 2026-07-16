// web/src/components/satis/KatalogContent.tsx
// Server Component — veri `/kurumsal-satis` sayfasında server-side getKatalog() ile
// çekilip prop olarak buraya geçiriliyor (SEO: içerik ilk HTML'de hazır olmalı).
// Bu bileşende client-side interaktivite (useState/onClick) yok; 'use client' gerekmiyor.
import { ArrowRight, TrendingDown } from 'lucide-react';
import { Link } from '@/navigation';
import type { Katalog, KatalogKitap } from '@/lib/katalog-api';
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

// CEFR seviye aralığı — bir seri/rafın kapsadığı en düşük ve en yüksek seviye
// başlıkta gösterilir (ör. "A1 – B2"). Bilinmeyen/boş seviyeler yok sayılır.
const CEFR_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
function cefrRange(kitaplar: KatalogKitap[]): string | null {
  const idxs = kitaplar
    .map((k) => (k.seviye ? CEFR_ORDER.indexOf(k.seviye.toUpperCase()) : -1))
    .filter((i) => i >= 0);
  if (idxs.length === 0) return null;
  const min = CEFR_ORDER[Math.min(...idxs)];
  const max = CEFR_ORDER[Math.max(...idxs)];
  return min === max ? min : `${min} – ${max}`;
}

// Tek bir yatay "raf" şeridi: başlık (+ CEFR aralığı) ve altında kaydırılabilir
// kitap sırası. Mobilde `overflow-x-auto` ile yatay kaydırma, desktop'ta genişlik
// yeterliyse tek satırda sığar. Kart genişliği sabit (CLS 0, kaydırma tutarlı).
function KitapRafi({
  title,
  kitaplar,
  birimFiyatEurCent,
  locale,
}: {
  title: string;
  kitaplar: KatalogKitap[];
  birimFiyatEurCent: number;
  locale: string;
}) {
  if (kitaplar.length === 0) return null;
  const range = cefrRange(kitaplar);

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-baseline gap-2.5">
        <h2 className="type-title tracking-tight text-slate-900">{title}</h2>
        {range && <span className="text-xs font-semibold text-slate-400">CEFR {range}</span>}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-3">
        {kitaplar.map((k) => (
          <div key={k.id} className="w-40 flex-shrink-0 sm:w-44 md:w-48">
            <KitapKarti kitap={k} birimFiyatEurCent={birimFiyatEurCent} locale={locale} />
          </div>
        ))}
      </div>
      {/* Raf efekti — şeridin altında ince gölge/çizgi, fiziksel raf platformu hissi */}
      <div className="h-px bg-slate-200" />
      <div className="h-1.5 bg-gradient-to-b from-slate-200/70 to-transparent" />
    </section>
  );
}

export function KatalogContent({ locale, katalog }: { locale: string; katalog: Katalog | null }) {
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;

  if (!katalog) {
    return (
      <div className="mx-auto max-w-[1200px] px-4 py-16 text-center md:px-10">
        <p className="text-sm text-red-600">{c.error}</p>
      </div>
    );
  }

  const dersKitaplari = katalog.kitaplar.filter((k) => k.kitapTuru !== 'OkumaKitabi');
  const okumaKitaplari = katalog.kitaplar.filter((k) => k.kitapTuru === 'OkumaKitabi');

  const seriler = Array.from(new Set(dersKitaplari.map((k) => k.seri).filter(Boolean))) as string[];
  const seriGrouplu = dersKitaplari.filter((k) => k.seri);
  const seriGruplusuz = dersKitaplari.filter((k) => !k.seri);

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-12 pb-20 md:px-10">
      {/* Birim fiyat */}
      <p className="mb-7 text-center text-[15px] text-slate-500">
        {c.unitPricePrefix}{' '}
        <strong className="text-slate-900">€{(katalog.birimFiyatEurCent / 100).toFixed(2)}</strong>{' '}
        {c.unitPriceSuffix}
      </p>

      {/* Kampanya banner */}
      {katalog.aktifKampanya && (
        <div className="mb-8">
          <KampanyaBanner kampanya={katalog.aktifKampanya} locale={locale} />
        </div>
      )}

      {/* Paketler — custom paket yoksa gizli, bu durumda seri rafları vitrin olur */}
      {katalog.paketler.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 type-title tracking-tight text-slate-900">{c.paketlerTitle}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {katalog.paketler.map((p) => (
              <PaketKarti key={p.id} paket={p} birimFiyatEurCent={katalog.birimFiyatEurCent} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* Hacim indirim tablosu */}
      {katalog.hacimKademeler.length > 0 && (
        <section className="mb-12">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown className="h-[18px] w-[18px] text-green-600" />
            <h2 className="type-title tracking-tight text-slate-900">{c.hacimTitle}</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            {katalog.hacimKademeler.map((k) => (
              <div key={k.minOgrenci} className="rounded-[10px] border border-slate-200 bg-white px-4 py-2.5 text-[13px]">
                <span className="font-extrabold text-indigo-600">{k.minOgrenci}+</span>{' '}
                <span className="text-slate-500">{c.hacimSuffix}</span>{' '}
                <span className="font-bold text-green-600">%{k.indirimOrani} {c.hacimDiscount}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Kitaplar — seri bazlı raflar */}
      {seriler.map((seri) => (
        <KitapRafi
          key={seri}
          title={seri}
          kitaplar={seriGrouplu.filter((k) => k.seri === seri)}
          birimFiyatEurCent={katalog.birimFiyatEurCent}
          locale={locale}
        />
      ))}

      {/* Seri bilgisi olmayan kitaplar */}
      <KitapRafi
        title={c.kitaplarOther}
        kitaplar={seriGruplusuz}
        birimFiyatEurCent={katalog.birimFiyatEurCent}
        locale={locale}
      />

      {/* Okuma kitapları rafı — ders kitapları serilerinden ayrı gösterilir */}
      <KitapRafi
        title={c.okumaKitaplariTitle}
        kitaplar={okumaKitaplari}
        birimFiyatEurCent={katalog.birimFiyatEurCent}
        locale={locale}
      />

      {/* CTA — Faz 2'de sepet/sipariş formuna bağlanacak */}
      <div className="mt-4 rounded-[20px] bg-gradient-to-br from-[#1e3a5f] via-primary to-sky-500 px-6 py-12 text-center">
        <h2 className="mb-2.5 text-2xl font-extrabold tracking-tight text-white">{c.ctaTitle}</h2>
        <p className="mb-6 text-sm text-white/75">{c.ctaSub}</p>
        <Link
          href="/kayit?tip=kurumsal-pro"
          className="inline-flex items-center gap-2 rounded-[10px] bg-white px-7 py-3.5 text-[15px] font-bold text-primary no-underline"
        >
          {c.ctaButton} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
