import type { Metadata } from 'next';
import { Link } from '@/navigation';
import { LandingNav } from '@/components/landing-nav';
import { LandingFooter } from '@/components/landing-footer';
import { BrainstormPlaceholder } from '@/components/brainstorm-placeholder';
import {
  ArrowRight, CheckCircle2, Zap, Users, Brain,
  BarChart3, QrCode, FileDown, Sparkles,
  MonitorPlay, BookOpen, Clock, Shield,
} from 'lucide-react';

const BASE = 'https://turkceokulu.com';

export const metadata: Metadata = {
  title: 'Türkçe Öğretmenler İçin | AI Stüdyo + Kahoot + Sınıf Yönetimi — Türkçe Okulu',
  description:
    'Türkçe öğretmenleri için AI destekli içerik üretimi, Kahoot tarzı canlı quiz, sınıf yönetimi ve öğrenci analitikleri. 30 saniyede materyal. Ücretsiz başlayın.',
  keywords: [
    'türkçe öğretmeni', 'türkçe öğretim materyali', 'sınıf yönetimi platformu',
    'yabancılara türkçe öğretimi', 'türkçe ai quiz üretimi', 'kahoot türkçe',
    'online türkçe ders', 'öğretmen paneli', 'nevai yayınları öğretmen',
  ],
  alternates: {
    canonical: `${BASE}/tr/ogretmenler`,
    languages: {
      tr: `${BASE}/tr/ogretmenler`,
      en: `${BASE}/en/for-teachers`,
    },
  },
  openGraph: {
    title: 'Türkçe Öğretmenler İçin | AI Stüdyo + Kahoot — Türkçe Okulu',
    description: 'AI destekli içerik üretimi, Kahoot tarzı canlı quiz, sınıf yönetimi. Ücretsiz başlayın.',
    url: `${BASE}/tr/ogretmenler`,
    type: 'website',
    locale: 'tr_TR',
    alternateLocale: ['en_GB'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Türkçe Okulu — Kurumsal Pro Öğretmen Planı',
  description: 'AI destekli içerik üretimi, Kahoot tarzı canlı quiz, sınıf yönetimi ve öğrenci analitikleri ile Türkçe öğretmenleri için kapsamlı platform.',
  url: `${BASE}/tr/ogretmenler`,
  brand: { '@type': 'Brand', name: 'Türkçe Okulu' },
  offers: [
    {
      '@type': 'Offer',
      name: 'Kurumsal Pro',
      price: '20',
      priceCurrency: 'EUR',
      priceSpecification: { '@type': 'UnitPriceSpecification', price: 20, priceCurrency: 'EUR', unitText: 'MONTH' },
      availability: 'https://schema.org/InStock',
    },
  ],
};

const features = [
  {
    icon: Sparkles,
    title: 'AI İçerik Stüdyosu',
    desc: '30 saniyede quiz, boşluk doldurma, kelime listesi. Konuyu girin, yapay zeka içeriği üretsin. Siz sadece onaylayın.',
    color: '#57dffe',
    bg: '#0a1628',
    highlight: true,
  },
  {
    icon: MonitorPlay,
    title: 'Canlı Kahoot Quizi',
    desc: 'Sınıfa QR kodu gösterin, öğrenciler telefondan katılsın. Gerçek zamanlı liderboard, anlık sonuçlar.',
    color: '#f97316',
    bg: '#fff7ed',
  },
  {
    icon: BarChart3,
    title: 'Öğrenci Analitikleri',
    desc: 'Kim hangi kelimede takılıyor? Hangi etkinlik tipi işe yarıyor? Excel ile indirin, veriyle karar alın.',
    color: '#1b75bc',
    bg: '#eff6ff',
  },
  {
    icon: QrCode,
    title: 'QR Kod ile Sınıfa Katılım',
    desc: '2 saatlik geçici QR kod oluşturun, öğrenciler tarasın, anında sınıfa girsin. Aktivasyon kodu yok.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    icon: FileDown,
    title: 'Excel Rapor İndirme',
    desc: 'Sınıf bazlı tamamlanma oranı, hata analizi ve öğrenci puanları tek tıkla Excel olarak indirin.',
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  {
    icon: Brain,
    title: 'Okuma → Zor Kelime → Quiz',
    desc: 'Öğrencilerin okuirken zorlandığı kelimeler otomatik işaretlenir. Bir tıkla AI quiz üretin.',
    color: '#be185d',
    bg: '#fdf2f8',
  },
];

const steps = [
  { step: '1', title: 'Hesap aç, sınıf oluştur', desc: '5 dakikada ücretsiz kurumsal hesap. İlk sınıfınıza 10 öğrenci ücretsiz.', color: '#1b75bc' },
  { step: '2', title: 'QR ile öğrenci ekle', desc: 'Tahta ya da projektörden QR gösterin, öğrenciler telefondan tarasın.', color: '#7c3aed' },
  { step: '3', title: 'AI ile materyal üretin', desc: 'Konu veya kelime listesi girin. 30 saniyede quiz hazır. Onaylayın, sınıfa gönderin.', color: '#ea580c' },
  { step: '4', title: 'Canlı quiz başlatın', desc: 'Kahoot gibi — gerçek zamanlı liderboard, anlık yarışma heyecanı.', color: '#16a34a' },
];

const plans = [
  {
    name: 'Başlangıç',
    price: 'Ücretsiz',
    period: 'Sonsuza kadar',
    color: '#414751',
    features: ['1 öğretmen + 10 öğrenci', 'AI Stüdyo: 10 üretim/ay', 'Canlı Kahoot modu', 'QR katılım'],
    missing: ['Sınırsız AI üretimi', 'Excel rapor', 'Tam analitik paneli'],
    cta: 'Ücretsiz Başla',
    href: '/kayit?tip=ogretmen',
    highlight: false,
  },
  {
    name: 'Kurumsal Pro',
    price: '€20',
    period: 'öğretmen / ay',
    sub: '+ öğrenci lisansları',
    color: '#1b75bc',
    features: ['Sınırsız sınıf & öğrenci', 'AI İçerik Stüdyosu', 'Canlı Kahoot modu', 'Excel rapor indirme', 'Tam analitik paneli', '10 öğrenci lisansı dahil'],
    missing: [],
    cta: 'Ücretsiz Dene',
    href: '/kayit?tip=kurumsal-pro',
    highlight: true,
  },
  {
    name: 'Kampüs',
    price: 'Özel',
    period: 'fiyat görüşme',
    color: '#414751',
    features: ['Kurumsal Pro (tümü)', 'Sınırsız öğretmen', 'Kitap kodu paketi', 'Öncelikli destek', 'Özel entegrasyon'],
    missing: [],
    cta: 'İletişime Geç',
    href: '/iletisim',
    highlight: false,
  },
];

const faqs = [
  { q: 'Kurumsal hesap açmak ücretsiz mi?', a: 'Evet. 1 sınıf ve 10 öğrenci ücretsiz olarak süresiz kullanılabilir. Sınıf ve öğrenci sayısı artınca Kurumsal Pro planına geçebilirsiniz.' },
  { q: 'Öğrencim sınıfa nasıl katılır?', a: 'İki yol var: (1) Öğretmen panelinden QR kodu açın, öğrenci telefonu ile tarasın. (2) Katılım kodunu paylaşın, öğrenci turkceokulu.com/sinif/katil sayfasına girip kodu yazsın. Ayrıntılı adımlar ve ekran görüntüleri için turkceokulu.com/nasil-calisir sayfasındaki "Sınıf Ekleme" rehberine bakın.' },
  { q: 'QR kodu nasıl çalışır? Özel uygulama gerekiyor mu?', a: 'Hayır, uygulama gerekmez. Öğretmen Paneli → Sınıfım → "QR ile Katıl" butonuna tıklayınca büyük bir QR kodu açılır. Öğrenci telefon kamerasıyla (iOS veya Android — ayrı QR uygulaması şart değil) kodu tarar; tarayıcıda turkceokulu.com/sinif/katil sayfası açılır ve sınıfa katılır. Hesabı yoksa önce kayıt olur, ardından otomatik olarak katılım sayfasına yönlendirilir.' },
  { q: 'AI İçerik Stüdyosu hangi dillerde çalışır?', a: 'Şu an Türkçe içerik üretimi için optimize edilmiştir. Konu Türkçe verilince kelime düzeyine uygun quiz, boşluk doldurma ve kelime listesi üretir.' },
  { q: 'Kahoot modunda kaç öğrenci aynı anda katılabilir?', a: 'Kurumsal Pro planda 50 öğrenciye kadar aynı anda canlı quiz yapılabilir. Kampüs planında bu limit kaldırılır.' },
  { q: 'Nevai Yayınları kitaplarıyla entegrasyon nasıl çalışır?', a: 'Kitap aktivasyon kodları öğrencilere 6 aylık premium erişim verir. Öğretmen panelinden sınıfı bağlı kitaba göre filtreleyebilirsiniz.' },
  { q: 'Veriler güvenli mi? GDPR uyumlu mu?', a: 'Evet. Platform UK merkezlidir ve GDPR\'a tabidir. Öğrenci verileri üçüncü taraflarla paylaşılmaz. Veri silme talebi 30 gün içinde yerine getirilir.' },
];

export default function OgretmenlerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${BASE}/tr` },
              { '@type': 'ListItem', position: 2, name: 'Öğretmenler', item: `${BASE}/tr/ogretmenler` },
            ],
          }),
        }}
      />

      <div style={{ background: '#f9fafb', color: '#1e1b1c' }}>

        {/* Nav */}
        <LandingNav
          locale="tr"
          alternateHref="/en/for-teachers"
          links={[
            { label: 'Öğrenciler', href: '/turkce-ogren' },
            { label: 'Öğretmenler', href: '/ogretmenler', active: true },
          ]}
          ctaLabel="Ücretsiz Dene"
          ctaHref="/kayit?tip=ogretmen"
        />

        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e3a5f 50%,#1b75bc 100%)', padding: '80px 0 72px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(87,223,254,0.10),transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -40, width: 360, height: 360, background: 'radial-gradient(circle,rgba(104,51,209,0.10),transparent 65%)', pointerEvents: 'none' }} />
          <div className="px-4 md:px-10" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(87,223,254,0.12)', border: '1px solid rgba(87,223,254,0.22)', color: '#57dffe', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', padding: '4px 14px', borderRadius: 999, marginBottom: 20 }}>
              ÖĞRETMENLERİN TERCİHİ · 30+ ÜLKE
            </div>
            <h1 style={{ fontSize: 'clamp(34px,5.5vw,60px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', marginBottom: 20 }}>
              Türkçe Öğretmenine<br />
              <span style={{ color: '#57dffe' }}>Süper Güç Ver</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.72)', maxWidth: 560, margin: '0 auto 40px', lineHeight: '28px' }}>
              AI ile 30 saniyede quiz üret. Canlı Kahoot quizi başlat.
              Öğrenci ilerlemesini takip et. Hepsini tek panelden.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/kayit?tip=ogretmen"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1b75bc', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}
              >
                Ücretsiz Başla <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <a
                href="#ozellikler"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}
              >
                Özellikleri Gör
              </a>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 40, flexWrap: 'wrap' }}>
              {[
                { val: '30 sn', label: 'Quiz üretim süresi' },
                { val: '50', label: 'Canlı öğrenci / quiz' },
                { val: '20+', label: 'Etkinlik tipi' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Özellikler */}
        <section id="ozellikler" style={{ background: '#fff', padding: '80px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ display: 'inline-flex', background: '#eef0f3', color: '#414751', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>ÖZELLİKLER</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 10 }}>
                Türkçe öğretimi için tasarlandı
              </h2>
              <p style={{ fontSize: 16, color: '#717882', maxWidth: 480, margin: '0 auto' }}>
                Ders hazırlığından canlı sınıfa, raporlamadan AI üretimine kadar tam döngü.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
              {features.map((f) => (
                <div
                  key={f.title}
                  style={{
                    background: f.highlight ? f.bg : f.bg,
                    border: f.highlight ? `1px solid rgba(87,223,254,0.2)` : '1px solid #e5e7eb',
                    borderRadius: 16,
                    padding: '28px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {f.highlight && (
                    <>
                      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle,rgba(87,223,254,0.08),transparent 65%)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', top: 10, right: 14, background: 'rgba(87,223,254,0.15)', color: '#57dffe', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999 }}>AI GÜÇLENDİRİLMİŞ</div>
                    </>
                  )}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: f.highlight ? 'rgba(87,223,254,0.10)' : f.bg === '#fff7ed' ? '#ffedd5' : `${f.bg}`, border: `1px solid ${f.highlight ? 'rgba(87,223,254,0.2)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, flexShrink: 0 }}>
                    <f.icon style={{ width: 20, height: 20, color: f.color }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: f.highlight ? '#fff' : '#1e1b1c' }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: f.highlight ? 'rgba(255,255,255,0.6)' : '#717882', lineHeight: '20px' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nasıl Çalışır */}
        <section style={{ background: '#eff6ff', padding: '80px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ display: 'inline-flex', background: '#dbeafe', color: '#1b75bc', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>NASIL ÇALIŞIR</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                İlk canlı quize 15 dakikada başlayın
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 20 }}>
              {steps.map((s) => (
                <div key={s.step} style={{ background: '#fff', borderRadius: 14, padding: '24px 20px', textAlign: 'center', border: '1px solid #e5e7eb', position: 'relative' }}>
                  <div style={{ width: 40, height: 40, background: s.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: 18, fontWeight: 900, color: '#fff' }}>
                    {s.step}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{s.title}</h3>
                  <p style={{ fontSize: 12, color: '#717882', lineHeight: '18px' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* AI Stüdyo Demo */}
        <section style={{ background: '#1e1b1c', padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, background: 'radial-gradient(circle,rgba(87,223,254,0.07),transparent 65%)', pointerEvents: 'none' }} />
          <div className="px-4 md:px-10" style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }} className="grid-cols-1 md:grid-cols-2">

              {/* Sol: anlatı */}
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(87,223,254,0.10)', border: '1px solid rgba(87,223,254,0.20)', color: '#57dffe', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 20 }}>
                  <Sparkles style={{ width: 10, height: 10 }} /> AI STÜDYO
                </div>
                <h2 style={{ fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 16 }}>
                  Ders hazırlığını 30 saniyeye indirin
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: '24px', marginBottom: 24 }}>
                  Konu girin veya kelime listesi yapıştırın. AI CEFR seviyesine uygun quiz, boşluk doldurma veya kelime eşleştirme üretir. Siz düzenleyin, onaylayın, sınıfa gönderin.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: Clock, text: '30 saniyede materyal hazır' },
                    { icon: Shield, text: 'Öğretmen onayı olmadan sınıfa gönderilmez' },
                    { icon: BookOpen, text: 'Kitap müfredatına uygun içerik' },
                    { icon: Users, text: 'Sınıfa gönder veya Kahoot\'ta başlat' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, background: 'rgba(87,223,254,0.08)', border: '1px solid rgba(87,223,254,0.15)', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon style={{ width: 13, height: 13, color: '#57dffe' }} />
                      </div>
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sağ: mock terminal */}
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px', fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {['#ef4444', '#facc15', '#22c55e'].map((c) => (
                    <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{'// AI İçerik Stüdyosu'}</div>
                <div style={{ background: 'rgba(87,223,254,0.05)', border: '1px solid rgba(87,223,254,0.12)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>KONU</div>
                  <div style={{ fontSize: 13, color: '#fff' }}>Türkiye&apos;nin coğrafyası, B1 seviyesi, 10 soru</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ fontSize: 10, color: '#57dffe', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles style={{ width: 10, height: 10 }} /> üretiliyor…
                  </div>
                  <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>
                {[
                  'İstanbul hangi kıtadadır?',
                  'Türkiye\'nin başkenti neresidir?',
                  'Ege\'de hangi iller yer alır?',
                ].map((q, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 10, color: '#57dffe', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>Q{i + 1}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: '18px' }}>{q}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, background: '#1b75bc', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Onayla →</button>
                  <button style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '8px 0', fontSize: 11, cursor: 'pointer' }}>Düzenle</button>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Fiyatlandırma */}
        <section style={{ background: '#f9fafb', padding: '80px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', background: '#eef0f3', color: '#414751', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>FİYATLANDIRMA</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 8 }}>
                Tek öğretmenden kampüse
              </h2>
              <p style={{ fontSize: 15, color: '#717882' }}>Kredi kartı gerekmez. İstediğiniz zaman iptal.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
              {plans.map((p) => (
                <div
                  key={p.name}
                  style={{
                    background: p.highlight ? '#1b75bc' : '#fff',
                    borderRadius: 14,
                    padding: '28px 24px',
                    border: p.highlight ? 'none' : '1px solid #e5e7eb',
                    boxShadow: p.highlight ? '0 8px 40px rgba(27,117,188,0.28)' : '0 1px 2px rgba(0,0,0,0.03)',
                    position: 'relative',
                  }}
                >
                  {p.highlight && (
                    <div style={{ position: 'absolute', top: -10, left: 20, background: '#fff', color: '#1b75bc', fontSize: 9, fontWeight: 800, letterSpacing: '0.05em', padding: '3px 10px', borderRadius: 999 }}>ÖNERİLEN</div>
                  )}
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: p.highlight ? 'rgba(255,255,255,0.55)' : '#9ca3af', marginBottom: 10 }}>{p.name.toUpperCase()}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: p.highlight ? '#fff' : '#1e1b1c', lineHeight: 1, marginBottom: 2 }}>{p.price}</div>
                  <div style={{ fontSize: 12, color: p.highlight ? 'rgba(255,255,255,0.6)' : '#9ca3af', marginBottom: 2 }}>{p.period}</div>
                  {p.sub && <div style={{ fontSize: 11, color: p.highlight ? 'rgba(255,255,255,0.35)' : '#d1d5db', marginBottom: 16 }}>{p.sub}</div>}
                  <hr style={{ border: 'none', borderTop: `1px solid ${p.highlight ? 'rgba(255,255,255,0.12)' : '#f0f0f0'}`, margin: '14px 0' }} />
                  <ul style={{ listStyle: 'none', padding: 0, marginBottom: 20 }}>
                    {p.features.map((f) => (
                      <li key={f} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: p.highlight ? 'rgba(255,255,255,0.82)' : '#414751' }}>
                        <CheckCircle2 style={{ width: 13, height: 13, color: p.highlight ? '#57dffe' : '#16a34a', flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                    {p.missing.map((f) => (
                      <li key={f} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: '#d1d5db' }}>
                        <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px solid #e5e7eb', flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={p.href}
                    style={{
                      display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none',
                      background: p.highlight ? '#fff' : '#f3f4f6',
                      color: p.highlight ? '#1b75bc' : '#414751',
                      border: p.highlight ? 'none' : '1px solid #e5e7eb',
                    }}
                  >
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kullanıcı yorumları */}
        <section style={{ background: '#fff', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div className="mb-11 text-center">
              <div className="mb-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold tracking-wide text-amber-600">ÖĞRETMEN GÖRÜŞLERİ</div>
              <h2 className="type-display tracking-tight text-slate-900">Öğretmenler ne diyor?</h2>
            </div>
            <BrainstormPlaceholder alan="Gerçek kullanıcı yorumları (beta kullanıcılarından toplanacak)" />
          </div>
        </section>

        {/* Öğrenci Katılım Rehberi */}
        <section id="ogrenci-katilim" className="border-t border-slate-100 bg-white py-16">
          <div className="mx-auto max-w-2xl px-4 text-center md:px-10">
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-3.5 py-1 text-[11px] font-bold tracking-wide text-green-600">
              <QrCode className="h-3.5 w-3.5" />
              ÖĞRENCİ KATILIM REHBERİ
            </div>
            <h2 className="type-display tracking-tight text-slate-900">
              Öğrenciniz sınıfa nasıl katılır?
            </h2>
            <p className="type-body mx-auto mt-3 max-w-md text-slate-500">
              QR kod veya katılım koduyla 30 saniyede sınıfa katılır — uygulama indirmeye gerek yok. Ekran görüntüleriyle adım adım rehberi görün.
            </p>
            <Link
              href="/nasil-calisir#sinif"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-bold text-white no-underline"
            >
              Adım adım rehberi gör <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ background: '#f9fafb', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.025em' }}>Sık Sorulan Sorular</h2>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faqs.map((faq, i) => (
                <details key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '16px 20px' }}>
                  <summary style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {faq.q}
                    <span style={{ color: '#9ca3af', fontSize: 18, userSelect: 'none' }}>+</span>
                  </summary>
                  <p style={{ fontSize: 13, color: '#414751', lineHeight: '20px', marginTop: 12, marginBottom: 0 }}>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#1b75bc 60%,#0ea5e9 100%)', padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, background: 'radial-gradient(circle,rgba(255,255,255,0.06),transparent 65%)', pointerEvents: 'none' }} />
          <div className="px-4 md:px-10" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <Zap style={{ width: 36, height: 36, color: '#57dffe', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
              Sınıfınızı dönüştürün, bugün
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', marginBottom: 36, lineHeight: '26px' }}>
              1 öğretmen, 10 öğrenci — kurulum 5 dakika. Kredi kartı gerekmez.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/kayit?tip=ogretmen"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1b75bc', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}
              >
                Ücretsiz Başla <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link
                href="/iletisim"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}
              >
                Demo Talep Et
              </Link>
            </div>
          </div>
        </section>

        {/* Footer */}
        <LandingFooter locale="tr" />

      </div>
    </>
  );
}
