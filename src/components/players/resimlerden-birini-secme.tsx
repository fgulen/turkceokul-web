'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageOff, Zap } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { type PlayerProps, type Cevap } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';
import { ActivityHint } from './ui';

const XP_BASE = 10;

function comboMult(combo: number) {
  if (combo >= 10) return 10;
  if (combo >= 5) return 5;
  if (combo >= 3) return 3;
  if (combo >= 2) return 2;
  return 1;
}

interface BurstData { id: number; amount: number; mult: number }

// Her resim seçeneği: hangi detaya ait, resim URL'si, doğru cevap değeri
interface ImageOption {
  detayId: string;
  imgUrl: string | null;
  label: string;      // resim yoksa fallback metin
  kelime1: string;    // backend'e submit edilecek değer
}

export function ResimlerdenBiriniSecmePlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  // Resim seçenekleri: tüm detaylardan, aktivite boyunca aynı sırayla
  const imageOptions: ImageOption[] = useMemo(
    () =>
      detaylar
        .map((d) => ({
          detayId: d.id,
          imgUrl: toMediaUrl(d.resimLink),
          label: d.kelime1 ?? d.description ?? '',
          kelime1: d.kelime1 ?? '',
        }))
        .sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [selected, setSelected] = useState<string | null>(null); // seçilen detayId
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [burst, setBurst] = useState<BurstData | null>(null);
  const burstId = useRef(0);

  const current = detaylar[index];
  const correctKelime1 = current.kelime1 ?? '';

  function handleSelect(opt: ImageOption) {
    if (selected !== null) return;
    setSelected(opt.detayId);

    const isCorrect = opt.kelime1 === correctKelime1;
    play(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const mult = comboMult(newCombo);
      burstId.current += 1;
      setBurst({ id: burstId.current, amount: XP_BASE * mult, mult });
      if ([2, 3, 5, 10].includes(newCombo)) play('combo');
    } else {
      setCombo(0);
      setLocalKalp((k) => Math.max(0, k - 1));
    }

    setTimeout(() => {
      const yeni = [...cevaplar, { id: current.id, cevap: opt.kelime1 }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex(index + 1);
        setSelected(null);
        setBurst(null);
      }
    }, 900);
  }

  const cols = imageOptions.length <= 4 ? 2 : 3;

  return (
    <div className="max-w-sm mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Resim Seç"
      />

      {etkinlik.soruYonergesi && (
        <ActivityHint>{etkinlik.soruYonergesi}</ActivityHint>
      )}

      {/* Soru */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="bg-card border border-border rounded-2xl p-6 mb-5 text-center min-h-[80px] flex items-center justify-center"
        >
          <p className="text-2xl font-bold">{current.description ?? current.kelime1}</p>
        </motion.div>
      </AnimatePresence>

      {/* XP burst */}
      <div className="relative h-0 overflow-visible">
        <AnimatePresence>
          {burst && (
            <motion.div
              key={burst.id}
              className="absolute left-1/2 -translate-x-1/2 -top-4 pointer-events-none z-50 flex flex-col items-center gap-0.5"
              initial={{ opacity: 1, y: 0, scale: 0.75 }}
              animate={{ opacity: 0, y: -68, scale: 1.05 }}
              transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
              onAnimationComplete={() => setBurst(null)}
            >
              <span className="flex items-center gap-1 text-2xl font-black drop-shadow-sm" style={{ color: 'var(--correct)' }}>
                <Zap className="size-5 fill-current" />
                +{burst.amount} XP
              </span>
              {burst.mult > 1 && (
                <span className="text-sm font-bold text-orange-500">{burst.mult}x Combo!</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Resim ızgarası */}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {imageOptions.map((opt) => {
          const isSelected = selected === opt.detayId;
          const isCorrect = opt.kelime1 === correctKelime1;
          const revealed = selected !== null;

          return (
            <motion.button
              key={opt.detayId}
              onClick={() => handleSelect(opt)}
              disabled={revealed}
              animate={
                isSelected && isCorrect
                  ? { scale: [1, 1.06, 0.97, 1] }
                  : isSelected && !isCorrect
                  ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
                  : {}
              }
              transition={{ duration: 0.38 }}
              className={cn(
                'relative rounded-2xl overflow-hidden border-2 transition-all duration-200',
                !revealed && 'border-border hover:border-primary hover:shadow-md cursor-pointer',
                isSelected && isCorrect && 'border-[--correct]',
                isSelected && !isCorrect && 'border-destructive',
                !isSelected && revealed && isCorrect && 'border-[--correct]',
                !isSelected && revealed && !isCorrect && 'opacity-40 border-border',
              )}
            >
              {opt.imgUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={opt.imgUrl}
                  alt={opt.label}
                  className="w-full h-auto block"
                  draggable={false}
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1 bg-muted text-muted-foreground p-4 text-center min-h-[80px]">
                  <ImageOff className="size-5 opacity-40" />
                  <span className="text-xs font-medium">{opt.label}</span>
                </div>
              )}

              {/* Doğru rozeti */}
              {revealed && isCorrect && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="size-9 rounded-full bg-white flex items-center justify-center shadow">
                    <span className="text-lg font-bold" style={{ color: 'var(--correct)' }}>✓</span>
                  </div>
                </div>
              )}
              {/* Yanlış rozeti (sadece seçilen yanlış resimde) */}
              {isSelected && !isCorrect && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="size-9 rounded-full bg-white flex items-center justify-center shadow">
                    <span className="text-lg font-bold text-destructive">✗</span>
                  </div>
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
