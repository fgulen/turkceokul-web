'use client';

import { useCallback, useState } from 'react';
import { useWordTranslation } from './use-word-translation';

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

/**
 * Tıklanan/seçilen tek kelimeyi çevirir ve kelimenin hemen yanına (anchorRect)
 * yerleştirilecek TranslationPopup için konum bilgisini üretir.
 * Standart: word-click sözlük entegre eden her player/bileşen bunu kullanır
 * (bkz. players/PLAYER_STANDARD.md — Sözlük / Kelime Tıklama).
 */
export function useWordClickTranslate<TContext = void>(
  bookId: string,
  onWordPicked?: (word: string, context: TContext) => void,
) {
  const { loading, result, activeWord, translate, close } = useWordTranslation(bookId);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLElement>, context?: TContext) => {
    // Önce seçili metin var mı bak (mobil long-press / desktop drag)
    const selection = window.getSelection();
    const selectedText = selection?.toString().replace(/[.,!?;:"'()\n\r«»—–]/g, '').trim() ?? '';

    let word = '';
    let rect: DOMRect | null = null;
    if (selectedText && selectedText.split(/\s+/).length === 1 && selectedText.length > 1) {
      word = selectedText;
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
    translate(word);
    onWordPicked?.(word, context as TContext);
  }, [translate, onWordPicked]);

  return { loading, result, activeWord, anchorRect, handleMouseUp, close };
}
