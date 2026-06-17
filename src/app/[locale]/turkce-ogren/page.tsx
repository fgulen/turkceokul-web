import type { Metadata } from 'next';
import { Link } from '@/navigation';
import { LandingNav } from '@/components/landing-nav';
import { LandingFooter } from '@/components/landing-footer';
import {
  CheckCircle2, BookOpen, Zap, Users, ArrowRight, Star,
  Flame, Heart, Trophy, Layers, ListChecks, PencilLine,
  Mic, Brain, MessageCircle,
} from 'lucide-react';

const BASE = 'https://turkceokulu.com';

export const metadata: Metadata = {
  title: 'Türkçe Öğren | Ücretsiz Online Türkçe Kursu A1–C1 — Türkçe Okulu',
  description:
    'CEFR A1\'den C1\'e online Türkçe öğrenin. 53.000+ öğrenci, 30+ ülke, Nevai Yayınları müfredatı. Gamification + gerçek içerik. Ücretsiz başlayın.',
  keywords: [
    'türkçe öğren', 'online türkçe kursu', 'türkçe öğrenme',
    'türkçe dil kursu', 'cefr türkçe', 'yabancılara türkçe öğretimi',
    'türkçe a1', 'türkçe b1', 'türkçe c1', 'nevai yayınları',
  ],
  alternates: {
    canonical: `${BASE}/tr/turkce-ogren`,
    languages: {
      tr: `${BASE}/tr/turkce-ogren`,
      en: `${BASE}/en/learn-turkish-online`,
    },
  },
  openGraph: {
    title: 'Türkçe Öğren | Ücretsiz Online Türkçe Kursu — Türkçe Okulu',
    description: 'CEFR A1\'den C1\'e ücretsiz online Türkçe öğrenin. 53.000+ öğrenci.',
    url: `${BASE}/tr/turkce-ogren`,
    type: 'website',
    locale: 'tr_TR',
    alternateLocale: ['en_GB'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Türkçe Öğren — CEFR Kursları',
  description: 'Yabancılara Türkçe öğretimi için CEFR A1–C1 online kurs serisi',
  url: `${BASE}/tr/turkce-ogren`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, item: { '@type': 'Course', name: 'Türkçe A1 — Başlangıç', description: 'Sıfırdan Türkçe öğrenmeye başlayın. Temel kelimeler, gündelik ifadeler ve basit diyaloglar.', provider: { '@type': 'Organization', name: 'Türkçe Okulu', url: BASE }, educationalLevel: 'A1', inLanguage: 'tr', isAccessibleForFree: true } },
    { '@type': 'ListItem', position: 2, item: { '@type': 'Course', name: 'Türkçe A2 — Temel', description: 'Temel gündelik konuşmalar ve yazışmalar. Alışveriş, yol tarifi, tanışma.', provider: { '@type': 'Organization', name: 'Türkçe Okulu', url: BASE }, educationalLevel: 'A2', inLanguage: 'tr', isAccessibleForFree: true } },
    { '@type': 'ListItem', position: 3, item: { '@type': 'Course', name: 'Türkçe B1 — Orta', description: 'İş hayatı ve sosyal ortamlarda Türkçe. Geniş zaman, koşul cümleleri, yazılı iletişim.', provider: { '@type': 'Organization', name: 'Türkçe Okulu', url: BASE }, educationalLevel: 'B1', inLanguage: 'tr' } },
    { '@type': 'ListItem', position: 4, item: { '@type': 'Course', name: 'Türkçe B2 — Orta-İleri', description: 'Karmaşık konular, akademik yazım, medya ve kültür. Akıcı iletişim.', provider: { '@type': 'Organization', name: 'Türkçe Okulu', url: BASE }, educationalLevel: 'B2', inLanguage: 'tr' } },
    { '@type': 'ListItem', position: 5, item: { '@type': 'Course', name: 'Türkçe C1 — İleri', description: 'Akademik ve profesyonel Türkçe. Nüanslı ifadeler, edebi metinler, tartışma.', provider: { '@type': 'Organization', name: 'Türkçe Okulu', url: BASE }, educationalLevel: 'C1', inLanguage: 'tr' } },
  ],
};

const cefrLevels = [
  { level: 'A1', name: 'Başlangıç', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Sıfırdan başla. Temel kelimeler, gündelik ifadeler, basit diyaloglar.', free: true },
  { level: 'A2', name: 'Temel', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', desc: 'Alışveriş, yol tarifi, tanışma. Gündelik hayat iletişimi.', free: true },
  { level: 'B1', name: 'Orta', color: '#1b75bc', bg: '#eff6ff', border: '#bfdbfe', desc: 'İş ve sosyal ortamlarda akıcı Türkçe. Geniş zaman ve koşullar.', free: false },
  { level: 'B2', name: 'Orta-İleri', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', desc: 'Karmaşık konular, akademik yazım, medya dili.', free: false },
  { level: 'C1', name: 'İleri', color: '#be185d', bg: '#fdf2f8', border: '#f9a8d4', desc: 'Profesyonel ve akademik Türkçe. Nüanslı ifadeler, tartışma.', free: false },
  { level: 'C2', name: 'Ustalık', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', desc: 'Yakında. Edebi Türkçe ve tam akıcılık.', free: false, soon: true },
];

const activityTypes = [
  { icon: ListChecks, label: 'Çoktan Seçmeli', color: '#1b75bc', bg: '#eff6ff' },
  { icon: Zap, label: 'Quiz', color: '#ea580c', bg: '#fff7ed' },
  { icon: Layers, label: 'Kelime Eşleştir', color: '#0d9488', bg: '#f0fdfa' },
  { icon: Brain, label: 'Akıllı Kart', color: '#7c3aed', bg: '#f5f3ff' },
  { icon: PencilLine, label: 'Boşluk Doldurma', color: '#1d4ed8', bg: '#eff6ff' },
  { icon: Mic, label: 'Sesi Dinle & Yaz', color: '#d97706', bg: '#fffbeb' },
  { icon: MessageCircle, label: 'Cümle Kurma', color: '#16a34a', bg: '#f0fdf4' },
  { icon: BookOpen, label: 'Okuma & Anlama', color: '#be185d', bg: '#fdf2f8' },
];

const faqs = [
  {
    q: 'Türkçe Okulu ücretsiz mi?',
    a: 'Evet, temel içerikler ücretsizdir. A1 ve A2 seviyelerindeki etkinliklere ücretsiz erişebilirsiniz. Premium plan ile tüm seviyelerin kilidini açabilirsiniz.',
  },
  {
    q: 'Hangi seviyeden başlamalıyım?',
    a: 'Türkçeye hiç başlamadıysanız A1\'den başlayın. Platforma kayıt olduktan sonra kısa bir seviye testi ile size en uygun noktadan başlayabilirsiniz.',
  },
  {
    q: 'Türkçe Okulu CEFR sertifikası veriyor mu?',
    a: 'Her ünite tamamlandığında sertifika indirebilirsiniz. Bu sertifikalar resmi CEFR belgesi değil, öğrenme kaydınızın dijital kanıtıdır. Resmi CEFR sınavları için Yunus Emre Enstitüsü\'ne yönlendirilirsiniz.',
  },
  {
    q: 'Hangi dillerde arayüz var?',
    a: 'Şu an Türkçe ve İngilizce. Arapça ve Rusça arayüz hazırlık aşamasındadır.',
  },
  {
    q: 'Kurumlar ve okullar Türkçe Okulu\'nu nasıl kullanabilir?',
    a: 'Öğretmenler ücretsiz kurumsal hesap açarak sınıf oluşturabilir, öğrenci ilerlemesini takip edebilir ve AI destekli quiz üretebilir. Kurumsal lisans için iletişime geçin.',
  },
];

export default function TurkceOgrenPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ background: '#f9fafb', color: '#1e1b1c' }}>

        {/* Nav */}
        <LandingNav locale="tr" alternateHref="/en/learn-turkish-online" links={[]} />

        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg, #eff6ff 0%, #fff 60%)', padding: '72px 0 60px' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dbeafe', color: '#1b75bc', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', padding: '4px 14px', borderRadius: 999, marginBottom: 20 }}>
              CEFR A1 → C1 · 53.000+ ÖĞRENCİ · 30+ ÜLKE
            </div>
            <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
              Türkçe Öğren,<br />
              <span style={{ color: '#1b75bc' }}>Her Gün Bir Adım İlerle</span>
            </h1>
            <p style={{ fontSize: 18, color: '#414751', maxWidth: 560, margin: '0 auto 36px', lineHeight: '28px' }}>
              Nevai Yayınları&apos;nın gerçek müfredatı, Duolingo&apos;nun bağımlılık yaratan mekanizmaları.
              Kalp sistemi, XP zinciri, günlük seri — öğrenmek bir alışkanlığa dönüşür.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/kayit"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1b75bc', color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}
              >
                Ücretsiz Başla <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link
                href="/giris"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#414751', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', border: '1px solid #e5e7eb' }}
              >
                Giriş Yap
              </Link>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
              {[
                { icon: Heart, label: '5 kalp sistemi', color: '#ef4444' },
                { icon: Flame, label: 'Günlük seri', color: '#f97316' },
                { icon: Trophy, label: '10 lig seviyesi', color: '#ca8a04' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#414751', fontWeight: 500 }}>
                  <Icon style={{ width: 16, height: 16, color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CEFR Seviyeleri */}
        <section style={{ background: '#fff', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', background: '#eef0f3', color: '#414751', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>CEFR SEVİYELERİ</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 10 }}>
                Hangi seviyede Türkçe öğrenmek istiyorsunuz?
              </h2>
              <p style={{ fontSize: 15, color: '#717882', maxWidth: 500, margin: '0 auto' }}>
                Sıfırdan ileri seviyeye kadar her adım için yapılandırılmış içerik.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
              {cefrLevels.map((l) => (
                <div
                  key={l.level}
                  style={{
                    background: l.bg,
                    border: `1.5px solid ${l.border}`,
                    borderRadius: 14,
                    padding: '24px 22px',
                    position: 'relative',
                    opacity: l.soon ? 0.65 : 1,
                  }}
                >
                  {l.free && (
                    <div style={{ position: 'absolute', top: 14, right: 14, background: '#16a34a', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999 }}>
                      ÜCRETSİZ
                    </div>
                  )}
                  {l.soon && (
                    <div style={{ position: 'absolute', top: 14, right: 14, background: '#9ca3af', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999 }}>
                      YAKINDA
                    </div>
                  )}
                  <div style={{ fontSize: 28, fontWeight: 900, color: l.color, lineHeight: 1, marginBottom: 4 }}>{l.level}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#1e1b1c', marginBottom: 10 }}>{l.name}</div>
                  <p style={{ fontSize: 13, color: '#414751', lineHeight: '20px', marginBottom: 0 }}>{l.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Nasıl Çalışır */}
        <section style={{ background: '#eff6ff', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ display: 'inline-flex', background: '#dbeafe', color: '#1b75bc', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>NASIL ÇALIŞIR</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                3 adımda Türkçe öğrenmeye başla
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24 }}>
              {[
                {
                  step: '1',
                  title: 'Kayıt ol, seviyeni belirle',
                  desc: 'Ücretsiz kaydol ve kısa bir seviye testi yap. Sistem seni doğru noktadan başlatır.',
                  color: '#1b75bc',
                },
                {
                  step: '2',
                  title: 'Günde 10–15 dakika çalış',
                  desc: 'Her gün küçük etkinliklerle ilerle. Kalp sistemin seni dikkatli tutar, XP zinciri motive eder.',
                  color: '#7c3aed',
                },
                {
                  step: '3',
                  title: 'Seviye atla, sertifika al',
                  desc: 'Ünite finalini geç, dijital sertifikanı indir. Gerçek kitap içeriğiyle gerçek ilerleme.',
                  color: '#16a34a',
                },
              ].map((s) => (
                <div key={s.step} style={{ background: '#fff', borderRadius: 14, padding: '28px 24px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, background: s.color, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 20, fontWeight: 900, color: '#fff' }}>
                    {s.step}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                  <p style={{ fontSize: 13, color: '#717882', lineHeight: '20px' }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Etkinlik Tipleri */}
        <section style={{ background: '#fff', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ display: 'inline-flex', background: '#eef0f3', color: '#414751', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>ETKİNLİK TİPLERİ</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 8 }}>
                20+ farklı öğrenme formatı
              </h2>
              <p style={{ fontSize: 15, color: '#717882', maxWidth: 480, margin: '0 auto' }}>
                Tek tip quiz değil — dinleme, yazma, eşleştirme, sıralama, hafıza oyunu ve daha fazlası.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4" style={{ gap: 10 }}>
              {activityTypes.map(({ icon: Icon, label, color, bg }) => (
                <div key={label} style={{ background: bg, borderRadius: 10, padding: '18px 14px', textAlign: 'center', border: '1px solid rgba(0,0,0,0.06)' }}>
                  <Icon style={{ width: 22, height: 22, color, margin: '0 auto 8px' }} />
                  <div style={{ fontSize: 12, fontWeight: 600, color }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Özellikler */}
        <section style={{ background: '#1e1b1c', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', marginBottom: 10 }}>
                Neden Türkçe Okulu?
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>
                2013&apos;ten bu yana 53.000+ öğrencinin tercihi.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
              {[
                { title: 'Gerçek Müfredat', desc: 'Nevai Yayınları kitap serisi — fiziksel kitapla tam entegre, CEFR uyumlu.' },
                { title: 'Gamification', desc: 'Kalp sistemi, XP combo zinciri, günlük seri, haftalık lig — öğrenmek bağımlılık yaratır.' },
                { title: 'Sınıf Desteği', desc: 'Öğretmenler sınıf oluşturabilir, Kahoot tarzı canlı quiz yapabilir, AI ile içerik üretebilir.' },
                { title: 'Çoklu Platform', desc: 'Web\'de tam deneyim. Mobil uygulama yakında.' },
                { title: '30+ Ülke', desc: 'Irak, Kazakistan, Almanya başta olmak üzere küresel kullanıcı tabanı.' },
                { title: 'Kişisel İlerleme', desc: 'Akıllı kart algoritması en çok zorluk çektiğin kelimeleri öne çıkarır.' },
              ].map((f) => (
                <div key={f.title} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '18px 20px', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <CheckCircle2 style={{ width: 18, height: 18, color: '#57dffe', flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{f.title}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: '18px' }}>{f.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kullanıcı Yorumları */}
        <section style={{ background: '#fff', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ display: 'inline-flex', background: '#fefce8', color: '#ca8a04', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>KULLANICI GÖRÜŞLERİ</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                Türkçe öğrenenler ne diyor?
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
              {[
                { name: 'Ahmed K.', country: 'Irak', text: 'Her gün 15 dakika çalışıyorum, 3 ayda A2 bitti. Ses ve resimli etkinlikler çok faydalı.', level: 'A2' },
                { name: 'Dmitri S.', country: 'Kazakistan', text: 'Streak sistemi beni her gün çalıştırıyor. Uygulama da olsa süper olur.', level: 'B1' },
                { name: 'Layla M.', country: 'BAE', text: 'Öğretmen olarak AI quiz üretimi inanılmaz zaman kazandırıyor. Öğrencilerim de çok sevdi.', level: 'Öğretmen' },
              ].map((r) => (
                <div key={r.name} style={{ background: '#f9fafb', borderRadius: 12, padding: '22px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} style={{ width: 14, height: 14, fill: '#facc15', color: '#facc15' }} />
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: '#414751', lineHeight: '20px', marginBottom: 16 }}>&ldquo;{r.text}&rdquo;</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                      <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.country}</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, background: '#eff6ff', color: '#1b75bc', padding: '3px 8px', borderRadius: 999 }}>
                      {r.level}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ background: '#f9fafb', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                Sık Sorulan Sorular
              </h2>
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
        <section style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#1b75bc 60%,#0ea5e9 100%)', padding: '80px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(26px,3.5vw,44px)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15, marginBottom: 16 }}>
              Bugün Türkçe öğrenmeye başla
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', marginBottom: 36, lineHeight: '26px' }}>
              Ücretsiz kayıt. Kredi kartı gerekmez. A1&apos;den başla, C1&apos;e ulaş.
            </p>
            <Link
              href="/kayit"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1b75bc', fontSize: 15, fontWeight: 700, padding: '14px 30px', borderRadius: 10, textDecoration: 'none' }}
            >
              Ücretsiz Kaydol <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 20 }}>
              Zaten hesabın var mı? <Link href="/giris" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'underline' }}>Giriş yap</Link>
            </p>
          </div>
        </section>

        {/* Footer */}
        <LandingFooter locale="tr" />

        {/* Schema.org iç link breadcrumb */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Ana Sayfa', item: `${BASE}/tr` },
                { '@type': 'ListItem', position: 2, name: 'Türkçe Öğren', item: `${BASE}/tr/turkce-ogren` },
              ],
            }),
          }}
        />
      </div>
    </>
  );
}
