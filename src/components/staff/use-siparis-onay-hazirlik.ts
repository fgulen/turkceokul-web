'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { apiHataMesaji } from '@/lib/utils';

interface Params {
  siparisId: number;
  dersKitabiId: string | number | null | undefined;
  ogrenciKapasite: number | null | undefined;
  toplamTutar: number | null | undefined;
  siparisEndpoint: string;
  invalidate: () => void;
  setHata: (hata: string | null) => void;
  /** Onay basarili olunca invalidate()'e ek olarak cagrilir (orn. SlideOver'i kapatmak icin) */
  onBasarili?: () => void;
}

// Tutar hala 0'ken Onayla: otomatik hesaplanan (veya ek koltukla guncellenen)
// kapasite/tutari TEK atomik PUT ile /onayla'ya tasir (madde 97 — backend
// OnaylaSiparis artik opsiyonel ogrenciKapasite/toplamTutar kabul ediyor, guard'lardan
// once uyguluyor, iki ayri cagri arasinda yarim kalma riski yok). Duzenle panelindeki
// manuel-tutar akisiyla karistirma: tutar zaten girilmisse (offline pazarlik) bu hook
// devreye girmez, cagiran taraf `tutarBelirsiz`i kontrol edip eski tek-tik onaylamayi
// kullanir. `bekleyen-siparis-row.tsx` ve `kurumsal-satis-sayfasi.tsx` ayni mantigi
// bagimsiz kopyalamasin diye tek yerde tutuluyor (code-review bulgusu, madde 97).
export function useSiparisOnayHazirlik({
  siparisId, dersKitabiId, ogrenciKapasite, toplamTutar, siparisEndpoint, invalidate, setHata, onBasarili,
}: Params) {
  const [acik, setAcik] = useState(false);
  const [kapasite, setKapasite] = useState('');
  const [kapasiteDebounced, setKapasiteDebounced] = useState('');

  const tutarBelirsiz = (toplamTutar ?? 0) <= 0;
  // Paket siparislerinde DersKitabiId null olabilir — fiyat-hesapla kitap bazli
  // calistigi icin bu durumda hicbir zaman sonuc donmez, panel sonsuza dek
  // "hesaplaniyor" gorunur. Cagiran taraf bu bayrakla Duzenle'ye (manuel tutar
  // girisi var) yonlendirir.
  const hesaplanabilir = !!dersKitabiId;

  useEffect(() => {
    const t = setTimeout(() => setKapasiteDebounced(kapasite), 400);
    return () => clearTimeout(t);
  }, [kapasite]);

  const kapasiteSayi = Number(kapasiteDebounced);
  const { data: fiyatOnerisi, isFetching: hesaplaniyor } = useQuery({
    queryKey: ['fiyat-hesapla-onay', dersKitabiId, kapasiteSayi],
    queryFn: () => api.get('/api/katalog/fiyat-hesapla', {
      params: { kitapIdler: dersKitabiId, ogrenciSayisi: kapasiteSayi },
    }).then(r => r.data),
    enabled: acik && hesaplanabilir && kapasiteSayi > 0,
  });

  const onaylaMutation = useMutation({
    mutationFn: () => api.put(`${siparisEndpoint}/siparis/${siparisId}/onayla`, {
      ogrenciKapasite: kapasiteSayi,
      toplamTutar: fiyatOnerisi?.toplamEurCent ?? 0,
    }),
    onMutate: () => setHata(null),
    onSuccess: () => { setAcik(false); onBasarili?.(); },
    onError: (err: unknown) => setHata(apiHataMesaji(err)),
    onSettled: invalidate, // basarili/basarisiz fark etmez — sunucu durumu her zaman yeniden okunur
  });

  function ac() {
    const baslangic = String(ogrenciKapasite ?? '');
    setKapasite(baslangic);
    setKapasiteDebounced(baslangic);
    setAcik(true);
  }
  function kapat() {
    setAcik(false);
  }

  return {
    acik, ac, kapat, tutarBelirsiz, hesaplanabilir,
    kapasite, setKapasite, kapasiteSayi, fiyatOnerisi, hesaplaniyor, onaylaMutation,
  };
}
