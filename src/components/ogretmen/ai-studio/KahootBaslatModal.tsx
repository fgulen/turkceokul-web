'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Loader2, AlertCircle, Check, X } from 'lucide-react';
import { useRouter } from '@/navigation';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Sinif {
  id: number;
  name: string;
}

interface OlusturResponse {
  oyunKodu: string;
  sinifId: number | null;
  soruSayisi: number;
  demo: boolean;
}

export function KahootBaslatModal({
  etkinlikId,
  acik,
  onKapat,
}: {
  etkinlikId: string;
  acik: boolean;
  onKapat: () => void;
}) {
  const router = useRouter();
  const [seciliSinifId, setSeciliSinifId] = useState<number | null>(null);

  const { data: siniflar = [] } = useQuery<Sinif[]>({
    queryKey: ['siniflarim-modal'],
    queryFn: () => api.get('/api/ogretmen/siniflarim').then(r => r.data),
    enabled: acik,
  });

  const olusturMutation = useMutation({
    mutationFn: async (sinifId: number | null) => {
      const res = await api.post<OlusturResponse>('/api/kahoot/olustur', {
        sinifId: sinifId ?? null,
        etkinlikIdleri: [etkinlikId],
      });
      return res.data;
    },
    onSuccess: (data) => {
      // Sınıfsız oyun (sinifId === null): sinifId=0 ile route et
      if (data.sinifId === null) {
        const storageKey = 'kahoot_canli_0';
        sessionStorage.setItem(storageKey, data.oyunKodu);
        sessionStorage.removeItem(`${storageKey}_started`);
        router.push('/ogretmen/sinif/0/canli');
      } else {
        // Sınıflı oyun: sessionStorage'a kaydet ve navigate
        const storageKey = `kahoot_canli_${data.sinifId}`;
        sessionStorage.setItem(storageKey, data.oyunKodu);
        sessionStorage.removeItem(`${storageKey}_started`);
        router.push(`/ogretmen/sinif/${data.sinifId}/canli`);
      }
    },
  });

  function baslatOyun() {
    olusturMutation.mutate(seciliSinifId);
  }

  function kapat() {
    setSeciliSinifId(null);
    onKapat();
  }

  if (!acik) return null;

  // Portal + z-[80]: SlideOver/DeleteConfirmModal ile aynı sebep — üst öğelerin
  // stacking context'i (bkz. TurkishLetterBackdrop trap'i) modalı sticky header'ın
  // (z-70) altında bırakmasın.
  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[80]">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg max-w-sm w-full p-6 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Kahoot Başlat</h3>
          <button
            onClick={kapat}
            className="p-1 rounded-lg text-slate-300 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-3">
              Nerede başlatsın?
            </label>
            <div className="space-y-2">
              {/* Sınıfsız oyun — varsayılan seçili */}
              <button
                onClick={() => setSeciliSinifId(null)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                  seciliSinifId === null
                    ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20'
                    : 'bg-card border-border hover:bg-muted/40',
                )}
              >
                <div
                  className={cn(
                    'size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                    seciliSinifId === null ? 'bg-primary border-primary' : 'border-border',
                  )}
                >
                  {seciliSinifId === null && <Check className="size-3 text-white" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Sınıfsız hızlı oyun</p>
                  <p className="text-xs text-muted-foreground">PIN ile katılım</p>
                </div>
              </button>

              {/* Sınıf listesi */}
              {siniflar.map(sinif => (
                <button
                  key={sinif.id}
                  onClick={() => setSeciliSinifId(sinif.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                    seciliSinifId === sinif.id
                      ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/20'
                      : 'bg-card border-border hover:bg-muted/40',
                  )}
                >
                  <div
                    className={cn(
                      'size-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                      seciliSinifId === sinif.id ? 'bg-primary border-primary' : 'border-border',
                    )}
                  >
                    {seciliSinifId === sinif.id && <Check className="size-3 text-white" />}
                  </div>
                  <p className="text-sm font-medium text-foreground">{sinif.name}</p>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={baslatOyun}
            disabled={olusturMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors disabled:opacity-50 text-sm"
          >
            {olusturMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Başlatılıyor...
              </>
            ) : (
              <>▶ Oyunu Başlat</>
            )}
          </button>

          {olusturMutation.isError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle className="size-4 mt-0.5 shrink-0" />
              <span>Oyun oluşturulamadı. Lütfen tekrar deneyin.</span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
