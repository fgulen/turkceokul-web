// web/src/app/[locale]/nasil-calisir/page.tsx
import type { Metadata } from 'next';
import Image from 'next/image';
import { Link } from '@/navigation';
import { LandingNav } from '@/components/landing-nav';
import { LandingFooter } from '@/components/landing-footer';
import { ArrowRight, Building2, Users, MonitorPlay, BarChart3, Sparkles, KeyRound } from 'lucide-react';

const BASE = 'https://turkceokulu.com';

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const path = `/${locale}/nasil-calisir`;

  return isEn ? {
    title: 'How It Works | Türkçe Okulu — From Setup to Reports, Step by Step',
    description: 'Institution setup, adding a class, live Kahoot quizzes and progress reporting — see how Türkçe Okulu works with real screenshots, step by step.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { en: `${BASE}/en/nasil-calisir`, tr: `${BASE}/tr/nasil-calisir` } },
    openGraph: {
      title: 'How It Works | Türkçe Okulu',
      description: 'Institution setup, adding a class, live Kahoot quizzes and progress reporting — step by step.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'en_GB',
      alternateLocale: ['tr_TR'],
    },
  } : {
    title: 'Nasıl Çalışır? | Türkçe Okulu — Kurulumdan Rapora Adım Adım',
    description: 'Kurum kurulumu, sınıf ekleme, canlı Kahoot quizi ve ilerleme raporlaması — gerçek ekran görüntüleriyle Türkçe Okulu\'nun nasıl çalıştığını adım adım görün.',
    metadataBase: new URL(BASE),
    alternates: { canonical: `${BASE}${path}`, languages: { tr: `${BASE}/tr/nasil-calisir`, en: `${BASE}/en/nasil-calisir` } },
    openGraph: {
      title: 'Nasıl Çalışır? | Türkçe Okulu',
      description: 'Kurum kurulumu, sınıf ekleme, canlı Kahoot quizi ve ilerleme raporlaması — adım adım.',
      url: `${BASE}${path}`,
      type: 'website',
      locale: 'tr_TR',
      alternateLocale: ['en_GB'],
    },
  };
}

type Step = { n: string; text: string };
type GuideImage = { src: string; alt: string };

const C = {
  tr: {
    heroBadge: 'REHBER',
    h1: 'Nasıl Çalışır?',
    sub: 'Kurumu kurmaktan canlı Kahoot quizine, raporlamaya kadar Türkçe Okulu\'nu adım adım kullanın — gerçek ekran görüntüleriyle.',
    anchors: [
      { label: 'Kurum Kurulumu', href: '#kurum' },
      { label: 'Satın Alma & Lisans', href: '#lisans' },
      { label: 'Sınıf Ekleme', href: '#sinif' },
      { label: 'Canlı Kahoot', href: '#kahoot' },
      { label: 'Raporlama', href: '#rapor' },
    ],
    sections: {
      kurum: {
        kicker: '1 · SÜPER ADMİN / ÜLKE TEMSİLCİSİ',
        title: 'Kurum Kurulumu',
        desc: 'Yeni bir ülke, okul ya da kurum kaydı Süper Admin veya Ülke Temsilcisi rolüyle birkaç adımda tamamlanır.',
        steps: [
          { n: '1', text: '"Ülkeler & Okullar" sekmesine girin.' },
          { n: '2', text: 'Sol taraftan bir ülke seçin — sağda o ülkenin Temsilciler, Kurumlar, Ders Kitapları ve Sınıflar sekmeleri açılır.' },
          { n: '3', text: '"Okul Ekle" ile yeni kurum kaydı oluşturun.' },
          { n: '4', text: '"Kullanıcı Oluştur" sekmesiyle öğretmen veya yönetici hesabı açın — rolü ve ülke/kurum kapsamını (scope) seçin.' },
        ] as Step[],
        image: { src: '/rehber/kurum-yonetim.png', alt: 'Süper Admin panelinde Ülkeler & Okullar sekmesi — ülke listesi ve seçili ülkenin Temsilciler/Kurumlar/Ders Kitapları/Sınıflar sekmeleri' } as GuideImage,
      },
      lisans: {
        kicker: '2 · ÜLKE TEMSİLCİSİ / KURUM YÖNETİCİSİ',
        title: 'Satın Alma & Lisans Aktivasyonu',
        desc: 'Bir okul demo talebinden ücretli lisansa kadar süreç birkaç rolün elinden geçer — davet linkleriyle ilerler, ödeme banka havalesiyle yapılır.',
        steps: [
          { n: '1', text: 'Süper Admin, "Kullanıcı Oluştur" ekranından bir ülkeye Ülke Temsilcisi davet linki oluşturur; temsilci linkle kendi hesabını açar.', image: { src: '/rehber/kurumsal-davet-form.png', alt: 'Kullanıcı Oluştur ekranı — Rol: Ülke Temsilcisi, Ülke seçili, "Davet Linki Oluştur" butonu' } as GuideImage },
          { n: '2', text: 'Okul, Kurumsal Satış sayfasından bir kitap için "Demo / Teklif Talep Et" formunu doldurur. Ödeme yöntemi banka havalesidir; satış ekibi 48 saat içinde döner.', image: { src: '/rehber/kurumsal-demo-talep.png', alt: 'Kurumsal Satış sayfası — Demo / Teklif Talep Et formu: kurum adı, yetkili, e-posta, ülke' } as GuideImage },
          { n: '3', text: 'Ülke Temsilcisi panelinde beliren talebi "Kuruma Dönüştür" ile okula çevirir — bu adımda otomatik bir deneme lisansı açılır.', image: { src: '/rehber/kurumsal-bekleyen-talep.png', alt: 'Ülke Temsilcisi paneli — Bekleyen Talepler listesinde bir demo talebi ve "Kuruma Dönüştür" butonu' } as GuideImage },
          { n: '4', text: 'Aynı panelden okula özel bir Kurum Yöneticisi davet linki oluşturur; yönetici linkle hesabını açar ve kendi öğretmenlerini davet eder.', image: { src: '/rehber/kurumsal-yonetici-davet.png', alt: 'Ülke Temsilcisi paneli — Kurum Yöneticisi Davet Et formu, hedef kurum seçili' } as GuideImage },
          { n: '5', text: 'Kurum Yöneticisi, Lisanslar sekmesinde deneme lisanslı kitap için "Satın Al" butonuna basar — talep "Talebiniz İnceleniyor" durumuna düşer.', image: { src: '/rehber/kurumsal-lisans-deneme.png', alt: 'Kurum Yöneticisi paneli — Lisanslar sekmesi, Deneme etiketli kitap ve Satın Al butonu' } as GuideImage },
          { n: '6', text: 'Havale ödemesi ulaştığında Süper Admin, Kurumsal Satış → Siparişler\'de kapasite/tutarı teyit edip "Onayla"ya basar; lisans aynı anda Ücretli\'ye döner ve kurum yöneticisi ekranında aktif görünür.', image: { src: '/rehber/kurumsal-siparis-onay.png', alt: 'Süper Admin — Kurumsal Satış siparişi detayı: kapasite, tutar ve Onayla butonu' } as GuideImage },
        ] as (Step & { image?: GuideImage })[],
      },
      sinif: {
        kicker: '3 · ÖĞRETMEN',
        title: 'Sınıf Ekleme',
        desc: 'Öğretmen panelinden yeni bir sınıf açmak ve öğrencilerin katılmasını sağlamak birkaç dakika sürer.',
        steps: [
          { n: '1', text: 'Panelim → "Yeni Sınıf" → sınıf adını girin ve kitabı seçin (kitap seçimi zorunludur).', image: { src: '/rehber/ogretmen-panel.png', alt: 'Öğretmen paneli — sınıf kartları, "Yeni Sınıf" butonu ve AI Stüdyo linki' } as GuideImage },
          { n: '2', text: 'Sınıf kartından sınıfa girin — sayfanın üstünde katılım kodu (ör. TEST01) ve kopyala butonu görünür.', image: { src: '/rehber/sinif-detay.png', alt: 'Sınıf sayfası — katılım kodu, Canlı Kahoot butonu ve Genel/Öğrenciler/Raporlar/Ödevler/Okuma/Duyurular sekmeleri' } as GuideImage },
          { n: '3', text: 'Öğrenciler sekmesi → "QR ile Katıl" — büyük bir QR kod ve katılım kodu modalda açılır.', image: { src: '/rehber/qr-modal.png', alt: '"QR ile Sınıfa Katıl" modalı — QR kod ve katılım kodu' } as GuideImage },
          { n: '4', text: 'Öğrenciler QR\'ı telefon kamerasıyla okutur ya da turkceokulu.com/sinif/katil sayfasında katılım kodunu yazar.' },
        ] as (Step & { image?: GuideImage })[],
      },
      kahoot: {
        kicker: '4 · CANLI DERS',
        title: 'Kahoot Canlı Quiz',
        desc: 'Sınıfı tahtaya ya da projektöre yansıtın, öğrenciler kendi cihazlarından katılsın.',
        steps: [
          { n: '1', text: 'Sınıf sayfasında "Canlı Kahoot" butonuna tıklayın.' },
          { n: '2', text: '"Etkinlik Seç" ile kitap/ünite filtresi ve arama kullanarak quiz etkinliklerini çok-seçim ile belirleyin.' },
          { n: '3', text: '"Başlat (N soru)" ile canlı oturumu açın — önce denemek isterseniz "Demo" butonunu kullanın.' },
          { n: '4', text: 'Öğrenciler kendi cihazından katılır; sorular eş zamanlı gösterilir, süre bazlı hız puanıyla canlı skor tablosu güncellenir.' },
        ] as Step[],
        image: { src: '/rehber/kahoot-baslat.png', alt: 'Canlı Kahoot kurulum ekranı — "Etkinlik Seç" (kitap/ünite filtresi + arama + çok-seçim), "Başlat (N soru)" ve "Demo" butonları' } as GuideImage,
      },
      rapor: {
        kicker: '5 · PUANLAMA & RAPORLAMA',
        title: 'İlerleme Raporu',
        desc: 'Her sınıfın ünite bazlı ilerlemesini görün, dilerseniz Excel olarak indirin.',
        steps: [
          { n: '1', text: 'Sınıf → Raporlar sekmesine girin.' },
          { n: '2', text: 'Ünite dropdown\'u ile bir ünite seçin.' },
          { n: '3', text: 'Durum (Tamamlandı / Devam Ediyor / Başlamadı) rozetlerini, Ünite Puanı\'nı (denenen etkinliklerin başarı yüzdesi) ve İlerleme\'yi (kapsam yüzdesi) inceleyin.' },
          { n: '4', text: '"Excel İndir" ile ekranda gördüğünüz tabloyu aynı sütunlarla indirin.' },
        ] as Step[],
        image: { src: '/rehber/raporlar.png', alt: 'İlerleme Raporu — ünite dropdown seçili, Durum rozetleri, Ünite Puanı, Son Aktivite ve İlerleme çubukları, "Excel İndir" butonu' } as GuideImage,
        bonusKicker: 'BONUS · AI İÇERİK STÜDYOSU',
        bonusTitle: '30 saniyede yeni quiz üretin',
        bonusDesc: 'Raporlarda bir ünitenin zayıf kaldığını mı gördünüz? AI Stüdyo\'da Quiz, Eşleştirme, Boşluk Doldur veya Çalışma Kağıdı sekmelerinden birini seçin; kaynak ünite, hedef sınıf ve CEFR seviyesini belirleyip saniyeler içinde yeni materyal üretin.',
        bonusImage: { src: '/rehber/ai-studyo.png', alt: 'AI İçerik Stüdyosu — Quiz/Eşleştirme/Boşluk Doldur/Çalışma Kağıdı sekmeleri, kaynak ünite + hedef sınıf + CEFR seviye formu' } as GuideImage,
        bonusCta: 'AI Stüdyo\'yu Keşfet',
      },
    },
    closingTitle: 'Sınıfınızı bugün kurun',
    closingSub: '5 dakikada ücretsiz hesap açın, ilk sınıfınıza öğrenci ekleyin.',
    closingCta: 'Ücretsiz Başla',
  },
  en: {
    heroBadge: 'GUIDE',
    h1: 'How It Works',
    sub: 'From institution setup to a live Kahoot quiz and progress reports — walk through Türkçe Okulu step by step, with real screenshots.',
    anchors: [
      { label: 'Institution Setup', href: '#kurum' },
      { label: 'Purchase & Licensing', href: '#lisans' },
      { label: 'Add a Class', href: '#sinif' },
      { label: 'Live Kahoot', href: '#kahoot' },
      { label: 'Reporting', href: '#rapor' },
    ],
    sections: {
      kurum: {
        kicker: '1 · SUPER ADMIN / COUNTRY REPRESENTATIVE',
        title: 'Institution Setup',
        desc: 'Registering a new country, school or institution takes just a few steps as a Super Admin or Country Representative.',
        steps: [
          { n: '1', text: 'Open the "Countries & Schools" tab.' },
          { n: '2', text: 'Pick a country from the list on the left — the Representatives, Institutions, Textbooks and Classes tabs for that country open on the right.' },
          { n: '3', text: 'Use "Add School" to create a new institution record.' },
          { n: '4', text: 'Use the "Create User" tab to open a teacher or admin account — choose the role and the country/institution scope.' },
        ] as Step[],
        image: { src: '/rehber/kurum-yonetim.png', alt: 'Super Admin panel — Countries & Schools tab: country list and the selected country\'s Representatives/Institutions/Textbooks/Classes tabs' } as GuideImage,
      },
      lisans: {
        kicker: '2 · COUNTRY REPRESENTATIVE / INSTITUTION ADMIN',
        title: 'Purchase & License Activation',
        desc: 'From a school\'s demo request to a paid license, the process passes through a few roles — moved along by invite links, paid by bank transfer.',
        steps: [
          { n: '1', text: 'The Super Admin creates a Country Representative invite link from the "Create User" screen for a country; the representative opens their own account with the link.', image: { src: '/rehber/kurumsal-davet-form.png', alt: 'Create User screen — Role: Country Representative, country selected, "Generate Invite Link" button' } as GuideImage },
          { n: '2', text: 'A school fills out the "Request Demo / Quote" form for a textbook on the Corporate Sales page. Payment is by bank transfer; the sales team follows up within 48 hours.', image: { src: '/rehber/kurumsal-demo-talep.png', alt: 'Corporate Sales page — Request Demo / Quote form: institution name, contact, email, country' } as GuideImage },
          { n: '3', text: 'The Country Representative converts the request that appears in their panel into an institution via "Convert to Institution" — this automatically opens a trial license.', image: { src: '/rehber/kurumsal-bekleyen-talep.png', alt: 'Country Representative panel — a demo request in the Pending Requests list and the "Convert to Institution" button' } as GuideImage },
          { n: '4', text: 'From the same panel, they generate an Institution Admin invite link scoped to that school; the admin opens their account with the link and invites their own teachers.', image: { src: '/rehber/kurumsal-yonetici-davet.png', alt: 'Country Representative panel — Invite Institution Admin form, target institution selected' } as GuideImage },
          { n: '5', text: 'The Institution Admin clicks "Purchase" on the Licenses tab for a book still on a trial license — the request moves to "Under Review".', image: { src: '/rehber/kurumsal-lisans-deneme.png', alt: 'Institution Admin panel — Licenses tab, a book tagged Trial and the Purchase button' } as GuideImage },
          { n: '6', text: 'Once the bank transfer arrives, the Super Admin confirms the capacity/amount in Corporate Sales → Orders and clicks "Approve"; the license switches to Paid immediately and shows as active on the institution admin\'s screen.', image: { src: '/rehber/kurumsal-siparis-onay.png', alt: 'Super Admin — Corporate Sales order detail: capacity, amount and the Approve button' } as GuideImage },
        ] as (Step & { image?: GuideImage })[],
      },
      sinif: {
        kicker: '3 · TEACHER',
        title: 'Add a Class',
        desc: 'Opening a new class from the teacher panel and getting students to join takes a few minutes.',
        steps: [
          { n: '1', text: 'Dashboard → "New Class" → enter a class name and pick a textbook (required).', image: { src: '/rehber/ogretmen-panel.png', alt: 'Teacher panel — class cards, "New Class" button and AI Studio link' } as GuideImage },
          { n: '2', text: 'Open the class from its card — the join code (e.g. TEST01) and a copy button appear at the top of the page.', image: { src: '/rehber/sinif-detay.png', alt: 'Class page — join code, Live Kahoot button, and General/Students/Reports/Assignments/Reading/Announcements tabs' } as GuideImage },
          { n: '3', text: 'Students tab → "Join via QR" — a large QR code and the join code open in a modal.', image: { src: '/rehber/qr-modal.png', alt: '"Join Class via QR" modal — QR code and join code' } as GuideImage },
          { n: '4', text: 'Students scan the QR code with their phone camera, or enter the join code at turkceokulu.com/sinif/katil.' },
        ] as (Step & { image?: GuideImage })[],
      },
      kahoot: {
        kicker: '4 · LIVE LESSON',
        title: 'Live Kahoot Quiz',
        desc: 'Project the class screen on a board or projector, and let students join from their own devices.',
        steps: [
          { n: '1', text: 'Click "Live Kahoot" on the class page.' },
          { n: '2', text: 'Use "Select Activities" with the book/unit filter and search to multi-select quiz activities.' },
          { n: '3', text: 'Click "Start (N questions)" to open the live session — or try "Demo" first.' },
          { n: '4', text: 'Students join from their own device; questions appear in sync, and the live leaderboard updates with a speed-based score bonus.' },
        ] as Step[],
        image: { src: '/rehber/kahoot-baslat.png', alt: 'Live Kahoot setup screen — "Select Activities" (book/unit filter + search + multi-select), "Start (N questions)" and "Demo" buttons' } as GuideImage,
      },
      rapor: {
        kicker: '5 · SCORING & REPORTING',
        title: 'Progress Report',
        desc: 'See each class\'s progress broken down by unit, and download it as Excel if you like.',
        steps: [
          { n: '1', text: 'Open the Reports tab inside a class.' },
          { n: '2', text: 'Pick a unit from the unit dropdown.' },
          { n: '3', text: 'Review the Status badges (Completed / In Progress / Not Started), Unit Score (success rate on attempted activities) and Progress (coverage percentage) columns.' },
          { n: '4', text: 'Click "Download Excel" to export the same table with the same columns.' },
        ] as Step[],
        image: { src: '/rehber/raporlar.png', alt: 'Progress Report — unit dropdown selected, Status badges, Unit Score, Last Activity and Progress bars, "Download Excel" button' } as GuideImage,
        bonusKicker: 'BONUS · AI CONTENT STUDIO',
        bonusTitle: 'Generate a new quiz in 30 seconds',
        bonusDesc: 'Spotted a weak unit in the reports? Pick one of the Quiz, Matching, Fill-in-the-Blank or Worksheet tabs in AI Studio, set the source unit, target class and CEFR level, and generate new material in seconds.',
        bonusImage: { src: '/rehber/ai-studyo.png', alt: 'AI Content Studio — Quiz/Matching/Fill-in-the-Blank/Worksheet tabs, source unit + target class + CEFR level form' } as GuideImage,
        bonusCta: 'Explore AI Studio',
      },
    },
    closingTitle: 'Set up your class today',
    closingSub: 'Open a free account in 5 minutes and add students to your first class.',
    closingCta: 'Start Free',
  },
} as const;

function StepList({ steps }: { steps: readonly Step[] }) {
  return (
    <ol className="flex flex-col gap-5">
      {steps.map((s) => (
        <li key={s.n} className="flex gap-4">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            {s.n}
          </span>
          <p className="type-body text-slate-600">{s.text}</p>
        </li>
      ))}
    </ol>
  );
}

function GuideImg({ image, className }: { image: GuideImage; className?: string }) {
  return (
    <Image
      src={image.src}
      alt={image.alt}
      width={1280}
      height={800}
      sizes="(min-width: 768px) 560px, 100vw"
      className={className ?? 'w-full h-auto rounded-xl border border-slate-200'}
    />
  );
}

export default async function NasilCalisirPage(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;
  const s = c.sections;

  const icons = { kurum: Building2, lisans: KeyRound, sinif: Users, kahoot: MonitorPlay, rapor: BarChart3 };

  return (
    <div className="bg-white text-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : 'Ana Sayfa', item: `${BASE}/${locale}` },
              { '@type': 'ListItem', position: 2, name: c.h1, item: `${BASE}/${locale}/nasil-calisir` },
            ],
          }),
        }}
      />

      <LandingNav locale={locale} alternateHref={isEn ? '/tr/nasil-calisir' : '/en/nasil-calisir'} />

      {/* Hero */}
      <section className="bg-[#f9fafb] px-4 pt-16 pb-14 text-center md:px-10 md:pt-20 md:pb-16">
        <div className="mx-auto inline-flex items-center gap-[7px] rounded-full bg-blue-100 px-3.5 py-[5px] text-[11px] font-bold tracking-[0.06em] text-[#1e3a5f]">
          {c.heroBadge}
        </div>
        <h1 className="type-hero mx-auto mt-5 max-w-2xl tracking-tight text-slate-900">{c.h1}</h1>
        <p className="mx-auto mt-4 max-w-xl type-body-lg text-slate-500">{c.sub}</p>
      </section>

      {/* Sticky anchor bar */}
      <div className="sticky top-[60px] z-40 border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto whitespace-nowrap px-4 py-3 md:px-10">
          {c.anchors.map((a) => (
            <a
              key={a.href}
              href={a.href}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-primary"
            >
              {a.label}
            </a>
          ))}
        </div>
      </div>

      {/* 1 — Kurum Kurulumu */}
      <section id="kurum" className="scroll-mt-32 border-b border-slate-100 px-4 py-16 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <span className="type-label text-primary">{s.kurum.kicker}</span>
            </div>
            <h2 className="type-display tracking-tight text-slate-900">{s.kurum.title}</h2>
            <p className="mt-3 mb-8 type-body-lg text-slate-500">{s.kurum.desc}</p>
            <StepList steps={s.kurum.steps} />
          </div>
          <GuideImg image={s.kurum.image} />
        </div>
      </section>

      {/* 2 — Satın Alma & Lisans Aktivasyonu */}
      <section id="lisans" className="scroll-mt-32 border-b border-slate-100 bg-[#f9fafb] px-4 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <span className="type-label text-primary">{s.lisans.kicker}</span>
            </div>
            <h2 className="type-display tracking-tight text-slate-900">{s.lisans.title}</h2>
            <p className="mt-3 type-body-lg text-slate-500">{s.lisans.desc}</p>
          </div>
          <div className="flex flex-col gap-12">
            {s.lisans.steps.map((step, i) => (
              <div
                key={step.n}
                className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14 ${
                  step.image && i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {step.n}
                  </span>
                  <p className="type-body-lg text-slate-600">{step.text}</p>
                </div>
                {step.image ? (
                  <GuideImg image={step.image} />
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 — Sınıf Ekleme */}
      <section id="sinif" className="scroll-mt-32 border-b border-slate-100 px-4 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-10 max-w-2xl">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="type-label text-primary">{s.sinif.kicker}</span>
            </div>
            <h2 className="type-display tracking-tight text-slate-900">{s.sinif.title}</h2>
            <p className="mt-3 type-body-lg text-slate-500">{s.sinif.desc}</p>
          </div>
          <div className="flex flex-col gap-12">
            {s.sinif.steps.map((step, i) => (
              <div
                key={step.n}
                className={`grid grid-cols-1 items-center gap-8 md:grid-cols-2 md:gap-14 ${
                  step.image && i % 2 === 1 ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                <div className="flex gap-4">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {step.n}
                  </span>
                  <p className="type-body-lg text-slate-600">{step.text}</p>
                </div>
                {step.image ? (
                  <GuideImg image={step.image} />
                ) : (
                  <div className="hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4 — Kahoot Canlı Quiz */}
      <section id="kahoot" className="scroll-mt-32 border-b border-slate-100 bg-[#f9fafb] px-4 py-16 md:px-10 md:py-20">
        <div className="mx-auto grid max-w-[1200px] grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
          <div className="md:order-2">
            <div className="mb-3 flex items-center gap-2">
              <MonitorPlay className="h-5 w-5 text-primary" />
              <span className="type-label text-primary">{s.kahoot.kicker}</span>
            </div>
            <h2 className="type-display tracking-tight text-slate-900">{s.kahoot.title}</h2>
            <p className="mt-3 mb-8 type-body-lg text-slate-500">{s.kahoot.desc}</p>
            <StepList steps={s.kahoot.steps} />
          </div>
          <div className="md:order-1">
            <GuideImg image={s.kahoot.image} />
          </div>
        </div>
      </section>

      {/* 5 — Puanlama & Raporlama */}
      <section id="rapor" className="scroll-mt-32 px-4 py-16 md:px-10 md:py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-2 md:gap-14">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="type-label text-primary">{s.rapor.kicker}</span>
              </div>
              <h2 className="type-display tracking-tight text-slate-900">{s.rapor.title}</h2>
              <p className="mt-3 mb-8 type-body-lg text-slate-500">{s.rapor.desc}</p>
              <StepList steps={s.rapor.steps} />
            </div>
            <GuideImg image={s.rapor.image} />
          </div>

          {/* Bonus: AI Stüdyo */}
          <div className="mt-16 grid grid-cols-1 items-center gap-8 rounded-2xl border border-blue-100 bg-blue-50/60 p-8 md:grid-cols-2 md:gap-12 md:p-10">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="type-label text-primary">{s.rapor.bonusKicker}</span>
              </div>
              <h3 className="type-heading tracking-tight text-slate-900">{s.rapor.bonusTitle}</h3>
              <p className="mt-3 mb-6 type-body text-slate-600">{s.rapor.bonusDesc}</p>
              <Link
                href="/ogretmenler"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white"
              >
                {s.rapor.bonusCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <GuideImg image={s.rapor.bonusImage} />
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="bg-[linear-gradient(135deg,#1e3a5f_0%,#1b75bc_60%,#0ea5e9_100%)] px-4 py-20 text-center md:px-10">
        <h2 className="type-display mx-auto max-w-lg tracking-tight text-white">{c.closingTitle}</h2>
        <p className="mx-auto mt-4 max-w-md type-body-lg text-white/75">{c.closingSub}</p>
        <Link
          href="/kayit"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-7 py-3.5 text-sm font-bold text-primary"
        >
          {c.closingCta}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <LandingFooter locale={locale} />
    </div>
  );
}
