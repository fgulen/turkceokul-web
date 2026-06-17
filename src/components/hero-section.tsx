"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";
import { ArrowRight, Users, CheckCircle2, Zap, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";

// Buraya oluşturduğun hero görselinin yolunu yapıştır (örn: "/hero.jpg")
// Boş bırakılırsa uygulama mockup'ı gösterilir.
const HERO_IMAGE_SRC = "/hero.mp4";

const SHAPES = [
  { id: 1, size: 76, left: "6%", top: "12%", color: "#BFDBFE", radius: "18px", rot: 15, dur: 8, delay: 0 },
  { id: 2, size: 52, left: "81%", top: "10%", color: "#DBEAFE", radius: "50%", rot: -20, dur: 11, delay: 2 },
  { id: 3, size: 96, left: "2%", top: "65%", color: "#93C5FD", radius: "24px", rot: 35, dur: 13, delay: 1 },
  { id: 4, size: 66, left: "86%", top: "70%", color: "#FBCFE8", radius: "50%", rot: 30, dur: 9, delay: 3 },
  { id: 5, size: 42, left: "53%", top: "4%", color: "#A5F3FC", radius: "10px", rot: -30, dur: 7, delay: 1.5 },
  { id: 6, size: 58, left: "69%", top: "82%", color: "#BFDBFE", radius: "50%", rot: 10, dur: 14, delay: 0.5 },
];

const LETTERS = [
  { ch: "Ş", left: "13%", top: "20%", dur: 12, delay: 0, size: 32, color: "#1b75bc" },
  { ch: "Ğ", left: "75%", top: "26%", dur: 10, delay: 2, size: 26, color: "#57dffe" },
  { ch: "İ", left: "62%", top: "70%", dur: 14, delay: 1, size: 34, color: "#1b75bc" },
  { ch: "Ü", left: "23%", top: "76%", dur: 11, delay: 3, size: 28, color: "#57dffe" },
  { ch: "Ö", left: "39%", top: "9%", dur: 9, delay: 1.5, size: 32, color: "#1b75bc" },
  { ch: "Ç", left: "89%", top: "40%", dur: 13, delay: 0.5, size: 24, color: "#0ea5e9" },
];

const RECENT_USERS = [
  { name: "Sarah M.", initials: "SM", color: "#57dffe" },
  { name: "Ahmed K.", initials: "AK", color: "#60a5fa" },
  { name: "Yuki T.", initials: "YT", color: "#f472b6" },
  { name: "Marco R.", initials: "MR", color: "#34d399" },
  { name: "Lisa B.", initials: "LB", color: "#fb923c" },
];

const LIVE_JOINS = {
  tr: [
    "Sarah M. az önce katıldı 🎉",
    "Ahmed K. öğrenmeye başladı ✨",
    "Yuki T. dersini tamamladı 🏆",
    "Marco R. ligi geçti ⚡",
    "Priya S. az önce katıldı 🎉",
  ],
  en: [
    "Sarah M. just joined 🎉",
    "Ahmed K. started learning ✨",
    "Yuki T. completed a lesson 🏆",
    "Marco R. levelled up ⚡",
    "Priya S. just joined 🎉",
  ],
};

const HERO_TEXT = {
  tr: {
    badge: "NEVAİ YAYINLARI — A1'DEN C1'E",
    h1a: "Türkçe Eğitimini",
    h1b: "Yeniden Tasarladık.",
    subtitle: "Öğretmenler; yapay zeka destekli stüdyomuzla kitap içeriklerinden saniyeler içinde quizler ve çalışma yaprakları hazırlayın. Öğrenciler; okudukça puan toplayın, liglerde yükselin ve arkadaşlarınızla kıyasıya yarışarak Türkçenizi geliştirin.",
    ctaPrimary: "Okulunuz için Ücretsiz Başla",
    ctaSecondary: "Öğrenci Kaydı",
    statLessons: "Ders Tamamlandı",
    statStudents: "Aktif Öğrenci",
    todayXp: "BUGÜNKÜ XP",
    streak: "12 gün",
    correct: "Harika! +10 XP kazandın",
    continueCta: "Devam Et →",
  },
  en: {
    badge: "NEVAI PUBLISHERS — A1 TO C1",
    h1a: "We Reimagined",
    h1b: "Turkish Education.",
    subtitle: "Teachers: generate quizzes and worksheets from book content in seconds with our AI studio. Students: earn points as you learn, climb the leagues, and improve your Turkish in live competition with friends.",
    ctaPrimary: "Start Free for Your School",
    ctaSecondary: "Student Sign Up",
    statLessons: "Lessons Completed",
    statStudents: "Active Students",
    todayXp: "TODAY'S XP",
    streak: "12 days",
    correct: "Great! You earned +10 XP",
    continueCta: "Continue →",
  },
};

const ANSWERS = [
  { text: "bugün", correct: true },
  { text: "dün", correct: false },
  { text: "yarın", correct: false },
  { text: "şimdi", correct: false },
];

function HeartIcon({ filled = true }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" width="15" height="15" style={{ flexShrink: 0 }}>
      <path
        d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
        fill={filled ? "#ef4444" : "#fecaca"}
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LessonMockup({ streak, correct, continueCta }: { streak: string; correct: string; continueCta: string }) {
  return (
    <div style={{ background: "white", borderRadius: 20, border: "1px solid rgba(192,199,210,0.4)", boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(27,117,188,0.08)", overflow: "hidden" }}>

      {/* HUD bar */}
      <div style={{ background: "#f0f7ff", borderBottom: "1px solid #dbeafe", padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          {[true, true, true, true, false].map((f, i) => <HeartIcon key={i} filled={f} />)}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 999, padding: "2px 8px" }}>
          <span style={{ fontSize: 12 }}>🔥</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#ea580c" }}>{streak}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#dbeafe", border: "1px solid #bfdbfe", borderRadius: 999, padding: "2px 8px" }}>
          <Zap style={{ width: 11, height: 11, color: "#1b75bc", fill: "#1b75bc" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1b75bc" }}>240 XP</span>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: "10px 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ flex: 1, height: 5, background: "#e5e7eb", borderRadius: 999, overflow: "hidden" }}>
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "80%" }}
            transition={{ delay: 0.8, duration: 0.7, ease: "easeOut" }}
            style={{ height: "100%", background: "#1b75bc", borderRadius: 999 }}
          />
        </div>
        <span style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, flexShrink: 0 }}>4 / 5</span>
      </div>

      {/* Question */}
      <div style={{ padding: "14px 16px 12px" }}>
        <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", color: "#1b75bc", background: "#dbeafe", display: "inline-block", padding: "2px 8px", borderRadius: 999, marginBottom: 10 }}>ÇOKTAN SEÇMELİ</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#414751", marginBottom: 10 }}>Doğru kelimeyi seç:</div>

        {/* Sentence card */}
        <div style={{ background: "#f8faff", border: "1.5px solid #dbeafe", borderRadius: 10, padding: "10px 14px", marginBottom: 12, textAlign: "center", fontSize: 14, fontWeight: 600, color: "#1e1b1c", lineHeight: 1.5 }}>
          Ben{" "}
          <span style={{ borderBottom: "2.5px solid #1b75bc", color: "#1b75bc", paddingBottom: 1 }}>bugün</span>
          {" "}okula gidiyorum.
        </div>

        {/* Answer grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {ANSWERS.map((a) =>
            a.correct ? (
              <div key={a.text} style={{ background: "#dcfce7", border: "2px solid #16a34a", borderRadius: 9, padding: "9px 10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                <CheckIcon />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#15803d" }}>{a.text}</span>
              </div>
            ) : (
              <div key={a.text} style={{ background: "white", border: "1.5px solid #e5e7eb", borderRadius: 9, padding: "9px 10px", textAlign: "center" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#6b7280" }}>{a.text}</span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Correct feedback banner */}
      <div style={{ background: "#dcfce7", borderTop: "1px solid #bbf7d0", padding: "9px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <CheckIcon />
          <span style={{ fontSize: 12, fontWeight: 700, color: "#15803d" }}>{correct}</span>
        </div>
        <div style={{ background: "#16a34a", color: "white", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 6 }}>
          {continueCta}
        </div>
      </div>
    </div>
  );
}

const glassStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.85)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(192,199,210,0.55)",
  boxShadow: "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(27,117,188,0.08)",
};

export function HeroSection({ locale = 'tr' }: { locale?: string }) {
  const T = locale === 'en' ? HERO_TEXT.en : HERO_TEXT.tr;
  const liveJoins = locale === 'en' ? LIVE_JOINS.en : LIVE_JOINS.tr;

  const [liveIdx, setLiveIdx] = useState(0);
  const [showLive, setShowLive] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowLive(false);
      setTimeout(() => {
        setLiveIdx((i) => (i + 1) % liveJoins.length);
        setShowLive(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      className="relative overflow-hidden flex items-center"
      style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f0f7ff 0%,#f9fafb 50%,#eff6ff 100%)" }}
    >
      {/* Floating shapes */}
      {SHAPES.map((s) => (
        <motion.div
          key={s.id}
          className="absolute pointer-events-none"
          style={{ left: s.left, top: s.top, width: s.size, height: s.size, backgroundColor: s.color, borderRadius: s.radius, opacity: 0.6 }}
          animate={{ y: [-14, 14, -14], rotate: [s.rot, s.rot + 8, s.rot], scale: [1, 1.05, 1] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}

      {/* Floating Turkish letters */}
      {LETTERS.map((l, i) => (
        <motion.span
          key={i}
          className="absolute pointer-events-none font-black select-none"
          style={{ left: l.left, top: l.top, fontSize: l.size, color: l.color }}
          animate={{ y: [-16, 16, -16], x: [-4, 4, -4], opacity: [0.07, 0.28, 0.07] }}
          transition={{ duration: l.dur, delay: l.delay, repeat: Infinity, ease: "easeInOut" }}
        >
          {l.ch}
        </motion.span>
      ))}

      {/* Parallax glow blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: "absolute", top: 0, left: "8%", width: 640, height: 640, background: "radial-gradient(circle,rgba(27,117,188,0.08),transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "15%", right: "4%", width: 480, height: 480, background: "radial-gradient(circle,rgba(27,117,188,0.07),transparent 65%)", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "5%", left: "38%", width: 560, height: 560, background: "radial-gradient(circle,rgba(87,223,254,0.05),transparent 65%)", borderRadius: "50%" }} />
      </div>

      {/* Main content */}
      <div
        className="relative z-10 w-full grid grid-cols-1 lg:grid-cols-2 items-center px-5 md:px-10"
        style={{ maxWidth: 1200, margin: "0 auto", paddingTop: 80, paddingBottom: 80, gap: 56 }}
      >
        {/* Left: copy */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-[7px] mb-[22px]"
            style={{ background: "#dbeafe", color: "#1e3a5f", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", padding: "5px 14px", borderRadius: 999 }}
          >
            <BookOpen style={{ width: 12, height: 12 }} />
            {T.badge}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-extrabold"
            style={{ fontSize: "clamp(34px,3.8vw,52px)", lineHeight: 1.12, letterSpacing: "-0.03em", marginBottom: 18 }}
          >
            {T.h1a}<br />
            <span
              style={{
                background: "linear-gradient(130deg,#1b75bc 0%,#57dffe 55%,#1565a8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {T.h1b}
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ fontSize: 17, lineHeight: "28px", color: "#414751", maxWidth: 460, marginBottom: 28 }}
          >
            {T.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-wrap gap-2.5 mb-8"
          >
            <Link
              href="/kayit?tip=kurumsal"
              className="inline-flex items-center gap-2 text-white font-semibold rounded-lg"
              style={{ background: "#1b75bc", fontSize: 14, padding: "12px 22px" }}
            >
              {T.ctaPrimary}
              <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
            <Link
              href="/kayit?tip=bireysel"
              className="inline-flex items-center gap-2 font-semibold rounded-lg"
              style={{ ...glassStyle, fontSize: 14, padding: "12px 22px", color: "#1e1b1c" }}
            >
              {T.ctaSecondary}
            </Link>
          </motion.div>

          {/* Avatars + live notification */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex items-center gap-3.5 flex-wrap"
          >
            <div className="flex">
              {RECENT_USERS.map((u, i) => (
                <div
                  key={u.name}
                  title={u.name}
                  className={cn("size-8 rounded-full border-2 border-white flex items-center justify-center text-white font-bold", i > 0 && "-ml-2")}
                  style={{ fontSize: 10, background: u.color, boxShadow: i === 0 ? "0 0 0 1px #bfdbfe" : undefined }}
                >
                  {u.initials}
                </div>
              ))}
              <div
                className="-ml-2 size-8 rounded-full border-2 border-white flex items-center justify-center font-bold"
                style={{ fontSize: 9, background: "#f3f4f6", color: "#9ca3af" }}
              >
                +99
              </div>
            </div>

            <div style={{ height: 36 }}>
              <AnimatePresence mode="wait">
                {showLive && (
                  <motion.div
                    key={liveIdx}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.35 }}
                    className="inline-flex items-center gap-2 rounded-full h-full"
                    style={{ ...glassStyle, padding: "6px 13px", fontSize: 11, fontWeight: 600, color: "#414751" }}
                  >
                    <span className="inline-block size-1.5 rounded-full bg-green-400 flex-shrink-0" />
                    {liveJoins[liveIdx]}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Right: illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative"
          style={{ padding: "44px 20px 44px 24px" }}
        >
          {HERO_IMAGE_SRC ? (
            /* Fotoğraf / video modu */
            <div style={{ position: "relative" }}>
              <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 8px 48px rgba(27,117,188,0.18)" }}>
                {/\.(mp4|webm|mov)$/i.test(HERO_IMAGE_SRC) ? (
                  <video
                    src={HERO_IMAGE_SRC}
                    autoPlay
                    loop
                    muted
                    playsInline
                    style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <img
                    src={HERO_IMAGE_SRC}
                    alt="Türkçe öğrencileri"
                    style={{ width: "100%", height: 280, objectFit: "cover", display: "block" }}
                  />
                )}
              </div>
              {/* Lesson mockup overlay — geçici kapalı
              <div style={{ position: "absolute", bottom: -32, right: -8, width: "60%", zIndex: 10 }}>
                <LessonMockup streak={T.streak} correct={T.correct} continueCta={T.continueCta} />
              </div>
              <div style={{ height: 120 }} />
              */}
            </div>
          ) : (
            /* Varsayılan: sadece uygulama mockup'ı */
            <LessonMockup streak={T.streak} correct={T.correct} continueCta={T.continueCta} />
          )}

          {/* Stat card — top right */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 }}
            className="absolute -top-3.5 -right-2 rounded-[14px] px-4 py-3 hidden lg:flex items-center gap-2.5"
            style={glassStyle}
          >
            <div className="size-[34px] rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#dcfce7" }}>
              <CheckCircle2 style={{ width: 18, height: 18, color: "#16a34a" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.04em" }}>{T.statLessons}</div>
              <div className="font-black leading-snug" style={{ fontSize: 20, color: "#1e1b1c" }}>1,247</div>
            </div>
          </motion.div>

          {/* Stat card — bottom left */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.65 }}
            className="absolute -bottom-3.5 -left-2 rounded-[14px] px-4 py-3 hidden lg:flex items-center gap-2.5"
            style={glassStyle}
          >
            <div className="size-[34px] rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#dbeafe" }}>
              <Users style={{ width: 18, height: 18, color: "#1565a8" }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 600, letterSpacing: "0.04em" }}>{T.statStudents}</div>
              <div className="font-black leading-snug" style={{ fontSize: 20, color: "#1e1b1c" }}>5,320</div>
            </div>
          </motion.div>

          {/* XP badge — floating mid-left */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.75 }}
            className="absolute top-[38%] -left-5 hidden lg:block"
          >
            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="rounded-xl px-3.5 py-2.5"
              style={glassStyle}
            >
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", color: "#9ca3af", marginBottom: 4 }}>{T.todayXp}</div>
              <div className="flex items-center gap-1.5">
                <Zap style={{ width: 16, height: 16, color: "#f97316", fill: "#f97316" }} />
                <span className="font-black leading-tight" style={{ fontSize: 22, color: "#1b75bc" }}>+240</span>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
