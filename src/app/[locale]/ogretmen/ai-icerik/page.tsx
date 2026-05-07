'use client';

import { useState } from 'react';
import { Sparkles, FileText, Copy, Check } from 'lucide-react';
import { useAuthGuard } from '@/hooks/use-auth-guard';
import { AppNav } from '@/components/app-nav';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

const SEVIYELER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const KONULAR = [
  'Aile ve Ev', 'Yiyecek ve İçecek', 'Seyahat', 'İş Hayatı',
  'Eğitim', 'Sağlık', 'Alışveriş', 'Hava Durumu', 'Hobiler', 'Şehir Hayatı',
];

export default function AIIcerikPage() {
  const { user, ready } = useAuthGuard('Ogretmen');
  const [seviye, setSeviye] = useState('A1');
  const [konu, setKonu] = useState('');
  const [sonuc, setSonuc] = useState('');
  const [loading, setLoading] = useState(false);
  const [kopyalandi, setKopyalandi] = useState(false);

  async function egzersizUret() {
    if (!konu.trim()) return;
    setLoading(true);
    setSonuc('');
    try {
      const res = await api.post('/api/ai/konusma-egzersizi', { seviye, konu });
      setSonuc(res.data.icerik ?? JSON.stringify(res.data, null, 2));
    } catch (e: unknown) {
      setSonuc('Hata: ' + (e instanceof Error ? e.message : 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  }

  function kopyala() {
    navigator.clipboard.writeText(sonuc);
    setKopyalandi(true);
    setTimeout(() => setKopyalandi(false), 2000);
  }

  if (!ready) return <div className="min-h-screen flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <AppNav />
      <main className="max-w-[800px] mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="size-6 text-primary" />
            AI İçerik Üretici
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Seviye ve konuya göre otomatik Türkçe konuşma egzersizi oluşturun
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">Konuşma Egzersizi Üret</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                CEFR Seviyesi
              </label>
              <div className="flex gap-2 flex-wrap">
                {SEVIYELER.map(s => (
                  <button
                    key={s}
                    onClick={() => setSeviye(s)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                      seviye === s
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40',
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Konu
              </label>
              <select
                value={konu}
                onChange={e => setKonu(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
              >
                <option value="">Konu seçin...</option>
                {KONULAR.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <input
                type="text"
                value={konu}
                onChange={e => setKonu(e.target.value)}
                placeholder="veya kendi konunuzu yazın"
                className="w-full mt-2 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          <button
            onClick={egzersizUret}
            disabled={!konu.trim() || loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
          >
            <Sparkles className="size-4" />
            {loading ? 'Üretiliyor...' : 'Egzersiz Üret'}
          </button>
        </div>

        {/* Sonuç */}
        {(loading || sonuc) && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="size-4 text-slate-400" />
                Üretilen İçerik
              </h2>
              {sonuc && (
                <button
                  onClick={kopyala}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 text-slate-500 hover:text-primary hover:border-primary/40 transition-colors"
                >
                  {kopyalandi ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                  {kopyalandi ? 'Kopyalandı!' : 'Kopyala'}
                </button>
              )}
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-4 bg-slate-100 rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} />
                ))}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-sans">
                {sonuc}
              </pre>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
