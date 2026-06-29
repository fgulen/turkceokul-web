'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from '@/navigation';
import { CheckCircle2, BookOpen, Zap } from 'lucide-react';

interface BolumTamamlandiProps {
  uniteId: string;
  kitapId: string;
  /** Okuma sırasında kullanıcının tıkladığı kelime sayısı */
  kelimeSayisi: number;
  /** Bir sonraki bölümün id'si. Yoksa son bölümdeyiz. */
  sonrakiBolumId?: string;
}

export function BolumTamamlandi({ uniteId, kitapId, kelimeSayisi, sonrakiBolumId }: BolumTamamlandiProps) {
  const queryClient = useQueryClient();

  // Kitap detay cache'ini temizle — bölüm kilit durumu güncellendi
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['okuma-kitap', kitapId] });
  }, [kitapId, queryClient]);

  // Üniteye kayıtlı kelimeler (API'dan)
  const { data: kelimeler } = useQuery<string[]>({
    queryKey: ['okuma-kelime', uniteId],
    queryFn: () => api.get(`/api/okuma/kelime/${uniteId}`).then((r) => r.data),
    retry: false,
  });

  return (
    <div className="text-center space-y-8 py-8">
      {/* Başarı ikonu */}
      <div className="flex justify-center">
        <div className="size-20 rounded-full bg-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="size-10 text-emerald-500" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-foreground">
          {sonrakiBolumId ? 'Bölüm Tamamlandı!' : 'Kitabı Tamamladın!'}
        </h2>
        <p className="text-muted-foreground text-sm">Harika iş çıkardın.</p>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
        <div className="rounded-xl border bg-card p-4 space-y-1 text-center">
          <Zap className="size-5 text-yellow-500 mx-auto" />
          <p className="text-2xl font-bold tabular-nums">{kelimeSayisi}</p>
          <p className="text-xs text-muted-foreground">Yeni kelime</p>
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-1 text-center">
          <BookOpen className="size-5 text-blue-500 mx-auto" />
          <p className="text-2xl font-bold">✓</p>
          <p className="text-xs text-muted-foreground">Bölüm bitti</p>
        </div>
      </div>

      {/* Kelime listesi özeti (API'dan geliyorsa) */}
      {kelimeler && kelimeler.length >= 3 && (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 max-w-xs mx-auto">
          <p className="font-semibold mb-1">{kelimeler.length} kelime öğrendin!</p>
          <p className="text-xs opacity-80">
            {/* TODO Faz 2.5: AkilliKart player ile pekiştir */}
            Akıllı kart ile pekiştir →
          </p>
        </div>
      )}

      {/* Navigasyon */}
      <div className="space-y-3 max-w-xs mx-auto w-full">
        {sonrakiBolumId ? (
          <Link
            href={`/okuma/kitap/${kitapId}/bolum/${sonrakiBolumId}`}
            className="flex items-center justify-center w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors min-h-[48px]"
          >
            Sonraki Bölüme Geç
          </Link>
        ) : (
          <Link
            href={`/okuma/kitap/${kitapId}`}
            className="flex items-center justify-center w-full rounded-xl bg-primary text-primary-foreground py-3 font-semibold hover:bg-primary/90 transition-colors min-h-[48px]"
          >
            Kitaba Dön
          </Link>
        )}
        <Link
          href="/okuma"
          className="flex items-center justify-center w-full rounded-xl border border-border py-3 text-sm font-medium hover:bg-muted/50 transition-colors min-h-[48px]"
        >
          Okuma Kitaplarına Dön
        </Link>
      </div>
    </div>
  );
}
