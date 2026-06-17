import type { Metadata } from 'next';
import { Link } from '@/navigation';
import { LandingNav } from '@/components/landing-nav';
import { LandingFooter } from '@/components/landing-footer';
import {
  CheckCircle2, BookOpen, Zap, ArrowRight, Star,
  Flame, Heart, Trophy, Layers, ListChecks, PencilLine,
  Mic, Brain, MessageCircle,
} from 'lucide-react';

const BASE = 'https://turkceokulu.com';

export const metadata: Metadata = {
  title: 'Learn Turkish Online | Free CEFR Course A1–C1 — Türkçe Okulu',
  description:
    'Learn Turkish online with CEFR-aligned courses from A1 to C1. 53,000+ learners, 30+ countries. Real curriculum from Nevai Publishers + gamification. Start free.',
  keywords: [
    'learn Turkish online', 'Turkish language course', 'Turkish lessons online',
    'CEFR Turkish', 'free Turkish course', 'Turkish for beginners',
    'Turkish A1', 'Turkish B1', 'Turkish C1', 'Nevai publishers',
    'online Turkish classes',
  ],
  alternates: {
    canonical: `${BASE}/en/learn-turkish-online`,
    languages: {
      en: `${BASE}/en/learn-turkish-online`,
      tr: `${BASE}/tr/turkce-ogren`,
    },
  },
  openGraph: {
    title: 'Learn Turkish Online | Free CEFR Course — Türkçe Okulu',
    description: 'Learn Turkish online with CEFR-aligned courses from A1 to C1. 53,000+ learners.',
    url: `${BASE}/en/learn-turkish-online`,
    type: 'website',
    locale: 'en_GB',
    alternateLocale: ['tr_TR'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Learn Turkish Online — CEFR Courses',
  description: 'CEFR A1–C1 online Turkish language course series for international learners',
  url: `${BASE}/en/learn-turkish-online`,
  itemListElement: [
    { '@type': 'ListItem', position: 1, item: { '@type': 'Course', name: 'Turkish A1 — Beginner', description: 'Start from zero. Basic vocabulary, everyday expressions and simple dialogues.', provider: { '@type': 'Organization', name: 'Türkçe Okulu', url: BASE }, educationalLevel: 'A1', inLanguage: 'tr', isAccessibleForFree: true } },
    { '@type': 'ListItem', position: 2, item: { '@type': 'Course', name: 'Turkish A2 — Elementary', description: 'Shopping, directions, introductions. Everyday communication in Turkish.', provider: { '@type': 'Organization', name: 'Türkçe Okulu', url: BASE }, educationalLevel: 'A2', inLanguage: 'tr', isAccessibleForFree: true } },
    { '@type': 'ListItem', position: 3, item: { '@type': 'Course', name: 'Turkish B1 — Intermediate', description: 'Fluent Turkish in work and social settings. Tenses, conditionals, written communication.', provider: { '@type': 'Organization', name: 'Türkçe Okulu', url: BASE }, educationalLevel: 'B1', inLanguage: 'tr' } },
    { '@type': 'ListItem', position: 4, item: { '@type': 'Course', name: 'Turkish B2 — Upper Intermediate', description: 'Complex topics, academic writing, media language. Near-fluent communication.', provider: { '@type': 'Organization', name: 'Türkçe Okulu', url: BASE }, educationalLevel: 'B2', inLanguage: 'tr' } },
    { '@type': 'ListItem', position: 5, item: { '@type': 'Course', name: 'Turkish C1 — Advanced', description: 'Professional and academic Turkish. Nuanced expression, debate, literary texts.', provider: { '@type': 'Organization', name: 'Türkçe Okulu', url: BASE }, educationalLevel: 'C1', inLanguage: 'tr' } },
  ],
};

const cefrLevels = [
  { level: 'A1', name: 'Beginner', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', desc: 'Start from zero. Basic words, everyday expressions, simple dialogues.', free: true },
  { level: 'A2', name: 'Elementary', color: '#0891b2', bg: '#ecfeff', border: '#a5f3fc', desc: 'Shopping, directions, introductions. Everyday communication.', free: true },
  { level: 'B1', name: 'Intermediate', color: '#1b75bc', bg: '#eff6ff', border: '#bfdbfe', desc: 'Fluent Turkish in work and social contexts. Tenses and complex grammar.', free: false },
  { level: 'B2', name: 'Upper Intermediate', color: '#7c3aed', bg: '#f5f3ff', border: '#c4b5fd', desc: 'Complex topics, academic writing, media language.', free: false },
  { level: 'C1', name: 'Advanced', color: '#be185d', bg: '#fdf2f8', border: '#f9a8d4', desc: 'Professional and academic Turkish. Nuanced expression.', free: false },
  { level: 'C2', name: 'Mastery', color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb', desc: 'Coming soon. Literary Turkish and full fluency.', free: false, soon: true },
];

const activityTypes = [
  { icon: ListChecks, label: 'Multiple Choice', color: '#1b75bc', bg: '#eff6ff' },
  { icon: Zap, label: 'Quiz', color: '#ea580c', bg: '#fff7ed' },
  { icon: Layers, label: 'Word Matching', color: '#0d9488', bg: '#f0fdfa' },
  { icon: Brain, label: 'Smart Flashcards', color: '#7c3aed', bg: '#f5f3ff' },
  { icon: PencilLine, label: 'Fill in the Blank', color: '#1d4ed8', bg: '#eff6ff' },
  { icon: Mic, label: 'Listen & Write', color: '#d97706', bg: '#fffbeb' },
  { icon: MessageCircle, label: 'Sentence Builder', color: '#16a34a', bg: '#f0fdf4' },
  { icon: BookOpen, label: 'Reading & Comprehension', color: '#be185d', bg: '#fdf2f8' },
];

const faqs = [
  {
    q: 'Is Türkçe Okulu free?',
    a: 'Yes, the core content is free. A1 and A2 level activities are fully accessible without payment. A Premium plan unlocks all levels and features.',
  },
  {
    q: 'What level should I start at?',
    a: 'If you\'re completely new to Turkish, start at A1. After registering, a short placement test will suggest the right level for you.',
  },
  {
    q: 'How long does it take to learn Turkish?',
    a: 'With 15–20 minutes of daily study, most learners reach A2 in 3–4 months and B1 in 8–12 months. Turkish is a regular language — once you learn the patterns, progress accelerates.',
  },
  {
    q: 'Can I use Türkçe Okulu in my classroom?',
    a: 'Yes. Teachers can create classes for free, track student progress, run Kahoot-style live quizzes, and use the AI content studio to generate exercises. Contact us for institutional pricing.',
  },
  {
    q: 'Does Türkçe Okulu follow official CEFR standards?',
    a: 'Yes. All content aligns with the Common European Framework of Reference (CEFR), using the Nevai Publishers curriculum — a 25-year-old Turkish teaching institution.',
  },
];

export default function LearnTurkishOnlinePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div style={{ background: '#f9fafb', color: '#1e1b1c' }}>

        {/* Nav */}
        <LandingNav locale="en" alternateHref="/tr/turkce-ogren" links={[]} />

        {/* Hero */}
        <section style={{ background: 'linear-gradient(160deg, #eff6ff 0%, #fff 60%)', padding: '72px 0 60px' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dbeafe', color: '#1b75bc', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', padding: '4px 14px', borderRadius: 999, marginBottom: 20 }}>
              CEFR A1 → C1 · 53,000+ LEARNERS · 30+ COUNTRIES
            </div>
            <h1 style={{ fontSize: 'clamp(36px,6vw,64px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 20 }}>
              Learn Turkish Online,<br />
              <span style={{ color: '#1b75bc' }}>One Step at a Time</span>
            </h1>
            <p style={{ fontSize: 18, color: '#414751', maxWidth: 560, margin: '0 auto 36px', lineHeight: '28px' }}>
              Real curriculum from Nevai Publishers, with the addictive mechanics of Duolingo.
              Hearts, XP chains, daily streaks — learning becomes a habit.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link
                href="/kayit"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#1b75bc', color: '#fff', fontSize: 15, fontWeight: 700, padding: '14px 28px', borderRadius: 10, textDecoration: 'none' }}
              >
                Start Free <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link
                href="/giris"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#414751', fontSize: 15, fontWeight: 600, padding: '14px 28px', borderRadius: 10, textDecoration: 'none', border: '1px solid #e5e7eb' }}
              >
                Log In
              </Link>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 32, flexWrap: 'wrap' }}>
              {[
                { icon: Heart, label: '5 heart system', color: '#ef4444' },
                { icon: Flame, label: 'Daily streak', color: '#f97316' },
                { icon: Trophy, label: '10 league tiers', color: '#ca8a04' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#414751', fontWeight: 500 }}>
                  <Icon style={{ width: 16, height: 16, color }} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CEFR Levels */}
        <section style={{ background: '#fff', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={{ display: 'inline-flex', background: '#eef0f3', color: '#414751', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>CEFR LEVELS</div>
              <h2 style={{ fontSize: 'clamp(24px,3.5vw,40px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 10 }}>
                Which level do you want to reach?
              </h2>
              <p style={{ fontSize: 15, color: '#717882', maxWidth: 500, margin: '0 auto' }}>
                Structured content for every step, from absolute beginner to advanced.
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
                      FREE
                    </div>
                  )}
                  {l.soon && (
                    <div style={{ position: 'absolute', top: 14, right: 14, background: '#9ca3af', color: '#fff', fontSize: 9, fontWeight: 800, letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999 }}>
                      SOON
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

        {/* How it Works */}
        <section style={{ background: '#eff6ff', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <div style={{ display: 'inline-flex', background: '#dbeafe', color: '#1b75bc', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>HOW IT WORKS</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                Start learning Turkish in 3 steps
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 24 }}>
              {[
                { step: '1', title: 'Sign up, take the test', desc: 'Register for free and complete a short placement test. The system starts you at the right level.', color: '#1b75bc' },
                { step: '2', title: 'Study 10–15 min daily', desc: 'Small daily activities build real fluency. Hearts keep you careful. XP chains keep you motivated.', color: '#7c3aed' },
                { step: '3', title: 'Level up, earn certificates', desc: 'Pass the unit final exam, download your certificate. Real progress with a real curriculum.', color: '#16a34a' },
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

        {/* Activity Types */}
        <section style={{ background: '#fff', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ display: 'inline-flex', background: '#eef0f3', color: '#414751', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>ACTIVITY TYPES</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 8 }}>
                20+ learning formats
              </h2>
              <p style={{ fontSize: 15, color: '#717882', maxWidth: 480, margin: '0 auto' }}>
                Not just quizzes — listening, writing, matching, sequencing, memory games and more.
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

        {/* Why */}
        <section style={{ background: '#1e1b1c', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 900, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.025em', marginBottom: 10 }}>
                Why learn Turkish with us?
              </h2>
              <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.5)' }}>
                53,000+ learners&apos; choice since 2013.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: 14 }}>
              {[
                { title: 'Real curriculum', desc: 'Nevai Publishers book series — fully integrated with physical textbooks, CEFR-aligned.' },
                { title: 'Gamification', desc: 'Heart system, XP combo chains, daily streaks, weekly leagues — learning becomes addictive.' },
                { title: 'Classroom support', desc: 'Teachers can create classes, run live Kahoot-style quizzes and generate AI-powered exercises.' },
                { title: 'Multi-platform', desc: 'Full experience on web. Mobile app coming soon.' },
                { title: '30+ countries', desc: 'Iraq, Kazakhstan, Germany and beyond — a truly global learner community.' },
                { title: 'Personalised progress', desc: 'Smart flashcard algorithm surfaces the words you find most difficult.' },
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

        {/* Testimonials */}
        <section style={{ background: '#fff', padding: '72px 0' }}>
          <div className="px-4 md:px-10" style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <div style={{ display: 'inline-flex', background: '#fefce8', color: '#ca8a04', fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', padding: '4px 12px', borderRadius: 999, marginBottom: 12 }}>LEARNER REVIEWS</div>
              <h2 style={{ fontSize: 'clamp(22px,3vw,36px)', fontWeight: 800, letterSpacing: '-0.025em' }}>
                What learners say
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 16 }}>
              {[
                { name: 'Ahmed K.', country: 'Iraq', text: '15 minutes a day, A2 done in 3 months. The audio and picture activities are really helpful.', level: 'A2' },
                { name: 'Dmitri S.', country: 'Kazakhstan', text: 'The streak system keeps me coming back every day. Would love a mobile app too.', level: 'B1' },
                { name: 'Sarah M.', country: 'Germany', text: 'As a teacher, the AI quiz generator saves me hours every week. My students love it.', level: 'Teacher' },
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
                Frequently Asked Questions
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
              Start learning Turkish today
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', marginBottom: 36, lineHeight: '26px' }}>
              Free to sign up. No credit card needed. Begin at A1, reach C1.
            </p>
            <Link
              href="/kayit"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#fff', color: '#1b75bc', fontSize: 15, fontWeight: 700, padding: '14px 30px', borderRadius: 10, textDecoration: 'none' }}
            >
              Start Free <ArrowRight style={{ width: 16, height: 16 }} />
            </Link>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 20 }}>
              Already have an account? <Link href="/giris" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'underline' }}>Log in</Link>
            </p>
          </div>
        </section>

        {/* Footer */}
        <LandingFooter locale="en" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Home', item: `${BASE}/en` },
                { '@type': 'ListItem', position: 2, name: 'Learn Turkish Online', item: `${BASE}/en/learn-turkish-online` },
              ],
            }),
          }}
        />
      </div>
    </>
  );
}
