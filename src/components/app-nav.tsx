'use client';

import { useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from '@/navigation';
import { BookOpen, Flame, Heart, LogOut, Trophy, Zap } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { PlusBanner } from '@/components/plus-banner';
import { cn } from '@/lib/utils';

export function AppNav() {
  const { user, logout } = useAuthStore();
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function handleLogout() {
    logout();
    router.push('/');
  }

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-slate-100 shadow-sm w-full">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <Link href="/pano" className="flex items-center gap-2 shrink-0">
          <BookOpen className="size-5 text-primary shrink-0" />
          <span className="text-lg sm:text-xl font-bold text-primary truncate">TürkçeOkulu</span>
        </Link>

        {/* Nav */}
        {mounted && hydrated && user && (
          <nav className="hidden md:flex items-center gap-1">
            {user.role === 'Admin' ? (
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
            ) : user.role === 'Ogretmen' ? (
              <>
                <Link
                  href="/ogretmen"
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                    pathname?.startsWith('/ogretmen')
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
                      <span className="text-xs sm:text-sm">{user.puan.toLocaleString('tr', { maximumFractionDigits: 0 })}</span>
                    </span>
                  </div>
                  <PlusBanner variant="compact" className="hidden sm:flex" />
                </>
              )}

              {/* Logout button only */}
              <button
                onClick={handleLogout}
                className="size-8 sm:size-7 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                title="Çıkış yap"
              >
                <LogOut className="size-4 sm:size-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
