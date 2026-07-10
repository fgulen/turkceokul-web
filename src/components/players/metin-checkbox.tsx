'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Volume2 } from 'lucide-react';
import { cn, toMediaUrl } from '@/lib/utils';
import { sanitizeHtml } from '@/lib/sanitize';
import { type PlayerProps, type Cevap, getKelimelerIndexed } from '@/types/etkinlik';
import { usePlayerAudio } from '@/hooks/use-player-audio';
import { PlayingBars, NextButton } from './ui';

// NOT: dogru-yanlis.tsx ile aynı gizlilik mimarisi — bu tipte hangi şıkların doğru
// olduğu (Cevap mask'i) öğrenciye API'den hiç gönderilmiyor (DersController.GetEtkinlik
// — "ogretmenTier ? d.Cevap : null"). Anlık doğru/yanlış geri bildirimi İMKANSIZ;
// GameHUD/kalp/combo kullanılmaz, seçimler biriktirilip tek seferde onComplete ile
// gönderilir, sonuç yalnızca sunucu yanıtından gelir.
export function MetinCheckBoxPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const { playing: audioPlaying, play: playWord } = usePlayerAudio();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [secili, setSecili] = useState<Set<number>>(new Set());
  const [gonderildi, setGonderildi] = useState(false);

  const current = detaylar[index];
  const secenekler = useMemo(() => getKelimelerIndexed(current), [current]);
  const imgUrl = toMediaUrl(current.resimLink);
  const sesUrl = toMediaUrl(current.sesLink);
  const progress = (index / detaylar.length) * 100;

  // Legacy içerikte description sık sık ham HTML kalıntısı (<br>, <div><br></div>)
  // taşıyor — sanitize edip düz metne indirger, tamamen boşsa soru kutusunu hiç basma.
  const soruHtml = useMemo(() => sanitizeHtml(current.description ?? ''), [current]);
  const soruBos = soruHtml.replace(/<[^>]*>/g, '').trim() === '';

  function toggleSecenek(secenekIndex: number) {
    if (gonderildi) return;
    setSecili((prev) => {
      const yeni = new Set(prev);
      if (yeni.has(secenekIndex)) yeni.delete(secenekIndex);
      else yeni.add(secenekIndex);
      return yeni;
    });
  }

  function handleSubmit() {
    if (gonderildi) return;
    setGonderildi(true);

    // Pozisyonel mask — DB'deki Cevap formatıyla birebir aynı (kelime1..9 ↔ index 0..8)
    const mask = Array.from({ length: 9 }, (_, i) => (secili.has(i) ? '1' : '0')).join(',');

    setTimeout(() => {
      const yeni = [...cevaplar, { id: current.id, cevap: mask }];
      setCevaplar(yeni);
      if (index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex(index + 1);
        setSecili(new Set());
        setGonderildi(false);
      }
    }, 300);
  }

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>Soru {index + 1} / {detaylar.length}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full mb-5">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {imgUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgUrl}
          alt=""
          className="h-56 w-auto max-w-full mx-auto object-contain rounded-2xl mb-4 block"
        />
      )}

      {/* Soru + şıklar TEK animasyon bloğunda — ayrı ayrı key'lenirlerse geçiş
          sırasında (description fade-out sürerken şıklar zaten yenilenmiş olur)
          bir sonraki sorunun şıkları önceki sorunun metniyle bir arada görünür. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.22 }}
        >
          {!soruBos && (
            <div className="bg-card border border-border rounded-2xl p-6 mb-5 text-center min-h-[100px] flex items-center justify-center gap-3">
              <p
                className="text-lg font-semibold leading-relaxed"
                dangerouslySetInnerHTML={{ __html: soruHtml }}
              />
              {sesUrl && (
                <button
                  type="button"
                  onClick={() => playWord(sesUrl)}
                  className="shrink-0 size-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                  aria-label="Sesi çal"
                >
                  {audioPlaying
                    ? <PlayingBars size="sm" color="bg-primary" />
                    : <Volume2 className="size-4 text-primary" />
                  }
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3 mb-6">
            {secenekler.map(({ index: secenekIndex, text }) => {
              const isSecili = secili.has(secenekIndex);
              return (
                <button
                  key={secenekIndex}
                  onClick={() => toggleSecenek(secenekIndex)}
                  disabled={gonderildi}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3.5 md:py-4 rounded-xl border-2 text-left text-base font-medium transition-all disabled:pointer-events-none',
                    !gonderildi && !isSecili && 'border-border hover:border-primary hover:bg-primary/5',
                    isSecili && 'border-primary bg-primary/10 text-primary',
                    gonderildi && !isSecili && 'opacity-40',
                  )}
                >
                  <span
                    className={cn(
                      'shrink-0 size-6 rounded-md border-2 flex items-center justify-center transition-colors',
                      isSecili ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                    )}
                  >
                    {isSecili && <Check className="size-4 text-primary-foreground" />}
                  </span>
                  {text}
                </button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <NextButton
        isLast={index + 1 >= detaylar.length}
        onClick={handleSubmit}
        disabled={gonderildi || (secenekler.length > 0 && secili.size === 0)}
      />
    </div>
  );
}
