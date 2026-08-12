'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';
import { toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { AudioPlayButton } from '@/components/players/ui';
import { useGameSound } from '@/hooks/use-game-sound';
import { useWordClickTranslate } from '@/hooks/use-word-click-translate';
import { TranslationPopup } from '@/components/okuma/translation-popup';
import type { EtkinlikData } from '@/types/etkinlik';

// Ücretsiz ipucu hakkı — bu sayıya kadar gönüllü tekrar açılış XP kesmez.
// API tarafındaki eşleniği: EtkinlikService.cs — PERDE_UCRETSIZ_ACILMA (aynı değerde tutulmalı).
export const PERDE_UCRETSIZ_ACILMA = 5;

interface Props {
  etkinlik: EtkinlikData;
  onBasla: () => void;
  // 0 = ilk zorunlu açılış (ceza yok), 1-5 = ücretsiz gönüllü tekrar, 6+ = her biri -1 XP
  acilmaSayisi: number;
  kitapId?: string;
}

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

export function PerdeGiris({ etkinlik, onBasla, acilmaSayisi, kitapId }: Props) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { play } = useGameSound();
  const ilkAcilis = acilmaSayisi === 0;
  const asilanHakSayisi = Math.max(0, acilmaSayisi - PERDE_UCRETSIZ_ACILMA);

  const bookId = kitapId ?? etkinlik.id;
  const {
    loading: translating,
    result: translationResult,
    activeWord,
    anchorRect,
    handleMouseUp: handleMetinMouseUp,
    close: closeTranslation,
  } = useWordClickTranslate(bookId);

  useEffect(() => {
    if (!ilkAcilis) return;
    const t = setTimeout(() => play('sparkle'), 280);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const resimUrl = toMediaUrl(etkinlik.resimLink);
  const sesUrl = toMediaUrl(etkinlik.sesLink);
  const videoUrl = toMediaUrl(etkinlik.videoLink);
  const metin = etkinlik.description;

  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setPlaying(false);
  }, [sesUrl]);

  function handleTogglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    const t = Number(e.target.value);
    if (audio) audio.currentTime = t;
    setCurrentTime(t);
  }

  function handleBasla() {
    audioRef.current?.pause();
    onBasla();
  }

  return (
    <motion.div
      initial={{ clipPath: 'inset(0 0 100% 0)' }}
      animate={{ clipPath: 'inset(0 0 0% 0)' }}
      exit={{ clipPath: 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.28, ease: 'easeInOut' }}
      className="fixed top-16 inset-x-0 bottom-14 md:bottom-0 z-50 bg-sky-50 dark:bg-sky-950 flex flex-col border-t border-sky-200 dark:border-sky-900/40"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="size-4" />
          <span>İpucu</span>
        </div>
        {!ilkAcilis && (
          asilanHakSayisi > 0 ? (
            <span className="text-xs font-semibold text-destructive">
              −{asilanHakSayisi} XP
            </span>
          ) : (
            <span className="text-xs font-medium text-muted-foreground">
              İpucu {acilmaSayisi}/{PERDE_UCRETSIZ_ACILMA}
            </span>
          )
        )}
      </div>

      {/* İçerik */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
          {ilkAcilis && (
            <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 text-sm text-primary font-medium text-center">
              <motion.span
                className="inline-block mr-1"
                animate={{ scale: [1, 1.6, 1.1, 1] }}
                transition={{ duration: 0.5, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
              >
                💡
              </motion.span>
              Perdeye hiç bakmadan tamamlarsan +2 bonus XP!
            </div>
          )}

          {resimUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- 30 etkinlik tipinde paylaşılan
            // kritik yol; next/image'ın uzak-host/boyut kısıtları hızlıca görsel doğrulanamadan
            // riske edilmiyor (bkz. akilli-kart.tsx aynı gerekçe).
            <img
              src={resimUrl}
              alt="Bağlam görseli"
              className="mx-auto block h-auto max-h-56 w-auto max-w-full rounded-xl object-contain"
            />
          )}

          {sesUrl && (
            <div className="flex flex-col gap-2 bg-muted rounded-xl px-4 py-3">
              <audio
                ref={audioRef}
                src={sesUrl}
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => setPlaying(false)}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                className="hidden"
              />
              <div className="flex items-center gap-3">
                <AudioPlayButton playing={playing} onPlay={handleTogglePlay} />
                <span className="text-sm text-muted-foreground">Sesi dinle</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs tabular-nums text-muted-foreground w-9 text-right shrink-0">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={currentTime}
                  onChange={handleSeek}
                  aria-label="Ses konumu"
                  className="flex-1 h-1.5 rounded-full bg-border accent-primary
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-5
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary
                    [&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary"
                />
                <span className="text-xs tabular-nums text-muted-foreground w-9 shrink-0">
                  {formatTime(duration)}
                </span>
              </div>
            </div>
          )}

          {videoUrl && (
            <video src={videoUrl} controls className="w-full rounded-xl" />
          )}

          {metin && (
            <div
              className="rounded-xl bg-muted/50 border border-border px-4 py-3 text-sm leading-relaxed [&_p]:mb-2 [&_br]:block selection:bg-yellow-200 selection:text-yellow-900"
              onMouseUp={handleMetinMouseUp}
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(metin) }}
            />
          )}
        </div>
      </div>

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

      {/* Başla butonu — cerez banner'ı gösterirken üstüne binmesin diye pay bırakılır */}
      <div className="px-4 pt-4 border-t shrink-0" style={{ paddingBottom: 'calc(var(--cerez-banner-h, 0px) + 1rem)' }}>
        <button
          onClick={handleBasla}
          className="w-full py-4 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          {ilkAcilis ? 'Başla' : 'Etkinliğe Dön'}
        </button>
      </div>
    </motion.div>
  );
}
