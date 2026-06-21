'use client';

import { use, useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ChevronLeft, ChevronRight, BookOpen,
  Sun, BookMarked, Moon, TypeIcon,
} from 'lucide-react';
import { ReactReaderStyle, type IReactReaderStyle } from 'react-reader';
import { Logo } from '@/components/logo';
import { Link } from '@/navigation';
import { api } from '@/lib/api';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { useWordTranslation } from '@/hooks/use-word-translation';
import { TranslationPopup } from '@/components/okuma/translation-popup';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactReader = dynamic<any>(
  () => import('react-reader').then((m) => m.ReactReader),
  { ssr: false, loading: () => <EpubSkeleton /> },
);

const PdfFlipbook = dynamic(
  () => import('@/components/okuma/pdf-flipbook'),
  { ssr: false, loading: () => <EpubSkeleton /> },
);

// ── API İnterface ───────────────────────────────────────────────────────────
interface KutuphaneKitap {
  id: string;
  baslik: string;
  yazar: string;
  seviye: string;
  tur: 'epub' | 'pdf';
  url: string;
  kapakUrl: string | null;
  fixedLayout: boolean;
  durum: 'Taslak' | 'Aktif' | 'Pasif';
  aciklama: string | null;
  insertDate: string;
}

// ── Sabitler ─────────────────────────────────────────────────────────────────
type Theme = 'light' | 'sepia' | 'dark';
type FontFamily = 'serif' | 'sans' | 'mono';

const FONTS: Record<FontFamily, { label: string; css: string }> = {
  serif: { label: 'Serif',  css: 'Georgia, "Times New Roman", serif' },
  sans:  { label: 'Sans',   css: 'system-ui, -apple-system, sans-serif' },
  mono:  { label: 'Mono',   css: '"Courier New", Courier, monospace' },
};

const THEMES: Record<Theme, { bg: string; fg: string; headerBg: string; headerFg: string; muted: string; label: string; icon: React.ReactNode }> = {
  light: { bg: '#ffffff', fg: '#111111', headerBg: '#ffffff', headerFg: '#111111', muted: '#6b7280', label: 'Açık',  icon: <Sun className="size-4" /> },
  sepia: { bg: '#f5efe0', fg: '#3b2e1e', headerBg: '#ede6d3', headerFg: '#3b2e1e', muted: '#7a6550', label: 'Sepya', icon: <BookMarked className="size-4" /> },
  dark:  { bg: '#1c1c1e', fg: '#e8e0d4', headerBg: '#111111', headerFg: '#e8e0d4', muted: '#9ca3af', label: 'Koyu',  icon: <Moon className="size-4" /> },
};

const FONT_SIZES = [90, 100, 115, 130] as const;

// ── Reader UI stilleri ───────────────────────────────────────────────────────
function buildReaderStyles(theme: Theme): IReactReaderStyle {
  const { bg } = THEMES[theme];
  return {
    ...ReactReaderStyle,
    readerArea:    { ...ReactReaderStyle.readerArea, background: bg, transition: 'background 0.2s' },
    titleArea:     { ...ReactReaderStyle.titleArea, display: 'none' },
    tocBackground: { ...ReactReaderStyle.tocBackground, background: bg },
    tocArea:       { ...ReactReaderStyle.tocArea, background: bg },
    prev:          { ...ReactReaderStyle.prev, background: 'transparent' },
    next:          { ...ReactReaderStyle.next, background: 'transparent' },
    arrow:         { ...ReactReaderStyle.arrow, color: THEMES[theme].muted },
  };
}

// ── EPUB içeriğine uygulanan stiller (iframe içi) ────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyEpubStyles(rend: any, t: Theme, ff: FontFamily, fs: number) {
  if (!rend?.themes) return;
  const { bg, fg } = THEMES[t];
  const fontCss    = FONTS[ff].css;

  rend.themes.fontSize(`${fs}%`);

  // line-height sadece paragraf elementlerine → kapak/absolüt konumlu elementler kaymaz
  rend.themes.register('to-theme', {
    'html': {
      background: `${bg} !important`,
    },
    'body': {
      background:    `${bg} !important`,
      color:         `${fg} !important`,
      'font-family': `${fontCss} !important`,
    },
    // Sadece metin içerikli elementlere line-height
    'p, li, td, th, blockquote': {
      color:         `${fg} !important`,
      'font-family': `${fontCss} !important`,
      'line-height': '1.85 !important',
    },
    // Başlıklara renk ve font ama line-height YOK (absolüt konumlu kapak başlıkları kaymasın)
    'h1, h2, h3, h4, h5, h6': {
      color:         `${fg} !important`,
    },
    // Inline elementlere sadece renk, font-family/layout OVERRIDE YOK
    'a': { color: `${fg} !important` },
  });
  rend.themes.select('to-theme');
}

// ── Yükleniyor ───────────────────────────────────────────────────────────────
function EpubSkeleton() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="text-center">
        <BookOpen className="size-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm opacity-50">Kitap yükleniyor…</p>
      </div>
    </div>
  );
}

// ── Ayarlar paneli ───────────────────────────────────────────────────────────
function SettingsPanel({
  theme, setTheme,
  fontFamily, setFontFamily,
  fontSize, setFontSize,
  headerFg, headerBg,
}: {
  theme: Theme;          setTheme: (t: Theme) => void;
  fontFamily: FontFamily; setFontFamily: (f: FontFamily) => void;
  fontSize: number;      setFontSize: (s: number) => void;
  headerFg: string;      headerBg: string;
}) {
  return (
    <div
      className="absolute bottom-16 right-4 z-50 rounded-2xl shadow-2xl p-4 w-64 space-y-5 border"
      style={{ background: headerBg, color: headerFg, borderColor: `${headerFg}20` }}
    >
      {/* Tema */}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide opacity-50">Tema</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(THEMES) as Theme[]).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: theme === t ? `${headerFg}18` : 'transparent',
                color: headerFg,
                outline: theme === t ? `2px solid ${headerFg}40` : 'none',
              }}
            >
              {THEMES[t].icon}
              {THEMES[t].label}
            </button>
          ))}
        </div>
      </div>

      {/* Font ailesi */}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide opacity-50">Yazı Tipi</p>
        <div className="grid grid-cols-3 gap-1.5">
          {(Object.keys(FONTS) as FontFamily[]).map((f) => (
            <button
              key={f}
              onClick={() => setFontFamily(f)}
              className="py-2.5 rounded-xl text-xs font-medium transition-all"
              style={{
                fontFamily: FONTS[f].css,
                background: fontFamily === f ? `${headerFg}18` : 'transparent',
                color: headerFg,
                outline: fontFamily === f ? `2px solid ${headerFg}40` : 'none',
              }}
            >
              {FONTS[f].label}
            </button>
          ))}
        </div>
      </div>

      {/* Font boyutu */}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-wide opacity-50">Yazı Boyutu</p>
        <div className="flex items-center justify-between gap-1">
          {FONT_SIZES.map((s, i) => (
            <button
              key={s}
              onClick={() => setFontSize(s)}
              className="flex-1 py-2 rounded-xl font-bold transition-all tabular-nums"
              style={{
                fontSize: `${10 + i * 3}px`,
                background: fontSize === s ? `${headerFg}18` : 'transparent',
                color: headerFg,
                outline: fontSize === s ? `2px solid ${headerFg}40` : 'none',
              }}
            >
              A
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Ana sayfa ────────────────────────────────────────────────────────────────
export default function OkumaPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, ready } = useAuthGuard(undefined, true); // içerik sayfası: rol yönlendirmesi yok

  const { data: kitap, isLoading: kitapYukleniyor } = useQuery<KutuphaneKitap>({
    queryKey: ['kutuphane-kitap', slug],
    queryFn: () => api.get(`/api/kutuphane/kitaplar/${slug}`).then(r => r.data),
    retry: false,
    enabled: !!user,
  });

  const isPdf       = kitap?.tur === 'pdf';
  const isFixed     = kitap?.fixedLayout === true;   // Fixed Layout EPUB → no CSS override

  const [location, setLocation]           = useState<string | number>(0);
  const [theme, setTheme]                 = useState<Theme>('light');
  const [fontFamily, setFontFamily]       = useState<FontFamily>('serif');
  const [fontSize, setFontSize]           = useState<number>(100);
  const [showSettings, setShowSettings]   = useState(false);
  const [anchorRect, setAnchorRect]       = useState<DOMRect | null>(null);

  const { loading: translating, result: translationResult, activeWord, translate, close: closeTranslation } = useWordTranslation(slug);

  const handlePdfWordClick = useCallback((word: string, rect: DOMRect) => {
    setAnchorRect(rect);
    translate(word);
  }, [translate]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renditionRef  = useRef<any>(null);
  // Ref'ler: rendered event'i stale closure olmadan güncel değerleri okusun
  const themeRef      = useRef(theme);
  const fontFamilyRef = useRef(fontFamily);
  const fontSizeRef   = useRef(fontSize);

  useEffect(() => { themeRef.current      = theme;      }, [theme]);
  useEffect(() => { fontFamilyRef.current = fontFamily; }, [fontFamily]);
  useEffect(() => { fontSizeRef.current   = fontSize;   }, [fontSize]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getRendition = useCallback((rendition: any) => {
    renditionRef.current = rendition;

    // Fixed Layout EPUB'larda CSS override hiç uygulanmaz (piksel-tam InDesign layout bozulur)
    if (!isFixed) {
      rendition.on('rendered', () => {
        applyEpubStyles(renditionRef.current, themeRef.current, fontFamilyRef.current, fontSizeRef.current);
      });
    }

    // Metin seçimi (double-click / long-press → seçili kelime)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rendition.on('selected', (_cfi: string, contents: any) => {
      const sel  = contents?.window?.getSelection?.() as Selection | null;
      const word = sel?.toString().replace(/[.,!?;:"'()\n\r]/g, '').trim();
      if (word && word.length > 1 && !word.includes(' ')) {
        sel?.removeAllRanges();
        translate(word);
      }
    });

    // Tek tıklama — Selection.modify ile kelime genişletme (Chrome/Safari/WebKit)
    rendition.on('click', (e: MouseEvent) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = (e.target as any)?.ownerDocument as Document | undefined;
      if (!doc) return;

      const sel = doc.getSelection();

      // Önce mevcut seçim var mı diye bak (double-click durumu)
      if (sel && !sel.isCollapsed) {
        const word = sel.toString().replace(/[.,!?;:"'()\n\r]/g, '').trim();
        if (word && word.length > 1 && !word.includes(' ')) {
          sel.removeAllRanges();
          translate(word);
          return;
        }
      }

      // caretRangeFromPoint ile tıklanan noktaya git
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const range = (doc as any).caretRangeFromPoint?.(e.clientX, e.clientY) as Range | undefined;
      if (!range || !sel) return;

      sel.removeAllRanges();
      sel.addRange(range);

      // Selection.modify: kelime sınırlarına genişlet (Chrome/Safari)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sel as any).modify?.('move', 'backward', 'word');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sel as any).modify?.('extend', 'forward', 'word');
      } catch { /* Firefox: modify desteklenmiyor, kelime yok */ }

      const word = sel.toString().replace(/[.,!?;:"'()\n\r]/g, '').trim();
      sel.removeAllRanges();
      if (word && word.length > 1 && !word.includes(' ')) {
        translate(word);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translate, isFixed]);

  // Ayar değişince yeniden uygula — Fixed Layout kitaplarda atla
  useEffect(() => {
    if (!isFixed) applyEpubStyles(renditionRef.current, theme, fontFamily, fontSize);
  }, [isFixed, theme, fontFamily, fontSize]);

  function prev() { renditionRef.current?.prev(); }
  function next() { renditionRef.current?.next(); }

  if (!ready || kitapYukleniyor) return (
    <div className="min-h-[100dvh] flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  if (!kitap) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Kitap bulunamadı.</p>
        <Link href="/pano" className="text-primary text-sm hover:underline">Panoya dön</Link>
      </div>
    );
  }

  const t = THEMES[theme];

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: t.bg }}>

      {/* ── Header ── */}
      <header
        className="h-14 border-b flex items-center px-4 gap-3 shrink-0 z-10"
        style={{ background: t.headerBg, borderColor: `${t.headerFg}15` }}
      >
        {/* Logo */}
        <Link href="/pano" className="shrink-0" title="Panoya dön">
          <Logo
            size="sm"
            className={theme === 'dark' ? '[&>span]:text-zinc-200 [&>span:first-child]:text-primary [&>span:last-child]:text-primary' : ''}
          />
        </Link>

        <div className="w-px h-5 shrink-0" style={{ background: `${t.headerFg}20` }} />

        {/* Kitap bilgisi */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate" style={{ color: t.headerFg }}>
            {kitap.baslik}
          </p>
          <p className="text-xs truncate" style={{ color: t.muted }}>
            {kitap.yazar}
          </p>
        </div>

        {/* Seviye */}
        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
          {kitap.seviye}
        </span>

        {isPdf && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">
            PDF
          </span>
        )}

        {isFixed && (
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0" title="Sabit sayfa düzeni — InDesign tasarımı korunuyor">
            FXL
          </span>
        )}

        {/* Ayarlar butonu — Fixed Layout ve PDF'te gizli */}
        {!isPdf && !isFixed && (
          <button
            onClick={() => setShowSettings((s) => !s)}
            title="Okuma ayarları"
            className="p-2 rounded-lg transition-all shrink-0"
            style={{
              background: showSettings ? `${t.headerFg}12` : 'transparent',
              color: showSettings ? t.headerFg : t.muted,
            }}
          >
            <TypeIcon className="size-4" />
          </button>
        )}
      </header>

      {/* ── Reader ── */}
      {isPdf ? (
        <PdfFlipbook url={kitap.url} onWordClick={handlePdfWordClick} />
      ) : (
        <div className="flex-1 relative overflow-hidden">
          <ReactReader
            url={kitap.url}
            location={location}
            locationChanged={(cfi: string) => setLocation(cfi)}
            getRendition={getRendition}
            readerStyles={buildReaderStyles(theme)}
            showToc={true}
          />
        </div>
      )}

      {/* ── Ayarlar paneli — Fixed Layout ve PDF'te gösterilmez ── */}
      {!isPdf && !isFixed && showSettings && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)} />
          <SettingsPanel
            theme={theme}           setTheme={(v) => { setTheme(v); setShowSettings(false); }}
            fontFamily={fontFamily} setFontFamily={setFontFamily}
            fontSize={fontSize}     setFontSize={setFontSize}
            headerBg={t.headerBg}   headerFg={t.headerFg}
          />
        </>
      )}

      {/* ── Kelime Çeviri Popup ── */}
      {(translating || translationResult) && activeWord && (
        <TranslationPopup
          word={activeWord}
          result={translationResult}
          loading={translating}
          onClose={() => { closeTranslation(); setAnchorRect(null); }}
          theme={theme}
          anchorRect={anchorRect}
        />
      )}

      {/* ── Footer nav (sadece EPUB) ── */}
      {!isPdf && (
        <footer
          className="h-14 border-t flex items-center justify-between px-4 shrink-0"
          style={{ background: t.headerBg, borderColor: `${t.headerFg}15` }}
        >
          <button
            onClick={prev}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-all"
            style={{ color: t.muted }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${t.headerFg}10`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline">Geri</span>
          </button>

          <button
            onClick={() => setShowSettings((s) => !s)}
            className="p-2 rounded-lg transition-all"
            style={{ color: t.muted }}
          >
            <ChevronLeft className="size-3 inline" />
            <ChevronRight className="size-3 inline" />
          </button>

          <button
            onClick={next}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg transition-all"
            style={{ color: t.muted }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${t.headerFg}10`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <span className="hidden sm:inline">İleri</span>
            <ChevronRight className="size-4" />
          </button>
        </footer>
      )}
    </div>
  );
}
