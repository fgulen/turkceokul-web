'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

const PDFJS_VERSION = '5.4.296';
const BASE_SCALE    = 1.8;

// Text layer CSS — pdfjs standart, transparent ama seçilebilir
const TEXT_LAYER_CSS = `
.pdf-text-layer {
  position: absolute; top: 0; left: 0;
  overflow: hidden; line-height: 1;
  user-select: text; -webkit-user-select: text;
  cursor: text; pointer-events: all;
}
.pdf-text-layer span,
.pdf-text-layer br {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}
.pdf-text-layer ::selection {
  background: rgba(0, 100, 255, 0.25);
  color: transparent;
}
`;

interface Props {
  url: string;
  onWordClick?: (word: string) => void;
}

export default function PdfViewer({ url, onWordClick }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc]     = useState<any>(null);
  const [numPages, setNumPages] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom]         = useState(100);
  const [loading, setLoading]   = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError]       = useState('');

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjsRef     = useRef<any>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  // ── 1. PDF.js + belgeyi yükle ──────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const lib = await loadPdfJs();
        if (cancelled || !lib) return;
        pdfjsRef.current = lib;
        lib.GlobalWorkerOptions.workerSrc =
          `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
        const doc = await lib.getDocument(url).promise;
        if (cancelled) return;
        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch {
        if (!cancelled) { setError('PDF yüklenemedi.'); setLoading(false); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [url]);

  // ── 2. Sayfa render (canvas + text layer) ─────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;
    let cancelled = false;

    async function renderPage() {
      setRendering(true);
      try {
        renderTaskRef.current?.cancel();
        const lib  = pdfjsRef.current;
        const page = await pdfDoc.getPage(pageIndex + 1);
        if (cancelled) return;

        const scale = (BASE_SCALE * zoom) / 100;
        const vp    = page.getViewport({ scale });

        // Canvas
        const canvas = canvasRef.current!;
        const ctx    = canvas.getContext('2d')!;
        canvas.width  = vp.width;
        canvas.height = vp.height;

        const renderTask = page.render({ canvasContext: ctx, viewport: vp });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;

        // Text layer
        const textDiv = textLayerRef.current!;
        textDiv.innerHTML = '';
        textDiv.style.width  = `${vp.width}px`;
        textDiv.style.height = `${vp.height}px`;

        const textContent = await page.getTextContent();
        if (cancelled) return;

        // pdfjs v4+: TextLayer class; v3 compat: renderTextLayer function
        try {
          if (typeof lib.TextLayer === 'function') {
            // pdfjs v4/v5 preferred API
            const tl = new lib.TextLayer({
              textContentSource: textContent,
              container: textDiv,
              viewport: vp,
            });
            await tl.render();
          } else if (typeof lib.renderTextLayer === 'function') {
            const task = lib.renderTextLayer({
              textContentSource: textContent,
              container: textDiv,
              viewport: vp,
              textDivs: [],
            });
            // v4 returns { promise, cancel }; v3 returns RenderTask
            const p = task?.promise ?? task;
            if (p && typeof p.then === 'function') await p;
          }
        } catch (te) {
          if (!cancelled) console.warn('[PdfViewer] text layer failed:', te);
        }

      } catch (e: unknown) {
        // RenderingCancelledException beklenen bir durum
        if (e && typeof e === 'object' && 'name' in e && e.name !== 'RenderingCancelledException') {
          console.error(e);
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    renderPage();
    return () => { cancelled = true; renderTaskRef.current?.cancel(); };
  }, [pdfDoc, pageIndex, zoom]);

  // ── 3. Text layer — kelime seçimi + tek tıklama çeviri ───────────────────
  useEffect(() => {
    const el = textLayerRef.current;
    if (!el || !onWordClick) return;

    function wordAtPoint(x: number, y: number): string {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const range = (document as any).caretRangeFromPoint?.(x, y) as Range | null;
      if (!range) return '';
      const sel = window.getSelection();
      if (!sel) return '';
      sel.removeAllRanges();
      sel.addRange(range);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sel as any).modify?.('move', 'backward', 'word');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (sel as any).modify?.('extend', 'forward', 'word');
      } catch { /* Firefox: modify yok */ }
      const w = sel.toString().replace(/[.,!?;:"'()\n\r]/g, '').trim();
      sel.removeAllRanges();
      return w;
    }

    function handleWord(word: string) {
      if (word && word.length > 1 && !word.includes(' ')) {
        onWordClick!(word);
      }
    }

    function onMouseUp(e: MouseEvent) {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        // Kullanıcı sürükleyerek seçti
        const raw = sel.toString().replace(/[.,!?;:"'()\n\r\s]+/g, '').trim();
        sel.removeAllRanges();
        handleWord(raw);
        return;
      }
      // Tek tıklama → caretRangeFromPoint ile kelimeye git
      handleWord(wordAtPoint(e.clientX, e.clientY));
    }

    function onTouchEnd(e: TouchEvent) {
      const sel = window.getSelection();
      if (sel && !sel.isCollapsed) {
        const raw = sel.toString().replace(/[.,!?;:"'()\n\r\s]+/g, '').trim();
        sel.removeAllRanges();
        handleWord(raw);
        return;
      }
      const touch = e.changedTouches[0];
      if (touch) handleWord(wordAtPoint(touch.clientX, touch.clientY));
    }

    el.addEventListener('mouseup', onMouseUp);
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('mouseup', onMouseUp);
      el.removeEventListener('touchend', onTouchEnd as EventListener);
    };
  }, [onWordClick]);

  const goTo = useCallback((i: number) => {
    if (i < 0 || i >= numPages) return;
    setPageIndex(i);
  }, [numPages]);

  // ── UI ─────────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex-1 flex items-center justify-center bg-zinc-900">
      <p className="text-sm text-red-400">{error}</p>
    </div>
  );

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-zinc-900">
      <Loader2 className="size-8 animate-spin text-zinc-400" />
      <p className="text-sm text-zinc-500">PDF yükleniyor…</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
      <style>{TEXT_LAYER_CSS}</style>

      {/* Toolbar */}
      <div className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0">
        {/* Sayfa nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => goTo(pageIndex - 1)}
            disabled={pageIndex === 0}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
            aria-label="Önceki sayfa"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs text-zinc-400 tabular-nums font-medium min-w-20 text-center">
            {pageIndex + 1} / {numPages}
          </span>
          <button
            onClick={() => goTo(pageIndex + 1)}
            disabled={pageIndex >= numPages - 1}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
            aria-label="Sonraki sayfa"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Zoom + ipucu */}
        <div className="flex items-center gap-2">
          {onWordClick && (
            <span className="text-[10px] text-zinc-600 hidden sm:block">
              Kelime seç → çevir
            </span>
          )}
          <button
            onClick={() => setZoom((s) => Math.max(40, s - 15))}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            aria-label="Uzaklaştır"
          >
            <ZoomOut className="size-4" />
          </button>
          <span className="text-xs text-zinc-500 w-9 text-center font-medium">{zoom}%</span>
          <button
            onClick={() => setZoom((s) => Math.min(200, s + 15))}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            aria-label="Yakınlaştır"
          >
            <ZoomIn className="size-4" />
          </button>
        </div>
      </div>

      {/* Sayfa alanı */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div className="relative shadow-2xl" style={{ display: 'inline-block' }}>
          {rendering && (
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 z-10">
              <Loader2 className="size-6 animate-spin text-zinc-400" />
            </div>
          )}
          <canvas ref={canvasRef} className="block" />
          <div
            ref={textLayerRef}
            className="pdf-text-layer"
          />
        </div>
      </div>

      {/* Sayfa nav — alt */}
      <div className="h-12 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center gap-4 shrink-0">
        <button
          onClick={() => goTo(pageIndex - 1)}
          disabled={pageIndex === 0}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="size-4" />
          Önceki
        </button>
        <span className="text-xs text-zinc-600 tabular-nums">{pageIndex + 1} / {numPages}</span>
        <button
          onClick={() => goTo(pageIndex + 1)}
          disabled={pageIndex >= numPages - 1}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"
        >
          İleri
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ── PDF.js dinamik yükleyici ────────────────────────────────────────────────
async function loadPdfJs() {
  const KEY = '__pdfjs_v5__';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any)[KEY]) return (window as any)[KEY];
  const mod = await import(
    /* webpackIgnore: true */
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.mjs`
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any)[KEY] = mod;
  return mod;
}
