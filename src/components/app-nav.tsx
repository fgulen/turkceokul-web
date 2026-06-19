'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, usePathname, useRouter } from '@/navigation';
import { Flame, Heart, LayoutDashboard, LogOut, Sparkles, Trophy, User, Wifi, Zap } from 'lucide-react';
import { useAuthStore, AuthUser } from '@/stores/auth';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

const AVATAR_COLORS: Record<string, string> = {
  SuperAdmin: 'bg-purple-600',
  Admin: 'bg-red-500',
  Editor: 'bg-indigo-500',
  KurumYoneticisi: 'bg-blue-600',
  UlkeTemsilcisi: 'bg-orange-500',
  Ogretmen: 'bg-green-600',
  Ogrenci: 'bg-primary',
};

const ROL_BADGE: Record<string, string> = {
  SuperAdmin: 'bg-purple-100 text-purple-700',
  Admin: 'bg-red-100 text-red-700',
  Editor: 'bg-indigo-100 text-indigo-700',
  KurumYoneticisi: 'bg-blue-100 text-blue-700',
  UlkeTemsilcisi: 'bg-orange-100 text-orange-700',
  Ogretmen: 'bg-green-100 text-green-700',
  Ogrenci: 'bg-slate-100 text-slate-600',
};

function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const initials = `${user.name?.[0] ?? ''}${user.surname?.[0] ?? ''}`.toUpperCase() || '?';
  const avatarColor = AVATAR_COLORS[user.role] ?? 'bg-slate-500';
  const badgeColor = ROL_BADGE[user.role] ?? 'bg-slate-100 text-slate-600';

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={cn('size-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 transition-opacity hover:opacity-85', avatarColor)}
        title={`${user.name} ${user.surname}`}
      >
        {initials}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-56 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="font-semibold text-sm text-slate-900 truncate">{user.name} {user.surname}</div>
            <div className="text-xs text-slate-500 truncate">{user.email}</div>
            <span className={cn('inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full', badgeColor)}>
              {user.role}
            </span>
          </div>

          {/* Actions */}
          <div className="p-1.5 space-y-0.5">
            <Link
              href="/profil"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <User className="size-3.5 text-slate-400" />
              Profili Düzenle
            </Link>
          </div>

          <div className="border-t border-slate-100 p-1.5">
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <LogOut className="size-3.5" />
              Çıkış Yap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function AppNav() {
  const { user, logout } = useAuthStore();
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [xpPulse, setXpPulse] = useState(false);
  const prevPuan = useRef<number | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!user) return;
    if (prevPuan.current !== null && user.puan > prevPuan.current) {
      setXpPulse(true);
      const t = setTimeout(() => setXpPulse(false), 600);
      prevPuan.current = user.puan;
      return () => clearTimeout(t);
    }
    prevPuan.current = user.puan;
  }, [user?.puan]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <>
    <header className="bg-white sticky top-0 z-[70] border-b border-slate-100 shadow-sm w-full">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <Link href="/pano" className="shrink-0">
          <Logo size="md" />
        </Link>

        {/* Nav */}
        {mounted && hydrated && user && (
          <nav className="hidden md:flex items-center gap-1">
            {user.role === 'SuperAdmin' ? (
              <Link
                href="/super-admin"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname?.startsWith('/super-admin')
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
              >
                Super Admin
              </Link>
            ) : user.role === 'Admin' ? (
              <Link
                href="/admin"
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  pathname?.startsWith('/admin')
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                )}
              >
                Admin
              </Link>
            ) : user.role === 'Ogretmen' || user.role === 'KurumYoneticisi' || user.role === 'UlkeTemsilcisi' ? (
              <>
                <Link
                  href="/ogretmen"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    pathname?.startsWith('/ogretmen') && pathname !== '/ogretmen/ai-icerik'
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                  )}
                >
                  Panelim
                </Link>
                <Link
                  href="/ogretmen/ai-icerik"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === '/ogretmen/ai-icerik'
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                  )}
                >
                  AI İçerik
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/pano"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === '/pano'
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                  )}
                >
                  Pano
                </Link>
                <Link
                  href="/lig"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    pathname === '/lig'
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <Trophy className="size-3.5" />
                  Lig
                </Link>
                <Link
                  href="/kahoot/katil"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    pathname?.startsWith('/kahoot')
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
                  )}
                >
                  <Wifi className="size-3.5" />
                  Kahoot
                </Link>
              </>
            )}
          </nav>
        )}

        {/* Stats + user */}
        <div className="flex items-center gap-1 sm:gap-4 shrink-0">
          {mounted && hydrated && user && (
            <>
              {/* Öğrenci stats — öğretmen/admin'de gizli */}
              {user.role === 'Ogrenci' && (
                <>
                  <div className="flex items-center gap-2 sm:gap-4 font-bold">
                    <span className="flex items-center gap-1 text-orange-500">
                      <Flame className="size-4 sm:size-5 fill-current" />
                      <span className="text-xs sm:text-sm">{user.streakCount}</span>
                    </span>
                    <span className="flex items-center gap-1 text-red-500">
                      <Heart className="size-4 sm:size-5 fill-current" />
                      <span className="text-xs sm:text-sm">{user.kalp}</span>
                    </span>
                    <span className="flex items-center gap-1 text-primary">
                      <Zap className="size-4 sm:size-5 fill-current" />
                      <motion.span
                        id="nav-xp-counter"
                        className="text-xs sm:text-sm tabular-nums"
                        animate={xpPulse ? { scale: [1, 1.65, 1.2, 1] } : {}}
                        transition={{ duration: 0.45, type: 'spring', stiffness: 300, damping: 15 }}
                      >
                        {user.puan.toLocaleString('tr', { maximumFractionDigits: 0 })}
                      </motion.span>
                    </span>
                  </div>
                </>
              )}

              <UserMenu user={user} onLogout={handleLogout} />
            </>
          )}
        </div>
      </div>
    </header>

    {/* Öğretmen / KurumYoneticisi / UlkeTemsilcisi mobil bottom bar */}
    {mounted && hydrated && user && (user.role === 'Ogretmen' || user.role === 'KurumYoneticisi' || user.role === 'UlkeTemsilcisi') && (
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[70] bg-white border-t border-slate-100 flex">
        {[
          { href: '/ogretmen',           Icon: LayoutDashboard, label: 'Panelim'   },
          { href: '/ogretmen/ai-icerik', Icon: Sparkles,        label: 'AI İçerik' },
        ].map(({ href, Icon, label }) => {
          const active = href === '/ogretmen/ai-icerik'
            ? pathname === href
            : pathname?.startsWith('/ogretmen') && pathname !== '/ogretmen/ai-icerik';
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-slate-400',
              )}
            >
              <Icon className={cn('size-5', active && 'text-primary')} />
              {label}
            </Link>
          );
        })}
      </nav>
    )}

    {/* Öğrenci mobil bottom bar */}
    {mounted && hydrated && user?.role === 'Ogrenci' && (
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-[70] bg-white border-t border-slate-100 flex">
        {[
          { href: '/pano',         Icon: LayoutDashboard, label: 'Pano'   },
          { href: '/lig',          Icon: Trophy,          label: 'Lig'    },
          { href: '/kahoot/katil', Icon: Wifi,            label: 'Kahoot' },
        ].map(({ href, Icon, label }) => {
          const active = pathname === href || (href !== '/pano' && pathname?.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
                active ? 'text-primary' : 'text-slate-400',
              )}
            >
              <Icon className={cn('size-5', active && 'text-primary')} />
              {label}
            </Link>
          );
        })}
      </nav>
    )}
    </>
  );
}
