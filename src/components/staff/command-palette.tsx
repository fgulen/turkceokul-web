'use client';

// Command Palette (Ctrl+K / Cmd+K) — staff navigasyonu için hızlı atlama.
// v1 kapsamı: nav config'ten sayfalar + son kullanılanlar (localStorage).
// Veri araması (kurum/kullanıcı bulma) backend arama endpoint'iyle sonraki faz.

import { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, Search } from 'lucide-react';
import { useRouter } from '@/navigation';
import { useAuthStore } from '@/stores/auth';
import { navForRole } from '@/config/navigation';
import { cn } from '@/lib/utils';

const RECENT_KEY = 'staff-palette-recent';
const RECENT_MAX = 5;

function okuRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { return []; }
}

function yazRecent(href: string) {
  const eski = okuRecent().filter(h => h !== href);
  localStorage.setItem(RECENT_KEY, JSON.stringify([href, ...eski].slice(0, RECENT_MAX)));
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const user = useAuthStore(s => s.user);
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [aktifIndex, setAktifIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [recent, setRecent] = useState<string[]>([]);

  const tumSayfalar = useMemo(() => {
    if (!user) return [];
    return navForRole(user.role).flatMap(g =>
      g.items.map(i => ({ ...i, group: g.label }))
    );
  }, [user]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setAktifIndex(0);
      setRecent(okuRecent());
      // Overlay render edildikten sonra odaklan
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const sonuclar = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) {
      const recentItems = recent
        .map(h => tumSayfalar.find(s => s.href === h))
        .filter(Boolean) as typeof tumSayfalar;
      const kalan = tumSayfalar.filter(s => !recent.includes(s.href));
      return [
        ...recentItems.map(s => ({ ...s, group: 'Son Kullanılanlar' })),
        ...kalan,
      ];
    }
    return tumSayfalar.filter(s =>
      s.label.toLocaleLowerCase('tr').includes(q) ||
      s.group.toLocaleLowerCase('tr').includes(q));
  }, [query, tumSayfalar, recent]);

  function git(href: string) {
    yazRecent(href);
    onClose();
    router.push(href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setAktifIndex(i => Math.min(i + 1, sonuclar.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setAktifIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const secili = sonuclar[aktifIndex];
      if (secili) git(secili.href);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  if (!open) return null;

  let sonGrup = '';

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Hızlı gezinme">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-24 -translate-x-1/2 w-[min(560px,92vw)] bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center gap-2.5 px-4 border-b border-slate-100">
          <Search className="size-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setAktifIndex(0); }}
            onKeyDown={onKeyDown}
            placeholder="Sayfa ara..."
            className="flex-1 py-3.5 text-sm focus:outline-none placeholder:text-slate-400"
          />
          <kbd className="px-1.5 py-0.5 text-[10px] text-slate-400 border border-slate-200 rounded">esc</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-1.5">
          {sonuclar.length === 0 && (
            <p className="px-4 py-6 text-center text-xs text-slate-400">Sonuç bulunamadı</p>
          )}
          {sonuclar.map((s, i) => {
            const grupBasligi = s.group !== sonGrup ? s.group : null;
            sonGrup = s.group;
            const Icon = s.icon;
            return (
              <div key={`${s.href}-${s.group}`}>
                {grupBasligi && (
                  <div className="px-4 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    {grupBasligi}
                  </div>
                )}
                <button
                  onClick={() => git(s.href)}
                  onMouseEnter={() => setAktifIndex(i)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors',
                    i === aktifIndex ? 'bg-purple-50 text-purple-800' : 'text-slate-700',
                  )}
                >
                  <Icon className={cn('size-4 shrink-0', i === aktifIndex ? 'text-purple-600' : 'text-slate-400')} />
                  <span className="flex-1 truncate">{s.label}</span>
                  {i === aktifIndex && <CornerDownLeft className="size-3.5 text-purple-400 shrink-0" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-slate-100 flex items-center gap-3 text-[11px] text-slate-400">
          <span><kbd className="px-1 border border-slate-200 rounded">↑</kbd> <kbd className="px-1 border border-slate-200 rounded">↓</kbd> gezin</span>
          <span><kbd className="px-1 border border-slate-200 rounded">⏎</kbd> aç</span>
        </div>
      </div>
    </div>
  );
}
