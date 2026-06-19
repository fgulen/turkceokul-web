"use client";

import { useState } from "react";
import { Link, useRouter, useLocale } from "@/navigation";
import { Brain, Check, X, ArrowRight, BookOpen, RotateCcw } from "lucide-react";
import { Logo } from "@/components/logo";
import { api } from "@/lib/api";

type Level = "A1" | "A2" | "B1" | "B2" | "C1";
type Phase = "intro" | "testing" | "results";

interface Question {
  id: number;
  level: Level;
  text: string;
  options: string[];
  correctIndex: number;
}

const QUESTIONS: Question[] = [
  // A1
  { id: 1,  level: "A1", text: "Merhaba! Benim ___ Ali. Siz kimsiniz?",                                                options: ["adım", "isim", "adın", "adi"],                                          correctIndex: 0 },
  { id: 2,  level: "A1", text: "Sınıfta ___ öğrenci var.",                                                          options: ["yirmiden", "yirmide", "yirmi", "yirmiye"],                              correctIndex: 2 },
  { id: 3,  level: "A1", text: "Bu ___ çantamdır.",                                                                  options: ["beni", "benim", "bende", "bene"],                                       correctIndex: 1 },
  { id: 4,  level: "A1", text: "Her sabah kahvaltı ___.",                                                           options: ["yaptım", "yapacağım", "yapardım", "yapıyorum"],                         correctIndex: 3 },
  // A2
  { id: 5,  level: "A2", text: "Geçen hafta İstanbul'a ___.",                                                       options: ["gidiyorum", "gideceğim", "giderdim", "gittim"],                        correctIndex: 3 },
  { id: 6,  level: "A2", text: "Kitap masanın ___ duruyor.",                                                        options: ["üstüne", "üstünden", "üstünde", "üstü"],                               correctIndex: 2 },
  { id: 7,  level: "A2", text: "Bu benim ___ arabası.",                                                             options: ["abime", "abimden", "abimin", "abim"],                                   correctIndex: 2 },
  { id: 8,  level: "A2", text: "Toplantıya katılamadım ___ hastaydım.",                                             options: ["için", "çünkü", "ama", "dahi"],                                         correctIndex: 1 },
  // B1
  { id: 9,  level: "B1", text: "Eğer çok çalışırsan, sınavı ___.",                                                 options: ["geçiyorsun", "geçtin", "geçmişsin", "geçersin"],                       correctIndex: 3 },
  { id: 10, level: "B1", text: "Arkadaşım, yarın geleceğini ___ söyledi.",                                          options: ["bana", "benle", "benden", "beni"],                                      correctIndex: 0 },
  { id: 11, level: "B1", text: "Ne kadar erken uyursam, sabah o kadar zinde ___.",                                  options: ["uyandım", "uyanırım", "uyanacaktım", "uyanırdım"],                      correctIndex: 1 },
  { id: 12, level: "B1", text: "Hava güzel olduğunda parkta yürüyüş ___ severim.",                                 options: ["yapmaya", "yapmadan", "yapmanın", "yapmayı"],                           correctIndex: 3 },
  // B2
  { id: 13, level: "B2", text: "Konuşmacı sahneye çıktığında salon ___.",                                          options: ["alkışladı", "alkışa boğuldu", "alkışlıyor", "alkışlayacak"],            correctIndex: 1 },
  { id: 14, level: "B2", text: "Bu proje ___ göre oldukça başarılı sayılabilir.",                                   options: ["beklentilere", "beklentilerden", "beklentilerle", "beklentileri"],     correctIndex: 0 },
  { id: 15, level: "B2", text: "Rapor, gerekli düzeltmeler ___ sunulacak.",                                        options: ["yapılırken", "yapıldıktan sonra", "yapıldığında", "yapılmadan önce"], correctIndex: 1 },
  { id: 16, level: "B2", text: "O kadar yorgundu ki ayakta ___.",                                                   options: ["duramıyordu", "durmuyordu", "durmazdı", "duramaz"],                    correctIndex: 0 },
  // C1
  { id: 17, level: "C1", text: "Ekonomik krizin derinleşmesi, satın alma gücünü ___ etkilemektedir.",              options: ["olumsuz yönde", "olumsuzca", "olumsuza", "olumsuzu"],                  correctIndex: 0 },
  { id: 18, level: "C1", text: "Bu eserde, toplumsal dönüşümün birey üzerindeki ___ ele alınmaktadır.",            options: ["yansıması", "yansımalar", "yansımaları", "yansımada"],                 correctIndex: 2 },
  { id: 19, level: "C1", text: "Bilim insanları, bu buluşun tıp ___ devrim niteliği taşıdığını vurguladı.",       options: ["dünyasını", "dünyasında", "dünyasına", "dünyasından"],                 correctIndex: 1 },
  { id: 20, level: "C1", text: "Söz konusu politikanın uygulanabilmesi, tüm paydaşların ___ bağlıdır.",            options: ["mutabakatına", "mutabakatı", "mutabakatından", "mutabakatıyla"],       correctIndex: 0 },
];

function calcLevel(score: number): Level {
  if (score <= 4)  return "A1";
  if (score <= 8)  return "A2";
  if (score <= 12) return "B1";
  if (score <= 16) return "B2";
  return "C1";
}

const LEVEL_META: Record<Level, { label: string; color: string; bg: string; border: string; desc: string }> = {
  A1: { label: "Başlangıç",  color: "#16a34a", bg: "#dcfce7", border: "#86efac", desc: "Türkçeye ilk adımını atıyorsun. Temel ifadeler ve günlük kelimeler ile başlamak sana en uygun." },
  A2: { label: "Temel",      color: "#0891b2", bg: "#cffafe", border: "#67e8f9", desc: "Basit konuşmalar kurabiliyorsun. Günlük ifadeleri anlamak ve kullanmak için güzel bir seviye." },
  B1: { label: "Orta",       color: "#1b75bc", bg: "#dbeafe", border: "#93c5fd", desc: "Ana konularda kendini ifade edebiliyorsun. Dilbilgisi ve kelime hazineni genişletme zamanı." },
  B2: { label: "Orta-Üstü",  color: "#7c3aed", bg: "#ede9fe", border: "#c4b5fd", desc: "Karmaşık konularda rahatlıkla iletişim kurabiliyorsun. İnceliklere odaklanma zamanı." },
  C1: { label: "İleri",      color: "#be185d", bg: "#fce7f3", border: "#f9a8d4", desc: "Türkçeyi akıcı kullanabiliyorsun. Akademik ve profesyonel içerikler sana göre." },
};

const BOOK_RECS: Record<Level, { series: string; subtitle: string; desc: string; books: string; color: string; bg: string; border: string }> = {
  A1: { series: "Can Serisi",     subtitle: "A1 · Başlangıç",  desc: "Temel Türkçe yapıları ve günlük iletişim için ideal başlangıç noktası.",       books: "3 kitap · 18 ünite", color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
  A2: { series: "Can Serisi",     subtitle: "A1–A2 · Temel",   desc: "Günlük konuşma ve basit yazı becerilerini pekiştiren içerikler.",                books: "3 kitap · 18 ünite", color: "#0891b2", bg: "#ecfeff", border: "#a5f3fc" },
  B1: { series: "Yağmur Serisi",  subtitle: "B1 · Orta",       desc: "Karmaşık cümle yapıları ve zengin kelime hazinesiyle orta seviye içerikler.",    books: "3 kitap · 18 ünite", color: "#1b75bc", bg: "#eff6ff", border: "#bfdbfe" },
  B2: { series: "Yağmur Serisi",  subtitle: "B2 · Orta-Üstü", desc: "İleri düzey dilbilgisi ve özgün metinlerle kendini daha iyi ifade et.",          books: "3 kitap · 18 ünite", color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
  C1: { series: "Harmoni Serisi", subtitle: "C1 · İleri",      desc: "Akademik ve resmi Türkçeyi kapsayan ileri seviye içerikler.",                    books: "3 kitap · 18 ünite", color: "#be185d", bg: "#fdf2f8", border: "#fbcfe8" },
};

const PAGE_STYLE: React.CSSProperties = {
  minHeight: "100dvh",
  background: "#f9fafb",
  display: "flex",
  flexDirection: "column",
  fontFamily: "var(--font-sans, Inter, sans-serif)",
};

const HEADER_STYLE: React.CSSProperties = {
  padding: "18px 28px",
  background: "#fff",
  borderBottom: "1px solid #e5e7eb",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const MAIN_STYLE: React.CSSProperties = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "40px 20px",
};

export default function SeviyeTestiPage() {
  const router = useRouter();
  const locale = useLocale();

  const [phase, setPhase] = useState<Phase>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null));
  const [selected, setSelected] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  const q = QUESTIONS[currentIndex];
  const isLast = currentIndex === QUESTIONS.length - 1;
  const progress = Math.round((currentIndex / QUESTIONS.length) * 100);

  const score = answers.reduce<number>((acc, a, i) => acc + (a === QUESTIONS[i].correctIndex ? 1 : 0), 0);
  const level = calcLevel(score);
  const lm = LEVEL_META[level];
  const br = BOOK_RECS[level];

  function pick(idx: number) {
    if (showFeedback) return;
    const next = [...answers];
    next[currentIndex] = idx;
    setAnswers(next);
    setSelected(idx);
    setShowFeedback(true);
  }

  function advance() {
    if (isLast) { setPhase("results"); return; }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
    setShowFeedback(false);
  }

  function restart() {
    setPhase("intro");
    setCurrentIndex(0);
    setAnswers(Array(QUESTIONS.length).fill(null));
    setSelected(null);
    setShowFeedback(false);
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────
  if (phase === "intro") return (
    <div style={PAGE_STYLE}>
      <header style={HEADER_STYLE}>
        <Link href="/" style={{ textDecoration: "none" }}><Logo size="sm" /></Link>
      </header>
      <main style={MAIN_STYLE}>
        <div style={{ maxWidth: 440, width: "100%", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Brain style={{ width: 26, height: 26, color: "#1b75bc" }} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#1e1b1c", letterSpacing: "-0.02em", marginBottom: 8 }}>
            Türkçe Seviye Tespiti
          </h1>
          <p style={{ fontSize: 14, color: "#717882", lineHeight: "22px", marginBottom: 32 }}>
            20 çoktan seçmeli soru ile Türkçe seviyeni belirle.<br />
            Sana en uygun kitap serisini önereceğiz.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 36 }}>
            {[{ val: "20", label: "Soru" }, { val: "~5dk", label: "Süre" }, { val: "A1–C1", label: "Kapsam" }].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#1e1b1c" }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={() => setPhase("testing")}
            style={{ width: "100%", maxWidth: 300, background: "#1b75bc", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "0 auto" }}
          >
            Teste Başla <ArrowRight style={{ width: 15, height: 15 }} />
          </button>
          <button
            onClick={() => router.push("/pano", { locale })}
            style={{ marginTop: 14, background: "none", border: "none", fontSize: 12, color: "#9ca3af", cursor: "pointer", textDecoration: "underline" }}
          >
            Atla, panoya git
          </button>
        </div>
      </main>
    </div>
  );

  // ── TESTING ────────────────────────────────────────────────────────────────
  if (phase === "testing") {
    const qLm = LEVEL_META[q.level];
    const isCorrect = selected === q.correctIndex;
    return (
      <div style={PAGE_STYLE}>
        <header style={HEADER_STYLE}>
          <Link href="/" style={{ textDecoration: "none" }}><Logo size="sm" /></Link>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "#9ca3af" }}>{currentIndex + 1} / {QUESTIONS.length}</span>
            <div style={{ width: 100, height: 5, background: "#e5e7eb", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${progress}%`, background: "#1b75bc", borderRadius: 3, transition: "width 0.3s" }} />
            </div>
          </div>
        </header>
        <main style={MAIN_STYLE}>
          <div style={{ maxWidth: 500, width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: qLm.bg, color: qLm.color, letterSpacing: "0.04em" }}>
                {q.level}
              </span>
              <span style={{ fontSize: 12, color: "#9ca3af" }}>seviye sorusu</span>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.06)", marginBottom: 14 }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: "#1e1b1c", lineHeight: "26px", margin: 0 }}>
                {q.text}
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 20 }}>
              {q.options.map((opt, idx) => {
                const isCorrectOpt = idx === q.correctIndex;
                const isWrongPick = showFeedback && idx === selected && !isCorrect;
                let bg = "#fff", border = "1px solid #e5e7eb", color = "#1e1b1c";
                if (showFeedback) {
                  if (isCorrectOpt)   { bg = "#f0fdf4"; border = "1px solid #86efac"; color = "#15803d"; }
                  else if (isWrongPick) { bg = "#fef2f2"; border = "1px solid #fca5a5"; color = "#dc2626"; }
                  else                { color = "#c0c7d2"; }
                }
                return (
                  <button
                    key={idx}
                    onClick={() => pick(idx)}
                    disabled={showFeedback}
                    style={{ background: bg, border, borderRadius: 9, padding: "12px 16px", textAlign: "left", cursor: showFeedback ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", transition: "all 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}
                  >
                    <span style={{ fontSize: 14, color, fontWeight: showFeedback && isCorrectOpt ? 600 : 400 }}>{opt}</span>
                    {showFeedback && isCorrectOpt  && <Check style={{ width: 14, height: 14, color: "#16a34a", flexShrink: 0 }} />}
                    {showFeedback && isWrongPick   && <X    style={{ width: 14, height: 14, color: "#dc2626", flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>

            {showFeedback && (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: isCorrect ? "#16a34a" : "#dc2626" }}>
                  {isCorrect ? "Doğru!" : "Yanlış"}
                </span>
                <button
                  onClick={advance}
                  style={{ background: "#1b75bc", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {isLast ? "Sonuçları Gör" : "İleri"} <ArrowRight style={{ width: 13, height: 13 }} />
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── RESULTS ────────────────────────────────────────────────────────────────
  return (
    <div style={PAGE_STYLE}>
      <header style={HEADER_STYLE}>
        <Link href="/" style={{ textDecoration: "none" }}><Logo size="sm" /></Link>
      </header>
      <main style={MAIN_STYLE}>
        <div style={{ maxWidth: 460, width: "100%", textAlign: "center" }}>
          <div style={{ width: 68, height: 68, borderRadius: "50%", background: lm.bg, border: `2px solid ${lm.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <span style={{ fontSize: 16, fontWeight: 900, color: lm.color }}>{level}</span>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#9ca3af", letterSpacing: "0.08em", marginBottom: 4 }}>SEVİYENİZ</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#1e1b1c", letterSpacing: "-0.02em", marginBottom: 6 }}>{lm.label}</h2>
          <p style={{ fontSize: 13, color: "#717882", lineHeight: "20px", maxWidth: 340, margin: "0 auto 6px" }}>{lm.desc}</p>
          <p style={{ fontSize: 11, color: "#c0c7d2", marginBottom: 28 }}>{score} / {QUESTIONS.length} doğru</p>

          <div style={{ background: br.bg, border: `1px solid ${br.border}`, borderRadius: 12, padding: "18px 22px", textAlign: "left", marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: br.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <BookOpen style={{ width: 15, height: 15, color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#1e1b1c" }}>{br.series}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: br.color }}>{br.subtitle}</div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: "#374151", lineHeight: "19px", margin: 0 }}>{br.desc}</p>
            <p style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>{br.books} · Nevai Yayınları</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            <button
              onClick={() => {
                localStorage.setItem("cefrLevel", level);
                api.patch("/api/auth/me", { cefrLevel: level }).catch(() => {});
                router.push("/pano", { locale });
              }}
              style={{ width: "100%", background: "#1b75bc", color: "#fff", border: "none", borderRadius: 9, padding: "12px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              Öğrenmeye Başla <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
            <button
              onClick={restart}
              style={{ width: "100%", background: "#fff", color: "#9ca3af", border: "1px solid #e5e7eb", borderRadius: 9, padding: "11px", fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}
            >
              <RotateCcw style={{ width: 12, height: 12 }} /> Testi Tekrar Yap
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
