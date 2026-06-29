'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, usePathname, useRouter } from '@/navigation';
import { BookOpen, Flame, Heart, LayoutDashboard, Library, LogOut, Settings, Sparkles, Trophy, User, Users, Wifi, Zap } from 'lucide-react';
import { useAuthStore, AuthUser } from '@/stores/auth';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';

const AVATAR_COLORS: Record<string, string> = {
  SuperAdmin: 'bg-purple-600',
  Koordinator: 'bg-red-500',
  Editor: 'bg-indigo-500',
  KurumYoneticisi: 'bg-blue-600',
  UlkeTemsilcisi: 'bg-orange-500',
  Ogretmen: 'bg-green-600',
  Ogrenci: 'bg-primary',
};

const ROL_BADGE: Record<string, string> = {
  SuperAdmin: 'bg-purple-100 text-purple-700',
  Koordinator: 'bg-red-100 text-red-700',
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

// ─── Shared nav helpers ───────────────────────────────────────────────────────

interface NLProps { href: string; label: string; active: boolean; icon?: React.ReactNode }
function NL({ href, label, active, icon }: NLProps) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
        active ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50',
      )}
    >
      {icon}{label}
    </Link>
  );
}

interface MBItem { href: string; Icon: React.ElementType; label: string; active: boolean }
function MobileBar({ items }: { items: MBItem[] }) {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-[70] bg-white border-t border-slate-100 flex"
      // iOS Safari: fixed konumlu öğelerin scroll sırasında kaybolmasını önler
      style={{ WebkitTransform: 'translateZ(0)', transform: 'translateZ(0)' }}
    >
      {items.map(({ href, Icon, label, active }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
            active ? 'text-primary' : 'text-slate-400',
          )}
        >
          <div className={cn('flex items-center justify-center w-10 h-7 rounded-xl transition-colors', active && 'bg-primary/10')}>
            <Icon className={cn('size-5', active ? 'text-primary' : 'text-slate-400')} />
          </div>
          {label}
        </Link>
      ))}
    </nav>
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
            {user.role === 'SuperAdmin' && <>
              <NL href="/super-admin"       label="Super Admin"      active={!!pathname?.startsWith('/super-admin')} />
              <NL href="/admin"             label="Admin Paneli"     active={!!pathname?.startsWith('/admin')} />
              <NL href="/ogretmen"          label="Öğretmen Paneli"  active={!!pathname?.startsWith('/ogretmen')} />
              <NL href="/kutuphane"         label="Kütüphane"        active={!!pathname?.startsWith('/kutuphane')} />
            </>}
            {user.role === 'Koordinator' && <>
              <NL href="/admin"             label="Admin Paneli"     active={!!pathname?.startsWith('/admin')} />
              <NL href="/ogretmen"          label="Öğretmen Paneli"  active={!!(pathname?.startsWith('/ogretmen') && pathname !== '/ogretmen/ai-icerik')} />
              <NL href="/ogretmen/ai-icerik" label="AI İçerik"       active={pathname === '/ogretmen/ai-icerik'} />
              <NL href="/kutuphane"         label="Kütüphane"        active={!!pathname?.startsWith('/kutuphane')} />
            </>}
            {user.role === 'Editor' && (
              <NL href="/editor/kutuphane"  label="Kütüphane"        active={!!pathname?.startsWith('/editor')} />
            )}
            {(user.role === 'Ogretmen' || user.role === 'KurumYoneticisi' || user.role === 'UlkeTemsilcisi') && <>
              <NL href="/ogretmen"          label="Panelim"          active={!!(pathname?.startsWith('/ogretmen') && pathname !== '/ogretmen/ai-icerik')} />
              <NL href="/ogretmen/ai-icerik" label="AI İçerik"       active={pathname === '/ogretmen/ai-icerik'} />
              <NL href="/kutuphane"         label="Kütüphane"        active={!!pathname?.startsWith('/kutuphane')} />
            </>}
            {user.role === 'Ogrenci' && <>
              <NL href="/pano"              label="Pano"             active={pathname === '/pano'} />
              <NL href="/lig"               label="Lig"              active={pathname === '/lig'} icon={<Trophy className="size-3.5" />} />
              <NL href="/okuma"             label="Okuma"            active={!!pathname?.startsWith('/okuma')} icon={<BookOpen className="size-3.5" />} />
              <NL href="/kahoot/katil"      label="Kahoot"           active={!!pathname?.startsWith('/kahoot')} icon={<Wifi className="size-3.5" />} />
            </>}
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
                        transition={{ duration: 0.45, type: 'tween', ease: 'easeOut' }}
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

    {/* Mobil bottom bar'lar — rol bazlı */}
    {mounted && hydrated && user?.role === 'SuperAdmin' && (
      <MobileBar items={[
        { href: '/super-admin',        Icon: Settings,        label: 'Super Admin', active: !!pathname?.startsWith('/super-admin') },
        { href: '/admin',              Icon: Users,           label: 'Admin',       active: !!pathname?.startsWith('/admin') },
        { href: '/ogretmen',           Icon: LayoutDashboard, label: 'Öğretmen',    active: !!pathname?.startsWith('/ogretmen') },
        { href: '/kutuphane',          Icon: BookOpen,        label: 'Kütüphane',   active: !!pathname?.startsWith('/kutuphane') },
      ]} />
    )}
    {mounted && hydrated && user?.role === 'Koordinator' && (
      <MobileBar items={[
        { href: '/admin',              Icon: Users,           label: 'Admin',       active: !!pathname?.startsWith('/admin') },
        { href: '/ogretmen',           Icon: LayoutDashboard, label: 'Öğretmen',    active: !!(pathname?.startsWith('/ogretmen') && pathname !== '/ogretmen/ai-icerik') },
        { href: '/ogretmen/ai-icerik', Icon: Sparkles,        label: 'AI İçerik',   active: pathname === '/ogretmen/ai-icerik' },
        { href: '/kutuphane',          Icon: BookOpen,        label: 'Kütüphane',   active: !!pathname?.startsWith('/kutuphane') },
      ]} />
    )}
    {mounted && hydrated && user?.role === 'Editor' && (
      <MobileBar items={[
        { href: '/editor/kutuphane',   Icon: Library,         label: 'Kütüphane',   active: !!pathname?.startsWith('/editor') },
      ]} />
    )}
    {mounted && hydrated && user && (user.role === 'Ogretmen' || user.role === 'KurumYoneticisi' || user.role === 'UlkeTemsilcisi') && !pathname?.endsWith('/canli') && (
      <MobileBar items={[
        { href: '/ogretmen',           Icon: LayoutDashboard, label: 'Panelim',     active: !!(pathname?.startsWith('/ogretmen') && pathname !== '/ogretmen/ai-icerik') },
        { href: '/ogretmen/ai-icerik', Icon: Sparkles,        label: 'AI İçerik',   active: pathname === '/ogretmen/ai-icerik' },
        { href: '/kutuphane',          Icon: BookOpen,        label: 'Kütüphane',   active: !!pathname?.startsWith('/kutuphane') },
      ]} />
    )}
    {mounted && hydrated && user?.role === 'Ogrenci' && !pathname?.startsWith('/kahoot') && (
      <MobileBar items={[
        { href: '/pano',               Icon: LayoutDashboard, label: 'Pano',        active: pathname === '/pano' },
        { href: '/lig',                Icon: Trophy,          label: 'Lig',         active: pathname === '/lig' },
        { href: '/okuma',              Icon: BookOpen,        label: 'Okuma',       active: !!pathname?.startsWith('/okuma') },
        { href: '/kahoot/katil',       Icon: Wifi,            label: 'Kahoot',      active: !!pathname?.startsWith('/kahoot') },
      ]} />
    )}
    </>
  );
}
