'use client';

import { X } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { TranslationResult } from '@/hooks/use-word-translation';

interface Props {
  word: string;
  result: TranslationResult | null;
  loading: boolean;
  onClose: () => void;
  theme: 'light' | 'sepia' | 'dark';
  anchorRect?: DOMRect | null;
}

const THEME_STYLES = {
  light: { bg: '#ffffff', fg: '#111111', border: '#e5e7eb', muted: '#6b7280', badgeBg: '#f3f4f6' },
  sepia: { bg: '#f5efe0', fg: '#3b2e1e', border: '#d6c9a8', muted: '#7a6550', badgeBg: '#ede6d3' },
  dark:  { bg: '#2c2c2e', fg: '#e8e0d4', border: '#3a3a3c', muted: '#9ca3af', badgeBg: '#3a3a3c' },
};

function SourceBadge({ source, theme }: { source: string; theme: 'light' | 'sepia' | 'dark' }) {
  const t = THEME_STYLES[theme];
  const labels: Record<string, { text: string; color: string }> = {
    cache:  { text: '⚡ Cache',  color: '#22c55e' },
    deepl:  { text: '✓ DeepL',  color: '#3b82f6' },
    google: { text: '⚠ Google', color: '#f59e0b' },
    stale:  { text: '⚠ Eski',   color: '#ef4444' },
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

const POPUP_W = 300;
const SPACE_BELOW = 180; // px — popup yüksekliği tahmini

function getPositionStyle(anchorRect?: DOMRect | null): CSSProperties {
  if (!anchorRect) {
    // EPUB / anchor yok → centered bottom
    return {
      position: 'fixed',
      bottom: '4.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
    };
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const GAP = 8;

  // Soldan başla: kelimenin ortası
  let left = anchorRect.left + anchorRect.width / 2 - POPUP_W / 2;
  // Viewport dışına taşmasın
  left = Math.max(8, Math.min(left, vw - POPUP_W - 8));

  // Altında yer var mı?
  const showBelow = anchorRect.bottom + GAP + SPACE_BELOW < vh;

  if (showBelow) {
    return { position: 'fixed', top: anchorRect.bottom + GAP, left };
  }
  // Üstte göster — popup'ın alt kenarı kelimenin üstüne yapışsın
  return { position: 'fixed', bottom: vh - anchorRect.top + GAP, left };
}

export function TranslationPopup({ word, result, loading, onClose, theme, anchorRect }: Props) {
  const t = THEME_STYLES[theme];
  const posStyle = getPositionStyle(anchorRect);

  return (
    <div
      style={{
        ...posStyle,
        width: POPUP_W,
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.border}`,
        borderRadius: '0.875rem',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        zIndex: 100,
        padding: '0.875rem 1rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>{word}</span>
        <button
          onClick={onClose}
          style={{ color: t.muted, cursor: 'pointer', background: 'none', border: 'none', padding: '2px', lineHeight: 1 }}
        >
          <X size={16} />
        </button>
      </div>

      {loading ? (
        <div style={{ color: t.muted, fontSize: '0.875rem', textAlign: 'center', padding: '0.4rem' }}>
          ⟳ Çeviriliyor...
        </div>
      ) : result?.error ? (
        <div style={{ color: '#ef4444', fontSize: '0.875rem' }}>{result.message}</div>
      ) : result ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {result.turkishExplanation && (
            <div>
              <div style={{ fontSize: '0.68rem', fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
                🇹🇷 Türkçe Açıklama
              </div>
              <div style={{ fontSize: '0.875rem' }}>{result.turkishExplanation}</div>
            </div>
          )}
          {result.translation && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '2px' }}>
                <span style={{ fontSize: '0.68rem', fontWeight: 600, color: t.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  🇬🇧 İngilizce
                </span>
                <SourceBadge source={result.source} theme={theme} />
              </div>
              <div style={{ fontSize: '0.975rem', fontWeight: 600 }}>{result.translation}</div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
