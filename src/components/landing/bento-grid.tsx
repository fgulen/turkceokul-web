import { Link } from "@/navigation";
import {
  Sparkles, Heart, Flame, Zap, Trophy, Award, Users, BarChart3,
  Languages, Swords, Video, Smartphone, ArrowRight, FileSpreadsheet,
} from "lucide-react";
import { SegmentHighlight } from "./segment-switcher";
import { YakindaTrigger, YakindaBadge } from "./yakinda-sheet";
import { cn } from "@/lib/utils";

// Sabit demo veri — Tailwind'in statik tarama gereği yüzdeler build-time'da
// arbitrary-value class olarak yazılmalı (runtime-değişken değil, inline style yasak).
const ANALYTICS_BARS = [
  { h: "h-[40%]" }, { h: "h-[58%]" }, { h: "h-[45%]" }, { h: "h-[82%]" },
  { h: "h-[65%]" }, { h: "h-[92%]" }, { h: "h-[72%]" },
] as const;

const LEADERBOARD_BARS = [
  { w: "w-full", opacity: "opacity-100" },
  { w: "w-4/5", opacity: "opacity-70" },
  { w: "w-3/5", opacity: "opacity-45" },
] as const;

// ─── İçerik (TR / EN) ─────────────────────────────────────────────────────────

const C = {
  tr: {
    badge: "PLATFORM",
    h2: "Sınıfı geleceğe taşıyan araçlar",
    sub: "Öğretmen için AI stüdyo. Öğrenci için bağımlılık yaratan deneyim.",
    ai: {
      label: "AI STÜDYO",
      title: "30 Saniyede Sınav Üretin",
      desc: "Müfredatı siz belirleyin, yapay zeka etkinlikleri anında üretsin.",
      tags: ["Quiz Üretimi", "AI Seslendirme", "Boşluk Doldurma", "Kelime Listesi"],
      cta: "Öğretmenler için",
    },
    gam: {
      title: "Bağımlılık Yaratan Sistem",
      sub: "Duolingo mekanikleri, gerçek müfredat.",
      streak: "12 gün",
      combo: "5x COMBO",
      xp: "+240 XP",
    },
    kahoot: {
      title: "Kahoot Canlı Sınıf",
      desc: "Sınıfı ekrana bağlayın, herkes aynı anda yarışsın.",
      playerLabel: "Oyuncu",
    },
    lig: {
      title: "Lig Sistemi",
      desc: "Haftalık lig, 30 kişilik gruplar.",
      tiers: ["Bronz", "Gümüş", "Altın", "Taç"],
    },
    okuma: {
      title: "Okuma Kütüphanesi",
      desc: "Kelimeye dokun, anında çevirisini gör.",
      word: "kütüphane",
      translation: "library",
    },
    analitik: {
      title: "Öğretmen Analitiği",
      desc: "Ünite bazlı ilerleme, tek tıkla Excel raporu.",
      completionRate: "Tamamlanma oranı",
    },
    duello: { title: "1v1 Kelime Düellosu", desc: "Arkadaşınla gerçek zamanlı yarış." },
    canliSinif: { title: "Canlı Sınıf", desc: "Video ile senkron ders anlatımı." },
    mobil: { title: "Mobil Uygulama", desc: "iOS ve Android'de her yerde öğren." },
  },
  en: {
    badge: "PLATFORM",
    h2: "Tools that take the classroom to the future",
    sub: "An AI studio for teachers. An addictive experience for students.",
    ai: {
      label: "AI STUDIO",
      title: "Generate a Quiz in 30 Seconds",
      desc: "You set the curriculum, AI generates activities instantly.",
      tags: ["Quiz Generation", "AI Voiceover", "Gap Fill", "Word Lists"],
      cta: "For teachers",
    },
    gam: {
      title: "An Addictive System",
      sub: "Duolingo mechanics, real curriculum.",
      streak: "12 days",
      combo: "5x COMBO",
      xp: "+240 XP",
    },
    kahoot: {
      title: "Kahoot Live Class",
      desc: "Put the class on screen — everyone competes at once.",
      playerLabel: "Player",
    },
    lig: {
      title: "League System",
      desc: "Weekly league, groups of 30.",
      tiers: ["Bronze", "Silver", "Gold", "Crown"],
    },
    okuma: {
      title: "Reading Library",
      desc: "Tap a word, see the translation instantly.",
      word: "kütüphane",
      translation: "library",
    },
    analitik: {
      title: "Teacher Analytics",
      desc: "Progress per unit, one-click Excel export.",
      completionRate: "Completion rate",
    },
    duello: { title: "1v1 Word Duel", desc: "Compete with a friend in real time." },
    canliSinif: { title: "Live Class", desc: "Synchronous video lessons." },
    mobil: { title: "Mobile App", desc: "Learn Turkish on iOS and Android, anywhere." },
  },
} as const;

// Ortak kart kabuğu — ince border, hafif gölge, tutarlı radius
const CARD = "rounded-3xl border border-slate-200 bg-white p-6";

export function BentoGrid({ locale = "tr" }: { locale?: string }) {
  const t = locale === "en" ? C.en : C.tr;

  return (
    <section id="platform" className="bg-white py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-4 md:px-10">
        <div className="mb-14 text-center">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold tracking-[0.07em] text-slate-600">
            {t.badge}
          </div>
          <h2 className="type-display tracking-tight text-slate-900">{t.h2}</h2>
          <p className="type-body mx-auto mt-3 max-w-md text-slate-500">{t.sub}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:[grid-auto-flow:dense] lg:grid-cols-4">

          {/* 1. AI İçerik Stüdyosu — 2x2, koyu kart */}
          <SegmentHighlight
            when="ogretmen"
            className="lg:col-span-2 lg:row-span-2 rounded-3xl"
            activeClassName="ring-2 ring-primary ring-offset-2 ring-offset-white"
          >
            <div className="relative flex h-full flex-col overflow-hidden rounded-3xl bg-slate-900 p-7">
              <div className="pointer-events-none absolute -right-16 -top-16 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(87,223,254,0.14),transparent_65%)]" />
              <div className="pointer-events-none absolute -bottom-20 left-20 h-60 w-60 rounded-full bg-[radial-gradient(circle,rgba(104,51,209,0.10),transparent_65%)]" />

              <div className="relative mb-4 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#57dffe]/25 bg-[#57dffe]/10 px-3 py-1">
                <Sparkles className="h-3 w-3 text-[#57dffe]" />
                <span className="text-[10px] font-bold tracking-[0.07em] text-[#57dffe]">{t.ai.label}</span>
              </div>

              <h3 className="relative type-heading mb-2 tracking-tight text-white">{t.ai.title}</h3>
              <p className="relative mb-5 max-w-sm text-sm leading-6 text-white/50">{t.ai.desc}</p>

              {/* TODO: Task 5 screenshot — web/public/landing/ai-studio.png hazır olunca
                  next/image ile burada gösterilecek; o güne kadar CSS mockup (tag pilleri). */}
              <div className="relative mb-6 flex flex-1 flex-wrap items-start gap-1.5">
                {t.ai.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[#57dffe]/15 bg-[#57dffe]/[0.08] px-2.5 py-1 text-[10px] font-semibold text-[#57dffe]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <Link
                href={locale === "en" ? "/for-teachers" : "/ogretmenler"}
                className="relative inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-white"
              >
                {t.ai.cta} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </SegmentHighlight>

          {/* 2. Gamification — 1x2 dikey */}
          <SegmentHighlight when="ogrenci" className="lg:row-span-2 rounded-3xl">
            <div className={CARD + " flex h-full flex-col"}>
              <h3 className="type-title mb-1 tracking-tight text-slate-900">{t.gam.title}</h3>
              <p className="mb-5 text-sm text-slate-500">{t.gam.sub}</p>

              <div className="mb-5 flex items-center gap-1.5">
                {[true, true, true, true, false].map((filled, i) => (
                  <Heart
                    key={i}
                    className="h-5 w-5"
                    color={filled ? "#ef4444" : "#fecaca"}
                    fill={filled ? "#ef4444" : "#fecaca"}
                  />
                ))}
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2.5">
                <Flame className="h-4 w-4 flex-shrink-0 text-orange-500" />
                <span className="text-sm font-bold text-orange-700">{t.gam.streak}</span>
              </div>

              <div className="mb-4 flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5">
                <Zap className="h-4 w-4 flex-shrink-0 text-indigo-600" fill="#4f46e5" />
                <span className="text-sm font-bold text-indigo-700">{t.gam.combo}</span>
              </div>

              <div className="mt-auto flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <Trophy className="h-4 w-4 flex-shrink-0 text-amber-600" />
                <span className="text-sm font-bold text-amber-700">{t.gam.xp}</span>
              </div>
            </div>
          </SegmentHighlight>

          {/* 3. Kahoot Canlı Sınıf — 1x1 */}
          <div className={CARD}>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <h3 className="type-title mb-1 tracking-tight text-slate-900">{t.kahoot.title}</h3>
            <p className="mb-4 text-sm leading-5 text-slate-500">{t.kahoot.desc}</p>
            {/* Skor tablosu simülasyonu — gerçek/uydurma isim veya rakam yok, sadece görsel çubuklar. */}
            <ul className="space-y-2">
              {LEADERBOARD_BARS.map((bar, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="w-3.5 flex-shrink-0 text-[11px] font-bold text-slate-400">{i + 1}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn("h-full rounded-full bg-primary", bar.w, bar.opacity)} />
                  </div>
                  <span className="flex-shrink-0 text-[10px] font-semibold text-slate-400">{t.kahoot.playerLabel} {i + 1}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Lig sistemi — 1x1 */}
          <div className={CARD}>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
              <Award className="h-4 w-4 text-amber-600" />
            </div>
            <h3 className="type-title mb-1 tracking-tight text-slate-900">{t.lig.title}</h3>
            <p className="mb-4 text-sm leading-5 text-slate-500">{t.lig.desc}</p>
            <div className="flex flex-wrap gap-1.5">
              {t.lig.tiers.map((tier) => (
                <span
                  key={tier}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                >
                  {tier}
                </span>
              ))}
            </div>
          </div>

          {/* 5. Okuma Kütüphanesi — 1x1 */}
          <div className={CARD}>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-teal-100">
              <Languages className="h-4 w-4 text-teal-600" />
            </div>
            <h3 className="type-title mb-1 tracking-tight text-slate-900">{t.okuma.title}</h3>
            <p className="mb-4 text-sm leading-5 text-slate-500">{t.okuma.desc}</p>
            <div className="flex items-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 py-2.5">
              <span className="rounded border-b-2 border-teal-600 text-sm font-bold text-teal-700">{t.okuma.word}</span>
              <span className="text-xs text-teal-500">→ {t.okuma.translation}</span>
            </div>
          </div>

          {/* 6. Öğretmen analitiği — 1x1 */}
          <div className={CARD}>
            <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <h3 className="type-title mb-1 tracking-tight text-slate-900">{t.analitik.title}</h3>
            <p className="mb-3 text-sm leading-5 text-slate-500">{t.analitik.desc}</p>
            <div className="mb-2 flex h-12 items-end gap-1">
              {ANALYTICS_BARS.map((bar, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex-1 rounded-t-sm",
                    bar.h,
                    i === 3 || i === 5 ? "bg-primary" : "bg-blue-100"
                  )}
                />
              ))}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="inline-flex items-center gap-1"><FileSpreadsheet className="h-3 w-3" /> {t.analitik.completionRate}</span>
              <span className="font-bold text-primary">78% ↑</span>
            </div>
          </div>

          {/* 7. 1v1 Kelime Düellosu — Yakında */}
          <YakindaTrigger label={t.duello.title} className="relative">
            <div className={CARD + " opacity-70"}>
              <YakindaBadge locale={locale} />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100">
                <Swords className="h-4 w-4 text-orange-600" />
              </div>
              <h3 className="type-title mb-1 tracking-tight text-slate-900">{t.duello.title}</h3>
              <p className="text-sm leading-5 text-slate-500">{t.duello.desc}</p>
            </div>
          </YakindaTrigger>

          {/* 8. Canlı Sınıf — Yakında */}
          <YakindaTrigger label={t.canliSinif.title} className="relative">
            <div className={CARD + " opacity-70"}>
              <YakindaBadge locale={locale} />
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100">
                <Video className="h-4 w-4 text-rose-600" />
              </div>
              <h3 className="type-title mb-1 tracking-tight text-slate-900">{t.canliSinif.title}</h3>
              <p className="text-sm leading-5 text-slate-500">{t.canliSinif.desc}</p>
            </div>
          </YakindaTrigger>

          {/* 9. Mobil uygulama — Yakında, kapanış şeridi olarak tam genişlik (dense grid'de tek başına kalmasın) */}
          <YakindaTrigger label={t.mobil.title} className="relative lg:col-span-4">
            <div className={CARD + " flex items-center gap-4 opacity-70"}>
              <YakindaBadge locale={locale} />
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-violet-100">
                <Smartphone className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h3 className="type-title tracking-tight text-slate-900">{t.mobil.title}</h3>
                <p className="text-sm leading-5 text-slate-500">{t.mobil.desc}</p>
              </div>
            </div>
          </YakindaTrigger>

        </div>
      </div>
    </section>
  );
}
