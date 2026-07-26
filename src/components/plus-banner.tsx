'use client';

import { Zap, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const DISMISS_KEY = 'plusBannerDismissedAt';
const DISMISS_GUN_MS = 7 * 24 * 60 * 60 * 1000;

function kapatilmisGecerli(): boolean {
  if (typeof window === 'undefined') return false;
  const ts = Number(localStorage.getItem(DISMISS_KEY));
  return Number.isFinite(ts) && ts > 0 && Date.now() - ts < DISMISS_GUN_MS;
}

interface PlusBannerProps {
  className?: string;
  variant?: 'inline' | 'compact';
}

export function PlusBanner({ className, variant = 'inline' }: PlusBannerProps) {
  const [open, setOpen] = useState(false);
  // İlk render'da (SSR + hydration) gizli varsayılır, mount'ta localStorage kontrolü
  // yapılır — aksi halde sunucu/istemci içeriği uyuşmazlığı (hydration mismatch) olur.
  const [dismissed, setDismissed] = useState(true);
  const user = useAuthStore(s => s.user);
  const ogretmen = user?.role === 'Ogretmen';

  useEffect(() => {
    setDismissed(kapatilmisGecerli());
  }, []);

  const { data: krediData } = useQuery({
    queryKey: ['ai-kredi'],
    queryFn: () => api.get('/api/ai/kredi').then(r => r.data as {
      kalan: number | null; toplam: number | null; sinirsiz: boolean;
    }),
    enabled: ogretmen && !dismissed,
    staleTime: 30_000,
  });

  function kapat(e: React.MouseEvent) {
    e.stopPropagation();
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  if (dismissed) return null;

  // Rol bazlı içerik: öğretmene güncel AI kullanım durumu, öğrenciye mevcut kısıtlama mesajı.
  const mesaj = ogretmen && krediData && !krediData.sinirsiz && krediData.kalan != null && krediData.toplam != null
    ? `Bu ay ${krediData.toplam - krediData.kalan}/${krediData.toplam} AI üretimi kullandın — Kurumsal Pro'ya geç, sınırsız üret`
    : 'Ücretsiz sürümdesin — Ünite 1 açık, sınırsız kalp ve tüm üniteler için Plus\'a geç';

  const ctaHref = ogretmen ? 'mailto:info@turkceokulu.com?subject=Kurumsal%20Pro%20Talebi' : '/plus';

  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold',
        'bg-gradient-to-r from-amber-400 to-yellow-300 text-amber-950 shadow-sm',
        className
      )}>
        <Zap className="size-3 fill-current" />
        Plus&apos;a Geç
        <button type="button" onClick={kapat} className="ml-1 opacity-70 hover:opacity-100">
          <X className="size-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-2xl text-white', className)}
      style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#1b75bc 60%,#0ea5e9 100%)' }}
    >
      <div className="w-full flex items-center gap-3 px-5 py-3">
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <Zap className="size-4 fill-white shrink-0" />
          <span className="flex-1 text-left text-sm font-bold">TürkçeOkulu Plus</span>
          <span className="text-xs text-white/70 mr-1">{open ? 'Kapat' : 'Detaylar'}</span>
          {open ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
        </button>
        <button
          type="button"
          onClick={kapat}
          aria-label="Banner'ı kapat"
          className="shrink-0 p-1 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>

      {open && (
        <div className="flex items-center gap-4 px-5 pb-4 border-t border-white/15">
          <p className="flex-1 text-white/75 text-xs pt-3">
            {mesaj}
          </p>
          {ogretmen ? (
            <a
              href={ctaHref}
              className="shrink-0 mt-3 px-4 py-2 rounded-xl bg-white font-bold text-xs"
              style={{ color: '#1b75bc' }}
            >
              Yükselt
            </a>
          ) : (
            <Link
              href={ctaHref}
              className="shrink-0 mt-3 px-4 py-2 rounded-xl bg-white font-bold text-xs"
              style={{ color: '#1b75bc' }}
            >
              Dene
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
