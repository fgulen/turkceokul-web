'use client';

import { createPortal } from 'react-dom';
import { Lock, X } from 'lucide-react';
import { ProBadge } from '@/components/ui/ProBadge';

/**
 * Kilitli AI formatına tıklanınca 403/boş kilit ekranı yerine gösterilen "canlı önizleme"
 * modalı — bulanık örnek çıktı + yükseltme çağrısı. Freemium PLG kararı (2026-07-26 spec).
 */
export function ProUpgradeModal({
  acik, onKapat, ozellikAdi,
}: {
  acik: boolean;
  onKapat: () => void;
  ozellikAdi: string;
}) {
  if (!acik) return null;

  // Portal + z-[80]: KahootBaslatModal ile aynı sebep — üst öğelerin stacking context'i
  // modalı sticky header'ın (z-70) altında bırakmasın.
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[80]">
      <div className="relative bg-white rounded-2xl border border-slate-100 shadow-lg max-w-sm w-full p-6">
        <button
          onClick={onKapat}
          className="absolute top-4 right-4 p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors z-10"
        >
          <X className="size-5" />
        </button>

        {/* Bulanık örnek önizleme — gerçek çıktı yok, sadece format hissi vermek için iskelet */}
        <div className="relative rounded-xl overflow-hidden mb-5 bg-slate-50 border border-slate-100 p-4">
          <div className="space-y-2.5 blur-[3px] select-none pointer-events-none" aria-hidden>
            <div className="h-3 w-3/4 bg-slate-300 rounded" />
            <div className="h-3 w-full bg-slate-200 rounded" />
            <div className="h-3 w-5/6 bg-slate-200 rounded" />
            <div className="h-9 w-full bg-slate-200 rounded-lg mt-3" />
            <div className="h-9 w-full bg-slate-200 rounded-lg" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-11 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center">
              <Lock className="size-5 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="flex justify-center mb-2">
            <ProBadge />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">{ozellikAdi} — Pro özelliği</h3>
          <p className="text-sm text-slate-500 mb-5">
            Bu formatı sınırsız kullanmak için Kurumsal Pro&apos;ya geç.
          </p>
          <a
            href="mailto:info@turkceokulu.com?subject=Kurumsal%20Pro%20Talebi"
            className="block w-full text-center px-4 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity"
          >
            Hemen Yükselt
          </a>
          <button
            onClick={onKapat}
            className="mt-3 text-xs text-slate-400 hover:text-slate-600 transition-colors"
          >
            Şimdi değil
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
