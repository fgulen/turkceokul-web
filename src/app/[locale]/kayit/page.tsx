"use client";

import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useLocale, useRouter } from "@/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, EyeOff, ArrowRight, ArrowLeft, Check,
  Building2, GraduationCap, KeyRound, Zap, Users, BookOpen, Brain,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TurkishLetterBackdrop } from "@/components/turkish-letter-backdrop";
import { GlobeCanvas } from "@/components/globe-canvas";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/lib/api";
import { safeRedirect } from "@/lib/safe-redirect";
import { cn, gecerliIsimMi } from "@/lib/utils";

type Tab = "kurumsal" | "bireysel";
type Step = 1 | 2 | 3;
type NativeLangValue = "ku" | "ru" | "ar" | "en" | "none";
type Benefit = { Icon: React.ComponentType<{ className?: string }>; text: string };
type SeviyeValue = "baslangic" | "orta" | "ileri";
type YasGrubuValue = "cocuk" | "genc" | "yetiskin";

// Bireysel (sınıfsız) kayıtta toplanan bekleme listesi bilgisi — bireysel plan
// açıldığında iletişim için (kullanıcı kararı, 2026-07-29).
const SEVIYE_OPTIONS: { value: SeviyeValue; labelKey: string }[] = [
  { value: "baslangic", labelKey: "auth.register.levelBaslangic" },
  { value: "orta", labelKey: "auth.register.levelOrta" },
  { value: "ileri", labelKey: "auth.register.levelIleri" },
];
const YAS_OPTIONS: { value: YasGrubuValue; labelKey: string }[] = [
  { value: "cocuk", labelKey: "auth.register.ageCocuk" },
  { value: "genc", labelKey: "auth.register.ageGenc" },
  { value: "yetiskin", labelKey: "auth.register.ageYetiskin" },
];

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
  // Sınıfa Katıl akışından dönüldüğünde (kod zaten girildi) dil adımını atla —
  // doğrudan isim/e-posta formuna in, kutlama banner'ı hemen görünsün.
  const sinifKatilRedirect = redirectAfter.startsWith('/') && !redirectAfter.startsWith('//') && redirectAfter.includes('/sinif/katil');

  const router = useRouter();
  const locale = useLocale();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [step, setStep] = useState<Step>(initialTab ? (sinifKatilRedirect ? 3 : 2) : 1);
  const [direction, setDirection] = useState(1);
  const [tab, setTab] = useState<Tab | null>(initialTab);
  const [nativeLanguage, setNativeLanguage] = useState<NativeLangValue | null>(null);
  const [form, setForm] = useState({
    name: "", surname: "", email: "", password: "", kurumAdi: "", kurumKodu: "",
    beklemeUlke: "", seviye: "" as SeviyeValue | "", yasGrubu: "" as YasGrubuValue | "",
  });
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

  function gotoSinifKatil() {
    router.push("/sinif/katil", { locale });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!tab) return;
    if (!gecerliIsimMi(form.name) || !gecerliIsimMi(form.surname)) {
      setError(t("auth.register.errorInvalidName"));
      return;
    }
    if (form.password.length < 8) { setError(t("auth.register.errorShortPassword")); return; }
    if (tab === "bireysel" && !sinifKatilRedirect && (!form.beklemeUlke.trim() || !form.seviye || !form.yasGrubu)) {
      setError(t("auth.register.errorMissingWaitlistInfo"));
      return;
    }
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
        ...(form.beklemeUlke.trim() && form.seviye && form.yasGrubu
          ? { beklemeUlke: form.beklemeUlke.trim(), seviye: form.seviye, yasGrubu: form.yasGrubu }
          : {}),
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
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-36 -right-36 z-0 h-[560px] w-[560px] mix-blend-screen"
        >
          <GlobeCanvas />
        </div>

        <Link href="/" className="relative z-10 mb-14 inline-flex items-baseline select-none">
          <span className="text-[22px] font-black leading-none text-white/70">[</span>
          <span className="text-[17px] font-extrabold leading-none tracking-tight text-white">TÜRKÇEOKULU</span>
          <span className="text-[22px] font-black leading-none text-white/70">]</span>
        </Link>

        <div className="relative z-10 flex-1">
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

        <div className="relative z-10 flex gap-7 border-t border-white/10 pt-6">
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
                  <StepRol value={tab} onSelect={selectRole} onHasCode={gotoSinifKatil} />
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
                    sinifKatilRedirect={sinifKatilRedirect}
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

function StepRol({ value, onSelect, onHasCode }: { value: Tab | null; onSelect: (t: Tab) => void; onHasCode: () => void }) {
  const t = useTranslations();
  return (
    <div>
      <h1 className="type-title tracking-tight text-slate-900 mb-1">{t("auth.register.roleTitle")}</h1>
      <p className="type-body text-slate-500 mb-6">{t("auth.register.roleSubtitle")}</p>
      <div className="flex flex-col gap-3">
        <RolKart
          Icon={KeyRound}
          title={t("auth.register.roleHasCode")}
          sub={t("auth.register.roleHasCodeSub")}
          onClick={onHasCode}
        />
        <RolKart
          Icon={GraduationCap}
          title={t("auth.register.roleNoCode")}
          sub={t("auth.register.roleNoCodeSub")}
          selected={value === "bireysel"}
          onClick={() => onSelect("bireysel")}
        />
        <RolKart
          Icon={Building2}
          title={t("auth.register.roleTeacher")}
          sub={t("auth.register.roleTeacherSub")}
          selected={value === "kurumsal"}
          onClick={() => onSelect("kurumsal")}
        />
      </div>
    </div>
  );
}

function RolKart({ Icon, title, sub, selected, onClick }: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  sub: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-3.5 rounded-2xl border-2 p-4 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-slate-300"
      )}
    >
      <span className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
        selected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"
      )}>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <div className="text-base font-extrabold leading-tight text-slate-900">{title}</div>
        <div className="mt-0.5 text-sm text-slate-500">{sub}</div>
      </div>
    </button>
  );
}

type BilgiForm = {
  name: string; surname: string; email: string; password: string; kurumAdi: string; kurumKodu: string;
  beklemeUlke: string; seviye: SeviyeValue | ""; yasGrubu: YasGrubuValue | "";
};

function StepBilgi({
  tab, form, field, setForm, formatKurumKodu,
  showPass, setShowPass, kurumOpen, setKurumOpen,
  error, loading, sinifKatilRedirect, onSubmit,
}: {
  tab: Tab;
  form: BilgiForm;
  field: (k: "name" | "surname" | "email" | "password" | "kurumAdi" | "kurumKodu" | "beklemeUlke") => (e: React.ChangeEvent<HTMLInputElement>) => void;
  setForm: React.Dispatch<React.SetStateAction<BilgiForm>>;
  formatKurumKodu: (raw: string) => string;
  showPass: boolean;
  setShowPass: React.Dispatch<React.SetStateAction<boolean>>;
  kurumOpen: boolean;
  setKurumOpen: React.Dispatch<React.SetStateAction<boolean>>;
  error: string;
  loading: boolean;
  sinifKatilRedirect: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  const t = useTranslations();
  // "Sınıf Kodum Yok" dalında form iki fazlı: önce kısa açıklama (Faz A), onaydan
  // sonra ad/e-posta/şifre + ülke/seviye/yaş (Faz B). Adım değişince (AnimatePresence
  // key={step}) bu bileşen yeniden mount olur, faz otomatik sıfırlanır.
  const [beklemeOnaylandi, setBeklemeOnaylandi] = useState(false);
  const bireyselBeklemeDali = tab === "bireysel" && !sinifKatilRedirect;
  const formGorunur = tab === "kurumsal" || sinifKatilRedirect || (bireyselBeklemeDali && beklemeOnaylandi);

  return (
    <div>
      <h1 className="type-title tracking-tight text-slate-900 mb-1">{t("auth.register.infoTitle")}</h1>
      <p className="type-body text-slate-500 mb-6">
        {tab === "kurumsal" ? t("auth.register.infoSubCorporate") : t("auth.register.infoSubIndividual")}
      </p>

      {tab === "bireysel" && sinifKatilRedirect && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 380, damping: 22 }}
          className="mb-4 flex items-start gap-3.5 rounded-xl bg-gradient-to-br from-[#1e3a5f] to-primary p-4"
        >
          <motion.span
            className="shrink-0 text-2xl leading-none"
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}
          >
            🎉
          </motion.span>
          <div>
          <div className="mb-1 text-sm font-extrabold text-white">{t("auth.register.infoClassCodeSuccess")}</div>
          <div className="text-xs leading-relaxed text-white/80">{t("auth.register.infoClassCodeDesc")}</div>
          </div>
        </motion.div>
      )}

      {bireyselBeklemeDali && !beklemeOnaylandi && (
        <div className="mb-4 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
              <Users className="h-[18px] w-[18px] text-blue-600" />
            </span>
            <p className="text-sm leading-relaxed text-slate-600">{t("auth.register.waitlistDesc")}</p>
          </div>
          <Button type="button" onClick={() => setBeklemeOnaylandi(true)} className="h-11 w-full rounded-lg text-sm font-bold">
            {t("auth.register.waitlistCta")}
          </Button>
          <Link href="/sinif/katil" className="text-center text-[13px] font-semibold text-primary">
            {t("auth.register.waitlistHasCode")}
          </Link>
        </div>
      )}

      {bireyselBeklemeDali && beklemeOnaylandi && (
        <div className="mb-4 flex flex-col gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-600">{t("auth.register.countryLabel")}</label>
            <Input
              type="text"
              value={form.beklemeUlke}
              onChange={field("beklemeUlke")}
              required
              placeholder={t("auth.register.countryPlaceholder")}
              autoComplete="country-name"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-600">{t("auth.register.levelLabel")}</label>
            <div className="grid grid-cols-3 gap-2">
              {SEVIYE_OPTIONS.map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, seviye: value }))}
                  className={cn(
                    "rounded-lg border-2 px-2 py-2 text-xs font-semibold transition-colors",
                    form.seviye === value ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold text-slate-600">{t("auth.register.ageLabel")}</label>
            <div className="grid grid-cols-3 gap-2">
              {YAS_OPTIONS.map(({ value, labelKey }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, yasGrubu: value }))}
                  className={cn(
                    "rounded-lg border-2 px-2 py-2 text-xs font-semibold transition-colors",
                    form.yasGrubu === value ? "border-primary bg-primary/5 text-primary" : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}
                >
                  {t(labelKey)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {formGorunur && (
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
      )}
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
