'use client';

import { useCallback } from 'react';

type OscType = 'sine' | 'square' | 'triangle' | 'sawtooth';

interface Tone {
  freq: number;
  duration: number;
  delay?: number;
  type?: OscType;
  gain?: number;
}

function playTones(tones: Tone[]) {
  if (typeof window === 'undefined') return;
  const ctx = new AudioContext();

  tones.forEach(({ freq, duration, delay = 0, type = 'sine', gain = 0.18 }) => {
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

    vol.gain.setValueAtTime(0, ctx.currentTime + delay);
    vol.gain.linearRampToValueAtTime(gain, ctx.currentTime + delay + 0.01);
    vol.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(vol);
    vol.connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  });

  setTimeout(() => ctx.close(), (Math.max(...tones.map((t) => (t.delay ?? 0) + t.duration)) + 0.1) * 1000);
}

const SOUND_DEFS: Record<string, () => void> = {
  correct: () => playTones([
    { freq: 523, duration: 0.12 },           // C5
    { freq: 659, duration: 0.12, delay: 0.1 }, // E5
    { freq: 784, duration: 0.18, delay: 0.2 }, // G5
  ]),
  wrong: () => playTones([
    { freq: 300, duration: 0.15, gain: 0.15 },
    { freq: 220, duration: 0.2, delay: 0.13, gain: 0.12 },
  ]),
  combo: () => playTones([
    { freq: 523, duration: 0.08 },
    { freq: 659, duration: 0.08, delay: 0.08 },
    { freq: 784, duration: 0.08, delay: 0.16 },
    { freq: 1047, duration: 0.2, delay: 0.24, gain: 0.22 },
  ]),
  complete: () => playTones([
    { freq: 523, duration: 0.1 },
    { freq: 659, duration: 0.1, delay: 0.1 },
    { freq: 784, duration: 0.1, delay: 0.2 },
    { freq: 1047, duration: 0.1, delay: 0.3 },
    { freq: 1319, duration: 0.3, delay: 0.4, gain: 0.22 },
  ]),
  flip: () => playTones([
    { freq: 440, duration: 0.08, type: 'triangle', gain: 0.14 },
  ]),
  select: () => playTones([
    { freq: 600, duration: 0.07, type: 'triangle', gain: 0.12 },
  ]),
  sparkle: () => playTones([
    { freq: 1047, duration: 0.07, type: 'triangle', gain: 0.11 },        // C6
    { freq: 1319, duration: 0.07, delay: 0.09, type: 'triangle', gain: 0.09 }, // E6
    { freq: 1568, duration: 0.12, delay: 0.18, type: 'triangle', gain: 0.13 }, // G6
  ]),
};

type SoundKey = keyof typeof SOUND_DEFS;

export function useGameSound() {
  const play = useCallback((key: SoundKey) => {
    SOUND_DEFS[key]?.();
  }, []);

  return { play };
}
