'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

const PDFJS_VERSION = '5.4.296';
const BASE_SCALE    = 1.8;

const TEXT_LAYER_CSS = `
.pdf-text-layer {
  position: absolute; top: 0; left: 0;
  overflow: hidden; pointer-events: none;
}
.pdf-text-layer div[data-words] {
  position: absolute;
  cursor: pointer;
  pointer-events: all;
}
.pdf-text-layer div[data-words]:hover {
  background: rgba(0, 100, 255, 0.12);
  border-radius: 2px;
}
`;

interface Props {
  url: string;
  onWordClick?: (word: string, rect: DOMRect) => void;
}

export default function PdfViewer({ url, onWordClick }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [pdfDoc, setPdfDoc]       = useState<any>(null);
  const [numPages, setNumPages]   = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [zoom, setZoom]           = useState(100);
  const [spread, setSpread]       = useState(false); // iki sayfa modu
  const [loading, setLoading]     = useState(true);
  const [rendering, setRendering] = useState(false);
  const [error, setError]         = useState('');

  // Sol sayfa
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  // Sağ sayfa (spread modu)
  const canvas2Ref    = useRef<HTMLCanvasElement>(null);
  const textLayer2Ref = useRef<HTMLDivElement>(null);

  // ── 1. PDF.js + belge ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const lib = await loadPdfJs();
        if (cancelled || !lib) return;
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

  // ── 2. Render ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || !textLayerRef.current) return;
    let cancelled = false;
    const scale = (BASE_SCALE * zoom) / 100;

    async function renderOnePage(
      pageNum: number,
      canvas: HTMLCanvasElement,
      textDiv: HTMLDivElement,
    ) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const page = await (pdfDoc as any).getPage(pageNum);
      if (cancelled) return;
      const vp = page.getViewport({ scale });

      const ctx = canvas.getContext('2d')!;
      canvas.width  = vp.width;
      canvas.height = vp.height;
      await page.render({ canvasContext: ctx, viewport: vp }).promise;
      if (cancelled) return;

      textDiv.innerHTML = '';
      textDiv.style.width  = `${vp.width}px`;
      textDiv.style.height = `${vp.height}px`;
      if (onWordClick) {
        const tc = await page.getTextContent();
        if (!cancelled) buildClickLayer(tc.items, textDiv, vp, onWordClick);
      }
    }

    async function renderPages() {
      setRendering(true);
      try {
        await renderOnePage(pageIndex + 1, canvasRef.current!, textLayerRef.current!);

        const rightIdx = pageIndex + 1; // 0-based index sağ sayfa
        if (spread && rightIdx < numPages && canvas2Ref.current && textLayer2Ref.current) {
          await renderOnePage(rightIdx + 1, canvas2Ref.current, textLayer2Ref.current);
        } else if (canvas2Ref.current) {
          // Spread kapalıysa sağ canvas'ı temizle
          const ctx = canvas2Ref.current.getContext('2d');
          ctx?.clearRect(0, 0, canvas2Ref.current.width, canvas2Ref.current.height);
          if (textLayer2Ref.current) textLayer2Ref.current.innerHTML = '';
        }
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'name' in e &&
            (e as { name: string }).name !== 'RenderingCancelledException') {
          console.error(e);
        }
      } finally {
        if (!cancelled) setRendering(false);
      }
    }

    renderPages();
    return () => { cancelled = true; };
  }, [pdfDoc, pageIndex, zoom, spread, numPages, onWordClick]);

  // Spread moduna girerken çift sayfaya hizala (1. sayfa hariç)
  const toggleSpread = useCallback(() => {
    setSpread(prev => {
      const next = !prev;
      if (next) {
        setPageIndex(pi => (pi > 0 && pi % 2 !== 0 ? pi - 1 : pi));
      }
      return next;
    });
  }, []);

  const step = spread ? 2 : 1;

  const goTo = useCallback((i: number) => {
    if (i < 0 || i >= numPages) return;
    // Spread modunda sol sayfa daima çift index
    setPageIndex(spread && i > 0 && i % 2 !== 0 ? i - 1 : i);
  }, [numPages, spread]);

  // Sayfa sayacı etiketi
  const hasRight = spread && pageIndex + 1 < numPages;
  const pageLabel = hasRight
    ? `${pageIndex + 1}–${pageIndex + 2} / ${numPages}`
    : `${pageIndex + 1} / ${numPages}`;

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

      {/* ── Toolbar ── */}
      <div className="h-12 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-4 shrink-0 gap-3">

        {/* Sayfa nav */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => goTo(pageIndex - step)}
            disabled={pageIndex === 0}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
            aria-label="Önceki sayfa"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="text-xs text-zinc-400 tabular-nums font-medium min-w-[5rem] text-center">
            {pageLabel}
          </span>
          <button
            onClick={() => goTo(pageIndex + step)}
            disabled={pageIndex + step >= numPages}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30"
            aria-label="Sonraki sayfa"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>

        {/* Sağ kontroller */}
        <div className="flex items-center gap-2">
          {onWordClick && (
            <span className="text-[10px] text-zinc-600 hidden sm:block">
              Kelimeye tıkla → çevir
            </span>
          )}

          {/* Tek / iki sayfa toggle */}
          <div className="flex items-center rounded-md overflow-hidden border border-zinc-800 shrink-0">
            <button
              onClick={() => setSpread(false)}
              className={`px-2 py-1 text-xs font-semibold transition-colors ${!spread ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="Tek sayfa"
            >1</button>
            <button
              onClick={toggleSpread}
              className={`px-2 py-1 text-xs font-semibold transition-colors ${spread ? 'bg-zinc-700 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'}`}
              title="İki sayfa"
            >2</button>
          </div>

          {/* Zoom */}
          <button
            onClick={() => setZoom(s => Math.max(40, s - 15))}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            aria-label="Uzaklaştır"
          ><ZoomOut className="size-4" /></button>
          <span className="text-xs text-zinc-500 w-9 text-center font-medium">{zoom}%</span>
          <button
            onClick={() => setZoom(s => Math.min(200, s + 15))}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            aria-label="Yakınlaştır"
          ><ZoomIn className="size-4" /></button>
        </div>
      </div>

      {/* ── Sayfa alanı ── */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        <div className="flex items-start gap-1">
          {/* Sol / tek sayfa */}
          <div className="relative shadow-2xl shrink-0" style={{ display: 'inline-block' }}>
            {rendering && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 z-10">
                <Loader2 className="size-6 animate-spin text-zinc-400" />
              </div>
            )}
            <canvas ref={canvasRef} className="block" />
            <div ref={textLayerRef} className="pdf-text-layer" />
          </div>

          {/* Sağ sayfa (spread modu) */}
          {spread && (
            <div className="relative shadow-2xl shrink-0" style={{ display: 'inline-block' }}>
              <canvas ref={canvas2Ref} className="block" />
              <div ref={textLayer2Ref} className="pdf-text-layer" />
            </div>
          )}
        </div>
      </div>

      {/* ── Alt nav ── */}
      <div className="h-12 bg-zinc-950 border-t border-zinc-800 flex items-center justify-center gap-4 shrink-0">
        <button
          onClick={() => goTo(pageIndex - step)}
          disabled={pageIndex === 0}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="size-4" />Önceki
        </button>
        <span className="text-xs text-zinc-600 tabular-nums">{pageLabel}</span>
        <button
          onClick={() => goTo(pageIndex + step)}
          disabled={pageIndex + step >= numPages}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-30 transition-colors"
        >
          İleri<ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

// ── Kelime overlay'leri ─────────────────────────────────────────────────────
function buildClickLayer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[],
  container: HTMLElement,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vp: any,
  onWordClick: (w: string, rect: DOMRect) => void,
) {
  const vt = vp.transform as number[];
  for (const item of items) {
    if (!item.str?.trim()) continue;
    const tx: number[] = item.transform;
    const ix = vt[0] * tx[4] + vt[2] * tx[5] + vt[4];
    const iy = vt[1] * tx[4] + vt[3] * tx[5] + vt[5];
    const ih = Math.max(Math.abs(tx[3]) * vp.scale, 8);
    const iw = Math.max((item.width || 0) * vp.scale, 4);

    const totalLen = item.str.length || 1;
    let charPos = 0;
    for (const token of item.str.split(/(\s+)/)) {
      const word = token.trim().replace(/[.,!?;:"'«»()\[\]\n\r]/g, '').trim();
      if (word.length > 1) {
        const startFrac = charPos / totalLen;
        const wordW = Math.max((token.length / totalLen) * iw, 4);
        const div = document.createElement('div');
        div.dataset.words = word;
        div.style.left   = `${ix + startFrac * iw}px`;
        div.style.top    = `${iy - ih}px`;
        div.style.width  = `${wordW}px`;
        div.style.height = `${ih}px`;
        div.addEventListener('click', (e) => {
          onWordClick(word, (e.currentTarget as HTMLElement).getBoundingClientRect());
        });
        div.addEventListener('touchend', (e) => {
          e.preventDefault();
          onWordClick(word, (e.currentTarget as HTMLElement).getBoundingClientRect());
        });
        container.appendChild(div);
      }
      charPos += token.length;
    }
  }
}

// ── PDF.js yükleyici ────────────────────────────────────────────────────────
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
