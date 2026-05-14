'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';

interface Answer { detayId: string; secilen: string; dogru: string; sonuc: boolean }

export function ResminSesiHangisiPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { play } = useGameSound();

  // Ses seçenekleri tüm aktivite boyunca aynı sırada karışık kalır
  const sesSecenekleri = useMemo(
    () => detaylar
      .map((d) => ({
        id: d.id,
        audioSrc: d.sesLink || d.kelime1 || '', // sesLink yoksa kelime1'i dene
        kelime1: d.kelime1 ?? '',
      }))
      .sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [index, setIndex] = useState(0);
  const [secilen, setSecilen] = useState<string | null>(null);   // seçili kelime1
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = detaylar[index];
  const imgUrl = toMediaUrl(current.resimLink);
  const correct = current.kelime1 ?? '';
  const isLast = index === detaylar.length - 1;

  function handleOpt(audioSrc: string, kelime1: string, optId: string) {
    // Önce ses çal
    const url = toMediaUrl(audioSrc);
    if (url) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlayingId((p) => (p === optId ? null : p));
      audio.onerror = () => setPlayingId((p) => (p === optId ? null : p));
      audio.play().catch(() => setPlayingId((p) => (p === optId ? null : p)));
      setPlayingId(optId);
    }
    // Sonra seç
    setSecilen(kelime1);
  }

  function handleIleri() {
    if (!secilen) return;
    const isCorrect = secilen === correct;
    play(isCorrect ? 'correct' : 'wrong');

    const newAnswers = [...answers, {
      detayId: current.id,
      secilen,
      dogru: correct,
      sonuc: isCorrect,
    }];
    setAnswers(newAnswers);

    if (isLast) {
      setShowSummary(true);
    } else {
      setIndex(index + 1);
      setSecilen(null);
      setPlayingId(null);
    }
  }

  function handleTamamla() {
    const cevaplar: Cevap[] = answers.map((a) => ({ id: a.detayId, cevap: a.secilen }));
    onComplete(cevaplar);
  }

  // Özet ekranı
  if (showSummary) {
    return (
      <div className="max-w-sm mx-auto">
        <p className="text-center font-bold text-lg mb-6">Sonuçlar</p>
        <div className="space-y-3 mb-8">
          {answers.map((a) => {
            const d = detaylar.find((x) => x.id === a.detayId);
            const imgUrl = toMediaUrl(d?.resimLink);
            return (
              <div
                key={a.detayId}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl border-2',
                  a.sonuc ? 'border-[--correct] bg-[--correct]/5' : 'border-destructive bg-destructive/5',
                )}
              >
                {imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imgUrl} alt="" className="size-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="size-14 rounded-lg bg-muted shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{d?.description}</p>
                </div>
                {a.sonuc
                  ? <CheckCircle2 className="size-6 shrink-0" style={{ color: 'var(--correct)' }} />
                  : <XCircle className="size-6 shrink-0 text-destructive" />
                }
              </div>
            );
          })}
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleTamamla}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Sonu Gör →
          </button>
          <button
            onClick={() => { setAnswers([]); setIndex(0); setSecilen(null); setPlayingId(null); setShowSummary(false); }}
            className="w-full py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Baştan Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto">
      {/* İlerleme noktaları */}
      <div className="flex justify-center gap-1.5 mb-6">
        {detaylar.map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300',
              i < index  && 'bg-primary/40 w-3',
              i === index && 'bg-primary w-6',
              i > index  && 'bg-muted w-3',
            )}
          />
        ))}
      </div>

      {/* Resim */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <div className="rounded-2xl overflow-hidden border border-border/50">
            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl} alt={current.description ?? ''} className="w-full h-auto block" draggable={false} />
            ) : (
              <div className="flex items-center justify-center py-12 bg-muted text-muted-foreground text-sm">
                {current.description}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Ses seçenekleri — tüm karta tıklanınca hem çalar hem seçer */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {sesSecenekleri.map((opt) => {
          const isSelected = secilen === opt.kelime1;
          const isPlaying = playingId === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleOpt(opt.audioSrc, opt.kelime1, opt.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm transition-all duration-200',
                isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
              )}
            >
              <span className="shrink-0 size-9 rounded-lg bg-muted flex items-center justify-center">
                {isPlaying ? (
                  <span className="flex items-end gap-[2px] h-4">
                    {[0, 0.15, 0.3].map((delay, j) => (
                      <motion.span
                        key={j}
                        className="w-[2px] rounded-full bg-primary"
                        animate={{ height: ['3px', '12px', '3px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay, ease: 'easeInOut' }}
                      />
                    ))}
                  </span>
                ) : (
                  <Volume2 className="size-4" />
                )}
              </span>
              <span className={cn('font-semibold', isSelected ? 'text-primary' : 'text-foreground')}>
                {isPlaying ? 'Dinleniyor…' : 'Dinle'}
              </span>
            </button>
          );
        })}
      </div>

      {/* İleri */}
      <button
        onClick={handleIleri}
        disabled={!secilen}
        className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none"
      >
        {isLast ? 'Sonuçları Gör' : 'İleri'}
        <ChevronRight className="size-4" />
      </button>

      <p className="text-center text-xs text-muted-foreground mt-3">
        {index + 1} / {detaylar.length}
      </p>
    </div>
  );
}
