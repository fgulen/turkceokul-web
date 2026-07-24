"use client";

import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useLocale, useRouter } from "@/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Check,
  Building2, GraduationCap, Zap, Users, BookOpen, Brain,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurkishLetterBackdrop } from "@/components/turkish-letter-backdrop";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { safeRedirect } from "@/lib/safe-redirect";
import { cn, gecerliIsimMi } from "@/lib/utils";

type Tab = "kurumsal" | "bireysel";
type Step = 1 | 2 | 3;
type NativeLangValue = "ku" | "ru" | "ar" | "en" | "none";
type Benefit = { Icon: React.ComponentType<{ className?: string }>; text: string };

const KURUMSAL_BENEFITS: Benefit[] = [
  { Icon: Zap,      text: "auth.register.benefitsCorporate.0" },
  { Icon: Users,    text: "auth.register.benefitsCorporate.1" },
  { Icon: BookOpen, text: "auth.register.benefitsCorporate.2" },
  { Icon: Brain,    text: "auth.register.benefitsCorporate.3" },
];

// "AI ile kişisel seviye testi" maddesi bilinçli olarak yok — bireysel kullanım
// henüz kapalı, vaadimiz olmayan özellik vitrine yazılmaz (kullanıcı kararı, 2026-07-16).
const BIREYSEL_BENEFITS: Benefit[] = [
  { Icon: BookOpen, text: "auth.register.benefitsIndividual.0" },
  { Icon: Zap,      text: "auth.register.benefitsIndividual.1" },
  { Icon: Users,    text: "auth.register.benefitsIndividual.2" },
];

const GENEL_BENEFITS: Benefit[] = [
  { Icon: Zap,      text: "auth.register.benefitsGeneral.0" },
  { Icon: BookOpen, text: "auth.register.benefitsGeneral.1" },
  { Icon: Brain,    text: "auth.register.benefitsGeneral.2" },
];

// Bayrak/emoji bilinçli olarak yok: Windows'ta emoji bayraklar harf koduna düşüyor
// ve kart üç görsel katmanla karmaşıklaşıyordu (kullanıcı kararı, 2026-07-16).
const NATIVE_LANGS: { code: NativeLangValue; nativeName: string; labelKey: string }[] = [
  { code: "ku", nativeName: "کوردی",   labelKey: "auth.register.nativeLangKurdish" },
  { code: "ru", nativeName: "Русский", labelKey: "auth.register.nativeLangRussian" },
  { code: "ar", nativeName: "العربية", labelKey: "auth.register.nativeLangArabic" },
  { code: "en", nativeName: "English", labelKey: "auth.register.nativeLangEnglish" },
];

const DIL_SECENEKLERI = [
  ...NATIVE_LANGS,
  { code: "none" as const, nativeName: "Türkçe / Diğer", labelKey: "auth.register.nativeLangSkip" },
];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 28 : -28, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -28 : 28, opacity: 0 }),
};

function KayitForm() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const tipParam = searchParams.get("tip");
  const initialTab: Tab | null =
    tipParam === "bireysel" ? "bireysel"
    // "ogretmen" öğretmen sayfalarının CTA'sı (for-teachers/ogretmenler) — kurumsal = öğretmen
    // rolü. Eşlenmezse rol seçili gelmiyor, kullanıcı rol adımında takılıyordu.
    : (tipParam === "kurumsal" || tipParam === "kurumsal-pro" || tipParam === "ogretmen") ? "kurumsal"
    : null;
  const redirectAfter = searchParams.get("redirect") ?? "";

  const router = useRouter();
  const locale = useLocale();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>(initialTab ? 2 : 1);
  const [direction, setDirection] = useState(1);
  const [tab, setTab] = useState<Tab | null>(initialTab);
  const [nativeLanguage, setNativeLanguage] = useState<NativeLangValue | null>(null);
  const [form, setForm] = useState({ name: "", surname: "", email: "", password: "", kurumAdi: "", kurumKodu: "" });
  const [kurumOpen, setKurumOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const field = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  function formatKurumKodu(raw: string) {
    const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "").replace(/[01IL]/g, "");
    const p1 = clean.slice(0, 2);
    const p2 = clean.slice(2, 6);
    const p3 = clean.slice(6, 10);
    return [p1, p2, p3].filter(Boolean).join("-");
  }

  function goToStep(next: Step) {
    // Rol 1. adım ve zorunlu — seçilmeden dil (2) veya bilgi (3) adımına geçilemez.
    // Aksi halde StepIndicator'dan dil adımına atlayıp dil seçince 3. adım boş kalıyordu.
    if (next >= 2 && !tab) return;
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function selectLanguage(code: NativeLangValue) {
    setNativeLanguage(code);
    setDirection(1);
    setStep(tab ? 3 : 1); // rol yoksa bilgi adımı boş kalır — rol adımına geri dön
  }

  function selectRole(role: Tab) {
    setTab(role);
    setDirection(1);
    setStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tab) return;
    if (!gecerliIsimMi(form.name) || !gecerliIsimMi(form.surname)) {
      setError(t("auth.register.errorInvalidName"));
      return;
    }
    if (form.password.length < 8) { setError(t("auth.register.errorShortPassword")); return; }
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
        ...(nativeLanguage && nativeLanguage !== "none" ? { nativeLanguage } : {}),
      };
      const { data } = await api.post("/api/auth/register", payload);
      setAuth(data.user, data.accessToken);
      const safeAfter = safeRedirect(redirectAfter);
      if (tab === "bireysel" && safeAfter) {
        window.location.href = safeAfter;
        return;
      }
      // Bireysel öğrenci panoya gider — bireysel kullanım kapalı, öğrenci içeriği
      // öğretmenin sınıfa atadığı kitap üzerinden görür (kullanıcı kararı, 2026-07-16).
      router.push(tab === "kurumsal" ? "/ogretmen" : "/pano", { locale });
    } catch (err) {
      const d = (err as { response?: { data?: unknown } }).response?.data;
      setError(typeof d === "string" ? d : t("auth.register.errorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  const leftBenefits = tab === "kurumsal" ? KURUMSAL_BENEFITS : tab === "bireysel" ? BIREYSEL_BENEFITS : GENEL_BENEFITS;

  return (
    <div className="flex min-h-dvh">

      {/* Sol panel — marka */}
      <div className="hidden lg:flex w-[42%] flex-col relative overflow-hidden bg-gradient-to-br from-[#1e3a5f] via-primary to-[#0ea5e9] p-12">
        <Link href="/" className="mb-14 inline-flex items-baseline select-none">
          <span className="text-[22px] font-black leading-none text-white/70">[</span>
          <span className="text-[17px] font-extrabold leading-none tracking-tight text-white">TÜRKÇEOKULU</span>
          <span className="text-[22px] font-black leading-none text-white/70">]</span>
        </Link>

        <div className="flex-1">
          <div className="mb-3 text-xs font-bold tracking-widest text-white/55">
            {tab === "kurumsal" ? t("auth.register.badgeCorporate") : tab === "bireysel" ? t("auth.register.badgeIndividual") : t("auth.register.badgeDefault")}
          </div>
          <h2 className="type-display tracking-tight text-white mb-3.5">
            {tab === "kurumsal"
              ? t.rich("auth.register.leftTitleCorporate", { br: () => <br /> })
              : tab === "bireysel"
              ? t.rich("auth.register.leftTitleIndividual", { br: () => <br /> })
              : t.rich("auth.register.leftTitleDefault", { br: () => <br /> })}
          </h2>
          <p className="mb-9 max-w-[280px] text-base leading-relaxed text-white/65">
            {tab === "kurumsal"
              ? t("auth.register.leftDescCorporate")
              : tab === "bireysel"
              ? t("auth.register.leftDescIndividual")
              : t("auth.register.leftDescDefault")}
          </p>

          <div className="flex flex-col gap-4">
            {leftBenefits.map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <Icon className="h-4 w-4 text-[#57dffe]" />
                </div>
                <span className="text-[15px] leading-snug text-white/85">{t(text)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-7 border-t border-white/10 pt-6">
          {[{ val: "53k+", labelKey: "auth.register.statsGraduates" }, { val: "30+", labelKey: "auth.register.statsCountries" }, { val: "A1–C1", label: "CEFR" }].map((s) => (
            <div key={s.labelKey ?? s.label}>
              <div className="text-[22px] font-black leading-none text-white">{s.val}</div>
              <div className="mt-1 text-xs text-white/50">{s.labelKey ? t(s.labelKey) : s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sağ panel — form */}
      <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gray-50 px-6 py-10">
        <TurkishLetterBackdrop variant="kayit" fixed={false} />

        <div className="relative z-10 w-full max-w-[460px]">

          <div className="mb-6 text-center lg:hidden">
            <Link href="/">
              <Logo size="md" />
            </Link>
          </div>

          <StepIndicator step={step} onJump={goToStep} />

          {/* Geri butonu her adımda yer kaplar (adım 1'de görünmez) — koşullu render
              adım geçişlerinde altındaki tüm içeriği ~52px zıplatıyordu (flicker). */}
          <button
            type="button"
            onClick={() => goToStep((step - 1) as Step)}
            aria-hidden={step === 1}
            tabIndex={step === 1 ? -1 : 0}
            className={cn(
              "mb-4 inline-flex h-9 items-center gap-1.5 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-700",
              step === 1 && "invisible"
            )}
          >
            <ArrowLeft className="h-4 w-4" /> {t("auth.register.back")}
          </button>

          <div className="relative min-h-[480px] overflow-hidden">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {step === 1 && (
                  <StepRol value={tab} onSelect={selectRole} />
                )}

                {step === 2 && (
                  <StepDil value={nativeLanguage} onSelect={selectLanguage} />
                )}

                {step === 3 && tab && (
                  <StepBilgi
                    tab={tab}
                    form={form}
                    field={field}
                    setForm={setForm}
                    formatKurumKodu={formatKurumKodu}
                    showPass={showPass}
                    setShowPass={setShowPass}
                    kurumOpen={kurumOpen}
                    setKurumOpen={setKurumOpen}
                    error={error}
                    loading={loading}
                    redirectAfter={redirectAfter}
                    onSubmit={handleSubmit}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <p className="mt-6 text-center text-[15px] text-slate-400">
            {t("auth.register.hasAccount")}{" "}
            <Link
              href="/giris"
              onClick={(e) => {
                e.preventDefault();
                const href = redirectAfter
                  ? `/giris?redirect=${encodeURIComponent(redirectAfter)}`
                  : '/giris';
                router.push(href, { locale });
              }}
              className="cursor-pointer font-semibold text-primary"
            >
              {t("auth.register.loginLink")}
            </Link>
          </p>

          <p className="mt-4 text-center text-[13px] leading-snug text-slate-300">
            {t.rich("auth.register.legal", {
              terms: (chunks) => <Link href="/kullanim-kosullari" className="text-slate-400 underline">{chunks}</Link>,
              privacy: (chunks) => <Link href="/gizlilik" className="text-slate-400 underline">{chunks}</Link>,
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ step, onJump }: { step: Step; onJump: (s: Step) => void }) {
  const t = useTranslations();
  const items: { n: Step; labelKey: string }[] = [
    { n: 1, labelKey: "auth.register.stepRol" },
    { n: 2, labelKey: "auth.register.stepLang" },
    { n: 3, labelKey: "auth.register.stepInfo" },
  ];
  return (
    <ol className="mb-6 flex items-center" aria-label={t("auth.register.stepAria")}>
      {items.map(({ n, labelKey }, i) => {
        const isCurrent = step === n;
        const isDone = n < step;
        return (
          <li key={n} className={cn("flex items-center", i < items.length - 1 && "flex-1")}>
            <button
              type="button"
              onClick={() => onJump(n)}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold transition-colors",
                isCurrent ? "bg-primary text-white"
                  : isDone ? "bg-primary/10 text-primary"
                  : "bg-slate-100 text-slate-400"
              )}
            >
              <span className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs",
                isCurrent ? "bg-white/25" : isDone ? "bg-primary/20" : "bg-slate-200"
              )}>
                {isDone ? <Check className="h-3 w-3" /> : n}
              </span>
              <span className="hidden sm:inline">{t(labelKey)}</span>
            </button>
            {i < items.length - 1 && (
              <span className={cn("mx-2 h-px flex-1", n < step ? "bg-primary/30" : "bg-slate-200")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function StepDil({ value, onSelect }: { value: NativeLangValue | null; onSelect: (code: NativeLangValue) => void }) {
  const t = useTranslations();
  return (
    <div>
      <h1 className="type-title tracking-tight text-slate-900 mb-1">{t("auth.register.nativeLangQuestion")}</h1>
      <p className="type-body text-slate-500 mb-6">{t("auth.register.nativeLangHelp")}</p>
      <div className="flex flex-col gap-2.5">
        {DIL_SECENEKLERI.map(({ code, nativeName, labelKey }) => {
          const selected = value === code;
          const rtl = code === "ar" || code === "ku";
          return (
            <button
              key={code}
              type="button"
              onClick={() => onSelect(code)}
              className={cn(
                "flex min-h-[56px] items-center justify-between rounded-xl border-2 px-5 py-3 transition-colors",
                selected ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <span
                dir={rtl ? "rtl" : "ltr"}
                className={cn("text-base font-bold leading-tight", selected ? "text-primary" : "text-slate-800")}
              >
                {nativeName}
              </span>
              <span className="text-sm text-slate-400">{t(labelKey)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepRol({ value, onSelect }: { value: Tab | null; onSelect: (t: Tab) => void }) {
  const t = useTranslations();
  const cards: { key: Tab; Icon: React.ComponentType<{ className?: string }>; titleKey: string; subKey: string; benefits: Benefit[] }[] = [
    { key: "bireysel", Icon: GraduationCap, titleKey: "auth.register.roleStudent", subKey: "auth.register.roleStudentSub", benefits: BIREYSEL_BENEFITS },
    { key: "kurumsal", Icon: Building2,     titleKey: "auth.register.roleTeacher", subKey: "auth.register.roleTeacherSub", benefits: KURUMSAL_BENEFITS },
  ];
  return (
    <div>
      <h1 className="type-title tracking-tight text-slate-900 mb-1">{t("auth.register.roleTitle")}</h1>
      <p className="type-body text-slate-500 mb-6">{t("auth.register.roleSubtitle")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map(({ key, Icon, titleKey, subKey, benefits }) => {
          const selected = value === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={cn(
                "flex min-h-[220px] flex-col items-start gap-3 rounded-2xl border-2 p-5 text-left transition-colors",
                selected ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <span className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl",
                selected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
              )}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-lg font-extrabold leading-tight text-slate-900">{t(titleKey)}</div>
                <div className="mt-0.5 text-sm text-slate-500">{t(subKey)}</div>
              </div>
              <ul className="mt-1 w-full space-y-1.5">
                {benefits.slice(0, 3).map(({ text }) => (
                  <li key={text} className="flex items-start gap-2 text-xs text-slate-500">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                    <span>{t(text)}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepBilgi({
  tab, form, field, setForm, formatKurumKodu,
  showPass, setShowPass, kurumOpen, setKurumOpen,
  error, loading, redirectAfter, onSubmit,
}: {
  tab: Tab;
  form: { name: string; surname: string; email: string; password: string; kurumAdi: string; kurumKodu: string };
  field: (k: "name" | "surname" | "email" | "password" | "kurumAdi" | "kurumKodu") => (e: React.ChangeEvent<HTMLInputElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<{ name: string; surname: string; email: string; password: string; kurumAdi: string; kurumKodu: string }>>;
  formatKurumKodu: (raw: string) => string;
  showPass: boolean;
  setShowPass: React.Dispatch<React.SetStateAction<boolean>>;
  kurumOpen: boolean;
  setKurumOpen: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  loading: boolean;
  redirectAfter: string;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const t = useTranslations();
  const sinifKatilRedirect = redirectAfter.startsWith('/') && !redirectAfter.startsWith('//') && redirectAfter.includes('/sinif/katil');

  return (
    <div>
      <h1 className="type-title tracking-tight text-slate-900 mb-1">{t("auth.register.infoTitle")}</h1>
      <p className="type-body text-slate-500 mb-6">
        {tab === "kurumsal" ? t("auth.register.infoSubCorporate") : t("auth.register.infoSubIndividual")}
      </p>

      {tab === "bireysel" && (
        sinifKatilRedirect ? (
          <div className="mb-4 flex items-start gap-3.5 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-primary p-4">
            <span className="shrink-0 text-2xl leading-none">🎉</span>
            <div>
            <div className="mb-1 text-sm font-extrabold text-white">{t("auth.register.infoClassCodeSuccess")}</div>
            <div className="text-xs leading-relaxed text-white/80">{t("auth.register.infoClassCodeDesc")}</div>
            </div>
          </div>
        ) : (
          <div className="mb-4 flex flex-col gap-2.5">
            {/* Bireysel kullanım henüz açık olmadığından AI seviye testi vaadi şimdilik gizli —
                bireysel plan canlıya çıkınca geri açılacak (kullanıcı kararı, 2026-07-16).
            <div className="flex items-center gap-2.5 rounded-lg border border-green-200 bg-green-50 px-3.5 py-2.5">
              <Brain className="h-[15px] w-[15px] shrink-0 text-green-600" />
              <span className="text-sm leading-tight text-green-700">Kayıt sonrası AI seviye testiyle sana uygun kitaplar önerilecek.</span>
            </div>
            */}
            <div className="flex items-center justify-between gap-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3.5 py-2.5">
              <div className="flex items-center gap-2.5">
                <Users className="h-[15px] w-[15px] shrink-0 text-blue-600" />
                <span className="text-sm leading-tight text-blue-700">{t("auth.register.infoClassCodePrompt")}</span>
                </div>
                <Link href="/sinif/katil" className="whitespace-nowrap border-b border-blue-300 text-[13px] font-bold text-blue-700">
                  {t("auth.register.infoClassCodeLink")}
                </Link>
            </div>
          </div>
        )
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-600">{t("auth.register.nameLabel")}</label>
            <Input type="text" value={form.name} onChange={field("name")} required placeholder={t("auth.register.namePlaceholder")} autoComplete="given-name" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-600">{t("auth.register.surnameLabel")}</label>
            <Input type="text" value={form.surname} onChange={field("surname")} required placeholder={t("auth.register.surnamePlaceholder")} autoComplete="family-name" />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-600">{t("auth.register.emailLabel")}</label>
          <Input type="email" value={form.email} onChange={field("email")} required placeholder={t("auth.register.emailPlaceholder")} autoComplete="email" />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-slate-600">{t("auth.register.passwordLabel")}</label>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={field("password")}
              required
              placeholder={t("auth.register.passwordPlaceholder")}
              autoComplete="new-password"
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPass((v) => !v)}
              className="absolute right-3 top-1/2 flex -translate-y-1/2 text-slate-400"
              tabIndex={-1}
            >
              {showPass ? <EyeOff className="h-[17px] w-[17px]" /> : <Eye className="h-[17px] w-[17px]" />}
            </button>
          </div>
        </div>

        {tab === "kurumsal" && (
          <div className="rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setKurumOpen((v) => !v)}
              className="flex h-11 w-full items-center justify-between gap-2 px-4"
            >
              <span className="text-sm font-semibold text-slate-600">
                {t("auth.register.institutionLabel")} <span className="font-normal text-slate-400">{t("auth.register.institutionOptional")}</span>
              </span>
              {kurumOpen ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
            </button>
            {kurumOpen && (
              <div className="grid grid-cols-2 gap-3 px-4 pb-4">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">{t("auth.register.institutionNameLabel")}</label>
                  <Input type="text" value={form.kurumAdi} onChange={field("kurumAdi")} placeholder={t("auth.register.institutionNamePlaceholder")} autoComplete="organization" />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-600">
                    {t("auth.register.institutionCodeLabel")} <span className="font-normal text-slate-400">{t("auth.register.institutionCodeHint")}</span>
                  </label>
                  <Input
                    type="text"
                    value={form.kurumKodu}
                    onChange={(e) => setForm((f) => ({ ...f, kurumKodu: formatKurumKodu(e.target.value) }))}
                    placeholder={t("auth.register.institutionCodePlaceholder")}
                    maxLength={11}
                    className="font-mono tracking-wider"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600">{error}</p>
        )}

        <Button type="submit" disabled={loading} className="h-12 w-full gap-1.5 rounded-lg text-base font-bold">
          {loading ? t("auth.register.loading") : (
            <>
              {tab === "kurumsal" ? t("auth.register.submitCorporate") : t("auth.register.submitIndividual")}
              <ArrowRight className="h-[17px] w-[17px]" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

export default function KayitPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-gray-50" />}>
      <KayitForm />
    </Suspense>
  );
}
