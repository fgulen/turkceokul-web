"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight, Zap, BookOpen } from "lucide-react";
import { SegmentSwitcher, useSegment, type Segment } from "./landing/segment-switcher";

// Statik hero görseli (video yerine — Irak/Kazakistan mobil ağlarında LCP koruması).
// Kaynak: kullanıcının ürettiği hero.png (2 MB) → ffmpeg ile 1600px/133 KB'a indirildi.
const HERO_IMAGE_SRC = "/hero-optimized.jpg";

const HERO_TEXT = {
  tr: {
    badge: "NEVAİ YAYINLARI — A1'DEN C1'E",
    h1a: "Türkçe Eğitimini",
    h1b: "Yeniden Tasarladık.",
    segments: {
      ogrenci: {
        subtitle: "Okudukça puan toplayın, liglerde yükselin ve arkadaşlarınızla kıyasıya yarışarak Türkçenizi geliştirin.",
        ctaLabel: "Ücretsiz Başla",
        ctaHref: "/kayit?tip=bireysel",
      },
      ogretmen: {
        subtitle: "Yapay zeka destekli stüdyomuzla kitap içeriklerinden saniyeler içinde quizler ve çalışma yaprakları hazırlayın.",
        ctaLabel: "Okulunuz için Ücretsiz Başla",
        ctaHref: "/kayit?tip=kurumsal",
      },
    } satisfies Record<Segment, { subtitle: string; ctaLabel: string; ctaHref: string }>,
    todayXp: "BUGÜNKÜ XP",
  },
  en: {
    badge: "NEVAI PUBLISHERS — A1 TO C1",
    h1a: "We Reimagined",
    h1b: "Turkish Education.",
    segments: {
      ogrenci: {
        subtitle: "Earn points as you learn, climb the leagues, and improve your Turkish in live competition with friends.",
        ctaLabel: "Start Free",
        ctaHref: "/kayit?tip=bireysel",
      },
      ogretmen: {
        subtitle: "Generate quizzes and worksheets from book content in seconds with our AI studio.",
        ctaLabel: "Start Free for Your School",
        ctaHref: "/kayit?tip=kurumsal",
      },
    } satisfies Record<Segment, { subtitle: string; ctaLabel: string; ctaHref: string }>,
    todayXp: "TODAY'S XP",
  },
} as const;

const GLASS = "border border-slate-300/40 bg-white/85 backdrop-blur-md shadow-[0_1px_2px_rgba(0,0,0,0.03),0_4px_16px_rgba(27,117,188,0.08)]";

function HeroCopy({ locale }: { locale: string }) {
  const T = locale === "en" ? HERO_TEXT.en : HERO_TEXT.tr;
  const { segment } = useSegment();

  return (
    <div>
      <motion.a
        href="https://nevai.co/"
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-[22px] inline-flex items-center gap-[7px] rounded-full bg-blue-100 px-3.5 py-[5px] text-[11px] font-bold tracking-[0.06em] text-[#1e3a5f] transition-colors hover:bg-blue-200"
      >
        <BookOpen className="h-3 w-3" />
        {T.badge}
      </motion.a>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="type-hero mb-5 tracking-tight text-slate-900"
      >
        {T.h1a}
        <br />
        <span className="bg-[linear-gradient(130deg,#1b75bc_0%,#57dffe_55%,#1565a8_100%)] bg-clip-text text-transparent">
          {T.h1b}
        </span>
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <SegmentSwitcher locale={locale} />
      </motion.div>

      {/* Segment'e göre değişen alt metin — iki metin de DOM'da kalır, opacity ile geçiş (CLS 0) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="relative mb-7 min-h-[140px] max-w-xl sm:min-h-[84px]"
      >
        {(Object.keys(T.segments) as Segment[]).map((key) => (
          <p
            key={key}
            aria-hidden={segment !== key}
            className={cn(
              "type-body-lg absolute inset-0 max-w-xl text-slate-600 transition-opacity duration-300",
              segment === key ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            {T.segments[key].subtitle}
          </p>
        ))}
      </motion.div>

      {/* Segment'e göre değişen birincil CTA — aynı desen: ikisi de DOM'da, opacity ile geçiş */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="relative mb-8 h-[46px] w-[280px] max-w-full"
      >
        {(Object.keys(T.segments) as Segment[]).map((key) => (
          <Link
            key={key}
            href={T.segments[key].ctaHref}
            tabIndex={segment === key ? 0 : -1}
            aria-hidden={segment !== key}
            className={cn(
              "absolute inset-0 inline-flex items-center justify-center gap-2 rounded-lg bg-primary text-[14px] font-semibold text-white transition-opacity duration-300",
              segment === key ? "opacity-100" : "pointer-events-none opacity-0"
            )}
          >
            {T.segments[key].ctaLabel}
            <ArrowRight className="h-[15px] w-[15px]" />
          </Link>
        ))}
      </motion.div>
    </div>
  );
}

export function HeroSection({ locale = "tr" }: { locale?: string }) {
  const T = locale === "en" ? HERO_TEXT.en : HERO_TEXT.tr;

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[linear-gradient(135deg,#f0f7ff_0%,#f9fafb_50%,#eff6ff_100%)]">
      {/* Ambiyans glow — statik, dekoratif */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[8%] top-0 h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,rgba(27,117,188,0.08),transparent_65%)]" />
        <div className="absolute right-[4%] top-[15%] h-[480px] w-[480px] rounded-full bg-[radial-gradient(circle,rgba(27,117,188,0.07),transparent_65%)]" />
        <div className="absolute bottom-[5%] left-[38%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(87,223,254,0.05),transparent_65%)]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-14 px-5 py-20 md:px-10 md:py-20 lg:grid-cols-2">

        <HeroCopy locale={locale} />

        {/* Right: illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative px-5 py-11 md:pl-6 md:pr-5"
        >
          <div className="relative overflow-hidden rounded-[20px] shadow-[0_8px_48px_rgba(27,117,188,0.18)]">
            <Image
              src={HERO_IMAGE_SRC}
              alt="Öğretmen ve iki öğrenci sınıfta tabletle çalışıyor"
              width={1600}
              height={1066}
              priority
              sizes="(min-width: 1024px) 560px, 100vw"
              className="block h-auto w-full"
            />
          </div>

          {/* XP badge — floating mid-left; ürün arayüzünden bir kesit (gerçek/tekil bir istatistik iddiası değil) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.75 }}
            className="absolute top-[38%] -left-5 hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className={cn("rounded-xl px-3.5 py-2.5", GLASS)}
            >
              <div className="mb-1 text-[9px] font-bold tracking-[0.07em] text-slate-400">{T.todayXp}</div>
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-orange-500" fill="#f97316" />
                <span className="text-[22px] font-black leading-tight text-primary">+240</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
