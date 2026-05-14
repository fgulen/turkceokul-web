'use client';

import { useState, useRef, useEffect } from 'react';
import { Volume2, Zap } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';

const XP_BASE = 8;

function comboMult(combo: number) {
  if (combo >= 10) return 10;
  if (combo >= 5) return 5;
  if (combo >= 3) return 3;
  if (combo >= 2) return 2;
  return 1;
}

interface BurstData { id: number; amount: number; mult: number }

export function AkilliKartPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);

  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [burst, setBurst] = useState<BurstData | null>(null);
  const [biliyorumAnim, setBiliyorumAnim] = useState(false);
  const burstId = useRef(0);
  const flipDisabled = useRef(false);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const { play } = useGameSound();

  function playWordAudio(url: string) {
    if (wordAudioRef.current) {
      wordAudioRef.current.pause();
      wordAudioRef.current.currentTime = 0;
    }
    const audio = new Audio(url);
    wordAudioRef.current = audio;
    audio.play().catch(() => {});
  }

  useEffect(() => () => { wordAudioRef.current?.pause(); }, []);

  const current = detaylar[index];
  const imgUrl = toMediaUrl(current.resimLink);
  const sesUrl = toMediaUrl(current.sesLink);
  const word = current.description || current.kelime1 || '';
  const back = current.kelime1 || current.description || '';
  const imageMode = !!imgUrl;

  function handleFlip() {
    if (flipped || flipDisabled.current) return;
    setFlipped(true);
    play('flip');
    if (sesUrl) playWordAudio(sesUrl);
  }

  function answer(bildi: boolean) {
    if (flipDisabled.current) return;
    flipDisabled.current = true;

    if (bildi) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const mult = comboMult(newCombo);
      burstId.current += 1;
      const bid = burstId.current;
      setBurst({ id: bid, amount: XP_BASE * mult, mult });
      setTimeout(() => setBurst((b) => (b?.id === bid ? null : b)), 1200);
      setBiliyorumAnim(true);
      setTimeout(() => setBiliyorumAnim(false), 400);
      play([2, 3, 5, 10].includes(newCombo) ? 'combo' : 'correct');
    } else {
      setCombo(0);
      setLocalKalp((k) => Math.max(0, k - 1));
      play('wrong');
    }

    const next = [...cevaplar, { id: current.id, cevap: bildi ? '1' : '0' }];
    setCevaplar(next);

    const delay = bildi ? 480 : 320;
    setTimeout(() => {
      if (index + 1 >= detaylar.length) {
        onComplete(next);
      } else {
        setIndex(index + 1);
        setFlipped(false);
        // kart geçiş animasyonu (CSS, 200ms) bitince unlock
        setTimeout(() => { flipDisabled.current = false; }, 220);
      }
    }, delay);
  }

  return (
    <div className="max-w-sm mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Akıllı Kart"
        birim="Kart"
        hideCounter
      />

      {/* XP burst — CSS animasyonu (Framer Motion initial opacity:0 sorunu yok) */}
      <div className="relative h-0 overflow-visible">
        {burst && (
          <div
            key={burst.id}
            className="ak-burst absolute left-1/2 -translate-x-1/2 -top-4 pointer-events-none z-50 flex flex-col items-center gap-0.5"
            onAnimationEnd={() => setBurst(null)}
          >
            <span
              className="flex items-center gap-1 text-2xl font-black drop-shadow-sm"
              style={{ color: 'var(--correct)' }}
            >
              <Zap className="size-5 fill-current" />
              +{burst.amount} XP
            </span>
            {burst.mult > 1 && (
              <span className="text-sm font-bold text-orange-500">{burst.mult}x Combo!</span>
            )}
          </div>
        )}
      </div>

      {/* Kart — CSS slide-in (key değişince yeni animasyon tetiklenir) */}
      <div key={index} className="ak-card-in mb-4" style={{ perspective: '1400px' }}>
        <div
          className={cn('ak-flip-inner', flipped && 'ak-flipped')}
          style={{ transformStyle: 'preserve-3d', position: 'relative' }}
        >
          {/* SIZER */}
          <div style={{ visibility: 'hidden' }} aria-hidden="true" className="w-full rounded-2xl overflow-hidden">
            {imageMode && <img src={imgUrl!} alt="" className="w-full h-auto block" />}
            <div className={cn('flex flex-col items-center gap-3 px-6 py-5', !imageMode && 'min-h-44 justify-center')}>
              <p className="text-3xl font-bold text-center leading-tight">{imageMode ? word : back}</p>
              {sesUrl && <div className="size-10 rounded-full" />}
            </div>
          </div>

          {/* ÖN YÜZ */}
          <div
            role="button"
            tabIndex={0}
            onClick={handleFlip}
            onKeyDown={(e) => e.key === 'Enter' && handleFlip()}
            style={{ backfaceVisibility: 'hidden' }}
            className={cn(
              'absolute inset-0 rounded-2xl border overflow-hidden bg-card select-none',
              'flex flex-col cursor-pointer border-border/60 hover:border-primary/30 transition-colors',
            )}
          >
            {imageMode && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl!} alt={word} className="w-full h-auto block" draggable={false} />
            )}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-5">
              {!imageMode && (
                <p className="text-2xl font-bold text-center leading-snug">{word}</p>
              )}
              {imageMode ? (
                <p className="text-sm font-medium text-muted-foreground">
                  Bil bakalım — bu hangi kelime?
                </p>
              ) : (
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest">
                  Çevirmek için tıkla
                </p>
              )}
            </div>
          </div>

          {/* ARKA YÜZ */}
          <div
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            className="absolute inset-0 rounded-2xl border border-primary/25 overflow-hidden bg-card select-none flex flex-col"
          >
            {imageMode && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imgUrl!} alt={back} className="w-full h-auto block" draggable={false} />
            )}
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-5">
              <p className="text-3xl font-bold text-primary text-center leading-tight">
                {imageMode ? word : back}
              </p>
              {sesUrl && (
                <button
                  onClick={(e) => { e.stopPropagation(); playWordAudio(sesUrl); }}
                  className="size-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  aria-label="Sesi çal"
                >
                  <Volume2 className="size-4 text-primary" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bilmiyorum / Biliyorum — sadece arka yüzde, CSS ile göster/gizle */}
      {flipped && (
        <div className="ak-btns-in flex gap-4">
          <button
            onClick={() => answer(false)}
            className="flex-1 py-3 rounded-xl border-2 border-destructive text-destructive font-semibold hover:bg-destructive/10 transition-colors"
          >
            Bilmiyorum
          </button>
          <button
            onClick={() => answer(true)}
            className={cn(
              'flex-1 py-3 rounded-xl border-2 font-semibold transition-colors',
              biliyorumAnim && 'ak-correct-pulse',
            )}
            style={{ borderColor: 'var(--correct)', color: 'var(--correct)' }}
          >
            Biliyorum ✓
          </button>
        </div>
      )}

      {/* İlerleme noktaları — altta */}
      <div className="flex justify-center gap-1.5 mt-5">
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
    </div>
  );
}
