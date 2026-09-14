'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn, toMediaUrl, etkinlikLabel } from '@/lib/utils';
import { type PlayerProps, type Cevap, getKelimeler } from '@/types/etkinlik';
import { useAuthStore } from '@/stores/auth';
import { useGameSound } from '@/hooks/use-game-sound';
import { GameHUD } from '@/components/game/game-hud';
import { ActivityHint } from './ui';
import { sanitizeHtml } from '@/lib/sanitize';
import { TurkceKlavye, insertIntoInput, sadelestir } from './turkce-klavye';
import { splitByBlanks, countBlanks } from './blank-utils';

// writeCount=1/blankCount=0 satırlarında (278 satır) cevap tek kelime değil tam cümle
// ("Sema resim kursuna gidecek.") — sadelestir() yalnızca trim+lowercase yapıyor,
// cümle sonu noktalamasını (. ! ?) atmıyor. Öğrenci noktayı unutursa/eklerse (ikisi de
// dilbilgisel olarak doğru) yanlış sayılırdı. Inline tek-kelime boşluklarda (description
// içindeki "...." her zaman kendi sonunda ayrı bir "." taşıyor, bkz. DB) bu noktalama
// zaten yok, o yüzden ek strip zararsız.
function sadelestirCumle(s: string) {
  return sadelestir(s).replace(/[.!?]+$/, '').trim();
}

export function ResimliSoruCevapPlayer({ etkinlik, onComplete }: PlayerProps) {
  const detaylar = etkinlik.detaylar;
  const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
  const { play } = useGameSound();

  const [index, setIndex] = useState(0);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);
  const [values, setValues] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [localKalp, setLocalKalp] = useState(initKalp);
  const [focusedIdx, setFocusedIdx] = useState<number | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const current = detaylar[index];
  const sentence = current.description ?? '';
  const textParts = useMemo(() => splitByBlanks(sentence), [sentence]);
  const blankCount = countBlanks(sentence, null);
  // SoruCevap içeriğinde doğru cevap Kelime1..10'da değil, çoğunlukla Cevap alanında
  // tutuluyor (DB'de doğrulandı — Kelime1 yalnızca birkaç legacy/çok-boşluklu satırda
  // dolu, o satırlarda öncelik onda kalıyor). getKelimeler() boş dönünce kelime/kontrol
  // hedefi hiç bulunamıyor, cevap asla doğrulanamıyordu. Tek parça (DB'de doğrulandı:
  // "üçü çeyrek geçe" gibi çok kelimeli tek cevaplar var ama virgülle ayrılan
  // çoklu-boşluk deseni yok) — bu yüzden Cevap bölünmeden tek elemanlı dizi olarak
  // kullanılıyor.
  const kelimeAnswers = useMemo(() => getKelimeler(current), [current]);
  const answers = useMemo(
    () => (kelimeAnswers.length > 0 ? kelimeAnswers : current.cevap?.trim() ? [current.cevap.trim()] : []),
    [kelimeAnswers, current.cevap],
  );

  // Description'da "...." işareti olmayan satırlarda (278 satır — tüm cümleyi başka
  // zamanda/şekilde yeniden yazma görevi, örn. "gidiyor" → "gidecek") blankCount=0
  // çıkıyor ama Cevap yine dolu — bu satırlar eskiden hiç yazı alanı göstermeden
  // "İleri" ile atlanıyordu (cevap hiç sorulmuyordu). writeCount, gerçek yazılabilir
  // alan sayısı: inline boşluk varsa blankCount, yoksa (tam cümle cevabı varsa) 1.
  const writeCount = blankCount > 0 ? blankCount : (answers.length > 0 ? 1 : 0);

  // Boşluk görünümü + yazma alanı BoslukDoldurma ile aynı desen (blank-utils.ts) —
  // sistemde ayrık bir "chip'e tıkla" görünümü olmasın, aynı alt-çizgi + canlı
  // yansıyan input kullanılsın.
  useEffect(() => {
    setValues(Array(writeCount).fill(''));
    setSubmitted(false);
    setFocusedIdx(null);
    inputRefs.current = Array(writeCount).fill(null);
    const t = setTimeout(() => inputRefs.current[0]?.focus(), 150);
    return () => clearTimeout(t);
  }, [current.id, writeCount]);

  const safe = values.length === writeCount ? values : Array(writeCount).fill('');
  const allFilled = writeCount > 0 && safe.every((v) => v.trim().length > 0);

  const insertChar = useCallback((ch: string) => {
    if (focusedIdx === null) return;
    const el = inputRefs.current[focusedIdx];
    if (!el) return;
    const next = insertIntoInput(el, safe[focusedIdx], ch);
    setValues((prev) => {
      const arr = [...prev];
      arr[focusedIdx] = next;
      return arr;
    });
  }, [focusedIdx, safe]);

  function renderBlank(i: number) {
    const val = safe[i];
    const correct = submitted && sadelestirCumle(val) === sadelestirCumle(answers[i] ?? '');
    const wrong = submitted && !correct;
    const blankMinW = `${Math.max(3, (answers[i] ?? '___').length * 0.75)}em`;
    return (
      <span
        key={i}
        style={{ minWidth: blankMinW }}
        className={cn(
          'inline-block mx-1 px-2 py-0.5 border-b-2 text-center align-middle rounded-sm transition-all',
          !val && 'border-primary/40 border-dashed text-transparent',
          val && !submitted && 'border-primary text-primary font-bold',
          correct && 'border-[--correct] text-[--correct] font-bold',
          wrong && 'border-destructive text-destructive font-bold',
        )}
      >
        {val || ' '}
      </span>
    );
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!allFilled || submitted) return;
    setSubmitted(true);

    const isCorrect = safe.every((w, i) => sadelestirCumle(w) === sadelestirCumle(answers[i] ?? ''));
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
      const yeni = [...cevaplar, { id: current.id, cevap: safe.join(',') }];
      setCevaplar(yeni);
      // index ile AYNI batch'te sıfırla — aksi halde geçiş render'ında yeni sorunun
      // answers'ı eski values/submitted ile eşleşip bir kare yanlış renk yanıp söner
      // (useEffect'in reset'i bir sonraki passive-effect turuna kadar gecikir).
      setValues([]);
      setSubmitted(false);
      // 0 kalpte erken bitir — diğer player'larla (quiz/dogru-yanlis/bosluk-doldurma) tutarlı
      if (newKalp === 0 || index + 1 >= detaylar.length) {
        onComplete(yeni);
      } else {
        setIndex((i) => i + 1);
      }
    }, 1000);
  }

  // No-blank fallback: show image + answers, user taps Next
  function handleNext() {
    const yeni = [...cevaplar, { id: current.id, cevap: answers.join(',') }];
    setCevaplar(yeni);
    if (index + 1 >= detaylar.length) {
      onComplete(yeni);
    } else {
      setIndex((i) => i + 1);
    }
  }

  const imgUrl = toMediaUrl(current.resimLink);

  return (
    <div className="max-w-sm md:max-w-lg mx-auto">
      <GameHUD
        soruNo={index}
        toplamSoru={detaylar.length}
        kalp={localKalp}
        combo={combo}
        etiket={etkinlikLabel(etkinlik.etkinlikTuru)}
      />

      {imgUrl && (
        <div className="mb-4 rounded-2xl overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl} alt="" className="w-full h-auto object-cover" />
        </div>
      )}

      <ActivityHint>Boşlukları kendi cümlenle yazarak doldur</ActivityHint>

      {/* Dialogue text with inline blanks — BoslukDoldurma ile aynı alt-çizgi stili */}
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border-2 border-border rounded-2xl p-4 mb-5 text-[15px] leading-loose"
      >
        {blankCount === 0 ? (
          <div
            className="whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(current.description ?? '') }}
          />
        ) : (
          textParts.map((part, i) => (
            <span key={i}>
              <span dangerouslySetInnerHTML={{ __html: sanitizeHtml(part) }} />
              {i < blankCount && renderBlank(i)}
            </span>
          ))
        )}
      </motion.div>

      {/* Input(lar) — her boşluk için ayrı, hepsi aynı anda görünür (BoslukDoldurma deseni) */}
      {writeCount > 0 && (
        <form onSubmit={handleSubmit} className="space-y-3">
          {safe.map((val, i) => (
            <div key={i}>
              {blankCount > 1 && (
                <label className="block text-xs font-medium text-muted-foreground mb-1 ml-1">
                  {i + 1}. boşluk
                </label>
              )}
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                value={val}
                disabled={submitted}
                onChange={(e) => {
                  const val = e.target.value;
                  setValues((prev) => {
                    const next = prev.length === writeCount ? [...prev] : Array(writeCount).fill('');
                    next[i] = val;
                    return next;
                  });
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && i < writeCount - 1) {
                    e.preventDefault();
                    inputRefs.current[i + 1]?.focus();
                  }
                }}
                onFocus={() => setFocusedIdx(i)}
                onBlur={() => setFocusedIdx(null)}
                onPaste={(e) => e.preventDefault()}
                onCopy={(e) => e.preventDefault()}
                onCut={(e) => e.preventDefault()}
                onContextMenu={(e) => e.preventDefault()}
                placeholder="Cevabını yaz…"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className={cn(
                  'w-full h-14 px-5 rounded-2xl border-2 border-input bg-background text-lg font-medium outline-none transition-all',
                  'placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary',
                  'disabled:opacity-70',
                )}
              />
              <TurkceKlavye onChar={insertChar} visible={focusedIdx === i && !submitted} disabled={submitted} />
            </div>
          ))}

          <button
            type="submit"
            disabled={!allFilled || submitted}
            className={cn(
              'w-full py-4 rounded-2xl font-semibold transition-all',
              allFilled && !submitted
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60',
            )}
          >
            {index + 1 >= detaylar.length ? 'Tamamla' : 'Kontrol Et'}
          </button>
        </form>
      )}

      {/* Cevap datası hiç yoksa (teoride olmamalı, DB'de doğrulandı) son çare: referans göster + atla */}
      {writeCount === 0 && (
        <div className="space-y-3">
          {answers.map((ans, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-muted text-sm font-medium"
            >
              {ans}
            </div>
          ))}
          <button
            type="button"
            onClick={handleNext}
            className="w-full py-4 rounded-2xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all mt-2"
          >
            {index + 1 >= detaylar.length ? 'Tamamla' : 'İleri →'}
          </button>
        </div>
      )}
    </div>
  );
}
