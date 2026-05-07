'use client';

import { Zap, X } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface PlusBannerProps {
  className?: string;
  variant?: 'inline' | 'compact';
}

export function PlusBanner({ className, variant = 'inline' }: PlusBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

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
    <div className={cn(
      'relative rounded-2xl overflow-hidden px-5 py-4',
      'bg-gradient-to-r from-[#005320] to-[#00873a]',
      'text-white shadow-lg shadow-green-900/20',
      className
    )}>
      {/* Shine overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3 right-3 size-6 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
        aria-label="Kapat"
      >
        <X className="size-3.5" />
      </button>

      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Zap className="size-5 fill-white text-white" />
        </div>
        <div className="min-w-0 pr-6">
          <p className="font-bold text-sm leading-tight">TürkçeOkulu Plus</p>
          <p className="text-white/80 text-xs mt-0.5">Sınırsız kalp, tüm üniteler, reklamsız</p>
        </div>
        <Link
          href="/plus"
          className="shrink-0 px-4 py-2 rounded-xl bg-white text-primary font-bold text-xs hover:bg-white/90 transition-colors"
        >
          Dene
        </Link>
      </div>
    </div>
  );
}
