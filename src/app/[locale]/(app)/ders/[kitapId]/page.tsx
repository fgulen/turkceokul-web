"use client";

import { useEffect, useState, useRef, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Link } from '@/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Circle, Lock, Play, RotateCcw,
  BookOpen, BookMarked, Headphones, PenLine, Languages, Trophy, Sparkles,
  Book, List, ChevronLeft,
} from 'lucide-react';
import { PlusBanner } from '@/components/plus-banner';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { api } from '@/lib/api';
import { cn, etkinlikLabel, bolumSirasi, getBolumZigzagColor } from '@/lib/utils';

interface Unite {
  id: string;
  name: string;
  description: string | null;
  orderNo: number;
  toplamEtkinlik: number;
  tamamlananEtkinlik: number;
  kilitli: boolean;
}

interface Etkinlik {
  id: string;
  name: string;
  bolum: string;
  etkinlikTuru: string;
  maxPuan: number | null | undefined;
  denendi: boolean | undefined;
}

type CompletionState = 'none' | 'tried' | 'partial' | 'great';

function getCompletionState(maxPuan: number | null | undefined, denendi: boolean | undefined): CompletionState {
  if (maxPuan == null && !denendi) return 'none';
  if (maxPuan == null) return 'tried';
  if (maxPuan >= 90) return 'great';
  return 'partial';
}

const BOLUM_ICONS: Record<string, React.ReactNode> = {
  Kelime: <BookOpen className="size-4" />,
  Okuma: <BookMarked className="size-4" />,
  Dinleme: <Headphones className="size-4" />,
  Yazma: <PenLine className="size-4" />,
  Dilbilgisi: <Languages className="size-4" />,
  Değerlendirme: <Trophy className="size-4" />,
  'AI Generated': <Sparkles className="size-4" />,
};

const BOLUM_TABS = ['Kelime', 'Okuma', 'Dinleme', 'Yazma', 'Dilbilgisi', 'Değerlendirme', 'AI Generated'];

function getZigzagPosition(index: number): 'left' | 'center' | 'right' {
  const pattern = index % 4;
  if (pattern === 0) return 'left';
  if (pattern === 1) return 'center';
  if (pattern === 2) return 'right';
  return 'center';
}

function ZigzagNode({
  etkinlik,
  uniteId,
  kitapId,
  isSiradaki,
  isLocked,
  position,
  isLastCompleted,
}: {
  etkinlik: Etkinlik;
  uniteId: string;
  kitapId: string;
  isSiradaki: boolean;
  isLocked: boolean;
  position: 'left' | 'center' | 'right';
  isLastCompleted?: boolean;
}) {
  const state = getCompletionState(etkinlik.maxPuan, etkinlik.denendi);
  const colors = getBolumZigzagColor(etkinlik.bolum);

  const nodeStyle = isLocked
    ? 'bg-slate-100 border-slate-200 text-slate-300'
    : isSiradaki
      ? `${colors.active} border-transparent text-white shadow-xl ${colors.shadow} ring-4 ${colors.ring} ring-offset-2 animate-node-bounce`
      : (state !== 'none')
        ? `${colors.active} border-transparent text-white shadow-md ${colors.shadow} ring-2 ring-white ring-offset-2`
        : 'bg-white border-border text-muted-foreground hover:border-primary/40';

  function NodeIcon() {
    if (isLocked) return <Lock className="size-3.5" />;
    if (state === 'great')   return <CheckCircle2 className="size-4" />;
    if (state === 'partial') return <CheckCircle2 className="size-4 opacity-70" />;
    if (state === 'tried')   return <RotateCcw className="size-3.5" />;
    if (isSiradaki)          return <Play className="size-4 fill-current" />;
    return <Circle className="size-3.5" />;
  }

  const alignmentClass =
    position === 'left'   ? 'justify-start pl-4 sm:pl-12 lg:pl-20' :
    position === 'right'  ? 'justify-end pr-4 sm:pr-12 lg:pr-20' :
    'justify-center';

  return (
    <div id={`node-${etkinlik.id}`} className={cn('flex w-full', alignmentClass)}>
      <div className="flex flex-col items-center relative">
        {isLocked ? (
          <div className={cn(
            'w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-4 shrink-0',
            nodeStyle,
          )}>
            <NodeIcon />
          </div>
        ) : (
          <Link
            href={`/etkinlik/${etkinlik.id}?uniteId=${uniteId}&kitapId=${kitapId}&bolum=${encodeURIComponent(etkinlik.bolum)}`}
            className={cn(
              'rounded-full flex items-center justify-center border-4 transition-all shrink-0 relative z-10 active:translate-y-0.5',
              isSiradaki ? 'w-16 h-16 sm:w-20 sm:h-20 border-b-[6px]' : 'w-14 h-14 sm:w-16 sm:h-16 border-b-4',
              nodeStyle,
              state === 'none' && !isSiradaki && 'hover:border-primary/40 cursor-pointer hover:bg-primary/5',
            )}
          >
            {isSiradaki ? (
              <Play className="size-5 sm:size-6 fill-current" />
            ) : (
              <NodeIcon />
            )}
          </Link>
        )}
        <span className={cn(
          'mt-2 text-xs sm:text-sm font-medium text-center max-w-[100px] sm:max-w-[120px] leading-tight',
          isLocked && 'text-muted-foreground/50',
        )}>
          {etkinlikLabel(etkinlik.etkinlikTuru)}
        </span>
        {isSiradaki && !isLocked && (
          <span className={cn('mt-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full', colors.label)}>
            Sıradaki
          </span>
        )}
        {state === 'tried' && !isSiradaki && !isLocked && (
          <span className="mt-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
            Tekrar
          </span>
        )}
        {etkinlik.maxPuan != null && !isLocked && (
          <span className={cn(
            'mt-1 text-[10px] sm:text-xs font-bold tabular-nums',
            etkinlik.maxPuan >= 90 ? 'text-emerald-600' : 'text-amber-500',
          )}>
            {etkinlik.maxPuan}%
          </span>
        )}
        {isLastCompleted && (
          <span className="mt-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 animate-pulse">
            Az önce ✓
          </span>
        )}
      </div>
    </div>
  );
}

function AdventurePath({
  etkinlikler,
  uniteId,
  kitapId,
  filterBolum,
  lastId,
}: {
  etkinlikler: Etkinlik[];
  uniteId: string;
  kitapId: string;
  filterBolum: string | null;
  lastId?: string | null;
}) {
  const filtered = filterBolum
    ? etkinlikler.filter(e => e.bolum === filterBolum)
    : etkinlikler;

  if (!filtered.length) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">Bu bölümde etkinlik yok.</p>
      </div>
    );
  }

  // Activities are locked sequentially: each activity requires the previous one to have >= 70% score
  const lockStates = filtered.map((e, idx) => {
    if (idx === 0) return false; // First activity always unlocked
    const prev = filtered[idx - 1];
    const prevScore = prev.maxPuan ?? 0;
    return prevScore < 70; // Locked if previous activity score < 70%
  });

  // First activity without maxPuan and not locked is "siradaki"
  const firstUncompletedIdx = filtered.findIndex((e, idx) => e.maxPuan == null && !lockStates[idx]);
  const firstUncompleted = firstUncompletedIdx >= 0 ? filtered[firstUncompletedIdx] : null;

  return (
    <div className="grow shrink-0 relative overflow-hidden path-zigzag py-10 px-6 sm:px-10">
      {/* Decorative SVGs */}
      {/* Mountains - top left */}
      <div className="absolute top-8 left-8 opacity-25 select-none pointer-events-none">
        <svg fill="none" height="80" viewBox="0 0 120 80" width="120" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 80L60 10L100 80H20Z" fill="currentColor" className="text-primary/60" />
          <path d="M50 80L80 30L110 80H50Z" fill="currentColor" className="text-slate-300" />
        </svg>
      </div>
      {/* Pine trees - bottom right */}
      <div className="absolute bottom-16 right-8 opacity-30 select-none pointer-events-none">
        <svg fill="none" height="100" viewBox="0 0 60 100" width="60" xmlns="http://www.w3.org/2000/svg">
          <path d="M30 0L50 35H38L55 65H42L60 100H0L18 65H5L22 35H10L30 0Z" fill="currentColor" className="text-emerald-400" />
        </svg>
      </div>
      {/* Cloud - mid left */}
      <div className="absolute top-1/3 left-4 opacity-35 select-none pointer-events-none">
        <svg fill="none" height="40" viewBox="0 0 80 40" width="80" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="40" cy="20" fill="currentColor" className="text-sky-300" rx="40" ry="20" />
        </svg>
      </div>
      {/* Dashed wave - bottom left */}
      <div className="absolute bottom-8 left-4 opacity-25 select-none pointer-events-none">
        <svg fill="none" height="60" viewBox="0 0 120 60" width="120" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 30C20 30 20 50 40 50C60 50 60 10 80 10C100 10 100 40 120 40" stroke="currentColor" strokeDasharray="6 6" strokeWidth="3" className="text-primary/40" />
        </svg>
      </div>

      <div className="relative w-full max-w-2xl mx-auto flex flex-col items-center">
        {filtered.map((e, idx) => {
          const isLocked = lockStates[idx];
          const isLast = idx === filtered.length - 1;
          const eColors = getBolumZigzagColor(e.bolum);

          return (
            <div key={e.id} className="flex flex-col items-center w-full">
              <ZigzagNode
                etkinlik={e}
                uniteId={uniteId}
                kitapId={kitapId}
                isSiradaki={e.id === firstUncompleted?.id}
                isLocked={isLocked}
                position={getZigzagPosition(idx)}
                isLastCompleted={!!lastId && e.id === lastId}
              />
              {!isLast && (
                <div className={cn(
                  'w-0.5 h-6 sm:h-8 bg-[image:repeating-linear-gradient(to_bottom,currentColor,currentColor_4px,transparent_4px,transparent_8px)] opacity-50',
                  eColors.activeLabel,
                )} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UniteSidebarItem({
  unite,
  selected,
  onClick,
}: {
  unite: Unite;
  selected: boolean;
  onClick: () => void;
}) {
  const hasCount = unite.toplamEtkinlik > 0;
  const allDone = hasCount && unite.tamamlananEtkinlik === unite.toplamEtkinlik;
  const isActive = selected && !unite.kilitli;
  const isCompleted = !unite.kilitli && allDone && !selected;
  const isLocked = unite.kilitli;
  const isUnlocked = !unite.kilitli && !selected && !allDone;

  return (
    <button
      onClick={onClick}
      disabled={isLocked}
      className={cn(
        'w-full text-left px-4 py-3 rounded-xl transition-all group',
        isActive && 'bg-primary/10',
        !isActive && 'hover:bg-white/60',
        isLocked && 'cursor-not-allowed opacity-60 hover:bg-transparent',
      )}
    >

      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={cn(
          'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
          isActive && 'bg-primary/10',
          isCompleted && 'bg-slate-100',
          isLocked && 'bg-slate-50',
          isUnlocked && 'bg-slate-50',
        )}>
          {isActive && <Book className="size-4 text-primary" />}
          {isCompleted && <List className="size-4 text-slate-500" />}
          {isLocked && <Lock className="size-4 text-slate-300" />}
          {isUnlocked && <List className="size-4 text-slate-400" />}
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <span className={cn(
            'text-sm font-medium block truncate',
            isActive && 'text-primary',
            isCompleted && 'text-slate-600',
            isLocked && 'text-slate-300',
            isUnlocked && 'text-slate-500',
          )}>
            {unite.name}
          </span>
        </div>

        {/* Status indicator */}
        {isCompleted && (
          <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
        )}
      </div>
    </button>
  );
}

function UniteHero({ unite, kitapName, kitapId }: { unite: Unite; kitapName?: string; kitapId: string }) {
  const hasCount = unite.toplamEtkinlik > 0;
  const pct = hasCount ? Math.round((unite.tamamlananEtkinlik / unite.toplamEtkinlik) * 100) : 0;
  const allDone = hasCount && unite.tamamlananEtkinlik === unite.toplamEtkinlik;

  return (
    <>
      {/* Mobil: slim header */}
      <div className="sm:hidden mb-5">
        <Link
          href="/pano"
          className="inline-flex items-center gap-1 text-xs font-medium text-primary/70 mb-3"
        >
          <ChevronLeft className="size-3.5" />
          <span className="truncate max-w-[200px]">{kitapName ?? 'Kitaplar'}</span>
        </Link>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900 leading-snug">{unite.name}</h2>
          {hasCount && !unite.kilitli && (
            <span className={cn('shrink-0 text-sm font-bold tabular-nums', allDone ? 'text-emerald-600' : 'text-primary')}>
              %{pct}
            </span>
          )}
        </div>
        {hasCount && !unite.kilitli && (
          <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-700', allDone ? 'bg-emerald-500' : 'progress-shimmer')}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* Desktop: hero card */}
      <div className="hidden sm:block bg-gradient-to-br from-transparent to-primary/[0.04] p-5 relative border-b border-border/30">
        <div className="absolute -top-4 -right-4 opacity-[0.16] pointer-events-none select-none">
          <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 140L70 30L120 140H20Z" fill="currentColor" className="text-primary" />
            <path d="M60 140L90 60L120 140H60Z" fill="currentColor" className="text-primary/60" />
            <circle cx="110" cy="30" r="18" fill="currentColor" className="text-amber-400" />
            <path d="M30 140L45 100L60 140H30Z" fill="currentColor" className="text-emerald-500" />
            <path d="M80 140L95 110L110 140H80Z" fill="currentColor" className="text-emerald-400" />
            <ellipse cx="50" cy="50" rx="28" ry="12" fill="currentColor" className="text-sky-300" />
          </svg>
        </div>
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-slate-900">{unite.name}</h2>
          </div>
          {hasCount && !unite.kilitli && (
            <div className="text-right shrink-0">
              <div className={cn('text-xl font-extrabold tabular-nums leading-none', allDone ? 'text-emerald-600' : 'text-slate-900')}>
                %{pct}
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {unite.tamamlananEtkinlik}/{unite.toplamEtkinlik}
              </div>
              <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden w-32">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', allDone ? 'bg-emerald-500' : 'progress-shimmer')}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

interface Kitap {
  id: string;
  name: string;
  seviye: string;
  description: string | null;
}

export default function DersPage({
  params,
}: {
  params: Promise<{ kitapId: string }>;
}) {
  const { kitapId } = use(params);
  const { user, ready } = useAuthGuard();
  const searchParams = useSearchParams();
  const [selectedUniteId, setSelectedUniteId] = useState<string | null>(
    searchParams.get('uniteId'),
  );
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get('bolum') ?? 'Kelime',
  );
  const lastId = searchParams.get('lastId');
  const scrolledRef = useRef(false);

  const { data: kitap } = useQuery<Kitap>({
    queryKey: ['kitap', kitapId],
    queryFn: () => api.get(`/api/kitap/${kitapId}`).then((r) => r.data),
    enabled: ready && !!user,
  });

  const { data: uniteler, isLoading } = useQuery<Unite[]>({
    queryKey: ['uniteler', kitapId],
    queryFn: () => api.get(`/api/uniteler/${kitapId}`).then((r) => r.data),
    enabled: ready && !!user,
  });

  const { data: etkinlikler } = useQuery<Etkinlik[]>({
    queryKey: ['etkinlikler', selectedUniteId],
    queryFn: () => api.get(`/api/etkinlikler/${selectedUniteId}`).then((r) => r.data),
    enabled: ready && !!user && !!selectedUniteId,
  });

  useEffect(() => {
    if (selectedUniteId || !uniteler?.length) return;
    const first =
      uniteler.find(u => !u.kilitli && u.tamamlananEtkinlik < u.toplamEtkinlik) ??
      uniteler.find(u => !u.kilitli) ??
      uniteler[0];
    if (first) setSelectedUniteId(first.id);
  }, [uniteler, selectedUniteId]);

  const selectedUnite = uniteler?.find(u => u.id === selectedUniteId) ?? null;

  const sortedEtkinlikler = (etkinlikler ?? [])
    .filter(e => BOLUM_TABS.includes(e.bolum))
    .sort((a, b) => {
      const bolumDiff = bolumSirasi(a.bolum) - bolumSirasi(b.bolum);
      if (bolumDiff !== 0) return bolumDiff;
      return 0;
    });

  const availableTabs = BOLUM_TABS.filter(tab =>
    (etkinlikler ?? []).some(e => e.bolum === tab)
  );

  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.includes(activeTab)) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs, activeTab]);

  // Etkinlik tamamlanınca geri dönüldüğünde az önce yapılan node'a scroll et
  useEffect(() => {
    if (!lastId || !etkinlikler || scrolledRef.current) return;
    scrolledRef.current = true;
    const t = setTimeout(() => {
      document.getElementById(`node-${lastId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 350);
    return () => clearTimeout(t);
  }, [lastId, etkinlikler]);

  const filteredEtkinlikler = sortedEtkinlikler.filter(e => e.bolum === activeTab);

  if (!ready) return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  return (
    <div className="bg-background">

      <div className="max-w-[1200px] mx-auto px-4 h-[calc(100dvh-4rem)]">
        <div className="flex h-full py-6">

          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 h-full rounded-2xl bg-card border border-border/50 shadow-sm p-5">
            {kitap && (
              <h3 className="text-sm font-bold text-foreground leading-tight mb-3 shrink-0">{kitap.name}</h3>
            )}

            {isLoading ? (
              <div className="space-y-2 flex-1 overflow-hidden">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-14 rounded-xl bg-white/60 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-1 flex-1 overflow-y-auto scrollbar-none">
                {(uniteler ?? []).map(u => (
                  <UniteSidebarItem
                    key={u.id}
                    unite={u}
                    selected={selectedUniteId === u.id}
                    onClick={() => !u.kilitli && setSelectedUniteId(u.id)}
                  />
                ))}
              </div>
            )}

            <div className="mt-4 shrink-0">
              <PlusBanner />
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0 flex flex-col h-full lg:pl-6">
          <div className="flex flex-col flex-1 min-h-0 px-4 sm:px-0 sm:rounded-2xl sm:bg-card sm:border sm:border-border/50 sm:shadow-sm sm:overflow-hidden">
            {/* Breadcrumbs — sadece desktop */}
            <nav className="hidden sm:block px-5 pt-4 pb-3 shrink-0 border-b border-border/30">
              <ol className="flex items-center gap-1.5 text-sm">
                <li>
                  <Link href="/pano" className="text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5" title="Pano">
                    <BookOpen className="size-4" />
                    <span className="hidden sm:inline">Pano</span>
                  </Link>
                </li>
                <li className="text-muted-foreground/40">/</li>
                <li>
                  {kitap ? (
                    <Link href={`/ders/${kitapId}`} className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px] sm:max-w-[200px]">
                      {kitap.name}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground animate-pulse">...</span>
                  )}
                </li>
                {selectedUnite && (
                  <>
                    <li className="text-muted-foreground/40">/</li>
                    <li className="text-foreground font-medium truncate max-w-[100px] sm:max-w-[180px]">
                      {selectedUnite.name}
                    </li>
                  </>
                )}
              </ol>
            </nav>

            {/* Unit content */}
            {selectedUnite ? (
              <div className="flex flex-col flex-1 min-h-0">
                {/* Sticky top: Hero + Tabs */}
                <div className="shrink-0">
                  <UniteHero unite={selectedUnite} kitapName={kitap?.name} kitapId={kitapId} />

                  {selectedUnite.kilitli ? (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      Önceki üniteyi tamamlayarak bu üniteye erişebilirsin.
                    </p>
                  ) : !etkinlikler?.length ? (
                    <p className="text-sm text-muted-foreground text-center py-10">
                      Bu üniteye ait etkinlik bulunamadı.
                    </p>
                  ) : (
                    <>
                      {/* Skill Tabs - Footer row with light grey background */}
                      <div className="bg-[#F8FAFC] rounded-xl p-1 mb-4 mx-5 mt-3">
                        <nav className="flex gap-1">
                          {availableTabs.map(tab => {
                            const Icon = BOLUM_ICONS[tab];
                            const tabColors = getBolumZigzagColor(tab);
                            return (
                              <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                title={tab}
                                className={cn(
                                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 px-1.5 sm:px-4 rounded-lg text-sm transition-all',
                                  activeTab === tab
                                    ? cn(tabColors.active, 'text-white shadow-md font-semibold scale-[1.02]')
                                    : 'text-muted-foreground hover:bg-white/70 hover:text-foreground font-medium',
                                )}
                              >
                                <span className="shrink-0">{Icon}</span>
                                <span className="hidden sm:inline">{tab}</span>
                              </button>
                            );
                          })}
                        </nav>
                      </div>
                    </>
                  )}
                </div>

                {/* Scrollable Adventure Path */}
                {!selectedUnite.kilitli && etkinlikler?.length ? (
                  <div className="flex-1 overflow-y-auto scrollbar-none min-h-0 flex flex-col">
                    <AdventurePath
                      etkinlikler={filteredEtkinlikler}
                      uniteId={selectedUnite.id}
                      kitapId={kitapId}
                      filterBolum={activeTab}
                      lastId={lastId}
                    />
                  </div>
                ) : null}
              </div>
            ) : !isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-16">
                Bir ünite seç.
              </p>
            ) : null}
          </div>
          </main>

        </div>
      </div>
    </div>
  );
}
