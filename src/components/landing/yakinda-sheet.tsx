"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "@/navigation";
import { cn } from "@/lib/utils";
import { Sparkles, X } from "lucide-react";

// ─── Shared "Yakında" sheet ──────────────────────────────────────────────────
// Bento grid'deki ve pricing kartlarındaki tüm "Yakında" rozetli tetikleyiciler
// aynı alttan-açılan sheet'i paylaşır — provider sayfanın kökünde tek sefer
// mount edilir, her tetikleyici sadece hangi özelliğin başlığını göstereceğini
// iletir.

interface YakindaCtxValue {
  open: (featureLabel?: string) => void;
}

const YakindaContext = createContext<YakindaCtxValue | null>(null);

const TEXT = {
  tr: {
    defaultTitle: "Bu özellik yakında",
    body: "Bu özellik açık beta sonrasında aktif olacak. Hemen ücretsiz kayıt ol, açıldığı an panonda ilk sen gör!",
    cta: "Ücretsiz Kayıt Ol",
    close: "Kapat",
  },
  en: {
    defaultTitle: "Coming soon",
    body: "This feature goes live after open beta. Sign up free now and be the first to see it on your dashboard!",
    cta: "Sign Up Free",
    close: "Close",
  },
} as const;

export function YakindaSheetProvider({
  locale = "tr",
  children,
}: {
  locale?: string;
  children: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [feature, setFeature] = useState<string | null>(null);
  const t = locale === "en" ? TEXT.en : TEXT.tr;

  const open = useCallback((featureLabel?: string) => {
    setFeature(featureLabel ?? null);
    setIsOpen(true);
  }, []);
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, close]);

  return (
    <YakindaContext.Provider value={{ open }}>
      {children}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-slate-900/50 backdrop-blur-sm"
              onClick={close}
              aria-hidden="true"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="yakinda-sheet-title"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 340, damping: 34 }}
              className="fixed inset-x-0 bottom-0 z-[71] mx-auto max-w-lg rounded-t-3xl border-t border-slate-200 bg-white px-6 pb-8 pt-6 shadow-2xl sm:bottom-8 sm:rounded-3xl sm:border"
            >
              <button
                type="button"
                onClick={close}
                aria-label={t.close}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h2 id="yakinda-sheet-title" className="type-title mb-2 tracking-tight text-slate-900">
                {feature ?? t.defaultTitle}
              </h2>
              <p className="type-body mb-6 text-slate-600">{t.body}</p>

              <Link
                href="/kayit"
                onClick={close}
                className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
              >
                {t.cta}
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </YakindaContext.Provider>
  );
}

export function useYakindaSheet(): (featureLabel?: string) => void {
  const ctx = useContext(YakindaContext);
  if (!ctx) throw new Error("useYakindaSheet YakindaSheetProvider icinde kullanilmali");
  return ctx.open;
}

/** "Yakında" rozetli, tıklanınca sheet açan kart sarmalayıcı. */
export function YakindaTrigger({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const open = useYakindaSheet();
  return (
    <button
      type="button"
      aria-haspopup="dialog"
      onClick={() => open(label)}
      className={cn("block w-full text-left", className)}
    >
      {children}
    </button>
  );
}

const BADGE_TEXT = { tr: "Yakında", en: "Coming soon" };

export function YakindaBadge({ locale = "tr" }: { locale?: string }) {
  return (
    <span className="absolute right-3 top-3 rounded-full bg-slate-900/70 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white backdrop-blur">
      {locale === "en" ? BADGE_TEXT.en : BADGE_TEXT.tr}
    </span>
  );
}
