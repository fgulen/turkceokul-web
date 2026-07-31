'use client';

import { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Volume2, CheckCircle2, XCircle } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap, kontrolEt } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';
import { PlayingBars, NextButton, NavCounter, ActivityHint } from './ui';

interface Answer { detayId: string; secilenId: string; sonuc: boolean }

export function ResminSesiHangisiPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  const [localKalp, setLocalKalp] = useState(initKalp);
  const [combo, setCombo] = useState(0);

  // Ses havuzu artık sunucudan geliyor (etkinlik.sesSecenekleri, id ile keyleniyor —
  // 2026-07-31 cevap-gizli mimari fix'i: d.kelime1 bu tipte hedef ses kimliğiydi ve
  // her detayda ham gidiyordu, current.kelime1 === opt.kelime1 karşılaştırması hiç
  // oynamadan doğru cevabı ifşa ediyordu). Gönderilen "cevap" artık seçilen havuz
  // üyesinin Id'si; gerçek eşleşme kontrolEt/Cevapla'da sunucu tarafında doğrulanıyor.
  const sesSecenekleri = etkinlik.sesSecenekleri ?? [];

  const [index, setIndex] = useState(0);
  const [secilenId, setSecilenId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [showSummary, setShowSummary] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false); // state async/batched — hızlı çift tıklamada senkron guard bu
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const current = detaylar[index];
  const imgUrl = toMediaUrl(current.resimLink);
  const isLast = index === detaylar.length - 1;

  function handleOpt(audioSrc: string | null, optId: string) {
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
    setSecilenId(optId);
  }

  async function handleIleri() {
    if (!secilenId || pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);

    let isCorrect = false;
    try {
      ({ sonuc: isCorrect } = await kontrolEt(etkinlik.id, current.id, secilenId));
    } catch {
      isCorrect = false;
    }
    pendingRef.current = false;
    setPending(false);
    play(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if ([2, 3, 5, 10].includes(newCombo)) play('combo');
    } else {
      setCombo(0);
      setLocalKalp((k) => Math.max(0, k - 1));
    }

    const newAnswers = [...answers, {
      detayId: current.id,
      secilenId,
      sonuc: isCorrect,
    }];
    setAnswers(newAnswers);

    if (isLast) {
      setShowSummary(true);
    } else {
      setIndex(index + 1);
      setSecilenId(null);
      setPlayingId(null);
    }
  }

  function handleTamamla() {
    const cevaplar: Cevap[] = answers.map((a) => ({ id: a.detayId, cevap: a.secilenId }));
    onComplete(cevaplar);
  }

  // Özet ekranı
  if (showSummary) {
    return (
      <div className="max-w-sm md:max-w-lg mx-auto">
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
            onClick={() => { setAnswers([]); setIndex(0); setSecilenId(null); setPlayingId(null); setShowSummary(false); }}
            className="w-full py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Baştan Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Resmin Sesi"
      />
      <ActivityHint>Resmin sesini bul.</ActivityHint>

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
          const isSelected = secilenId === opt.id;
          const isPlaying = playingId === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={pending}
              onClick={() => handleOpt(opt.audioSrc, opt.id)}
              className={cn(
                'flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm transition-all duration-200',
                isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50',
              )}
            >
              <span className="shrink-0 size-9 rounded-lg bg-muted flex items-center justify-center">
                {isPlaying
                  ? <PlayingBars size="sm" color="bg-primary" />
                  : <Volume2 className="size-4" />
                }
              </span>
              <span className={cn('font-semibold', isSelected ? 'text-primary' : 'text-foreground')}>
                {isPlaying ? 'Dinleniyor…' : 'Dinle'}
              </span>
            </button>
          );
        })}
      </div>

      <NextButton isLast={isLast} onClick={handleIleri} disabled={!secilenId || pending} />
      <NavCounter index={index} total={detaylar.length} />
    </div>
  );
}
