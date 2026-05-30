'use client';

import { Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PlusBannerProps {
  className?: string;
  variant?: 'inline' | 'compact';
}

export function PlusBanner({ className, variant = 'inline' }: PlusBannerProps) {
  const [open, setOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold',
        'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 shadow-sm',
        className
      )}>
        <Zap className="size-3 fill-current" />
        Plus&apos;a Geç
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-2xl text-white', className)}
      style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#1b75bc 60%,#0ea5e9 100%)' }}
    >
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-5 py-3"
      >
        <Zap className="size-4 fill-white shrink-0" />
        <span className="flex-1 text-left text-sm font-bold">TürkçeOkulu Plus</span>
        <span className="text-xs text-white/70 mr-1">{open ? 'Kapat' : 'Detaylar'}</span>
        {open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
      </button>

      {open && (
        <div className="flex items-center gap-4 px-5 pb-4 border-t border-white/15">
          <p className="flex-1 text-white/75 text-xs pt-3">
            Sınırsız kalp, tüm üniteler, reklamsız deneyim
          </p>
          <Link
            href="/plus"
            className="shrink-0 mt-3 px-4 py-2 rounded-xl bg-white font-bold text-xs"
            style={{ color: '#1b75bc' }}
          >
            Dene
          </Link>
        </div>
      )}
    </div>
  );
}
