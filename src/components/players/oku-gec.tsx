'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ImageOff, BookOpen, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type PlayerProps } from '@/types/etkinlik';
import { toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { useWordTranslation } from '@/hooks/use-word-translation';
import { TranslationPopup } from '@/components/okuma/translation-popup';
import { AudioPlayButton, PlayingBars } from './ui';

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
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioNeedsTap, setAudioNeedsTap] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const bookId = kitapId ?? etkinlik.id;
  const { loading: translating, result: translationResult, activeWord, translate, close: closeTranslation } = useWordTranslation(bookId);

  const current = detaylar[index];
  const progress = ((index + 1) / detaylar.length) * 100;
  const imgUrl = toMediaUrl(current.resimLink);
  const sesUrl = toMediaUrl(current.sesLink);
  const hasText = !!current.description?.trim();
  const hasImg = !!imgUrl && !imgError;

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setAudioPlaying(false);
  }

  function playAudio() {
    if (!sesUrl) return;
    stopAudio();
    setAudioNeedsTap(false);
    const a = new Audio(sesUrl);
    audioRef.current = a;
    setAudioPlaying(true);
    a.onended = () => { setAudioPlaying(false); setAudioNeedsTap(true); };
    a.onerror = () => setAudioPlaying(false);
    a.play().catch(() => setAudioPlaying(false));
  }

  // Sayfa değişince sesi durdur, varsa otomatik çal
  useEffect(() => {
    stopAudio();
    setImgError(false);
    setAudioNeedsTap(false);
    const url = toMediaUrl(detaylar[index]?.sesLink);
    if (!url) return;
    const t = setTimeout(() => {
      const a = new Audio(url);
      audioRef.current = a;
      setAudioPlaying(true);
      a.onended = () => { setAudioPlaying(false); setAudioNeedsTap(true); };
      a.onerror = () => setAudioPlaying(false);
      a.play().catch(() => { setAudioPlaying(false); setAudioNeedsTap(true); });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

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
    stopAudio();
    closeTranslation();
    if (index + 1 >= detaylar.length) {
      if (tiklananKelimeler.length >= 3) {
        setOzet(true);
      } else {
        onComplete(detaylar.map((d) => ({ id: d.id, cevap: '1' })));
      }
    } else {
      setIndex(index + 1);
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
          className="h-full rounded-full progress-shimmer"
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
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgUrl}
                  alt=""
                  className="w-full max-h-72 object-contain bg-muted"
                  onError={() => setImgError(true)}
                />
                {sesUrl && (
                  <div className="absolute bottom-2 right-2">
                    {audioNeedsTap && !audioPlaying && (
                      <span className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={audioPlaying ? stopAudio : playAudio}
                      className="relative size-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors"
                      aria-label="Dialogu dinle"
                    >
                      {audioPlaying
                        ? <PlayingBars size="sm" color="bg-white" />
                        : <Volume2 className="size-4 text-white" />
                      }
                    </button>
                  </div>
                )}
              </div>
            )
          )}

          {hasText && (
            <div className="p-6">
              {/* Resim yoksa ses butonu metnin üstünde göster */}
              {sesUrl && !hasImg && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative inline-flex">
                    {audioNeedsTap && !audioPlaying && (
                      <span className="absolute inset-0 rounded-lg bg-primary/30 animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={audioPlaying ? stopAudio : playAudio}
                      className="relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      {audioPlaying
                        ? <><PlayingBars size="sm" color="bg-primary" /><span>Dinleniyor…</span></>
                        : <><Volume2 className="size-3.5" /><span>Dialogu Dinle</span></>
                      }
                    </button>
                  </span>
                </div>
              )}
              {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <div
                className="text-lg md:text-xl leading-relaxed md:leading-loose font-mono whitespace-pre-wrap"
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
