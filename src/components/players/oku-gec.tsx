'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ImageOff, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type PlayerProps } from '@/types/etkinlik';
import { toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { useWordTranslation } from '@/hooks/use-word-translation';
import { TranslationPopup } from '@/components/okuma/translation-popup';

function getWordAtPoint(x: number, y: number): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const range = (document as any).caretRangeFromPoint?.(x, y) as Range | undefined;
  if (!range) return '';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (range as any).expand?.('word');
  return range.toString().replace(/[.,!?;:"'()\n\r«»—–]/g, '').trim();
}

export function OkuGecPlayer({ etkinlik, onComplete, kitapId, uniteId }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const [index, setIndex] = useState(0);
  const [imgError, setImgError] = useState(false);
  const [tiklananKelimeler, setTiklananKelimeler] = useState<string[]>([]);
  const [ozet, setOzet] = useState(false);

  const bookId = kitapId ?? etkinlik.id;
  const { loading: translating, result: translationResult, activeWord, translate, close: closeTranslation } = useWordTranslation(bookId);

  const current = detaylar[index];
  const progress = ((index + 1) / detaylar.length) * 100;
  const imgUrl = toMediaUrl(current.resimLink);
  const hasText = !!current.description?.trim();
  const hasImg = !!imgUrl && !imgError;

  const handleTextMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // Önce seçili metin var mı bak (mobil long-press / desktop drag)
    const selection = window.getSelection();
    const selectedText = selection?.toString().replace(/[.,!?;:"'()\n\r«»—–]/g, '').trim() ?? '';
    if (selectedText && selectedText.split(/\s+/).length === 1 && selectedText.length > 1) {
      translate(selectedText);
      setTiklananKelimeler(prev => prev.includes(selectedText) ? prev : [...prev, selectedText]);
      selection?.removeAllRanges();
      return;
    }

    // Seçim yoksa caretRangeFromPoint ile tıklanan kelimeyi bul
    const word = getWordAtPoint(e.clientX, e.clientY);
    if (!word || word.split(/\s+/).length !== 1 || word.length < 2) return;
    translate(word);
    setTiklananKelimeler(prev => prev.includes(word) ? prev : [...prev, word]);
  }, [translate]);

  function next() {
    closeTranslation();
    if (index + 1 >= detaylar.length) {
      if (tiklananKelimeler.length >= 3) {
        setOzet(true);
      } else {
        onComplete(detaylar.map((d) => ({ id: d.id, cevap: '1' })));
      }
    } else {
      setIndex(index + 1);
      setImgError(false);
    }
  }

  if (ozet) {
    return (
      <div className="max-w-lg md:max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 mb-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="size-5 text-primary" />
            <h3 className="font-semibold text-lg">Baktığın Kelimeler</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Bu okumada{' '}
            <span className="font-medium text-foreground">{tiklananKelimeler.length}</span>{' '}
            kelimeye baktın.
            {uniteId && (
              <span className="ml-1 text-xs opacity-60">· Ünite {uniteId}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {tiklananKelimeler.map((k) => (
              <span
                key={k}
                className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {k}
              </span>
            ))}
          </div>
        </motion.div>

        <button
          onClick={() => onComplete(detaylar.map((d) => ({ id: d.id, cevap: '1' })))}
          className={cn(
            'w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          Tamamla
          <ChevronRight className="size-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg md:max-w-2xl mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
        <span>{index + 1} / {detaylar.length}</span>
        <span>Oku &amp; Geç</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <motion.div
          className="h-full bg-primary rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25 }}
          className="bg-card border border-border rounded-2xl overflow-hidden mb-6"
        >
          {imgUrl && (
            imgError ? null : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt=""
                className="w-full max-h-72 object-contain bg-muted"
                onError={() => setImgError(true)}
              />
            )
          )}

          {hasText && (
            <div className="p-6">
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <div
                className="text-lg md:text-xl leading-relaxed md:leading-loose"
                onMouseUp={handleTextMouseUp}
                // eslint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(current.description!) }}
              />
            </div>
          )}

          {!hasImg && !hasText && (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <ImageOff className="size-10 opacity-30" />
              <p className="text-sm">İçerik bulunamadı.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {tiklananKelimeler.length > 0 && (
        <p className="text-xs text-muted-foreground text-center mb-3">
          {tiklananKelimeler.length} kelime kaydedildi
        </p>
      )}

      <button
        onClick={next}
        className={cn(
          'w-full py-4 rounded-2xl font-semibold flex items-center justify-center gap-2 transition-colors',
          'bg-primary text-primary-foreground hover:bg-primary/90'
        )}
      >
        {index + 1 >= detaylar.length ? 'Tamamla' : 'Devam Et'}
        <ChevronRight className="size-5" />
      </button>

      {activeWord && (
        <TranslationPopup
          word={activeWord}
          result={translationResult}
          loading={translating}
          onClose={closeTranslation}
          theme="light"
        />
      )}
    </div>
  );
}
