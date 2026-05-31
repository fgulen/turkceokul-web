import { useState, useCallback } from 'react';
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

  const translate = useCallback(async (word: string) => {
    const clean = word.trim().toLowerCase().replace(/[.,!?;:"'()]/g, '');
    if (!clean) return;

    // Toggle off if same word tapped again
    if (clean === state.activeWord) {
      setState({ loading: false, result: null, activeWord: null });
      return;
    }

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
  }, [bookId, state.activeWord]);

  const close = useCallback(() => {
    setState({ loading: false, result: null, activeWord: null });
  }, []);

  return { ...state, translate, close };
}
