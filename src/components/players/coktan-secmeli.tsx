'use client';

import { useState } from 'react';
import { cn, toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { type PlayerProps, type Cevap, kontrolEt } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';

export function CoktanSecmeliPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [correctReveal, setCorrectReveal] = useState<string | null>(null);
  const [guessSonuc, setGuessSonuc] = useState<boolean | null>(null);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);

  const current = detaylar[index];
  const options = current.secenekler ?? [];

  async function handleSelect(opt: string) {
    if (selected !== null) return;
    setSelected(opt);

    let isCorrect = false;
    try {
      const { sonuc, dogruCevap } = await kontrolEt(etkinlik.id, current.id, opt);
      isCorrect = sonuc;
      setCorrectReveal(dogruCevap);
      setGuessSonuc(sonuc);
    } catch {
      // Ağ hatasında güvenli taraf: correctReveal null kalır, hiçbir buton yeşil/kırmızı
      // boyanmaz (bkz. quiz.tsx aynı fix) — önceki davranış yeşil vurgu + kalp kaybını
      // aynı anda üretiyordu.
      isCorrect = false;
    }
    play(isCorrect ? 'correct' : 'wrong');

    let newKalp = localKalp;
    if (isCorrect) {
      const newCombo = combo + 1;
      setCombo(newCombo);
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
    }, 700);
  }

  const sentence = current.description ?? '';

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket="Boşluk Doldurma"
      />


      {etkinlik.resimLink && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={toMediaUrl(etkinlik.resimLink) ?? ''}
          alt=""
          className="h-56 w-auto max-w-full mx-auto object-contain rounded-2xl mb-4 block"
        />
      )}

      <div className="bg-card border border-border rounded-2xl p-8 mb-6 text-center min-h-[100px] flex items-center justify-center">
        <p
          className="text-xl font-semibold leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(sentence).replace(
              /\[___\]|_{3,}/g,
              `<span class="inline-block min-w-[80px] border-b-2 border-primary mx-1 text-primary font-bold">${sanitizeHtml(selected ?? '&nbsp;&nbsp;&nbsp;&nbsp;')}</span>`
            ),
          }}
        />
      </div>

      <div className="flex flex-wrap gap-3 justify-center">
        {options.map((opt) => {
          // Sunucu yanlış tahminde artık dogruCevap döndürmüyor (2026-08-01 fix) — hangi
          // şıkkın doğru olduğu başka bir şıkta asla gösterilemez, yalnızca kendi seçimin
          // doğru/yanlış olduğu (guessSonuc) işaretlenir.
          const isSelected = opt === selected;
          const revealed = selected !== null && guessSonuc !== null;
          const isCorrectOption = correctReveal !== null && opt === correctReveal;
          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={selected !== null}
              className={cn(
                'px-5 py-2.5 rounded-xl border-2 font-medium text-sm transition-all',
                selected === null && 'border-border hover:border-primary hover:bg-primary/5',
                isSelected && !revealed && 'border-primary bg-primary/5',
                revealed && isSelected && isCorrectOption && 'border-[--correct] bg-[--correct]/10 text-[--correct]',
                revealed && isSelected && !isCorrectOption && 'border-destructive bg-destructive/10 text-destructive',
                revealed && !isSelected && 'opacity-40',
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
