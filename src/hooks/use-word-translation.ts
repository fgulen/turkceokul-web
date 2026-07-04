import { useState, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export type TranslationSource = 'cache' | 'deepl' | 'google' | 'stale';

export interface TranslationResult {
  word: string;
  turkishExplanation?: string;
  translation?: string;
  source: TranslationSource;
  fromCache: boolean;
  error: boolean;
  message?: string;
}

interface TranslationState {
  loading: boolean;
  result: TranslationResult | null;
  activeWord: string | null;
}

export function useWordTranslation(bookId: string) {
  const [state, setState] = useState<TranslationState>({
    loading: false,
    result: null,
    activeWord: null,
  });

  // activeWord'ü ref'te tut → translate deps'i [bookId]'e iner ve KİMLİĞİ SABİT kalır.
  // Aksi halde her çeviride state.activeWord değişip translate yeniden oluşuyor, bu da
  // tüketicilerde (PdfFlipbook onWordClick) gereksiz yeniden render/loader flash yaratıyordu.
  const activeWordRef = useRef<string | null>(null);

  const translate = useCallback(async (word: string) => {
    const clean = word.trim().toLowerCase().replace(/[.,!?;:"'()]/g, '');
    if (!clean) return;

    // Toggle off if same word tapped again
    if (clean === activeWordRef.current) {
      activeWordRef.current = null;
      setState({ loading: false, result: null, activeWord: null });
      return;
    }

    activeWordRef.current = clean;

    setState({ loading: true, result: null, activeWord: clean });

    try {
      const { data } = await api.post<TranslationResult>('/api/okuma/kelime/cevir', {
        word: clean,
        bookId,
        sourceLang: 'tr',
        targetLang: 'EN-US',
      });
      setState({ loading: false, result: data, activeWord: clean });
    } catch {
      setState({
        loading: false,
        activeWord: clean,
        result: {
          word: clean,
          error: true,
          message: 'Çeviri yapılamadı.',
          source: 'cache',
          fromCache: false,
        },
      });
    }
  }, [bookId]);

  const close = useCallback(() => {
    activeWordRef.current = null;
    setState({ loading: false, result: null, activeWord: null });
  }, []);

  return { ...state, translate, close };
}
