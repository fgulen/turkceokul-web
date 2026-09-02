// web/src/components/satis/KatalogContent.tsx
// Server Component — veri `/kurumsal-satis` sayfasında server-side getKatalog() ile
// çekilip prop olarak buraya geçiriliyor (SEO: içerik ilk HTML'de hazır olmalı).
// Bu bileşende client-side interaktivite (useState/onClick) yok; 'use client' gerekmiyor.
import { TrendingDown } from 'lucide-react';
import type { Katalog, KatalogKitap } from '@/lib/katalog-api';
import { KampanyaBanner } from '@/components/satis/KampanyaBanner';
import { KitapKarti } from '@/components/satis/KitapKarti';
import { PaketKarti } from '@/components/satis/PaketKarti';
import { KurumsalTeklifCta } from '@/components/satis/KurumsalTeklifCta';

// Raf sıralaması — kullanıcı tarafından belirlenen sabit vitrin sırası. Listede
// olmayan seriler (yeni eklenirse) sona, tr locale alfabetik sırayla eklenir.
const SERI_SIRA = ['Can', 'Yağmur', 'Harmoni', 'Anadolu', 'Lale', 'Açılım', 'Bizim'];

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
    okumaKitaplariHediyeBadge: 'Hediye',
    okumaKitaplariHediyeNot: 'PDF versiyonları hediye · 1 kitap etkileşimli ücretsiz',
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
    okumaKitaplariHediyeBadge: 'Free',
    okumaKitaplariHediyeNot: 'PDF versions are a gift · 1 interactive book free',
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
  dahil = false,
}: {
  title: string;
  kitaplar: KatalogKitap[];
  birimFiyatEurCent: number;
  locale: string;
  dahil?: boolean;
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
        {kitaplar.map((k, idx) => (
          <div key={k.id} className="w-40 flex-shrink-0 sm:w-44 md:w-48">
            <KitapKarti kitap={k} birimFiyatEurCent={birimFiyatEurCent} locale={locale} seriNo={idx + 1} dahil={dahil} />
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

  const seriler = (Array.from(new Set(dersKitaplari.map((k) => k.seri).filter(Boolean))) as string[]).sort(
    (a, b) => {
      const ia = SERI_SIRA.indexOf(a);
      const ib = SERI_SIRA.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b, 'tr');
    },
  );
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
      {okumaKitaplari.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold">
              {c.okumaKitaplariHediyeBadge}
            </span>
            {c.okumaKitaplariHediyeNot}
          </p>
          <KitapRafi
            title={c.okumaKitaplariTitle}
            kitaplar={okumaKitaplari}
            birimFiyatEurCent={katalog.birimFiyatEurCent}
            locale={locale}
            dahil
          />
        </>
      )}

      {/* Tek konsolide "Teklif Al" CTA'sı — nav CTA'sı da `#teklif` ile buraya ankor edilir.
          Okuma kitapları (dahil/ücretsiz) seçim listesine girmiyor — ayrı fiyatlandırılmıyorlar,
          bkz. KitapKarti "dahil" rozeti. */}
      <KurumsalTeklifCta locale={locale} kitaplar={dersKitaplari} />
    </div>
  );
}
