"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link, useLocale, useRouter } from "@/navigation";
import {
  Eye, EyeOff, ArrowRight,
  Building2, GraduationCap, Zap, Users, BookOpen, Brain,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";

type Tab = "kurumsal" | "bireysel";

const KURUMSAL_BENEFITS = [
  { Icon: Zap,       text: "AI stüdyo ile 30 saniyede quiz üret" },
  { Icon: Users,     text: "1 öğretmen + 10 öğrenci ücretsiz" },
  { Icon: BookOpen,  text: "CEFR A1–C1 tam müfredat erişimi" },
  { Icon: Brain,     text: "Sınıf analitiği ve ilerleme takibi" },
];

const BIREYSEL_BENEFITS = [
  { Icon: Brain,     text: "AI ile kişisel seviye testi" },
  { Icon: BookOpen,  text: "Seviyene uygun kitap ve etkinlikler" },
  { Icon: Zap,       text: "XP kazan, liglerde yüksel" },
  { Icon: Users,     text: "Diğer öğrencilerle düello ve rekabet" },
];

function KayitForm() {
  const searchParams = useSearchParams();
  const initialTab: Tab = searchParams.get("tip") === "bireysel" ? "bireysel" : "kurumsal";

  const router = useRouter();
  const locale = useLocale();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [tab, setTab] = useState<Tab>(initialTab);
  const [form, setForm] = useState({ name: "", surname: "", email: "", password: "", kurumAdi: "", kurumKodu: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const field = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function formatKurumKodu(raw: string) {
    // Sadece harf+rakam al, büyük yap, 0/O/1/I/L çıkar, max 10 char
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/[01IL]/g, "");
    // XX-XXXX-XXXX formatına sok
    const p1 = clean.slice(0, 2);
    const p2 = clean.slice(2, 6);
    const p3 = clean.slice(6, 10);
    return [p1, p2, p3].filter(Boolean).join("-");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password.length < 6) { setError("Şifre en az 6 karakter olmalıdır."); return; }
    setError("");
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        surname: form.surname,
        email: form.email,
        password: form.password,
        role: tab === "kurumsal" ? "teacher" : "student",
        ...(tab === "kurumsal" && form.kurumAdi ? { kurumAdi: form.kurumAdi } : {}),
        ...(tab === "kurumsal" && form.kurumKodu ? { kurumKodu: form.kurumKodu.toUpperCase() } : {}),
      };
      const { data } = await api.post("/api/auth/register", payload);
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.push(tab === "kurumsal" ? "/ogretmen" : "/seviye-testi", { locale });
    } catch (err) {
      const d = (err as { response?: { data?: unknown } }).response?.data;
      setError(typeof d === "string" ? d : "Kayıt başarısız. Lütfen tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  const benefits = tab === "kurumsal" ? KURUMSAL_BENEFITS : BIREYSEL_BENEFITS;

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>

      {/* Sol panel — marka */}
      <div
        style={{
          width: "42%",
          background: "linear-gradient(155deg,#1e3a5f 0%,#1b75bc 55%,#0ea5e9 100%)",
          padding: "48px 48px",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
        className="hidden lg:flex"
      >
        {/* Glow blobs */}
        <div style={{ position: "absolute", top: -80, right: -80, width: 320, height: 320, background: "radial-gradient(circle,rgba(255,255,255,0.07),transparent 65%)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: -60, left: -40, width: 260, height: 260, background: "radial-gradient(circle,rgba(87,223,254,0.1),transparent 65%)", pointerEvents: "none" }} />

        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", marginBottom: 56 }}>
          <span style={{ display: "inline-flex", alignItems: "baseline", userSelect: "none" }}>
            <span style={{ fontSize: 20, fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>[</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>TÜRKÇEOKULU</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: "rgba(255,255,255,0.7)" }}>]</span>
          </span>
        </Link>

        {/* Başlık */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.55)", marginBottom: 12 }}>
            {tab === "kurumsal" ? "KURUMSAL HESAP" : "BİREYSEL HESAP"}
          </div>
          <h2 style={{ fontSize: "clamp(22px,2.4vw,32px)", fontWeight: 900, color: "#fff", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 12 }}>
            {tab === "kurumsal"
              ? <>Okulunuz için<br />ücretsiz başlayın.</>
              : <>Türkçenizi<br />geliştirin.</>}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: "21px", marginBottom: 36, maxWidth: 280 }}>
            {tab === "kurumsal"
              ? "1 öğretmen, 10 öğrenci — kredi kartı gerekmez, 5 dakikada kurulum."
              : "AI destekli seviye testi, CEFR müfredatı ve gamification ile Türkçe öğrenin."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {benefits.map(({ Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 14, height: 14, color: "#57dffe" }} />
                </div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.82)", lineHeight: "18px" }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Alt — stat */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.12)", paddingTop: 24, display: "flex", gap: 28 }}>
          {[{ val: "53k+", label: "Mezun" }, { val: "30+", label: "Ülke" }, { val: "A1–C1", label: "CEFR" }].map((s) => (
            <div key={s.label}>
              <div style={{ fontSize: 18, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ panel — form */}
      <div style={{ flex: 1, background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          {/* Mobil logo */}
          <div className="lg:hidden" style={{ marginBottom: 20, textAlign: "center" }}>
            <Link href="/" style={{ textDecoration: "none" }}>
              <Logo size="md" />
            </Link>
          </div>

          {/* Mobil mavi banner — sol panelin özeti, aç/kapat */}
          <MobileBenefitsBanner tab={tab} benefits={benefits} />

          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#1e1b1c", marginBottom: 4, letterSpacing: "-0.02em" }}>Hesap Oluştur</h1>
          <p style={{ fontSize: 13, color: "#717882", marginBottom: 24 }}>Ücretsiz başla, hemen kullanmaya başla.</p>

          {/* Tab seçimi */}
          <div style={{ display: "flex", background: "#f0f2f5", borderRadius: 10, padding: 4, gap: 4, marginBottom: 28 }}>
            {([
              { key: "kurumsal", Icon: Building2,    label: "Öğretmenim",  sub: "Kurumsal" },
              { key: "bireysel", Icon: GraduationCap, label: "Öğrenciyim", sub: "Bireysel" },
            ] as const).map(({ key, Icon, label, sub }) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "10px 12px",
                  borderRadius: 7,
                  border: "none",
                  cursor: "pointer",
                  background: tab === key ? "#fff" : "transparent",
                  boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  transition: "all 0.15s",
                }}
              >
                <Icon style={{ width: 15, height: 15, color: tab === key ? "#1b75bc" : "#9ca3af", flexShrink: 0 }} />
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: tab === key ? "#1e1b1c" : "#9ca3af", lineHeight: 1 }}>{label}</div>
                  <div style={{ fontSize: 10, color: tab === key ? "#1b75bc" : "#c0c7d2", marginTop: 1 }}>{sub}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Tab'a özel alan — sabit yükseklik, ortak alanları kaydırmaz */}
            <div style={{ minHeight: 96 }}>
              {tab === "kurumsal" ? (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#414751", marginBottom: 5 }}>
                      Kurum Adı
                      <span style={{ fontSize: 10, fontWeight: 400, color: "#9ca3af", marginLeft: 5 }}>isteğe bağlı</span>
                    </label>
                    <Input
                      type="text"
                      value={form.kurumAdi}
                      onChange={field("kurumAdi")}
                      placeholder="Ankara Türkçe Dil Okulu"
                      autoComplete="organization"
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#414751", marginBottom: 5 }}>
                      Kurum Kodu
                      <span style={{ fontSize: 10, fontWeight: 400, color: "#9ca3af", marginLeft: 5 }}>lisans varsa</span>
                    </label>
                    <Input
                      type="text"
                      value={form.kurumKodu}
                      onChange={(e) => setForm((f) => ({ ...f, kurumKodu: formatKurumKodu(e.target.value) }))}
                      placeholder="TR-ANKA-X4K9"
                      maxLength={11}
                      style={{ letterSpacing: "0.06em", fontSize: 12, fontFamily: "monospace" }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, padding: "9px 13px", display: "flex", alignItems: "center", gap: 8 }}>
                    <Brain style={{ width: 13, height: 13, color: "#16a34a", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#15803d" }}>Kayıt sonrası AI seviye testiyle sana uygun kitaplar önerilecek.</span>
                  </div>
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "9px 13px", display: "flex", alignItems: "center", gap: 8 }}>
                    <Users style={{ width: 13, height: 13, color: "#2563eb", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#1d4ed8" }}>Bir okul veya kurumdan mı geliyorsun? <strong>Öğretmeninden sınıf kodunu iste</strong>, seni sınıfına eklesin.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Ortak alanlar — tab değişse de sabit konumda */}
            <div className="grid grid-cols-2" style={{ gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#414751", marginBottom: 5 }}>Ad</label>
                <Input type="text" value={form.name} onChange={field("name")} required placeholder="Ahmet" autoComplete="given-name" />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#414751", marginBottom: 5 }}>Soyad</label>
                <Input type="text" value={form.surname} onChange={field("surname")} required placeholder="Yılmaz" autoComplete="family-name" />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#414751", marginBottom: 5 }}>E-posta</label>
              <Input type="email" value={form.email} onChange={field("email")} required placeholder="ornek@email.com" autoComplete="email" />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#414751", marginBottom: 5 }}>Şifre</label>
              <div style={{ position: "relative" }}>
                <Input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={field("password")}
                  required
                  placeholder="En az 6 karakter"
                  autoComplete="new-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", display: "flex" }}
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                </button>
              </div>
            </div>

            {error && (
              <p style={{ fontSize: 12, color: "#dc2626", background: "#fee2e2", padding: "8px 12px", borderRadius: 7, border: "1px solid #fecaca" }}>{error}</p>
            )}

            <Button type="submit" disabled={loading} style={{ width: "100%", background: "#1b75bc", color: "#fff", fontWeight: 700, padding: "12px", borderRadius: 9, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 2 }}>
              {loading ? "Kaydediliyor…" : (
                <>
                  {tab === "kurumsal" ? "Kurumsal Hesap Oluştur" : "Ücretsiz Kaydol"}
                  <ArrowRight style={{ width: 15, height: 15 }} />
                </>
              )}
            </Button>
          </form>

          <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af", marginTop: 20 }}>
            Zaten hesabın var mı?{" "}
            <Link href="/giris" style={{ color: "#1b75bc", fontWeight: 600, textDecoration: "none" }}>Giriş yap</Link>
          </p>

          <p style={{ textAlign: "center", fontSize: 10, color: "#c0c7d2", marginTop: 16, lineHeight: "16px" }}>
            Kayıt olarak{" "}
            <a href="#" style={{ color: "#9ca3af", textDecoration: "underline" }}>Kullanım Koşulları</a>
            {" "}ve{" "}
            <a href="#" style={{ color: "#9ca3af", textDecoration: "underline" }}>Gizlilik Politikası</a>
            {" "}kabul edilmiş sayılır.
          </p>
        </div>
      </div>
    </div>
  );
}

function MobileBenefitsBanner({ tab, benefits }: { tab: Tab; benefits: { Icon: React.ComponentType<{ style?: React.CSSProperties }>; text: string }[] }) {
  const [open, setOpen] = useState(false);
  const title = tab === "kurumsal" ? "Kurumsal Hesap Avantajları" : "Bireysel Hesap Avantajları";
  const sub = tab === "kurumsal" ? "1 öğretmen, 10 öğrenci — ücretsiz" : "AI seviye testi ve CEFR müfredatı";

  return (
    <div
      className="lg:hidden"
      style={{
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 24,
        background: "linear-gradient(135deg,#1e3a5f 0%,#1b75bc 60%,#0ea5e9 100%)",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#fff",
        }}
      >
        <Zap style={{ width: 14, height: 14, fill: "#fff", flexShrink: 0 }} />
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{title}</div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 1 }}>{sub}</div>
        </div>
        {open
          ? <ChevronUp style={{ width: 16, height: 16, color: "rgba(255,255,255,0.7)", flexShrink: 0 }} />
          : <ChevronDown style={{ width: 16, height: 16, color: "rgba(255,255,255,0.7)", flexShrink: 0 }} />
        }
      </button>

      {open && (
        <div style={{ padding: "4px 16px 14px", borderTop: "1px solid rgba(255,255,255,0.12)", display: "flex", flexDirection: "column", gap: 10 }}>
          {benefits.map(({ Icon, text }) => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 6, background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon style={{ width: 12, height: 12, color: "#57dffe" }} />
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function KayitPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#f9fafb" }} />}>
      <KayitForm />
    </Suspense>
  );
}
