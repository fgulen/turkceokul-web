'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn, toMediaUrl, diyalogMetinClass, duzMetneCevir } from '@/lib/utils';
import { type PlayerProps, type Cevap, kontrolEt } from '@/types/etkinlik';
import { useGameSound } from '@/hooks/use-game-sound';
import { useAuthStore } from '@/stores/auth';
import { GameHUD } from '@/components/game/game-hud';

const XP_BASE = 10;

function comboMult(combo: number) {
  if (combo >= 10) return 10;
  if (combo >= 5) return 5;
  if (combo >= 3) return 3;
  if (combo >= 2) return 2;
  return 1;
}

interface BurstData { id: number; amount: number; mult: number }

export function QuizPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  // sunucu artık yalnızca doğru bilindiğinde dogruCevap döndürüyor (2026-08-01 fix —
  // yanlışta göndermek her deneme cevabı ifşa ediyordu) — bu yüzden yanlış cevapta null
  // gelir ve başka bir şıkkı asla yeşil boyamaz. guessSonuc kendi seçimini kırmızı/yeşil
  // işaretlemek için ayrı tutuluyor.
  const [correctReveal, setCorrectReveal] = useState<string | null>(null);
  const [guessSonuc, setGuessSonuc] = useState<boolean | null>(null);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [burst, setBurst] = useState<BurstData | null>(null);
  const burstId = useRef(0);
  const { play } = useGameSound();

  const current = detaylar[index];
  const options = current.secenekler ?? [];
  const imgUrl = toMediaUrl(current.resimLink);

  async function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt); // butonları hemen kilitle — doğru/yanlış rengi sunucu yanıtını bekliyor

    let isCorrect = false;
    try {
      const { sonuc, dogruCevap } = await kontrolEt(etkinlik.id, current.id, opt);
      isCorrect = sonuc;
      setCorrectReveal(dogruCevap);
      setGuessSonuc(sonuc);
    } catch {
      // Ağ hatasında güvenli taraf: correctReveal null kalır, hiçbir buton yeşil/kırmızı
      // boyanmaz — önceki "seçileni doğru göster" davranışı yeşil vurgu + yanlış-cevap
      // sesi + kalp kaybını aynı anda üretiyordu (çelişkili UI).
      isCorrect = false;
    }
    play(isCorrect ? 'correct' : 'wrong');

    let newKalp = localKalp;
    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      const mult = comboMult(newCombo);
      burstId.current += 1;
      setBurst({ id: burstId.current, amount: XP_BASE * mult, mult });
      if ([2, 3, 5, 10].includes(newCombo)) play('combo');
    } else {
      setCombo(0);
      newKalp = Math.max(0, localKalp - 1);
      setLocalKalp(newKalp);
    }

    setTimeout(() => {
      const yeni = [...cevaplar, { id: current.id, cevap: opt }];
      setCevaplar(yeni);
      if (newKalp === 0 || index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex(index + 1);
        setSelected(null);
        setCorrectReveal(null);
        setGuessSonuc(null);
      }
    }, 950);
  }

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Quiz"
      />

      {imgUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgUrl}
          alt=""
          className="h-56 w-auto max-w-full mx-auto object-contain rounded-2xl mb-4 block"
        />
      )}

      {/* Soru kartı — açıklama yoksa gösterme (resim tek başına soru görevi görür) */}
      {current.description && (
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            className="bg-card border border-border rounded-2xl p-8 mb-5 text-center min-h-[120px] flex items-center justify-center"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            <p className={cn('text-2xl font-bold w-full', diyalogMetinClass(current.description) ?? 'text-center')}>{duzMetneCevir(current.description)}</p>
          </motion.div>
        </AnimatePresence>
      )}

      {/* XP burst — doğru cevapta yükseliyor */}
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cevap butonları */}
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          // Sunucu yanlış tahminde artık dogruCevap döndürmüyor (2026-08-01 fix — her
          // denemede gerçek cevabı ifşa ediyordu) — bu yüzden "hangi şık doğruydu"
          // artık asla başka bir şıkta gösterilemez, yalnızca kendi seçimin doğru/yanlış
          // olduğu (guessSonuc) işaretlenir.
          const isSelected = opt === selected;
          const revealed = selected !== null && guessSonuc !== null;
          const isCorrectOption = correctReveal !== null && opt === correctReveal;

          return (
            <motion.button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={selected !== null}
              className={cn(
                'py-4 px-3 rounded-xl border-2 font-medium text-sm transition-colors duration-150',
                selected === null && 'border-border hover:border-primary hover:bg-primary/5',
                isSelected && !revealed && 'border-primary bg-primary/5',
                revealed && isSelected && isCorrectOption && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
                revealed && isSelected && !isCorrectOption && 'border-destructive bg-destructive/10 text-destructive',
                revealed && !isSelected && 'opacity-35 border-border',
              )}
              animate={
                revealed && isSelected && isCorrectOption
                  ? { scale: [1, 1.07, 0.97, 1] }
                  : revealed && isSelected && !isCorrectOption
                  ? { x: [0, -10, 10, -7, 7, -4, 4, 0] }
                  : {}
              }
              transition={{ duration: 0.38, type: 'tween' }}
            >
              {opt}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
