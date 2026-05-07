'use client';

import { useCallback, useRef } from 'react';

const R2 = process.env.NEXT_PUBLIC_R2_URL ?? 'https://pub-46b389e8b43b4971bfcb50f467b8737c.r2.dev';

const SOUNDS = {
  correct: `${R2}/ses/ui/correct.mp3`,
  wrong: `${R2}/ses/ui/wrong.mp3`,
  combo: `${R2}/ses/ui/combo.mp3`,
  complete: `${R2}/ses/ui/complete.mp3`,
  flip: `${R2}/ses/ui/flip.mp3`,
  select: `${R2}/ses/ui/select.mp3`,
} as const;

type SoundKey = keyof typeof SOUNDS;

export function useGameSound() {
  const cache = useRef<Record<string, Howl>>({});

  const play = useCallback((key: SoundKey) => {
    if (typeof window === 'undefined') return;
    import('howler').then(({ Howl }) => {
      const src = SOUNDS[key];
      if (!cache.current[key]) {
        cache.current[key] = new Howl({ src: [src], volume: 0.6, preload: false });
      }
      cache.current[key].play();
    });
  }, []);

  return { play };
}
