'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Menu, PanelLeftClose, PanelLeftOpen, Search, X } from 'lucide-react';
import { Link, usePathname } from '@/navigation';
import { useAuthStore } from '@/stores/auth';
import { navForRole, type NavGroup } from '@/config/navigation';
import { Logo } from '@/components/logo';
import { UserMenu } from '@/components/app-nav';
import { ImpersonationBanner } from '@/components/impersonation-banner';
import { Breadcrumb } from '@/components/staff/breadcrumb';
import { CommandPalette } from '@/components/staff/command-palette';
import { cn } from '@/lib/utils';
import { homePathForRole } from '@/lib/role-home';

const SIDEBAR_COOKIE = 'staff-sidebar';

// Canlı oyun (Kahoot host) ekranında sidebar içerik alanını daraltmasın
function isFullscreenPath(pathname: string | null) {
  return !!pathname?.endsWith('/canli');
}

interface NavListProps {
  groups: NavGroup[];
  pathname: string | null;
  collapsed: boolean;
  onNavigate?: () => void;
}

function NavList({ groups, pathname, collapsed, onNavigate }: NavListProps) {
  // Aynı anda tek öğe aktif: en uzun href eşleşmesi kazanır
  const allItems = groups.flatMap((g) => g.items);
  const activeHref = allItems
    .filter((i) => pathname === i.href || pathname?.startsWith(i.href + '/'))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <div className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.label}
            </div>
          )}
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.href === activeHref;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  prefetch={false}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    collapsed && 'justify-center px-0',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100',
                  )}
                >
                  <Icon className="size-4.5 shrink-0" />
                  {!collapsed && <span className="truncate flex-1">{item.label}</span>}
                  {!collapsed && item.external && (
                    <ExternalLink className="size-3 text-slate-300 shrink-0" aria-label="Öğrenci görünümünde açılır" />
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function StaffShell({ children, defaultCollapsed }: { children: React.ReactNode; defaultCollapsed: boolean }) {
  const { user, logout } = useAuthStore();
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Route değişince mobil drawer kapanır
  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  // Ctrl+K / Cmd+K → Command Palette
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(v => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? '1' : '0'};path=/;max-age=31536000;samesite=lax`;
  }

  const ready = mounted && hydrated && !!user;
  const groups = ready ? navForRole(user.role) : [];
  const fullscreen = isFullscreenPath(pathname);

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      {/* Header */}
      <header className="bg-white sticky top-0 z-[70] border-b border-slate-100 shadow-sm">
        <div className="h-14 px-3 sm:px-4 flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden p-2 -ml-1 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Menüyü aç"
          >
            <Menu className="size-5" />
          </button>
          <Link href={user ? homePathForRole(user.role) : '/pano'} className="shrink-0">
            <Logo size="md" />
          </Link>
          <div className="hidden md:block w-px h-6 bg-slate-200 mx-1" />
          <Breadcrumb />
          <div className="flex-1" />
          {ready && (
            <button
              onClick={() => setPaletteOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 border border-slate-200 rounded-lg hover:border-slate-300 hover:text-slate-500 transition-colors"
              aria-label="Hızlı gezinme"
            >
              <Search className="size-3.5" />
              <span>Ara...</span>
              <kbd className="px-1 py-0.5 text-[10px] border border-slate-200 rounded">Ctrl K</kbd>
            </button>
          )}
          {ready && <UserMenu user={user} onLogout={logout} />}
        </div>
        <ImpersonationBanner />
      </header>

      <div className="flex">
        {/* Desktop sidebar */}
        {!fullscreen && (
          <aside
            className={cn(
              // 57px = h-14 header + 1px border-b; 56 kullanılırsa 1px taşma → hep scroll çıkar
              'hidden md:flex flex-col shrink-0 sticky top-[57px] h-[calc(100dvh-57px)]',
              'bg-white border-r border-slate-100 transition-[width] duration-200',
              collapsed ? 'w-16' : 'w-60',
            )}
          >
            <NavList groups={groups} pathname={pathname} collapsed={collapsed} />
            <div className="p-2 border-t border-slate-100">
              <button
                onClick={toggleCollapsed}
                className={cn(
                  'w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors',
                  collapsed && 'justify-center px-0',
                )}
                title={collapsed ? 'Menüyü genişlet' : 'Menüyü daralt'}
              >
                {collapsed ? <PanelLeftOpen className="size-4.5" /> : <PanelLeftClose className="size-4.5" />}
                {!collapsed && <span>Daralt</span>}
              </button>
            </div>
          </aside>
        )}

        {/* Mobile drawer */}
        <div
          className={cn(
            'md:hidden fixed inset-0 z-[80] transition-opacity duration-200',
            drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none',
          )}
        >
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div
            className={cn(
              'absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white flex flex-col shadow-xl',
              'transition-transform duration-200',
              drawerOpen ? 'translate-x-0' : '-translate-x-full',
            )}
          >
            <div className="h-14 px-4 flex items-center justify-between border-b border-slate-100">
              <Logo size="md" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Menüyü kapat"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavList groups={groups} pathname={pathname} collapsed={false} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>

        {/* İçerik */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
