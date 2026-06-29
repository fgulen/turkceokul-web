'use client';

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { useWordTranslation } from '@/hooks/use-word-translation';
import { TranslationPopup } from '@/components/okuma/translation-popup';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface OkumaMetinProps {
  uniteId: string;
  kitapId: string;
  /** Her eleman bir paragraf — EtkinlikDetay.description dizisi */
  paragraflar: string[];
  onKelimeTiklandi?: (kelimeTR: string) => void;
  onBitti: () => void;
}

function getCaretRange(x: number, y: number): Range | null {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (document as any).caretRangeFromPoint === 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (document as any).caretRangeFromPoint(x, y) as Range;
  }
  // Firefox fallback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pos = (document as any).caretPositionFromPoint?.(x, y);
  if (!pos) return null;
  const r = document.createRange();
  r.setStart(pos.offsetNode, pos.offset);
  r.setEnd(pos.offsetNode, pos.offset);
  return r;
}

function getWordAtPoint(x: number, y: number): { word: string; range: Range | null } {
  const range = getCaretRange(x, y);
  if (!range) return { word: '', range: null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (range as any).expand?.('word');
  const word = range.toString().replace(/[.,!?;:"'()\n\r«»—–]/g, '').trim();
  return { word, range };
}

export function OkumaMetin({
  uniteId,
  kitapId,
  paragraflar,
  onKelimeTiklandi,
  onBitti,
}: OkumaMetinProps) {
  const {
    loading: translating,
    result: translationResult,
    activeWord,
    translate,
    close: closeTranslation,
  } = useWordTranslation(kitapId);

  const [kaydilenKelimeler, setKaydilenKelimeler] = useState<Set<string>>(new Set());
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, paragraf: string) => {
      // Önce seçili metin var mı bak (mobil long-press / desktop drag)
      const selection = window.getSelection();
      const selectedText =
        selection?.toString().replace(/[.,!?;:"'()\n\r«»—–]/g, '').trim() ?? '';

      let word = '';
      let rect: DOMRect | null = null;
      if (selectedText && selectedText.split(/\s+/).length === 1 && selectedText.length > 1) {
        word = selectedText;
        // selection'dan rect al
        const selRange = selection?.getRangeAt(0) ?? null;
        rect = selRange?.getBoundingClientRect() ?? null;
        selection?.removeAllRanges();
      } else {
        const result = getWordAtPoint(e.clientX, e.clientY);
        word = result.word;
        rect = result.range?.getBoundingClientRect() ?? null;
      }

      if (!word || word.split(/\s+/).length !== 1 || word.length < 2) return;

      setAnchorRect(rect);

      // Çeviriyi başlat (async — state üzerinden sonuç gelir)
      translate(word);

      // Kelimeyi arka planda kaydet (hata durumunda UI etkilenmez)
      const normalized = word.toLowerCase();
      if (!kaydilenKelimeler.has(normalized)) {
        const ornekCumle = paragraf.replace(/<[^>]*>/g, '').slice(0, 200);
        api
          .post('/api/okuma/kelime', {
            uniteId,
            kelimeTR: normalized,
            ornekCumle,
            ceviriAR: null,
            ceviriRU: null,
          })
          .then(() => {
            setKaydilenKelimeler((prev) => new Set([...prev, normalized]));
            onKelimeTiklandi?.(normalized);
          })
          .catch(() => {
            // sessizce geç — kelime kaydı kritik değil
          });
      }
    },
    [translate, kaydilenKelimeler, uniteId, onKelimeTiklandi]
  );

  return (
    <div className="relative">
      {/* Kelime sayacı */}
      {kaydilenKelimeler.size > 0 && (
        <div className="mb-4 text-right">
          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {kaydilenKelimeler.size} kelime kaydedildi
          </span>
        </div>
      )}

      {/* Metin — tüm paragraflar scrollable */}
      <div className="space-y-5">
        {paragraflar.map((paragraf, pi) => (
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
          <div
            key={pi}
            className={cn(
              'text-lg leading-8 font-serif text-foreground',
              'selection:bg-yellow-200 selection:text-yellow-900'
            )}
            onMouseUp={(e) => handleMouseUp(e, paragraf)}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(paragraf) }}
          />
        ))}
      </div>

      {/* Devam Et */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={onBitti}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          Devam Et
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Çeviri popup */}
      {activeWord && (
        <TranslationPopup
          word={activeWord}
          result={translationResult}
          loading={translating}
          onClose={closeTranslation}
          theme="light"
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}
