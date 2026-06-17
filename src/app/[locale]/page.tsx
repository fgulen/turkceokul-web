import type { Metadata } from 'next';
import { Link } from "@/navigation";
import { LandingNav } from "@/components/landing-nav";
import { LandingFooter } from "@/components/landing-footer";
import { HeroSection } from "@/components/hero-section";
import {
  Heart, Flame, Zap, Trophy, Swords,
  PlusCircle, BookOpen, Check, X, Package, Users,
  Sparkles, ArrowRight,
} from "lucide-react";
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
    marquee: "NEVAİ YAYINLARI  ·  AI DESTEKLİ ÖĞRETMEN ARAÇLARI  ·  GAMİFİKASYON + GERÇEK MÜFREDAT  ·  CEFR UYUMLU MÜFREDAT  ·  2013'DEN BUGÜNE  ·  SINIF YÖNETİMİ  ·  MULTİPLAYER MODLAR",
    platformBadge: "PLATFORM",
    platformH2: "Sınıfı geleceğe taşıyan araçlar",
    platformSub: "Öğretmen için AI stüdyo. Öğrenci için bağımlılık yaratan deneyim.",
    aiLabel: "AI STÜDYO",
    aiTitle: "30 saniyede sıfırdan materyal",
    aiDesc: "Müfredatı siz belirleyin, yapay zeka etkinlikleri anında üretsin.",
    aiTags: ["Quiz Üretimi", "AI Seslendirme", "Boşluk Doldurma", "Kelime Listesi"],
    gamTitle: "Bağımlılık Yaratan Sistem",
    gamSub: "Duolingo mekanikleri + gerçek müfredat.",
    gamItems: [
      { label: "5 Kalp Sistemi",    sub: "Yanlışta -1, 30 dk'da +1" },
      { label: "Günlük Seri",       sub: "Dondurucu kalkan ile koruma" },
      { label: "XP Combo Zinciri",  sub: "2x → 3x → 5x → 10x" },
      { label: "10 Lig Seviyesi",   sub: "Bronz → Gümüş → Altın → Taç" },
    ],
    analyticsTitle: "Veriye Dayalı Takip",
    analyticsSub: "Bireysel ve sınıf bazlı analiz.",
    completionRate: "Tamamlanma oranı",
    mpTitle: "Rekabet & Multiplayer",
    mpSub: "1v1 düello, sınıf quizi, şampiyona.",
    mpModes: ["1v1 Kelime Düellosu", "Sınıf Kahoot Quizi", "Haftalık Şampiyona"],
    currTitle: "Hibrit Müfredat",
    currSub: "Fiziksel kitap + dijital platform, entegre.",
    bookActivation: "Kitap Kodu Aktivasyonu",
    bookDuration: "6 ay premium — anında aktif",
    booksBadge: "NEVAİ YAYINLARI",
    booksH2: "Öne Çıkan Kitap Serisi",
    booksAll: "Tüm kitaplar",
    bookPublisher: "Nevai Yayınları — Türkçe Öğretim Seti",
    bookBuy: "Satın Al",
    bookPreview: "İncele",
    books: [
      { levelLabel: "YENİ BAŞLAYANLAR", subLabel: "İlk Okullar",              features: ["4 Kitap + Çalışma Kitabı", "Ses dosyaları ve videolar", "Öğretmen kılavuzu", "Online etkinlikler"] },
      { levelLabel: "GELİŞMEKTE OLANLAR", subLabel: "Orta yoğunluk",        features: ["5 Kitap + Çalışma Kitabı", "Ses dosyaları ve videolar", "Öğretmen kılavuzu", "Online etkinlikler"] },
      { levelLabel: "İLERİ SEVİYE", subLabel: "Yoğun ders saati olanlar",    features: ["4 Kitap + Çalışma Kitabı", "Ses dosyaları ve videolar", "Öğretmen kılavuzu", "Online etkinlikler"] },
    ],
    pricingBadge: "FİYATLANDIRMA",
    pricingH2: "Şeffaf lisans seçenekleri",
    pricingSub: "Bireysel öğrenciden kampüse, her ölçeğe uygun plan.",
    plans: [
      {
        badge: "BİREYSEL", name: "Ücretsiz", period: "Sonsuza kadar",
        features: [
          { label: "5 kalp / gün", ok: true },
          { label: "1 ünite içerik", ok: true },
          { label: "Temel etkinlikler", ok: true },
          { label: "AI Stüdyo", ok: false },
          { label: "Sınıf yönetimi", ok: false },
        ],
        cta: "Başla", highlighted: false,
      },
      {
        badge: "PREMİUM BİREYSEL", name: "£9.99", period: "aylık", sub: "veya £79.99 / yıl",
        features: [
          { label: "Sınırsız kalp", ok: true },
          { label: "Tüm içerikler", ok: true },
          { label: "Tüm etkinlik tipleri", ok: true },
          { label: "Streak koruması", ok: true },
          { label: "AI Stüdyo", ok: false },
        ],
        cta: "Abone Ol", highlighted: false,
      },
      {
        badge: "KURUMSAL PRO", name: "€20", period: "öğretmen / ay", sub: "+ öğrenci lisansları",
        recommended: "ÖNERİLEN",
        features: [
          { label: "AI İçerik Stüdyosu", ok: true },
          { label: "Sınıf yönetimi", ok: true },
          { label: "Analitik paneli", ok: true },
          { label: "Kahoot modu", ok: true },
          { label: "10 lisans ücretsiz", ok: true },
        ],
        cta: "Ücretsiz Dene", highlighted: true,
      },
      {
        badge: "KAMPÜS / KURUM", name: "Özel", period: "Fiyat görüşme",
        features: [
          { label: "Kurumsal Pro (tümü)", ok: true },
          { label: "Sınırsız öğretmen", ok: true },
          { label: "Özel entegrasyon", ok: true },
          { label: "Öncelikli destek", ok: true },
          { label: "Kitap kodu paketi", ok: true },
        ],
        cta: "İletişime Geç", highlighted: false,
      },
    ],
    bookNote: '<strong>6 aylık Premium erişim kodu</strong> bulunur. Kurumsal alımlarda özel paketler için iletişime geçin.',
    bookNotePre: 'Nevai Yayınları kitap setlerinde ',
    ctaBadge: "ÜCRETSİZ BAŞLA",
    ctaH2a: "Okulunuz için ilk adımı",
    ctaH2b: "bugün atın.",
    ctaSub: "1 öğretmen, 10 öğrenci — kurulum 5 dakika. Kredi kartı gerekmez.",
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
    marquee: "NEVAI PUBLISHERS  ·  AI-POWERED TEACHER TOOLS  ·  GAMIFICATION + REAL CURRICULUM  ·  CEFR-ALIGNED  ·  EST. 2013  ·  CLASS MANAGEMENT  ·  MULTIPLAYER MODES",
    platformBadge: "PLATFORM",
    platformH2: "Tools that take the classroom to the future",
    platformSub: "AI studio for teachers. An addictive experience for students.",
    aiLabel: "AI STUDIO",
    aiTitle: "Generate materials from scratch in 30 seconds",
    aiDesc: "You set the curriculum, AI generates activities instantly.",
    aiTags: ["Quiz Generation", "AI Voiceover", "Gap Fill", "Word Lists"],
    gamTitle: "An Addictive System",
    gamSub: "Duolingo mechanics + real curriculum.",
    gamItems: [
      { label: "5 Hearts System",   sub: "Lose 1 on wrong, +1 per 30 min" },
      { label: "Daily Streak",      sub: "Protected with a streak freeze" },
      { label: "XP Combo Chain",    sub: "2x → 3x → 5x → 10x" },
      { label: "10 League Levels",  sub: "Bronze → Silver → Gold → Crown" },
    ],
    analyticsTitle: "Data-Driven Progress Tracking",
    analyticsSub: "Individual and class-level analysis.",
    completionRate: "Completion rate",
    mpTitle: "Competition & Multiplayer",
    mpSub: "1v1 duel, class quiz, championship.",
    mpModes: ["1v1 Word Duel", "Class Kahoot Quiz", "Weekly Championship"],
    currTitle: "Hybrid Curriculum",
    currSub: "Physical book + digital platform, integrated.",
    bookActivation: "Book Code Activation",
    bookDuration: "6 months premium — instant access",
    booksBadge: "NEVAI PUBLISHERS",
    booksH2: "Featured Book Series",
    booksAll: "All books",
    bookPublisher: "Nevai Publishers — Turkish Teaching Set",
    bookBuy: "Buy",
    bookPreview: "Preview",
    books: [
      { levelLabel: "BEGINNER", subLabel: "First Schools",       features: ["4 Books + Workbook", "Audio files and videos", "Teacher guide", "Online activities"] },
      { levelLabel: "DEVELOPING", subLabel: "Moderate intensity",  features: ["5 Books + Workbook", "Audio files and videos", "Teacher guide", "Online activities"] },
      { levelLabel: "ADVANCED", subLabel: "High lesson hours",   features: ["4 Books + Workbook", "Audio files and videos", "Teacher guide", "Online activities"] },
    ],
    pricingBadge: "PRICING",
    pricingH2: "Transparent licensing options",
    pricingSub: "From individual students to campus, a plan for every scale.",
    plans: [
      {
        badge: "INDIVIDUAL", name: "Free", period: "Forever",
        features: [
          { label: "5 hearts / day", ok: true },
          { label: "1 unit of content", ok: true },
          { label: "Core activities", ok: true },
          { label: "AI Studio", ok: false },
          { label: "Class management", ok: false },
        ],
        cta: "Get Started", highlighted: false,
      },
      {
        badge: "PREMIUM INDIVIDUAL", name: "£9.99", period: "per month", sub: "or £79.99 / year",
        features: [
          { label: "Unlimited hearts", ok: true },
          { label: "All content", ok: true },
          { label: "All activity types", ok: true },
          { label: "Streak protection", ok: true },
          { label: "AI Studio", ok: false },
        ],
        cta: "Subscribe", highlighted: false,
      },
      {
        badge: "INSTITUTIONAL PRO", name: "€20", period: "teacher / month", sub: "+ student licences",
        recommended: "RECOMMENDED",
        features: [
          { label: "AI Content Studio", ok: true },
          { label: "Class management", ok: true },
          { label: "Analytics dashboard", ok: true },
          { label: "Kahoot mode", ok: true },
          { label: "10 free licences", ok: true },
        ],
        cta: "Try Free", highlighted: true,
      },
      {
        badge: "CAMPUS / INSTITUTION", name: "Custom", period: "contact for pricing",
        features: [
          { label: "Institutional Pro (all)", ok: true },
          { label: "Unlimited teachers", ok: true },
          { label: "Custom integration", ok: true },
          { label: "Priority support", ok: true },
          { label: "Book code bundles", ok: true },
        ],
        cta: "Get in Touch", highlighted: false,
      },
    ],
    bookNote: '<strong>6-month Premium access code</strong> included. Contact us for custom packages on institutional orders.',
    bookNotePre: 'Nevai Publishers book sets include a ',
    ctaBadge: "START FREE",
    ctaH2a: "Take the first step",
    ctaH2b: "for your school, today.",
    ctaSub: "1 teacher, 10 students — set up in 5 minutes. No credit card needed.",
    ctaPrimary: "Start Free for Your Institution",
    ctaSecondary: "Student Sign Up",
    ctaLogin: "Already have an account?",
    ctaLoginLink: "Log in",
  },
} as const;

// ─── Book data ───────────────────────────────────────────────────────────────

const BOOK_BASE = [
  { name: "CAN",     cefr: "A1 – A2", color: "#1b75bc", colorLight: "#eff6ff", imgs: BOOK_COVERS.CAN },
  { name: "YAĞMUR", cefr: "A1 – B1", color: "#0891b2", colorLight: "#ecfeff", imgs: BOOK_COVERS.YAGMUR },
  { name: "HARMONİ",cefr: "A1 – B2", color: "#7c3aed", colorLight: "#f5f3ff", imgs: BOOK_COVERS.HARMONI },
];

const shadowCard = "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(27,117,188,0.08)";
const shadowBlue = "0 8px 40px rgba(27,117,188,0.28)";

// ─── Schema.org JSON-LD ──────────────────────────────────────────────────────

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Türkçe Okulu',
  url: BASE,
  foundingDate: '2013',
  offers: [
    { '@type': 'Offer', name: 'Bireysel Ücretsiz', price: '0', priceCurrency: 'GBP' },
    { '@type': 'Offer', name: 'Premium Bireysel', price: '9.99', priceCurrency: 'GBP' },
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

      <div style={{ background: "#f9fafb", color: "#1e1b1c" }}>

        {/* Nav */}
        <LandingNav locale={locale} alternateHref={alternateHref} />

        {/* Hero */}
        <HeroSection locale={locale} />

        {/* Stats + Marquee band */}
        <div style={{ background: "#1b75bc" }}>
          <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)", padding: "14px 20px" }}>
            {t.stats.map((s) => (
              <div key={s.label} style={{ textAlign: "center", padding: "6px 0" }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.val}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 3, letterSpacing: "0.04em" }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: "8px 0" }} className="marquee">
            <div className="marquee-inner" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.65)" }}>
              {t.marquee} &nbsp;·&nbsp; {t.marquee} &nbsp;·&nbsp;
            </div>
          </div>
        </div>

        {/* Platform Features */}
        <section id="platform" style={{ background: "#ffffff", padding: "72px 0" }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 52 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eef0f3", color: "#414751", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", padding: "4px 12px", borderRadius: 999, marginBottom: 12 }}>{t.platformBadge}</div>
              <h2 style={{ fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 12 }}>{t.platformH2}</h2>
              <p style={{ fontSize: 16, color: "#414751", maxWidth: 460, margin: "0 auto", lineHeight: "26px" }}>{t.platformSub}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 14 }}>

              {/* AI Studio */}
              <div className="md:col-span-2 lg:col-span-2" style={{ borderRadius: 16, padding: 30, background: "#1e1b1c", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: -60, right: -60, width: 340, height: 340, background: "radial-gradient(circle,rgba(87,223,254,0.13),transparent 65%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: -80, left: 100, width: 240, height: 240, background: "radial-gradient(circle,rgba(104,51,209,0.1),transparent 65%)", pointerEvents: "none" }} />
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(87,223,254,0.09)", border: "1px solid rgba(87,223,254,0.22)", borderRadius: 999, padding: "4px 12px", marginBottom: 14 }}>
                  <Sparkles style={{ width: 11, height: 11, color: "#57dffe" }} />
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#57dffe" }}>{t.aiLabel}</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 7 }}>{t.aiTitle}</h3>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, maxWidth: 400, lineHeight: "20px" }}>{t.aiDesc}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {t.aiTags.map((tag) => (
                    <span key={tag} style={{ background: "rgba(87,223,254,0.08)", border: "1px solid rgba(87,223,254,0.16)", color: "#57dffe", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* Gamification */}
              <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", border: "1px solid rgba(192,199,210,0.55)", boxShadow: shadowCard, borderRadius: 16, padding: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{t.gamTitle}</h3>
                <p style={{ fontSize: 12, color: "#717882", marginBottom: 14 }}>{t.gamSub}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                  {[
                    { Icon: Heart,  iconColor: "#ef4444", iconFill: "#ef4444", bg: "#fff1f2", idx: 0 },
                    { Icon: Flame,  iconColor: "#f97316", iconFill: undefined,  bg: "#fff7ed", idx: 1 },
                    { Icon: Zap,    iconColor: "#4f46e5", iconFill: undefined,  bg: "#eef2ff", idx: 2 },
                    { Icon: Trophy, iconColor: "#ca8a04", iconFill: undefined,  bg: "#fefce8", idx: 3 },
                  ].map(({ Icon, iconColor, iconFill, bg, idx }) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 28, height: 28, background: bg, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Icon style={{ width: 14, height: 14, color: iconColor, ...(iconFill ? { fill: iconFill } : {}) }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 600 }}>{t.gamItems[idx].label}</div>
                        <div style={{ fontSize: 10, color: "#9ca3af" }}>{t.gamItems[idx].sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analytics */}
              <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", border: "1px solid rgba(192,199,210,0.55)", boxShadow: shadowCard, borderRadius: 16, padding: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{t.analyticsTitle}</h3>
                <p style={{ fontSize: 12, color: "#717882", marginBottom: 12 }}>{t.analyticsSub}</p>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48, marginBottom: 8 }}>
                  {[40, 58, 45, 82, 65, 92, 72].map((h, i) => (
                    <div key={i} style={{ flex: 1, background: i === 3 || i === 5 ? "#1b75bc" : "#dbeafe", borderRadius: "3px 3px 0 0", height: `${h}%` }} />
                  ))}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
                  <span>{t.completionRate}</span>
                  <span style={{ fontWeight: 700, color: "#1b75bc" }}>78% ↑</span>
                </div>
              </div>

              {/* Multiplayer */}
              <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", border: "1px solid rgba(192,199,210,0.55)", boxShadow: shadowCard, borderRadius: 16, padding: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{t.mpTitle}</h3>
                <p style={{ fontSize: 12, color: "#717882", marginBottom: 12 }}>{t.mpSub}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { label: t.mpModes[0], Icon: Swords, bg: "#fff7ed", border: "#fed7aa", color: "#ea580c" },
                    { label: t.mpModes[1], Icon: Users,  bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a" },
                    { label: t.mpModes[2], Icon: Trophy, bg: "#fefce8", border: "#fde68a", color: "#ca8a04" },
                  ].map(({ label, Icon, bg, border, color }) => (
                    <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 7, padding: "7px 11px", fontSize: 11, fontWeight: 600, color, display: "flex", alignItems: "center", gap: 7 }}>
                      <Icon style={{ width: 12, height: 12 }} /> {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Hybrid Curriculum */}
              <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", border: "1px solid rgba(192,199,210,0.55)", boxShadow: shadowCard, borderRadius: 16, padding: 22 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>{t.currTitle}</h3>
                <p style={{ fontSize: 12, color: "#717882", marginBottom: 12 }}>{t.currSub}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f3f4f6", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                  <div style={{ width: 32, height: 42, background: "linear-gradient(135deg,#1b75bc,#005c99)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <BookOpen style={{ width: 14, height: 14, color: "white" }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#1e1b1c" }}>{t.bookActivation}</div>
                    <div style={{ fontSize: 10, color: "#9ca3af" }}>{t.bookDuration}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Book Series */}
        <section id="kitaplar" style={{ background: "#ffffff", padding: "72px 0" }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eef0f3", color: "#414751", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", padding: "4px 12px", borderRadius: 999, marginBottom: 10 }}>{t.booksBadge}</div>
                <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 800, letterSpacing: "-0.025em" }}>{t.booksH2}</h2>
              </div>
              <a href="#" style={{ fontSize: 13, fontWeight: 600, color: "#1b75bc", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                {t.booksAll} <ArrowRight style={{ width: 13, height: 13 }} />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 20 }}>
              {books.map((b) => (
                <div key={b.name} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: shadowCard, display: "flex", flexDirection: "column" }}>
                  <div style={{ background: b.color, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.90)" }}>{b.levelLabel}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.60)", marginTop: 1 }}>{b.subLabel}</div>
                    </div>
                    <span style={{ background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, flexShrink: 0 }}>{b.cefr}</span>
                  </div>
                  <div style={{ background: b.colorLight, padding: "20px 20px 16px", display: "flex", gap: 8, overflowX: "auto" }} className="scrollbar-none">
                    {b.imgs.map((src, i) => (
                      <div key={i} style={{ width: 64, height: 90, borderRadius: 6, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} alt={`${b.name} ${i + 1}`} />
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                    <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1e1b1c", marginBottom: 2, letterSpacing: "-0.02em" }}>{b.name}</h3>
                    <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>{t.bookPublisher}</p>
                    <ul style={{ fontSize: 12, color: "#414751", listStyle: "none", padding: 0, marginBottom: 20, flex: 1 }}>
                      {b.features.map((f) => (
                        <li key={f} style={{ marginBottom: 6, display: "flex", alignItems: "center", gap: 7 }}>
                          <Check style={{ width: 12, height: 12, color: b.color, flexShrink: 0 }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={{ flex: 1, background: b.color, color: "#fff", fontSize: 12, fontWeight: 700, padding: "10px 0", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                        {t.bookBuy} <ArrowRight style={{ width: 12, height: 12 }} />
                      </button>
                      <button style={{ flex: 1, background: "#f3f4f6", color: "#414751", fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 8, border: "1px solid #e5e7eb", cursor: "pointer" }}>
                        {t.bookPreview}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="fiyatlar" style={{ background: "#eff6ff", padding: "72px 0" }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 44 }}>
              <div style={{ display: "inline-flex", background: "#fff", color: "#414751", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", padding: "4px 12px", borderRadius: 999, marginBottom: 10, border: "1px solid #e5e7eb" }}>{t.pricingBadge}</div>
              <h2 style={{ fontSize: "clamp(22px,3vw,38px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 8 }}>{t.pricingH2}</h2>
              <p style={{ fontSize: 15, color: "#717882" }}>{t.pricingSub}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: 12, marginBottom: 12 }}>
              {t.plans.map((plan) => (
                <div
                  key={plan.badge}
                  style={{
                    background: plan.highlighted ? "#1b75bc" : "#fff",
                    borderRadius: 12,
                    padding: 22,
                    border: plan.highlighted ? "none" : "1px solid #e5e7eb",
                    boxShadow: plan.highlighted ? shadowBlue : shadowCard,
                    position: "relative",
                  }}
                >
                  {'recommended' in plan && plan.recommended && (
                    <div style={{ position: "absolute", top: -10, left: 18, background: "#fff", color: "#1b75bc", fontSize: 9, fontWeight: 800, letterSpacing: "0.05em", padding: "3px 10px", borderRadius: 999 }}>
                      {plan.recommended}
                    </div>
                  )}
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: plan.highlighted ? "rgba(255,255,255,0.55)" : "#9ca3af", marginBottom: 10 }}>{plan.badge}</div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: plan.highlighted ? "#fff" : "#1e1b1c", lineHeight: 1, marginBottom: 2 }}>{plan.name}</div>
                  <div style={{ fontSize: 12, color: plan.highlighted ? "rgba(255,255,255,0.6)" : "#9ca3af", marginBottom: 'sub' in plan && plan.sub ? 1 : 16 }}>{plan.period}</div>
                  {'sub' in plan && plan.sub && (
                    <div style={{ fontSize: 11, color: plan.highlighted ? "rgba(255,255,255,0.4)" : "#c0c7d2", marginBottom: 16 }}>{plan.sub}</div>
                  )}
                  <hr style={{ border: "none", borderTop: `1px solid ${plan.highlighted ? "rgba(255,255,255,0.12)" : "#f0f0f0"}`, marginBottom: 16 }} />
                  <ul style={{ fontSize: 12, color: plan.highlighted ? "rgba(255,255,255,0.82)" : "#414751", listStyle: "none", padding: 0, marginBottom: 20 }}>
                    {plan.features.map(({ label, ok }) => (
                      <li key={label} style={{ marginBottom: 7, display: "flex", alignItems: "center", gap: 7, color: ok ? (plan.highlighted ? "rgba(255,255,255,0.82)" : "#414751") : "#d1d5db" }}>
                        {ok
                          ? <Check style={{ width: 12, height: 12, color: plan.highlighted ? "#57dffe" : "#16a34a", flexShrink: 0 }} />
                          : <X    style={{ width: 12, height: 12, color: "#d1d5db", flexShrink: 0 }} />}
                        {label}
                      </li>
                    ))}
                  </ul>
                  <button style={{ width: "100%", padding: 9, borderRadius: 7, border: plan.highlighted ? "none" : "1px solid #e5e7eb", background: plan.highlighted ? "#fff" : "#fff", color: plan.highlighted ? "#1b75bc" : "#414751", fontSize: 12, fontWeight: plan.highlighted ? 700 : 600, cursor: "pointer" }}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>

            <div style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid #e5e7eb", boxShadow: shadowCard, display: "flex", alignItems: "center", gap: 12 }}>
              <Package style={{ width: 18, height: 18, color: "#1b75bc", flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: "#414751", margin: 0 }}
                dangerouslySetInnerHTML={{ __html: t.bookNotePre + t.bookNote }}
              />
            </div>
          </div>
        </section>

        {/* Son CTA */}
        <section style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1b75bc 60%,#0ea5e9 100%)", padding: "80px 0", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: "radial-gradient(circle,rgba(255,255,255,0.06),transparent 65%)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", bottom: -80, left: -60, width: 320, height: 320, background: "radial-gradient(circle,rgba(87,223,254,0.08),transparent 65%)", pointerEvents: "none" }} />
          <div className="px-4 md:px-10" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", padding: "4px 14px", borderRadius: 999, marginBottom: 20 }}>
              {t.ctaBadge}
            </div>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,44px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>
              {t.ctaH2a}<br />{t.ctaH2b}
            </h2>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", marginBottom: 36, lineHeight: "26px" }}>{t.ctaSub}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/kayit?tip=kurumsal" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#1b75bc", fontSize: 14, fontWeight: 700, padding: "13px 26px", borderRadius: 10, textDecoration: "none" }}>
                {t.ctaPrimary} <ArrowRight style={{ width: 15, height: 15 }} />
              </Link>
              <Link href="/kayit?tip=bireysel" style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 14, fontWeight: 600, padding: "13px 26px", borderRadius: 10, textDecoration: "none" }}>
                {t.ctaSecondary}
              </Link>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 20 }}>
              {t.ctaLogin} <Link href="/giris" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "underline" }}>{t.ctaLoginLink}</Link>
            </p>
          </div>
        </section>

        {/* Footer */}
        <LandingFooter locale={locale} />

      </div>
    </>
  );
}
