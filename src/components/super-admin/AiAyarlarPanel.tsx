'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';

type Provider = 'anthropic' | 'openai' | 'deepseek' | 'gemini';

type AiAyarlar = {
  provider: Provider;
  model: string;
  apiKeyMasked: string | null;
  baseUrl: string | null;
  maxTokens: number | null;
};

const PROVIDER_SECENEKLERI: { id: Provider; label: string; disabled?: boolean }[] = [
  { id: 'anthropic', label: 'Anthropic (Claude)' },
  { id: 'openai', label: 'OpenAI' },
  { id: 'deepseek', label: 'DeepSeek' },
  { id: 'gemini', label: 'Gemini (yakında)', disabled: true },
];

const MODEL_ONERILERI: Record<Provider, string[]> = {
  anthropic: ['claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-5-mini'],
  deepseek: ['deepseek-chat'],
  gemini: [],
};

function apiHataMesaji(err: any): string {
  const data = err?.response?.data;
  if (typeof data === 'string' && data) return data;
  return data?.hata ?? 'İşlem başarısız.';
}

export function AiAyarlarPanel() {
  const qc = useQueryClient();
  const { data: ayarlar, isLoading } = useQuery({
    queryKey: ['sa-ai-ayarlar'],
    queryFn: () => api.get('/api/admin/ai-ayarlar').then(r => r.data as AiAyarlar),
  });

  const [provider, setProvider] = useState<Provider>('anthropic');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [kaydedildi, setKaydedildi] = useState(false);
  const [testSonuc, setTestSonuc] = useState<{ basarili: boolean; mesaj: string } | null>(null);

  useEffect(() => {
    if (ayarlar) {
      setProvider(ayarlar.provider);
      setModel(ayarlar.model ?? '');
    }
  }, [ayarlar]);

  const kaydetMutation = useMutation({
    mutationFn: () => api.put('/api/admin/ai-ayarlar', {
      provider,
      model: model.trim(),
      apiKey: apiKey.trim() ? apiKey.trim() : undefined,
    }),
    onMutate: () => { setHata(null); setKaydedildi(false); setTestSonuc(null); },
    onSuccess: () => {
      setKaydedildi(true);
      setApiKey('');
      qc.invalidateQueries({ queryKey: ['sa-ai-ayarlar'] });
      setTimeout(() => setKaydedildi(false), 3000);
    },
    onError: (err: any) => setHata(apiHataMesaji(err)),
  });

  const testMutation = useMutation({
    mutationFn: () => api.post('/api/admin/ai-ayarlar/test').then(r => r.data as { basarili: boolean; mesaj: string }),
    onMutate: () => { setTestSonuc(null); setHata(null); },
    onSuccess: (data) => setTestSonuc(data),
    onError: (err: any) => setHata(apiHataMesaji(err)),
  });

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-6 text-sm text-slate-400 text-center">
        Yükleniyor…
      </div>
    );
  }

  const oneriler = MODEL_ONERILERI[provider] ?? [];
  const keyPlaceholder = ayarlar?.apiKeyMasked ?? 'sk-...';

  return (
    <div className="bg-white border border-slate-200 rounded-xl">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-700">AI Model & API Yapılandırması</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          İçerik Stüdyosu üretimlerinde kullanılan AI sağlayıcı, model ve API anahtarı (BYOK).
        </p>
      </div>

      <div className="px-5 py-4 space-y-4 max-w-lg">
        <div>
          <label className="block text-xs font-medium mb-1 text-slate-700">Sağlayıcı</label>
          <select
            value={provider}
            onChange={(e) => { setProvider(e.target.value as Provider); setModel(''); }}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
          >
            {PROVIDER_SECENEKLERI.map((p) => (
              <option key={p.id} value={p.id} disabled={p.disabled}>{p.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-slate-700">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Örn. claude-sonnet-4-6"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
          {oneriler.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-1.5">
              {oneriler.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModel(m)}
                  className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
                    model === m ? 'border-purple-300 bg-purple-50 text-purple-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1 text-slate-700">API Anahtarı</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={keyPlaceholder}
            autoComplete="off"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
          />
          <p className="text-xs text-slate-400 mt-1">
            Boş bırakılırsa mevcut anahtar korunur. Kayıtlı anahtar tekrar görüntülenmez.
          </p>
        </div>

        {hata && <p className="text-xs text-red-600">{hata}</p>}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={() => kaydetMutation.mutate()}
            disabled={kaydetMutation.isPending || !model.trim()}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            {kaydetMutation.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </button>
          <button
            onClick={() => testMutation.mutate()}
            disabled={testMutation.isPending}
            className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {testMutation.isPending ? 'Test ediliyor…' : 'Bağlantıyı Test Et'}
          </button>
          {kaydedildi && <span className="text-xs text-green-600 font-medium">Kaydedildi ✓</span>}
        </div>

        {testSonuc && (
          <div className={`flex items-start gap-2 text-sm px-3 py-2 rounded-xl border ${
            testSonuc.basarili ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {testSonuc.basarili ? <CheckCircle2 className="size-4 shrink-0 mt-0.5" /> : <XCircle className="size-4 shrink-0 mt-0.5" />}
            <span>{testSonuc.mesaj}</span>
          </div>
        )}
      </div>
    </div>
  );
}
