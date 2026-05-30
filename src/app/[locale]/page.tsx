import { Link } from "@/navigation";
import { Logo } from "@/components/logo";
import { HeroSection } from "@/components/hero-section";
import {
  Heart, Flame, Zap, Trophy, ListChecks, Layers,
  Image as ImageIcon, PencilLine, MessageCircle, Mic, Brain, Bot,
  PlusCircle, BookOpen, Check, X, Package, Swords, Users,
  Sparkles, ArrowRight,
} from "lucide-react";

const activityTypes = [
  { icon: ListChecks, label: "Çoktan Seçmeli", bg: "#eff6ff", border: "#dbeafe", color: "#1b75bc" },
  { icon: Zap,        label: "Quiz",            bg: "#fff7ed", border: "#fed7aa", color: "#ea580c" },
  { icon: Layers,     label: "Kelime Eşleştir", bg: "#f0fdfa", border: "#99f6e4", color: "#0d9488" },
  { icon: Bot,        label: "Akıllı Kart",     bg: "#eff6ff", border: "#bfdbfe", color: "#1b75bc" },
  { icon: ImageIcon,  label: "Resim–Ses",        bg: "#fff1f2", border: "#fecdd3", color: "#e11d48" },
  { icon: PencilLine, label: "Boşluk Doldurma",  bg: "#eff6ff", border: "#bfdbfe", color: "#1d4ed8" },
  { icon: MessageCircle, label: "Cümle Kurma",   bg: "#f0fdf4", border: "#bbf7d0", color: "#16a34a" },
  { icon: Mic,        label: "Sesi Dinle & Yaz", bg: "#fffbeb", border: "#fde68a", color: "#d97706" },
  { icon: Brain,      label: "Hafıza Oyunu",     bg: "#eef2ff", border: "#c7d2fe", color: "#4f46e5" },
  { icon: Sparkles,   label: "AI Diyalog",       bg: "#eff6ff", border: "#bfdbfe", color: "#1b75bc", soon: true },
  { icon: PlusCircle, label: "10 Tip Daha",      bg: "#f9fafb", border: "#c0c7d2", color: "#9ca3af", dashed: true },
] as const;

import { BOOK_COVERS } from "@/lib/book-covers";

const books = [
  {
    name: "CAN", cefr: "A1 – A2", levelLabel: "YENİ BAŞLAYANLAR", subLabel: "İlk Okullar",
    color: "#1b75bc", colorLight: "#eff6ff",
    imgs: BOOK_COVERS.CAN,
    features: ["4 Kitap + Çalışma Kitabı", "Ses dosyaları ve videolar", "Öğretmen kılavuzu", "Online etkinlikler"],
  },
  {
    name: "YAĞMUR", cefr: "A1 – B1", levelLabel: "GELİŞMEKTE OLANLAR", subLabel: "Orta yoğunluk",
    color: "#0891b2", colorLight: "#ecfeff",
    imgs: BOOK_COVERS.YAGMUR,
    features: ["5 Kitap + Çalışma Kitabı", "Ses dosyaları ve videolar", "Öğretmen kılavuzu", "Online etkinlikler"],
  },
  {
    name: "HARMONİ", cefr: "A1 – B2", levelLabel: "İLERİ SEVİYE", subLabel: "Yoğun ders saati olanlar",
    color: "#7c3aed", colorLight: "#f5f3ff",
    imgs: BOOK_COVERS.HARMONI,
    features: ["4 Kitap + Çalışma Kitabı", "Ses dosyaları ve videolar", "Öğretmen kılavuzu", "Online etkinlikler"],
  },
];

const shadowCard = "0 1px 2px rgba(0,0,0,0.03), 0 4px 16px rgba(27,117,188,0.08)";
const shadowBlue = "0 8px 40px rgba(27,117,188,0.28)";

export default function LandingPage() {
  return (
    <div style={{ background: "#f9fafb", color: "#1e1b1c" }}>

      {/* Nav */}
      <nav
        className="sticky top-0 z-50"
        style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: "1px solid rgba(192,199,210,0.35)" }}
      >
        <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: "0 auto", height: 60, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <Logo size="md" />
          </Link>

          <div className="hidden md:flex" style={{ alignItems: "center", gap: 28 }}>
            <a href="#platform" style={{ fontSize: 14, fontWeight: 500, color: "#414751", textDecoration: "none" }}>Platform</a>
            <a href="#kitaplar" style={{ fontSize: 14, fontWeight: 500, color: "#414751", textDecoration: "none" }}>Kitaplar</a>
            <a href="#fiyatlar" style={{ fontSize: 14, fontWeight: 500, color: "#414751", textDecoration: "none" }}>Fiyatlar</a>
            <a href="#" style={{ fontSize: 14, fontWeight: 500, color: "#414751", textDecoration: "none" }}>Kurumsal</a>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/giris" className="hidden md:block" style={{ fontSize: 14, fontWeight: 500, color: "#414751", textDecoration: "none" }}>Giriş Yap</Link>
            <Link href="/kayit" style={{ background: "#1b75bc", color: "#fff", fontSize: 13, fontWeight: 600, padding: "8px 18px", borderRadius: 8, textDecoration: "none" }}>Ücretsiz Başla</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <HeroSection />

      {/* Stats + Marquee band */}
      <div style={{ background: "#1b75bc" }}>

        {/* Üst: statik sayılar */}
        <div className="grid grid-cols-2 md:grid-cols-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)", padding: "14px 20px" }}>
          {[
            { val: "53.000+", label: "Toplam Kullanıcı" },
            { val: "30+",     label: "Ülke" },
            { val: "A1–C1",   label: "Tam CEFR" },
            { val: "2013",    label: "Kuruluş" },
          ].map((s) => (
            <div key={s.label} style={{ textAlign: "center", padding: "6px 0" }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.6)", marginTop: 3, letterSpacing: "0.04em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Alt: kayan şerit */}
        <div style={{ padding: "8px 0" }} className="marquee">
          <div className="marquee-inner" style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.65)" }}>
            NEVAİ YAYINLARI &nbsp;·&nbsp; AI DESTEKLİ ÖĞRETMEN ARAÇLARI &nbsp;·&nbsp; GAMİFİKASYON + GERÇEK MÜFREDAT &nbsp;·&nbsp; CEFR UYUMLU MÜFREDAT &nbsp;·&nbsp; 2013&rsquo;DEN BUGÜNE &nbsp;·&nbsp; SINIF YÖNETİMİ &nbsp;·&nbsp; MULTİPLAYER MODLAR &nbsp;·&nbsp; NEVAİ YAYINLARI &nbsp;·&nbsp; AI DESTEKLİ ÖĞRETMEN ARAÇLARI &nbsp;·&nbsp; GAMİFİKASYON + GERÇEK MÜFREDAT &nbsp;·&nbsp; CEFR UYUMLU MÜFREDAT &nbsp;·&nbsp; 2013&rsquo;DEN BUGÜNE &nbsp;·&nbsp; SINIF YÖNETİMİ &nbsp;·&nbsp; MULTİPLAYER MODLAR &nbsp;·&nbsp;
          </div>
        </div>

      </div>

      {/* Platform Features */}
      <section id="platform" style={{ background: "#ffffff", padding: "72px 0" }}>
        <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: "0 auto" }}>

          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eef0f3", color: "#414751", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", padding: "4px 12px", borderRadius: 999, marginBottom: 12 }}>PLATFORM</div>
            <h2 style={{ fontSize: "clamp(26px,3.5vw,42px)", fontWeight: 800, letterSpacing: "-0.025em", lineHeight: 1.15, marginBottom: 12 }}>Sınıfı geleceğe taşıyan araçlar</h2>
            <p style={{ fontSize: 16, color: "#414751", maxWidth: 460, margin: "0 auto", lineHeight: "26px" }}>Öğretmen için AI stüdyo. Öğrenci için bağımlılık yaratan deneyim.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 14 }}>

            {/* AI Studio — spans 2 cols on lg */}
            <div className="md:col-span-2 lg:col-span-2" style={{ borderRadius: 16, padding: 30, background: "#1e1b1c", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -60, right: -60, width: 340, height: 340, background: "radial-gradient(circle,rgba(87,223,254,0.13),transparent 65%)", pointerEvents: "none" }} />
              <div style={{ position: "absolute", bottom: -80, left: 100, width: 240, height: 240, background: "radial-gradient(circle,rgba(104,51,209,0.1),transparent 65%)", pointerEvents: "none" }} />
              <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(87,223,254,0.09)", border: "1px solid rgba(87,223,254,0.22)", borderRadius: 999, padding: "4px 12px", marginBottom: 14 }}>
                <Sparkles style={{ width: 11, height: 11, color: "#57dffe" }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", color: "#57dffe" }}>AI STÜDYO</span>
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 7 }}>30 saniyede sıfırdan materyal</h3>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 16, maxWidth: 400, lineHeight: "20px" }}>Müfredatı siz belirleyin, yapay zeka etkinlikleri anında üretsin.</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {["Quiz Üretimi", "AI Seslendirme", "Boşluk Doldurma", "Kelime Listesi"].map((tag) => (
                  <span key={tag} style={{ background: "rgba(87,223,254,0.08)", border: "1px solid rgba(87,223,254,0.16)", color: "#57dffe", fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 999 }}>{tag}</span>
                ))}
              </div>
            </div>

            {/* Gamification */}
            <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", border: "1px solid rgba(192,199,210,0.55)", boxShadow: shadowCard, borderRadius: 16, padding: 22 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Bağımlılık Yaratan Sistem</h3>
              <p style={{ fontSize: 12, color: "#717882", marginBottom: 14 }}>Duolingo mekanikleri + gerçek müfredat.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                {[
                  { Icon: Heart, iconColor: "#ef4444", iconFill: "#ef4444", bg: "#fff1f2", label: "5 Kalp Sistemi",    sub: "Yanlışta -1, 30 dk'da +1" },
                  { Icon: Flame, iconColor: "#f97316", iconFill: undefined,  bg: "#fff7ed", label: "Günlük Seri",       sub: "Dondurucu kalkan ile koruma" },
                  { Icon: Zap,   iconColor: "#4f46e5", iconFill: undefined,  bg: "#eef2ff", label: "XP Combo Zinciri", sub: "2x → 3x → 5x → 10x" },
                  { Icon: Trophy,iconColor: "#ca8a04", iconFill: undefined,  bg: "#fefce8", label: "10 Lig Seviyesi",  sub: "Bronz → Gümüş → Altın → Taç" },
                ].map(({ Icon, iconColor, iconFill, bg, label, sub }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 28, height: 28, background: bg, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Icon style={{ width: 14, height: 14, color: iconColor, ...(iconFill ? { fill: iconFill } : {}) }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 10, color: "#9ca3af" }}>{sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics */}
            <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", border: "1px solid rgba(192,199,210,0.55)", boxShadow: shadowCard, borderRadius: 16, padding: 22 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Veriye Dayalı Takip</h3>
              <p style={{ fontSize: 12, color: "#717882", marginBottom: 12 }}>Bireysel ve sınıf bazlı analiz.</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 48, marginBottom: 8 }}>
                {[40, 58, 45, 82, 65, 92, 72].map((h, i) => (
                  <div key={i} style={{ flex: 1, background: i === 3 || i === 5 ? "#1b75bc" : "#dbeafe", borderRadius: "3px 3px 0 0", height: `${h}%` }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9ca3af" }}>
                <span>Tamamlanma oranı</span>
                <span style={{ fontWeight: 700, color: "#1b75bc" }}>%78 ↑</span>
              </div>
            </div>

            {/* Multiplayer */}
            <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", border: "1px solid rgba(192,199,210,0.55)", boxShadow: shadowCard, borderRadius: 16, padding: 22 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Rekabet & Multiplayer</h3>
              <p style={{ fontSize: 12, color: "#717882", marginBottom: 12 }}>1v1 düello, sınıf quizi, şampiyona.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 7, padding: "7px 11px", fontSize: 11, fontWeight: 600, color: "#ea580c", display: "flex", alignItems: "center", gap: 7 }}>
                  <Swords style={{ width: 12, height: 12 }} /> 1v1 Kelime Düellosu
                </div>
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 7, padding: "7px 11px", fontSize: 11, fontWeight: 600, color: "#16a34a", display: "flex", alignItems: "center", gap: 7 }}>
                  <Users style={{ width: 12, height: 12 }} /> Sınıf Kahoot Quizi
                </div>
                <div style={{ background: "#fefce8", border: "1px solid #fde68a", borderRadius: 7, padding: "7px 11px", fontSize: 11, fontWeight: 600, color: "#ca8a04", display: "flex", alignItems: "center", gap: 7 }}>
                  <Trophy style={{ width: 12, height: 12 }} /> Haftalık Şampiyona
                </div>
              </div>
            </div>

            {/* Hybrid curriculum */}
            <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(14px)", border: "1px solid rgba(192,199,210,0.55)", boxShadow: shadowCard, borderRadius: 16, padding: 22 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>Hibrit Müfredat</h3>
              <p style={{ fontSize: 12, color: "#717882", marginBottom: 12 }}>Fiziksel kitap + dijital platform, entegre.</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "#f3f4f6", borderRadius: 8, border: "1px solid #e5e7eb" }}>
                <div style={{ width: 32, height: 42, background: "linear-gradient(135deg,#1b75bc,#005c99)", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <BookOpen style={{ width: 14, height: 14, color: "white" }} />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1e1b1c" }}>Kitap Kodu Aktivasyonu</div>
                  <div style={{ fontSize: 10, color: "#9ca3af" }}>6 ay premium — anında aktif</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Activity Types — geçici olarak kapatıldı
      <section style={{ background: "#eff6ff", padding: "72px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 40px" }}>
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fff", color: "#414751", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", padding: "4px 12px", borderRadius: 999, marginBottom: 10, border: "1px solid #e5e7eb" }}>ETKİNLİK TİPLERİ</div>
            <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 800, letterSpacing: "-0.025em" }}>20+ Farklı Öğrenme Formatı</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>
            {activityTypes.map((a) => (
              <div
                key={a.label}
                style={{
                  background: a.bg,
                  border: `1px ${(a as { dashed?: boolean }).dashed ? "dashed" : "solid"} ${a.border}`,
                  borderRadius: 10,
                  padding: "14px 10px",
                  textAlign: "center",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                  <a.icon style={{ width: 18, height: 18, color: a.color }} />
                </div>
                <div style={{ fontSize: 10, fontWeight: 600, color: a.color }}>{a.label}</div>
                {(a as { soon?: boolean }).soon && <div style={{ fontSize: 9, color: "#93c5fd", marginTop: 2 }}>Yakında</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* Book Series */}
      <section id="kitaplar" style={{ background: "#ffffff", padding: "72px 0" }}>
        <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: "0 auto" }}>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 36, flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#eef0f3", color: "#414751", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", padding: "4px 12px", borderRadius: 999, marginBottom: 10 }}>NEVAİ YAYINLARI</div>
              <h2 style={{ fontSize: "clamp(22px,3vw,36px)", fontWeight: 800, letterSpacing: "-0.025em" }}>Öne Çıkan Kitap Serisi</h2>
            </div>
            <a href="#" style={{ fontSize: 13, fontWeight: 600, color: "#1b75bc", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              Tüm kitaplar <ArrowRight style={{ width: 13, height: 13 }} />
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: 20 }}>
            {books.map((b) => (
              <div key={b.name} style={{ borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb", boxShadow: shadowCard, display: "flex", flexDirection: "column" }}>

                {/* Üst renk band */}
                <div style={{ background: b.color, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.90)" }}>{b.levelLabel}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.60)", marginTop: 1 }}>{b.subLabel}</div>
                  </div>
                  <span style={{ background: "rgba(255,255,255,0.18)", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 999, flexShrink: 0 }}>{b.cefr}</span>
                </div>

                {/* Kitap kapakları galerisi */}
                <div style={{ background: b.colorLight, padding: "20px 20px 16px", display: "flex", gap: 8, overflowX: "auto" }} className="scrollbar-none">
                  {b.imgs.map((src, i) => (
                    <div key={i} style={{ width: 64, height: 90, borderRadius: 6, flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.18)" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} alt={`${b.name} ${i + 1}`} />
                    </div>
                  ))}
                </div>

                {/* İçerik */}
                <div style={{ padding: "16px 20px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                  <h3 style={{ fontSize: 20, fontWeight: 900, color: "#1e1b1c", marginBottom: 2, letterSpacing: "-0.02em" }}>{b.name}</h3>
                  <p style={{ fontSize: 12, color: "#9ca3af", marginBottom: 14 }}>Nevai Yayınları — Türkçe Öğretim Seti</p>

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
                      Satın Al <ArrowRight style={{ width: 12, height: 12 }} />
                    </button>
                    <button style={{ flex: 1, background: "#f3f4f6", color: "#414751", fontSize: 12, fontWeight: 600, padding: "10px 0", borderRadius: 8, border: "1px solid #e5e7eb", cursor: "pointer" }}>
                      İncele
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
            <div style={{ display: "inline-flex", background: "#fff", color: "#414751", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", padding: "4px 12px", borderRadius: 999, marginBottom: 10, border: "1px solid #e5e7eb" }}>FİYATLANDIRMA</div>
            <h2 style={{ fontSize: "clamp(22px,3vw,38px)", fontWeight: 800, letterSpacing: "-0.025em", marginBottom: 8 }}>Şeffaf lisans seçenekleri</h2>
            <p style={{ fontSize: 15, color: "#717882" }}>Bireysel öğrenciden kampüse, her ölçeğe uygun plan.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4" style={{ gap: 12, marginBottom: 12 }}>

            {/* Free */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 22, border: "1px solid #e5e7eb", boxShadow: shadowCard }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#9ca3af", marginBottom: 10 }}>BİREYSEL</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#1e1b1c", lineHeight: 1, marginBottom: 4 }}>Ücretsiz</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Sonsuza kadar</div>
              <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", marginBottom: 16 }} />
              <ul style={{ fontSize: 12, color: "#414751", listStyle: "none", padding: 0, marginBottom: 20 }}>
                {[
                  { label: "5 kalp / gün", ok: true },
                  { label: "1 ünite içerik", ok: true },
                  { label: "Temel etkinlikler", ok: true },
                  { label: "AI Stüdyo", ok: false },
                  { label: "Sınıf yönetimi", ok: false },
                ].map(({ label, ok }) => (
                  <li key={label} style={{ marginBottom: 7, display: "flex", alignItems: "center", gap: 7, color: ok ? "#414751" : "#d1d5db" }}>
                    {ok
                      ? <Check style={{ width: 12, height: 12, color: "#16a34a", flexShrink: 0 }} />
                      : <X style={{ width: 12, height: 12, color: "#d1d5db", flexShrink: 0 }} />}
                    {label}
                  </li>
                ))}
              </ul>
              <button style={{ width: "100%", padding: 9, borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Başla</button>
            </div>

            {/* Premium */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 22, border: "1px solid #e5e7eb", boxShadow: shadowCard }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#9ca3af", marginBottom: 10 }}>PREMİUM BİREYSEL</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#1e1b1c", lineHeight: 1, marginBottom: 2 }}>£9.99</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 1 }}>aylık</div>
              <div style={{ fontSize: 11, color: "#c0c7d2", marginBottom: 16 }}>veya £79.99 / yıl</div>
              <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", marginBottom: 16 }} />
              <ul style={{ fontSize: 12, color: "#414751", listStyle: "none", padding: 0, marginBottom: 20 }}>
                {["Sınırsız kalp", "Tüm içerikler", "Tüm etkinlik tipleri", "Streak koruması"].map((label) => (
                  <li key={label} style={{ marginBottom: 7, display: "flex", alignItems: "center", gap: 7 }}>
                    <Check style={{ width: 12, height: 12, color: "#16a34a", flexShrink: 0 }} />{label}
                  </li>
                ))}
                <li style={{ display: "flex", alignItems: "center", gap: 7, color: "#d1d5db" }}>
                  <X style={{ width: 12, height: 12, color: "#d1d5db", flexShrink: 0 }} />AI Stüdyo
                </li>
              </ul>
              <button style={{ width: "100%", padding: 9, borderRadius: 7, border: "1px solid #dbeafe", background: "#eff6ff", fontSize: 12, fontWeight: 600, color: "#1b75bc", cursor: "pointer" }}>Abone Ol</button>
            </div>

            {/* Kurumsal Pro — highlighted */}
            <div style={{ background: "#1b75bc", borderRadius: 12, padding: 22, position: "relative", boxShadow: shadowBlue }}>
              <div style={{ position: "absolute", top: -10, left: 18, background: "#fff", color: "#1b75bc", fontSize: 9, fontWeight: 800, letterSpacing: "0.05em", padding: "3px 10px", borderRadius: 999 }}>ÖNERİLEN</div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.55)", marginBottom: 10 }}>KURUMSAL PRO</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#fff", lineHeight: 1, marginBottom: 2 }}>€20</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 1 }}>öğretmen / ay</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>+ öğrenci lisansları</div>
              <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.12)", marginBottom: 16 }} />
              <ul style={{ fontSize: 12, color: "rgba(255,255,255,0.82)", listStyle: "none", padding: 0, marginBottom: 20 }}>
                {["AI İçerik Stüdyosu", "Sınıf yönetimi", "Analitik paneli", "Kahoot modu", "10 lisans ücretsiz"].map((label) => (
                  <li key={label} style={{ marginBottom: 7, display: "flex", alignItems: "center", gap: 7 }}>
                    <Check style={{ width: 12, height: 12, color: "#57dffe", flexShrink: 0 }} />{label}
                  </li>
                ))}
              </ul>
              <button style={{ width: "100%", padding: 9, borderRadius: 7, background: "#fff", color: "#1b75bc", fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer" }}>Ücretsiz Dene</button>
            </div>

            {/* Campus */}
            <div style={{ background: "#fff", borderRadius: 12, padding: 22, border: "1px solid #e5e7eb", boxShadow: shadowCard }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#9ca3af", marginBottom: 10 }}>KAMPÜS / KURUM</div>
              <div style={{ fontSize: 30, fontWeight: 900, color: "#1e1b1c", lineHeight: 1, marginBottom: 4 }}>Özel</div>
              <div style={{ fontSize: 12, color: "#9ca3af", marginBottom: 16 }}>Fiyat görüşme</div>
              <hr style={{ border: "none", borderTop: "1px solid #f0f0f0", marginBottom: 16 }} />
              <ul style={{ fontSize: 12, color: "#414751", listStyle: "none", padding: 0, marginBottom: 20 }}>
                {["Kurumsal Pro (tümü)", "Sınırsız öğretmen", "Özel entegrasyon", "Öncelikli destek", "Kitap kodu paketi"].map((label) => (
                  <li key={label} style={{ marginBottom: 7, display: "flex", alignItems: "center", gap: 7 }}>
                    <Check style={{ width: 12, height: 12, color: "#16a34a", flexShrink: 0 }} />{label}
                  </li>
                ))}
              </ul>
              <button style={{ width: "100%", padding: 9, borderRadius: 7, border: "1px solid #e5e7eb", background: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>İletişime Geç</button>
            </div>

          </div>

          <div style={{ background: "#fff", borderRadius: 10, padding: "14px 18px", border: "1px solid #e5e7eb", boxShadow: shadowCard, display: "flex", alignItems: "center", gap: 12 }}>
            <Package style={{ width: 18, height: 18, color: "#1b75bc", flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "#414751", margin: 0 }}>
              Nevai Yayınları kitap setlerinde <strong>6 aylık Premium erişim kodu</strong> bulunur. Kurumsal alımlarda özel paketler için iletişime geçin.
            </p>
          </div>
        </div>
      </section>

      {/* Son CTA */}
      <section style={{ background: "linear-gradient(135deg,#1e3a5f 0%,#1b75bc 60%,#0ea5e9 100%)", padding: "80px 0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: "radial-gradient(circle,rgba(255,255,255,0.06),transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -80, left: -60, width: 320, height: 320, background: "radial-gradient(circle,rgba(87,223,254,0.08),transparent 65%)", pointerEvents: "none" }} />
        <div className="px-4 md:px-10" style={{ maxWidth: 680, margin: "0 auto", textAlign: "center", position: "relative" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.18)", color: "rgba(255,255,255,0.9)", fontSize: 10, fontWeight: 700, letterSpacing: "0.07em", padding: "4px 14px", borderRadius: 999, marginBottom: 20 }}>
            ÜCRETSİZ BAŞLA
          </div>
          <h2 style={{ fontSize: "clamp(26px,3.5vw,44px)", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 16 }}>
            Okulunuz için ilk adımı<br />bugün atın.
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.72)", marginBottom: 36, lineHeight: "26px" }}>
            1 öğretmen, 10 öğrenci — kurulum 5 dakika. Kredi kartı gerekmez.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link
              href="/kayit?tip=kurumsal"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", color: "#1b75bc", fontSize: 14, fontWeight: 700, padding: "13px 26px", borderRadius: 10, textDecoration: "none" }}
            >
              Kurumsal Ücretsiz Başla <ArrowRight style={{ width: 15, height: 15 }} />
            </Link>
            <Link
              href="/kayit?tip=bireysel"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)", color: "#fff", fontSize: 14, fontWeight: 600, padding: "13px 26px", borderRadius: 10, textDecoration: "none" }}
            >
              Öğrenci Kaydı
            </Link>
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 20 }}>
            Zaten hesabın var mı? <Link href="/giris" style={{ color: "rgba(255,255,255,0.65)", textDecoration: "underline" }}>Giriş yap</Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "#1e1b1c", padding: "60px 0 28px" }}>
        <div className="px-4 md:px-10" style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: 40, marginBottom: 44 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "baseline", userSelect: "none", marginBottom: 12, lineHeight: 1 }}>
                <span style={{ fontSize: 19, fontWeight: 900, color: "#1b75bc" }}>[</span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>TÜRKÇEOKULU</span>
                <span style={{ fontSize: 19, fontWeight: 900, color: "#1b75bc" }}>]</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", maxWidth: 240, lineHeight: "20px", marginBottom: 18 }}>
                Nevai Yayınları&apos;nın 25+ yıllık birikimini modern teknoloji ile buluşturan platform.
              </p>
              <Link href="/kayit" style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "#1b75bc", color: "#fff", fontSize: 12, fontWeight: 600, padding: "9px 16px", borderRadius: 7, textDecoration: "none" }}>
                Ücretsiz Başla <ArrowRight style={{ width: 12, height: 12 }} />
              </Link>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.28)", marginBottom: 14 }}>PLATFORM</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {["AI Stüdyo", "Gamification", "Analitik", "Multiplayer"].map((item) => (
                  <li key={item} style={{ marginBottom: 8 }}>
                    <a href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.28)", marginBottom: 14 }}>KURUMSAL</div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {["Fiyatlandırma", "Kitap Serisi", "Demo Talep Et", "İletişim"].map((item) => (
                  <li key={item} style={{ marginBottom: 8 }}>
                    <a href="#" style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", textDecoration: "none" }}>{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>©2026 Türkçe Okulu — Nevai Yayınları</div>
            <div style={{ display: "flex", gap: 16 }}>
              {["Gizlilik", "Kullanım Koşulları", "İletişim"].map((item) => (
                <a key={item} href="#" style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>{item}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
