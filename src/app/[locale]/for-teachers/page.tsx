import type { Metadata } from 'next';
import { Link } from '@/navigation';
import { Logo } from '@/components/logo';
import {
  ArrowRight, CheckCircle2, Zap, Users, Brain,
  BarChart3, QrCode, FileDown, Sparkles, Star,
  MonitorPlay, BookOpen, Clock, Shield,
} from 'lucide-react';

const BASE = 'https://turkceokulu.com';

export const metadata: Metadata = {
  title: 'For Turkish Language Teachers | AI Studio + Live Quiz + Class Management — Türkçe Okulu',
  description:
    'AI-powered content generation, live Kahoot-style quizzes, class management and student analytics for Turkish language teachers. Generate exercises in 30 seconds. Free to start.',
  keywords: [
    'Turkish language teacher platform', 'teach Turkish online', 'Turkish class management',
    'AI quiz generator Turkish', 'Kahoot Turkish', 'Turkish teaching materials',
    'CEFR Turkish teacher', 'Turkish teacher tools', 'Nevai publishers teacher',
    'live Turkish quiz classroom',
  ],
  alternates: {
    canonical: `${BASE}/en/for-teachers`,
    languages: {
      en: `${BASE}/en/for-teachers`,
      tr: `${BASE}/tr/ogretmenler`,
    },
  },
  openGraph: {
    title: 'For Turkish Language Teachers | AI Studio + Live Quiz — Türkçe Okulu',
    description: 'AI content generation, live Kahoot-style quizzes, class management. Free to start.',
    url: `${BASE}/en/for-teachers`,
    type: 'website',
    locale: 'en_GB',
    alternateLocale: ['tr_TR'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'Türkçe Okulu — Institutional Pro Teacher Plan',
  description: 'AI-powered content generation, Kahoot-style live quizzes, class management and student analytics for Turkish language teachers.',
  url: `${BASE}/en/for-teachers`,
  brand: { '@type': 'Brand', name: 'Türkçe Okulu' },
  offers: [
    {
      '@type': 'Offer',
      name: 'Institutional Pro',
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
    title: 'AI Content Studio',
    desc: 'Generate quizzes, gap-fills and word lists in 30 seconds. Enter a topic, AI produces CEFR-appropriate exercises. You approve before it reaches students.',
    color: '#57dffe',
    bg: '#0a1628',
    highlight: true,
  },
  {
    icon: MonitorPlay,
    title: 'Live Kahoot-style Quiz',
    desc: 'Show a QR code on screen, students join on their phones. Real-time leaderboard, instant competition.',
    color: '#f97316',
    bg: '#fff7ed',
  },
  {
    icon: BarChart3,
    title: 'Student Analytics',
    desc: 'Which word trips up students? Which activity type works? Download to Excel, make data-driven decisions.',
    color: '#1b75bc',
    bg: '#eff6ff',
  },
  {
    icon: QrCode,
    title: 'QR Code Class Join',
    desc: 'Generate a 2-hour QR code. Students scan it and join instantly. No activation codes to manage.',
    color: '#7c3aed',
    bg: '#f5f3ff',
  },
  {
    icon: FileDown,
    title: 'Excel Report Export',
    desc: 'Completion rates, error analysis and student scores by class — one click to Excel.',
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  {
    icon: Brain,
    title: 'Reading → Vocabulary → Quiz',
    desc: 'Words students look up while reading are automatically flagged. One click to generate an AI quiz.',
    color: '#be185d',
    bg: '#fdf2f8',
  },
];

const steps = [
  { step: '1', title: 'Open an account, create a class', desc: 'Free institutional account in 5 minutes. First class of 10 students is free.', color: '#1b75bc' },
  { step: '2', title: 'Add students via QR', desc: 'Show the QR on the board or projector. Students scan with their phones.', color: '#7c3aed' },
  { step: '3', title: 'Generate material with AI', desc: 'Enter a topic or word list. Quiz ready in 30 seconds. Approve, send to class.', color: '#ea580c' },
  { step: '4', title: 'Run a live quiz', desc: 'Kahoot-style — real-time leaderboard, instant competition excitement.', color: '#16a34a' },
];

const plans = [
  {
    name: 'Starter',
    price: 'Free',
    period: 'Forever',
    features: ['1 class, 10 students', 'Core activities', 'QR join', 'Basic analytics'],
    missing: ['AI Content Studio', 'Live Kahoot', 'Excel export'],
    cta: 'Start Free',
    href: '/kayit?tip=ogretmen',
    highlight: false,
  },
  {
    name: 'Institutional Pro',
    price: '€20',
    period: 'teacher / month',
    sub: '+ student licences',
    features: ['Unlimited classes & students', 'AI Content Studio', 'Live Kahoot mode', 'Excel report export', 'Full analytics dashboard', '10 student licences included'],
    missing: [],
    cta: 'Try Free',
    href: '/kayit?tip=kurumsal-pro',
    highlight: true,
  },
  {
    name: 'Campus',
    price: 'Custom',
    period: 'contact us',
    features: ['Everything in Pro', 'Unlimited teachers', 'Textbook code bundles', 'Priority support', 'Custom integration'],
    missing: [],
    cta: 'Get in Touch',
    href: '/iletisim',
    highlight: false,
  },
];

const faqs = [
  { q: 'Is the institutional account free?', a: 'Yes. 1 class and 10 students can be used for free indefinitely. Upgrade to Institutional Pro when you need more classes and students.' },
  { q: 'What languages does the AI Content Studio support?', a: 'It is optimised for Turkish content. Enter a topic in Turkish and it generates CEFR-appropriate quizzes, gap-fills and word lists.' },
  { q: 'How many students can join a live quiz at once?', a: 'Up to 50 students simultaneously on the Institutional Pro plan. The limit is removed on the Campus plan.' },
  { q: 'How does integration with Nevai Publishers textbooks work?', a: 'Textbook activation codes give students 6 months of premium access. From the teacher panel you can filter content by the book your class is using.' },
  { q: 'Is student data secure? Is it GDPR compliant?', a: 'Yes. The platform is UK-based and subject to GDPR. Student data is never shared with third parties. Data deletion requests are fulfilled within 30 days.' },
];

export default function ForTeachersPage() {
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
              { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/en` },
              { '@type': 'ListItem', position: 2, name: 'For Teachers', item: `${BASE}/en/for-teachers` },
            ],
          }),
        }}
      />

      <div style={{ background: '#f9fafb', color: '#1e1b1c' }}>

        {/* Nav */}
        <nav className="sticky top-0 z-50" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', borderBottom: '1px solid rgba(192,199,210,0.35)' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: '0 auto', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <Logo size="md" />
            </Link>
            <div className="hidden md:flex" style={{ alignItems: 'center', gap: 28 }}>
              <Link href="/learn-turkish-online" style={{ fontSize: 14, fontWeight: 500, color: '#414751', textDecoration: 'none' }}>Students</Link>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#1b75bc' }}>Teachers</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/giris" className="hidden md:block" style={{ fontSize: 14, fontWeight: 500, color: '#414751', textDecoration: 'none' }}>Log In</Link>
              <Link href="/kayit?tip=ogretmen" style={{ background: '#1b75bc', color: '#fff', fontSize: 13, fontWeight: 600, padding: '8px 18px', borderRadius: 8, textDecoration: 'none' }}>Try Free</Link>
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e3a5f 50%,#1b75bc 100%)', padding: '80px 0 72px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -120, right: -80, width: 500, height: 500, background: 'radial-gradient(circle,rgba(87,223,254,0.10),transparent 65%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -40, width: 360, height: 360, background: 'radial-gradient(circle,rgba(104,51,209,0.10),transparent 65%)', pointerEvents: 'none' }} />
          <div className="px-4 md:px-10" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(87,223,254,0.12)', border: '1px solid rgba(87,223,254,0.22)', color: '#57dffe', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', padding: '4px 14px', borderRadius: 999, marginBottom: 20 }}>
              TEACHERS&apos; CHOICE · 30+ COUNTRIES
            </div>
            <h1 style={{ fontSize: 'clamp(34px,5.5vw,60px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', marginBottom: 20 }}>
              Give Turkish Teachers<br />
              <span style={{ color: '#57dffe' }}>a Superpower</span>
            </h1>
            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.72)', maxWidth: 560, margin: '0 auto 40px', lineHeight: '28px' }}>
              Generate quizzes with AI in 30 seconds. Run live Kahoot quizzes.
              Track student progress. All from one dashboard.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/kayit?tip=ogretmen" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1b75bc', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}>
                Start Free <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <a href="#features" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}>
                See Features
              </a>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 40, flexWrap: 'wrap' }}>
              {[
                { val: '30 sec', label: 'Quiz generation time' },
                { val: '50', label: 'Live students / quiz' },
                { val: '20+', label: 'Activity types' },
              ].map((s) => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{ background: '#fff', padding: '80px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ display: 'inline-flex', background: '#eef0f3', color: '#414751', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>FEATURES</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,42px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 10 }}>
                Built for Turkish language teaching
              </h2>
              <p style={{ fontSize: 16, color: '#717882', maxWidth: 480, margin: '0 auto' }}>
                From lesson prep to live class, from reporting to AI generation — full cycle.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 16 }}>
              {features.map((f) => (
                <div
                  key={f.title}
                  style={{
                    background: f.bg,
                    border: f.highlight ? '1px solid rgba(87,223,254,0.2)' : '1px solid #e5e7eb',
                    borderRadius: 16,
                    padding: '28px 24px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  {f.highlight && (
                    <>
                      <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'radial-gradient(circle,rgba(87,223,254,0.08),transparent 65%)', pointerEvents: 'none' }} />
                      <div style={{ position: 'absolute', top: 10, right: 14, background: 'rgba(87,223,254,0.15)', color: '#57dffe', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999 }}>AI POWERED</div>
                    </>
                  )}
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: f.highlight ? 'rgba(87,223,254,0.10)' : f.bg, border: `1px solid ${f.highlight ? 'rgba(87,223,254,0.2)' : 'rgba(0,0,0,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <f.icon style={{ width: 20, height: 20, color: f.color }} />
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8, color: f.highlight ? '#fff' : '#1e1b1c' }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: f.highlight ? 'rgba(255,255,255,0.6)' : '#717882', lineHeight: '20px' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it Works */}
        <section style={{ background: '#eff6ff', padding: '80px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ display: 'inline-flex', background: '#dbeafe', color: '#1b75bc', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>HOW IT WORKS</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                First live quiz in 15 minutes
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 20 }}>
              {steps.map((s) => (
                <div key={s.step} style={{ background: '#fff', borderRadius: 14, padding: '24px 20px', textAlign: 'center', border: '1px solid #e5e7eb' }}>
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

        {/* AI Studio Demo */}
        <section style={{ background: '#1e1b1c', padding: '80px 0', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 500, height: 500, background: 'radial-gradient(circle,rgba(87,223,254,0.07),transparent 65%)', pointerEvents: 'none' }} />
          <div className="px-4 md:px-10" style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
            <div style={{ display: 'grid', gap: 48, alignItems: 'center' }} className="grid grid-cols-1 md:grid-cols-2">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(87,223,254,0.10)', border: '1px solid rgba(87,223,254,0.20)', color: '#57dffe', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 20 }}>
                  <Sparkles style={{ width: 10, height: 10 }} /> AI STUDIO
                </div>
                <h2 style={{ fontSize: 'clamp(24px,3vw,38px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 16 }}>
                  Cut lesson prep to 30 seconds
                </h2>
                <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', lineHeight: '24px', marginBottom: 24 }}>
                  Enter a topic or paste a word list. AI generates CEFR-appropriate quizzes, gap-fills or word-matching exercises. Edit, approve, send to class.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { icon: Clock, text: 'Material ready in 30 seconds' },
                    { icon: Shield, text: 'Nothing reaches students without teacher approval' },
                    { icon: BookOpen, text: 'Content aligned to book curriculum' },
                    { icon: Users, text: 'Send to class or launch as Kahoot' },
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
              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px', fontFamily: 'monospace' }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {['#ef4444', '#facc15', '#22c55e'].map((c) => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>// AI Content Studio</div>
                <div style={{ background: 'rgba(87,223,254,0.05)', border: '1px solid rgba(87,223,254,0.12)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 4 }}>TOPIC</div>
                  <div style={{ fontSize: 13, color: '#fff' }}>Turkish geography, B1 level, 10 questions</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
                  <div style={{ fontSize: 10, color: '#57dffe', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Sparkles style={{ width: 10, height: 10 }} /> generating…
                  </div>
                  <div style={{ height: 1, flex: 1, background: 'rgba(255,255,255,0.08)' }} />
                </div>
                {['Which continent is Istanbul on?', 'What is the capital of Türkiye?', 'Which provinces are on the Aegean coast?'].map((q, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 10, color: '#57dffe', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>Q{i + 1}</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: '18px' }}>{q}</span>
                  </div>
                ))}
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <button style={{ flex: 1, background: '#1b75bc', color: '#fff', border: 'none', borderRadius: 7, padding: '8px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Approve →</button>
                  <button style={{ flex: 1, background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '8px 0', fontSize: 11, cursor: 'pointer' }}>Edit</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section style={{ background: '#f9fafb', padding: '80px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', background: '#eef0f3', color: '#414751', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>PRICING</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,38px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 8 }}>From one teacher to an entire campus</h2>
              <p style={{ fontSize: 15, color: '#717882' }}>No credit card needed. Cancel any time.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
              {plans.map((p) => (
                <div key={p.name} style={{ background: p.highlight ? '#1b75bc' : '#fff', borderRadius: 14, padding: '28px 24px', border: p.highlight ? 'none' : '1px solid #e5e7eb', boxShadow: p.highlight ? '0 8px 40px rgba(27,117,188,0.28)' : '0 1px 2px rgba(0,0,0,0.03)', position: 'relative' }}>
                  {p.highlight && <div style={{ position: 'absolute', top: -10, left: 20, background: '#fff', color: '#1b75bc', fontSize: 9, fontWeight: 800, letterSpacing: '0.05em', padding: '3px 10px', borderRadius: 999 }}>RECOMMENDED</div>}
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
                  <Link href={p.href} style={{ display: 'block', textAlign: 'center', padding: '10px 0', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', background: p.highlight ? '#fff' : '#f3f4f6', color: p.highlight ? '#1b75bc' : '#414751', border: p.highlight ? 'none' : '1px solid #e5e7eb' }}>
                    {p.cta}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ background: '#fff', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ display: 'inline-flex', background: '#fefce8', color: '#ca8a04', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>TEACHER REVIEWS</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.025em' }}>What teachers say</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
              {[
                { name: 'Fatma H.', country: 'Türkiye — Ankara', text: 'The AI quiz generator is incredible. A 40-question exam ready in 2 minutes. Students absolutely love Kahoot mode.', role: 'Turkish Teacher' },
                { name: 'Layla M.', country: 'UAE — Dubai', text: 'The Excel report is perfect for presenting to management. I can see at a glance where each student is struggling.', role: 'Language Coordinator' },
                { name: 'Dmitri K.', country: 'Kazakhstan — Almaty', text: 'The QR code join system transformed classroom management. No setup — we used it straight away.', role: 'Turkish Teacher' },
              ].map((r) => (
                <div key={r.name} style={{ background: '#f9fafb', borderRadius: 12, padding: '22px', border: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map((i) => <Star key={i} style={{ width: 13, height: 13, fill: '#facc15', color: '#facc15' }} />)}
                  </div>
                  <p style={{ fontSize: 13, color: '#414751', lineHeight: '20px', marginBottom: 16 }}>&ldquo;{r.text}&rdquo;</p>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{r.role} — {r.country}</div>
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
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.025em' }}>Frequently Asked Questions</h2>
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
              Transform your classroom, today
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', marginBottom: 36, lineHeight: '26px' }}>
              1 teacher, 10 students — up and running in 5 minutes. No credit card needed.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/kayit?tip=ogretmen" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1b75bc', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}>
                Start Free <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link href="/iletisim" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.22)', color: '#fff', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}>
                Request a Demo
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
