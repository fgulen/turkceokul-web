'use client';

import { X } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  width?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
  children: React.ReactNode;
  noDim?: boolean;
}

const WIDTHS = { sm: 'w-80', md: 'w-[420px]', lg: 'w-[560px]' };

export function SlideOver({ open, onClose, title, subtitle, width = 'md', footer, children, noDim }: Props) {
  if (!open) return null;

  return (
    <div className={`fixed z-50 flex justify-end ${noDim ? 'inset-y-0 right-0' : 'inset-0'}`}>
      {!noDim && <div className="absolute inset-0 bg-black/30" onClick={onClose} />}
      <div className={`relative bg-white h-full ${WIDTHS[width]} shadow-2xl flex flex-col`}>
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-200 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 mt-0.5">
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {children}
        </div>
        {footer && (
          <div className="shrink-0 border-t border-slate-200 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
