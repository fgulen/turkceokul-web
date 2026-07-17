'use client';

import type { ComponentType } from 'react';

/** Sekme barının altında tanıtım amaçlı, tıklanamaz "yakında" kartı. */
export function YakindaKart({
  icon: Icon, baslik, aciklama,
}: {
  icon: ComponentType<{ className?: string }>;
  baslik: string;
  aciklama: string;
}) {
  return (
    <div className="relative bg-slate-50 border border-slate-100 rounded-xl p-4 opacity-70 cursor-default select-none">
      <span className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] rounded-full px-2 py-0.5 font-semibold">
        Yakında
      </span>
      <Icon className="size-5 text-slate-400 mb-2" />
      <p className="text-sm font-medium text-slate-500">{baslik}</p>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{aciklama}</p>
    </div>
  );
}
