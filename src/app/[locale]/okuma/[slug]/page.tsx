'use client';

import { use, useState, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  ArrowLeft, ChevronLeft, ChevronRight, BookOpen,
  Sun, BookMarked, Moon, TypeIcon,
} from 'lucide-react';
import { ReactReaderStyle, type IReactReaderStyle } from 'react-reader';
import { Logo } from '@/components/logo';
import { Link } from '@/navigation';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { cn } from '@/lib/utils';
import { useWordTranslation } from '@/hooks/use-word-translation';
import { TranslationPopup } from '@/components/okuma/translation-popup';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ReactReader = dynamic<any>(
  () => import('react-reader').then((m) => m.ReactReader),
  { ssr: false, loading: () => <EpubSkeleton /> },
);

// ── Katalog ─────────────────────────────────────────────────────────────────
const KITAPLAR: Record<string, { baslik: string; yazar: string; epubUrl: string; seviye: string }> = {
  'guliverin-seyahatleri': {
    baslik: "Güliver'in Seyahatleri",
    yazar: 'Jonathan Swift',
    epubUrl: '/books/guliverin-seyahatleri.epub',
    seviye: 'B1',
  },
};

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
// themes.font() ve themes.fontSize() epub.js'in yerleşik shorthand'leri —
// direkt body'ye priority:true ile inject eder.
// Renk için themes.register + themes.select kullanmak gerekiyor çünkü
// EPUB'ın kendi CSS'i override() ile gelen stilleri ezer.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyEpubStyles(rend: any, t: Theme, ff: FontFamily, fs: number) {
  if (!rend?.themes) return;
  const { bg, fg } = THEMES[t];

  rend.themes.font(FONTS[ff].css);
  rend.themes.fontSize(`${fs}%`);

  rend.themes.register('to-theme', {
    'html': {
      background: `${bg} !important`,
    },
    'body': {
      background: `${bg} !important`,
      color:      `${fg} !important`,
      'line-height': '1.85 !important',
    },
    'p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, blockquote': {
      color: `${fg} !important`,
    },
    'a': {
      color: `${fg} !important`,
    },
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
  const { user, ready } = useAuthGuard();
  const kitap = KITAPLAR[slug];

  const [location, setLocation]           = useState<string | number>(0);
  const [theme, setTheme]                 = useState<Theme>('light');
  const [fontFamily, setFontFamily]       = useState<FontFamily>('serif');
  const [fontSize, setFontSize]           = useState<number>(100);
  const [showSettings, setShowSettings]   = useState(false);

  const { loading: translating, result: translationResult, activeWord, translate, close: closeTranslation } = useWordTranslation('guliverin-seyahatleri');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renditionRef = useRef<any>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getRendition = useCallback((rendition: any) => {
    renditionRef.current = rendition;
    // İlk render'da mevcut ayarları uygula
    rendition.on('rendered', () => {
      applyEpubStyles(renditionRef.current, theme, fontFamily, fontSize);
    });
    rendition.on('selected', (cfiRange: string, contents: { window: Window }) => {
      const selection = contents.window.getSelection();
      const word = selection?.toString().trim();
      if (word && word.split(/\s+/).length === 1) {
        translate(word);
        selection?.removeAllRanges();
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translate]);

  // Ayar değişince yeniden uygula
  useEffect(() => {
    applyEpubStyles(renditionRef.current, theme, fontFamily, fontSize);
  }, [theme, fontFamily, fontSize]);

  function prev() { renditionRef.current?.prev(); }
  function next() { renditionRef.current?.next(); }

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
    </div>
  );
  if (!user) return null;

  if (!kitap) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
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

        {/* Ayarlar butonu */}
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
      </header>

      {/* ── EPUB Reader ── */}
      <div className="flex-1 relative overflow-hidden">
        <ReactReader
          url={kitap.epubUrl}
          location={location}
          locationChanged={(cfi: string) => setLocation(cfi)}
          getRendition={getRendition}
          readerStyles={buildReaderStyles(theme)}
          showToc={true}
        />
      </div>

      {/* ── Ayarlar paneli (floating) ── */}
      {showSettings && (
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
          onClose={closeTranslation}
          theme={theme}
        />
      )}

      {/* ── Footer nav ── */}
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
    </div>
  );
}
