'use client';

import { X } from 'lucide-react';
import type { TranslationResult } from '@/hooks/use-word-translation';

interface Props {
  word: string;
  result: TranslationResult | null;
  loading: boolean;
  onClose: () => void;
  theme: 'light' | 'sepia' | 'dark';
}

const THEME_STYLES = {
  light: { bg: '#ffffff', fg: '#111111', border: '#e5e7eb', muted: '#6b7280', badgeBg: '#f3f4f6' },
  sepia: { bg: '#f5efe0', fg: '#3b2e1e', border: '#d6c9a8', muted: '#7a6550', badgeBg: '#ede6d3' },
  dark:  { bg: '#2c2c2e', fg: '#e8e0d4', border: '#3a3a3c', muted: '#9ca3af', badgeBg: '#3a3a3c' },
};

function SourceBadge({ source, theme }: { source: string; theme: 'light' | 'sepia' | 'dark' }) {
  const t = THEME_STYLES[theme];
  const labels: Record<string, { text: string; color: string }> = {
    cache: { text: '⚡ Cache', color: '#22c55e' },
    deepl: { text: '✓ DeepL',  color: '#3b82f6' },
    google:{ text: '⚠ Google', color: '#f59e0b' },
    stale: { text: '⚠ Eski',   color: '#ef4444' },
  };
  const badge = labels[source] ?? labels.cache;
  return (
    <span style={{
      fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px',
      background: t.badgeBg, color: badge.color, fontWeight: 600,
    }}>
      {badge.text}
    </span>
  );
}

export function TranslationPopup({ word, result, loading, onClose, theme }: Props) {
  const t = THEME_STYLES[theme];

  return (
    <div
      style={{
        position: 'fixed', bottom: '4.5rem', left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(320px, 90vw)',
        background: t.bg, color: t.fg,
        border: `1px solid ${t.border}`,
        borderRadius: '1rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 100,
        padding: '1rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{word}</span>
        <button onClick={onClose} style={{ color: t.muted, cursor: 'pointer', background: 'none', border: 'none', padding: '2px' }}>
          <X size={18} />
        </button>
      </div>

      {loading ? (
        <div style={{ color: t.muted, fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem' }}>
          ⟳ Çeviriliyor...
        </div>
      ) : result?.error ? (
        <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>{result.message}</div>
      ) : result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {result.turkishExplanation && (
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                🇹🇷 Türkçe Açıklama
              </div>
              <div style={{ fontSize: '0.9rem' }}>{result.turkishExplanation}</div>
            </div>
          )}

          {result.translation && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🇬🇧 İngilizce
                </span>
                <SourceBadge source={result.source} theme={theme} />
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 600 }}>{result.translation}</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
