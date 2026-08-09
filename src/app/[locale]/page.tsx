import type { Metadata } from 'next';
import Image from 'next/image';
import { Link } from "@/navigation";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";
import { HeroSection } from "@/components/hero-section";
import { BentoGrid } from "@/components/landing/bento-grid";
import { SegmentProvider } from "@/components/landing/segment-switcher";
import { YakindaSheetProvider, YakindaTrigger, YakindaBadge } from "@/components/landing/yakinda-sheet";
import { Check, ArrowRight } from "lucide-react";
import { BOOK_COVERS } from "@/lib/book-covers";

const BASE = 'https://turkceokulu.com';

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';

  return isEn ? {
    title: 'Türkçe Okulu | Online Turkish Learning Platform — CEFR A1–C1',
    description: 'Learn Turkish online. CEFR A1–C1 curriculum, Nevai Publishers book series, gamification. 53,000+ students, 30+ countries. Start free.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}/en`, languages: { en: `${BASE}/en`, tr: `${BASE}/tr` } },
    openGraph: {
      title: 'Türkçe Okulu | Online Turkish Learning Platform',
      description: 'CEFR A1–C1 online Turkish course. Gamification + real curriculum. 53,000+ students.',
      url: `${BASE}/en`,
      type: 'website',
      locale: 'en_GB',
      alternateLocale: ['tr_TR'],
    },
  } : {
    title: 'Türkçe Okulu | Online Türkçe Öğrenme Platformu — CEFR A1–C1',
    description: 'Türkçeyi online öğrenin. CEFR A1–C1 müfredatı, Nevai Yayınları kitap serisi, gamification. 53.000+ öğrenci, 30+ ülke. Ücretsiz başlayın.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}/tr`, languages: { tr: `${BASE}/tr`, en: `${BASE}/en` } },
    openGraph: {
      title: 'Türkçe Okulu | Online Türkçe Öğrenme Platformu',
      description: 'CEFR A1–C1 online Türkçe kursu. Gamification + gerçek müfredat. 53.000+ öğrenci.',
      url: `${BASE}/tr`,
      type: 'website',
      locale: 'tr_TR',
      alternateLocale: ['en_GB'],
    },
  };
}

// ─── Page content (TR / EN) ──────────────────────────────────────────────────

const C = {
  tr: {
    stats: [
      { val: "53.000+", label: "Toplam Kullanıcı" },
      { val: "30+",     label: "Ülke" },
      { val: "A1–C1",   label: "Tam CEFR" },
      { val: "2013",    label: "Kuruluş" },
    ],
    booksBadge: "NEVAİ YAYINLARI",
    booksH2: "Öne Çıkan Kitap Serisi",
    booksAll: "Tüm setler ve paketler",
    books: [
      { levelLabel: "7-9 Yaş Grubu" },
      { levelLabel: "12-18 Yaş Grubu" },
      { levelLabel: "12-18 Yaş Grubu Yoğun" },
    ],
    pricingBadge: "FİYATLANDIRMA",
    pricingH2: "Şeffaf lisans seçenekleri",
    pricingSub: "Kurumsal ölçekten bireysel öğrenciye, her ihtiyaca uygun plan.",
    institutionalPlans: [
      {
        badge: "KURUMSAL ÜCRETSİZ", name: "Ücretsiz", period: "Sonsuza kadar",
        features: [
          "Sınırsız öğretmen & öğrenci",
          "Ünite 1 tüm kitaplarda ücretsiz",
          "Okuma kitapları: PDF ücretsiz",
          "AI Stüdyo: 5 üretim/ay (Quiz + Kahoot)",
          "Sınıf yönetimi",
          "Kahoot modu",
        ],
        cta: "Başla", ctaHref: "/kayit?tip=kurumsal", highlighted: false,
      },
      {
        badge: "KURUMSAL PRO", name: "€20", period: "öğretmen / ay", sub: "+ öğrenci lisansları",
        recommended: "ÖNERİLEN",
        features: [
          "AI Stüdyo: sınırsız",
          "Okuma kitapları: etkileşimli etkinlikler",
          "Analitik paneli",
          "Tek tıkla Excel raporu",
          "Öncelikli destek",
        ],
        cta: "Ücretsiz Dene", ctaHref: "/kayit?tip=kurumsal", highlighted: true,
      },
      {
        badge: "KAMPÜS / KURUM", name: "Özel", period: "Fiyat görüşme",
        features: [
          "Kurumsal Pro (tümü)",
          "Sınırsız öğretmen",
          "Özel entegrasyon",
          "Öncelikli destek",
        ],
        cta: "Teklif Al", ctaHref: "/kurumsal-satis", highlighted: false,
      },
    ],
    individualPlans: [
      {
        badge: "BİREYSEL",
        features: ["5 kalp / gün", "Temel etkinlikler"],
      },
      {
        badge: "PREMİUM BİREYSEL",
        features: ["Sınırsız kalp", "Tüm etkinlik tipleri"],
      },
    ],
    individualPriceLabel: "Yakında",
    individualCta: "Haber ver",
    ctaBadge: "ÜCRETSİZ BAŞLA",
    ctaH2a: "Okulunuz için ilk adımı",
    ctaH2b: "bugün atın.",
    ctaSub: "Sınırsız öğretmen ve öğrenci — kurulum 5 dakika. Kredi kartı gerekmez.",
    ctaPrimary: "Kurumsal Ücretsiz Başla",
    ctaSecondary: "Öğrenci Kaydı",
    ctaLogin: "Zaten hesabın var mı?",
    ctaLoginLink: "Giriş yap",
  },
  en: {
    stats: [
      { val: "53,000+", label: "Total Users" },
      { val: "30+",     label: "Countries" },
      { val: "A1–C1",   label: "Full CEFR" },
      { val: "2013",    label: "Founded" },
    ],
    booksBadge: "NEVAI PUBLISHERS",
    booksH2: "Featured Book Series",
    booksAll: "All sets and bundles",
    books: [
      { levelLabel: "Ages 7–9" },
      { levelLabel: "Ages 12–18" },
      { levelLabel: "Ages 12–18 Intensive" },
    ],
    pricingBadge: "PRICING",
    pricingH2: "Transparent licensing options",
    pricingSub: "From institutional scale to individual students, a plan for every need.",
    institutionalPlans: [
      {
        badge: "INSTITUTIONAL FREE", name: "Free", period: "Forever",
        features: [
          "Unlimited teachers & students",
          "Unit 1 free in every book",
          "Reading books: free PDF",
          "AI Studio: 5 generations/mo (Quiz + Kahoot)",
          "Class management",
          "Kahoot mode",
        ],
        cta: "Get Started", ctaHref: "/kayit?tip=kurumsal", highlighted: false,
      },
      {
        badge: "INSTITUTIONAL PRO", name: "€20", period: "teacher / month", sub: "+ student licences",
        recommended: "RECOMMENDED",
        features: [
          "AI Studio: unlimited",
          "Reading books: interactive activities",
          "Analytics dashboard",
          "One-click Excel report",
          "Priority support",
        ],
        cta: "Try Free", ctaHref: "/kayit?tip=kurumsal", highlighted: true,
      },
      {
        badge: "CAMPUS / INSTITUTION", name: "Custom", period: "contact for pricing",
        features: [
          "Institutional Pro (all)",
          "Unlimited teachers",
          "Custom integration",
          "Priority support",
        ],
        cta: "Get a Quote", ctaHref: "/kurumsal-satis", highlighted: false,
      },
    ],
    individualPlans: [
      {
        badge: "INDIVIDUAL",
        features: ["5 hearts / day", "Core activities"],
      },
      {
        badge: "PREMIUM INDIVIDUAL",
        features: ["Unlimited hearts", "All activity types"],
      },
    ],
    individualPriceLabel: "Coming soon",
    individualCta: "Notify me",
    ctaBadge: "START FREE",
    ctaH2a: "Take the first step",
    ctaH2b: "for your school, today.",
    ctaSub: "Unlimited teachers and students — set up in 5 minutes. No credit card needed.",
    ctaPrimary: "Start Free for Your Institution",
    ctaSecondary: "Student Sign Up",
    ctaLogin: "Already have an account?",
    ctaLoginLink: "Log in",
  },
} as const;

// ─── Book data ───────────────────────────────────────────────────────────────

const BOOK_BASE = [
  { name: "CAN",      cefr: "A1 – A2", imgs: BOOK_COVERS.CAN },
  { name: "YAĞMUR",   cefr: "A1 – B1", imgs: BOOK_COVERS.YAGMUR },
  { name: "HARMONİ",  cefr: "A1 – B2", imgs: BOOK_COVERS.HARMONI },
];

// ─── Schema.org JSON-LD ──────────────────────────────────────────────────────

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Türkçe Okulu',
  url: BASE,
  foundingDate: '2013',
  offers: [
    { '@type': 'Offer', name: 'Kurumsal Ücretsiz', price: '0', priceCurrency: 'EUR' },
    { '@type': 'Offer', name: 'Kurumsal Pro', price: '20', priceCurrency: 'EUR' },
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Türkçe Okulu',
  url: BASE,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function LandingPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const t = isEn ? C.en : C.tr;
  const alternateHref = isEn ? '/tr' : '/en';

  const books = BOOK_BASE.map((b, i) => ({ ...b, ...t.books[i] }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />

      <div className="bg-[#f9fafb] text-slate-900">

        <LandingNav locale={locale} alternateHref={alternateHref} />

        <YakindaSheetProvider locale={locale}>

          <SegmentProvider>
            <HeroSection locale={locale} />

            {/* Stats — sade, beyaz zemin, marquee/mavi bant yok */}
            <div className="border-y border-slate-200 bg-white">
              <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-y-6 px-4 py-10 md:grid-cols-4 md:px-10">
                {t.stats.map((s) => (
                  <div key={s.label} className="text-center">
                    <div className="text-2xl font-black leading-none text-primary md:text-3xl">{s.val}</div>
                    <div className="mt-1.5 text-[11px] font-semibold tracking-[0.04em] text-slate-500">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <BentoGrid locale={locale} />
          </SegmentProvider>

          {/* Book Series — kompakt raf şeridi */}
          <section id="kitaplar" className="bg-slate-50 py-20 md:py-28">
            <div className="mx-auto max-w-[1200px] px-4 md:px-10">
              <div className="mb-10 text-center">
                <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[10px] font-bold tracking-[0.07em] text-slate-600 ring-1 ring-slate-200">
                  {t.booksBadge}
                </div>
                <h2 className="type-display tracking-tight text-slate-900">{t.booksH2}</h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {books.map((b) => (
                  <Link
                    key={b.name}
                    href="/kurumsal-satis"
                    className="flex flex-col items-center gap-5 rounded-2xl border border-slate-200 bg-white p-6 text-center transition-colors hover:border-primary/40"
                  >
                    <div className="flex items-end gap-2">
                      {b.imgs.slice(0, 3).map((src, i) => (
                        // Kapak görselleri toMediaUrl() ile çözülüyor (R2 varsa R2, yoksa
                        // /Medya rewrite üzerinden API) — remotePatterns'e alınmadı, unoptimized
                        // ile next/image kullanılıyor (CLS koruması için width/height sabit).
                        <Image
                          key={i}
                          src={src}
                          alt={`${b.name} ${i + 1}`}
                          width={100}
                          height={140}
                          unoptimized
                          className="h-[90px] sm:h-[140px] w-auto rounded-md object-contain shadow-md"
                        />
                      ))}
                    </div>
                    <div>
                      <div className="text-[10px] font-bold tracking-[0.06em] text-slate-400">{b.levelLabel}</div>
                      <h3 className="text-lg font-black tracking-tight text-slate-900">{b.name}</h3>
                      <p className="text-xs text-slate-500">{b.cefr}</p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-8 text-center">
                <Link href="/kurumsal-satis" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {t.booksAll} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section id="fiyatlar" className="bg-white py-20 md:py-28">
            <div className="mx-auto max-w-[1200px] px-4 md:px-10">
              <div className="mb-12 text-center">
                <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold tracking-[0.07em] text-slate-600">
                  {t.pricingBadge}
                </div>
                <h2 className="type-display mb-2 tracking-tight text-slate-900">{t.pricingH2}</h2>
                <p className="text-[15px] text-slate-500">{t.pricingSub}</p>
              </div>

              {/* Kurumsal — birincil odak */}
              <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {t.institutionalPlans.map((plan) => (
                  <div
                    key={plan.badge}
                    className={
                      "relative rounded-2xl p-6 " +
                      (plan.highlighted
                        ? "bg-primary shadow-[0_8px_40px_rgba(27,117,188,0.28)]"
                        : "border border-slate-200 bg-white")
                    }
                  >
                    {'recommended' in plan && plan.recommended && (
                      <div className="absolute -top-3 left-5 rounded-full bg-white px-2.5 py-1 text-[9px] font-extrabold tracking-[0.05em] text-primary">
                        {plan.recommended}
                      </div>
                    )}
                    <div className={"mb-2.5 text-[9px] font-bold tracking-[0.08em] " + (plan.highlighted ? "text-white/55" : "text-slate-400")}>
                      {plan.badge}
                    </div>
                    <div className={"text-3xl font-black leading-none " + (plan.highlighted ? "text-white" : "text-slate-900")}>
                      {plan.name}
                    </div>
                    <div className={"mt-1 text-xs " + (plan.highlighted ? "text-white/60" : "text-slate-400") + ("sub" in plan && plan.sub ? "" : " mb-4")}>
                      {plan.period}
                    </div>
                    {'sub' in plan && plan.sub && (
                      <div className={"mb-4 text-[11px] " + (plan.highlighted ? "text-white/40" : "text-slate-300")}>{plan.sub}</div>
                    )}
                    <hr className={"mb-4 " + (plan.highlighted ? "border-white/10" : "border-slate-100")} />
                    <ul className="mb-5 space-y-2">
                      {plan.features.map((label) => (
                        <li key={label} className={"flex items-start gap-2 text-[13px] leading-5 " + (plan.highlighted ? "text-white/85" : "text-slate-600")}>
                          <Check className={"mt-0.5 h-3.5 w-3.5 flex-shrink-0 " + (plan.highlighted ? "text-[#57dffe]" : "text-green-600")} />
                          {label}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.ctaHref}
                      className={
                        "block rounded-lg py-2.5 text-center text-[13px] font-bold " +
                        (plan.highlighted ? "bg-white text-primary" : "border border-slate-200 text-slate-600")
                      }
                    >
                      {plan.cta}
                    </Link>
                  </div>
                ))}
              </div>

              {/* Bireysel — fiyatsız, Yakında rozetli */}
              <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {t.individualPlans.map((plan) => (
                  <YakindaTrigger key={plan.badge} label={plan.badge} className="relative">
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 opacity-90">
                      <YakindaBadge locale={locale} />
                      <div className="mb-1.5 text-[9px] font-bold tracking-[0.08em] text-slate-400">{plan.badge}</div>
                      <div className="mb-3 text-xl font-black text-slate-400">{t.individualPriceLabel}</div>
                      {/* Check kullanılıyor (X değil) — bu özellikler dahil OLACAK, sadece plan henüz yayında değil;
                          X institutional kartlarda "hariç" anlamına geldiği için burada karışıklık yaratır. */}
                      <ul className="flex flex-wrap gap-x-4 gap-y-1">
                        {plan.features.map((label) => (
                          <li key={label} className="flex items-center gap-1.5 text-[12px] text-slate-400">
                            <Check className="h-3 w-3 flex-shrink-0" />
                            {label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </YakindaTrigger>
                ))}
              </div>


            </div>
          </section>

          {/* Son CTA */}
          <section className="relative overflow-hidden bg-[linear-gradient(135deg,#1e3a5f_0%,#1b75bc_60%,#0ea5e9_100%)] py-20 md:py-28">
            <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_65%)]" />
            <div className="pointer-events-none absolute -bottom-20 -left-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(87,223,254,0.08),transparent_65%)]" />
            <div className="relative mx-auto max-w-[680px] px-4 text-center md:px-10">
              <div className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-[10px] font-bold tracking-[0.07em] text-white/90">
                {t.ctaBadge}
              </div>
              <h2 className="type-display mb-4 tracking-tight text-white">
                {t.ctaH2a}<br />{t.ctaH2b}
              </h2>
              <p className="mb-9 text-base leading-relaxed text-white/70">{t.ctaSub}</p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link href="/kayit?tip=kurumsal" className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-primary">
                  {t.ctaPrimary} <ArrowRight className="h-[15px] w-[15px]" />
                </Link>
                <Link href="/kayit?tip=bireysel" className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 py-3 text-sm font-semibold text-white">
                  {t.ctaSecondary}
                </Link>
              </div>
              <p className="mt-5 text-[11px] text-white/40">
                {t.ctaLogin} <Link href="/giris" className="text-white/65 underline">{t.ctaLoginLink}</Link>
              </p>
            </div>
          </section>

        </YakindaSheetProvider>

        <LandingFooter locale={locale} />

      </div>
    </>
  );
}
