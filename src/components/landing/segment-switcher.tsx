"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// ─── Shared segment state ────────────────────────────────────────────────────
// Hero (copy + CTA) and BentoGrid (vurgu kartı) her ikisi de aynı segment'i
// okumalı; page.tsx server component olduğundan state burada, tek Context'te
// tutulur ve iki ayrı client adası (HeroSection, SegmentHighlight) bunu paylaşır.

export type Segment = "ogrenci" | "ogretmen";

interface SegmentCtxValue {
  segment: Segment;
  setSegment: (s: Segment) => void;
}

const SegmentContext = createContext<SegmentCtxValue | null>(null);

export function SegmentProvider({ children }: { children: ReactNode }) {
  const [segment, setSegment] = useState<Segment>("ogrenci");
  return (
    <SegmentContext.Provider value={{ segment, setSegment }}>
      {children}
    </SegmentContext.Provider>
  );
}

export function useSegment(): SegmentCtxValue {
  const ctx = useContext(SegmentContext);
  if (!ctx) throw new Error("useSegment SegmentProvider icinde kullanilmali");
  return ctx;
}

/** Belirli bir segment aktifken çocuklarına vurgu (ring) veren küçük client adası. */
export function SegmentHighlight({
  when,
  activeClassName = "ring-2 ring-primary ring-offset-2 ring-offset-white",
  className,
  children,
}: {
  when: Segment;
  activeClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  const { segment } = useSegment();
  const active = segment === when;
  return (
    <div className={cn(className, "transition-shadow duration-300", active && activeClassName)}>
      {children}
    </div>
  );
}

// ─── Pill switcher UI ────────────────────────────────────────────────────────

const LABELS: Record<"tr" | "en", Record<Segment, string>> = {
  tr: { ogrenci: "Öğrenciler", ogretmen: "Öğretmenler & Kurumlar" },
  en: { ogrenci: "Students", ogretmen: "Teachers & Institutions" },
};

const GROUP_LABEL = { tr: "Hedef kitle", en: "Audience" };

export function SegmentSwitcher({ locale = "tr" }: { locale?: string }) {
  const { segment, setSegment } = useSegment();
  const isEn = locale === "en";
  const labels = isEn ? LABELS.en : LABELS.tr;
  const items: Segment[] = ["ogrenci", "ogretmen"];

  return (
    <div
      role="tablist"
      aria-label={isEn ? GROUP_LABEL.en : GROUP_LABEL.tr}
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 shadow-sm"
    >
      {items.map((item) => {
        const active = segment === item;
        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setSegment(item)}
            className={cn(
              "relative rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition-colors",
              active ? "text-white" : "text-slate-600 hover:text-slate-900"
            )}
          >
            {active && (
              <motion.span
                layoutId="segment-pill"
                className="absolute inset-0 rounded-full bg-primary"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10">{labels[item]}</span>
          </button>
        );
      })}
    </div>
  );
}
