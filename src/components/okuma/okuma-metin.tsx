'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useWordClickTranslate } from '@/hooks/use-word-click-translate';
import { TranslationPopup } from '@/components/okuma/translation-popup';
import { sanitizeHtml } from '@/lib/sanitize';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface OkumaMetinProps {
  uniteId: string;
  kitapId: string;
  /** Her eleman bir paragraf — EtkinlikDetay.description dizisi */
  paragraflar: string[];
  onKelimeTiklandi?: (kelimeTR: string) => void;
  onBitti: () => void;
}

export function OkumaMetin({
  uniteId,
  kitapId,
  paragraflar,
  onKelimeTiklandi,
  onBitti,
}: OkumaMetinProps) {
  const [kaydilenKelimeler, setKaydilenKelimeler] = useState<Set<string>>(new Set());

  const {
    loading: translating,
    result: translationResult,
    activeWord,
    anchorRect,
    handleMouseUp,
    close: closeTranslation,
  } = useWordClickTranslate<string>(kitapId, (word, paragraf) => {
    // Kelimeyi arka planda kaydet (hata durumunda UI etkilenmez)
    const normalized = word.toLocaleLowerCase('tr');
    if (kaydilenKelimeler.has(normalized)) return;
    const ornekCumle = paragraf.replace(/<[^>]*>/g, '').slice(0, 200);
    api
      .post('/api/okuma/kelime', {
        uniteId,
        kelimeTR: normalized,
        ornekCumle,
        ceviriAR: null,
        ceviriRU: null,
      })
      .then(() => {
        setKaydilenKelimeler((prev) => new Set([...prev, normalized]));
        onKelimeTiklandi?.(normalized);
      })
      .catch(() => {
        // sessizce geç — kelime kaydı kritik değil
      });
  });

  return (
    <div className="relative">
      {/* Kelime sayacı */}
      {kaydilenKelimeler.size > 0 && (
        <div className="mb-4 text-right">
          <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
            {kaydilenKelimeler.size} kelime kaydedildi
          </span>
        </div>
      )}

      {/* Metin — tüm paragraflar scrollable */}
      <div className="space-y-5">
        {paragraflar.map((paragraf, pi) => (
          <div
            key={pi}
            className={cn(
              'text-lg leading-8 font-serif text-foreground',
              'selection:bg-yellow-200 selection:text-yellow-900'
            )}
            onMouseUp={(e) => handleMouseUp(e, paragraf)}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(paragraf) }}
          />
        ))}
      </div>

      {/* Devam Et */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={onBitti}
          className={cn(
            'flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold transition-colors',
            'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          Devam Et
          <ChevronRight className="size-5" />
        </button>
      </div>

      {/* Çeviri popup */}
      {activeWord && (
        <TranslationPopup
          word={activeWord}
          result={translationResult}
          loading={translating}
          onClose={closeTranslation}
          theme="light"
          anchorRect={anchorRect}
        />
      )}
    </div>
  );
}
