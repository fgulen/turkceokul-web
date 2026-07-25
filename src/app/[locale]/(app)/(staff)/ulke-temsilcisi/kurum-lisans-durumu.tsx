'use client';

// Kurum detay sayfası ve Kurumlar listesindeki "Lisans" SlideOver'ı arasında paylaşılan
// tek kaynak — sorgu + iki mutasyon burada, iki yerde kopyalanmıyor.

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn, apiHataMesaji } from '@/lib/utils';
import { LisansKart, type LisansKarti } from '@/components/lisans-kart';

const SATIN_AL_BUTON_METIN: Record<string, string> = {
  SatinAl: 'Satın Al',
  EkLisans: 'Ek Lisans Al / Kapasiteyi Artır',
};
const SALT_OKUNUR_BUTON_METIN: Record<string, string> = {
  Inceleniyor: 'Talebi inceleniyor',
};

export function KurumLisansDurumu({ kurumId }: { kurumId: number }) {
  const qc = useQueryClient();
  const [lisansMesaj, setLisansMesaj] = useState<{ id: string; mesaj: string } | null>(null);

  const lisanslarKey = ['ulke-temsilcisi-kurum-lisanslar', kurumId];
  const { data: lisanslar, isLoading, error } = useQuery<LisansKarti[]>({
    queryKey: lisanslarKey,
    queryFn: () => api.get(`/api/ulke-temsilcisi/kurum/${kurumId}/lisanslar`).then(r => r.data),
  });

  const denemeMutation = useMutation({
    mutationFn: (dersKitabiId: string) =>
      api.post(`/api/ulke-temsilcisi/kurum/${kurumId}/deneme-baslat`, { dersKitabiId }),
    onMutate: () => setLisansMesaj(null),
    onSuccess: (res) => {
      toast.success(res.data?.mesaj ?? 'Deneme başlatıldı.');
      qc.invalidateQueries({ queryKey: lisanslarKey });
    },
    onError: (err, dersKitabiId) => setLisansMesaj({ id: dersKitabiId, mesaj: apiHataMesaji(err) }),
  });

  const satinAlMutation = useMutation({
    mutationFn: (dersKitabiId: string) =>
      api.post(`/api/ulke-temsilcisi/kurum/${kurumId}/satin-al`, { dersKitabiId }),
    onMutate: () => setLisansMesaj(null),
    onSuccess: (res) => {
      toast.success(res.data?.mesaj ?? 'Talebiniz alındı.');
      qc.invalidateQueries({ queryKey: lisanslarKey });
    },
    onError: (err, dersKitabiId) => setLisansMesaj({ id: dersKitabiId, mesaj: apiHataMesaji(err) }),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-slate-100 animate-pulse" />)}
      </div>
    );
  }
  if (error) {
    return <p className="text-slate-500 text-sm text-center py-12">{apiHataMesaji(error)}</p>;
  }
  if (!lisanslar?.length) {
    return <p className="text-slate-400 text-sm text-center py-12">Kitap bulunamadı.</p>;
  }

  return (
    <div className="divide-y divide-slate-50">
      {lisanslar.map(k => {
        const denemeBaslatilabilir = k.buton === 'UcretsizDene';
        const satinAlinabilir = k.buton === 'SatinAl' || k.buton === 'EkLisans';
        const denemeGonderiliyor = denemeMutation.isPending && denemeMutation.variables === k.id;
        const satinAlGonderiliyor = satinAlMutation.isPending && satinAlMutation.variables === k.id;
        const kartMesaj = lisansMesaj?.id === k.id
          ? { tip: 'hata' as const, metin: lisansMesaj.mesaj }
          : null;

        return (
          <LisansKart
            key={k.id}
            kitap={k}
            mesaj={kartMesaj}
            aksiyon={denemeBaslatilabilir ? (
              <button
                disabled={denemeGonderiliyor}
                onClick={() => denemeMutation.mutate(k.id)}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors bg-emerald-500 text-white hover:bg-emerald-600',
                  denemeGonderiliyor && 'opacity-60 cursor-wait',
                )}
              >
                {denemeGonderiliyor ? 'Başlatılıyor…' : 'Ücretsiz Dene'}
              </button>
            ) : satinAlinabilir ? (
              <button
                disabled={satinAlGonderiliyor}
                onClick={() => satinAlMutation.mutate(k.id)}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-colors bg-primary text-white hover:bg-primary/90',
                  satinAlGonderiliyor && 'opacity-60 cursor-wait',
                )}
              >
                {satinAlGonderiliyor ? 'Gönderiliyor…' : SATIN_AL_BUTON_METIN[k.buton]}
              </button>
            ) : (
              <span className="shrink-0 text-xs text-slate-400 italic text-right">
                {SALT_OKUNUR_BUTON_METIN[k.buton]}
              </span>
            )}
          />
        );
      })}
    </div>
  );
}
