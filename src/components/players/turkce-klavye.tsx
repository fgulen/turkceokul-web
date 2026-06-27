'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// lowercase → uppercase çiftleri (Türkçeye özgü)
const LOWER = ['ğ', 'ü', 'ş', 'ö', 'ç', 'ı', 'i'];
const UPPER = ['Ğ', 'Ü', 'Ş', 'Ö', 'Ç', 'I', 'İ'];

interface TurkceKlavyeProps {
  onChar: (ch: string) => void;
  visible: boolean;
  disabled?: boolean;
}

export function TurkceKlavye({ onChar, visible, disabled }: TurkceKlavyeProps) {
  const [shifted, setShifted] = useState(false);
  const chars = shifted ? UPPER : LOWER;

  if (!visible) return null;

  return (
    <div className="flex gap-1.5 justify-center flex-wrap py-2">
      {/* Shift butonu */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // input focus'u korur
          setShifted((s) => !s);
        }}
        aria-label="Büyük/küçük harf"
        className={cn(
          'min-w-[44px] h-11 px-3 rounded-xl border-2 text-sm font-bold transition-all select-none',
          shifted
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-input bg-muted text-muted-foreground hover:bg-muted/80',
        )}
      >
        ⇧
      </button>

      {/* Türkçe karakterler */}
      {chars.map((ch, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onMouseDown={(e) => {
            e.preventDefault(); // input focus'u korur
            onChar(ch);
          }}
          className="min-w-[44px] h-11 px-3 rounded-xl border border-input bg-muted text-base font-semibold hover:bg-primary/10 active:scale-95 transition-all disabled:opacity-40 select-none"
        >
          {ch}
        </button>
      ))}
    </div>
  );
}

// Ref'i olan input'a cursor pozisyonuna karakter ekle
export function insertIntoInput(
  inputEl: HTMLInputElement,
  currentValue: string,
  ch: string,
): string {
  const start = inputEl.selectionStart ?? currentValue.length;
  const end = inputEl.selectionEnd ?? currentValue.length;
  const next = currentValue.slice(0, start) + ch + currentValue.slice(end);
  requestAnimationFrame(() => {
    inputEl.focus();
    inputEl.setSelectionRange(start + ch.length, start + ch.length);
  });
  return next;
}

// Yazma etkinlikleri için standart puan hesaplama
export function sadelestir(s: string) {
  return s.trim().toLowerCase();
}

export function stripTurkce(s: string) {
  return sadelestir(s)
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/ı/g, 'i').replace(/İ/gi, 'i');
}

export function scoreAnswer(value: string, correct: string) {
  const isCorrect = sadelestir(value) === sadelestir(correct);
  const isPerfect = isCorrect && value.trim() === correct.trim();
  const isYakin = !isCorrect && stripTurkce(value) === stripTurkce(correct);
  return { isCorrect, isPerfect, isYakin };
}
