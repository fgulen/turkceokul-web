'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/navigation';

// Lisans duvari (spec: "Unite Kilidi"): sadece acik==true iken gosterilir (bkz.
// DersController.GetUniteler — LisansKilidi artik "&& acik"), yani deneme
// kullanicisi Unite 1'i en az %50 tamamlamadan bu ekranla hic karsilasmaz.
// Ogrenci ogretmenine, Ogretmen kurum koordinatorune yonlendirilir;
// KurumYoneticisi dogrudan Satin Al CTA'sina yonlendirilir.
export function LisansKilidiUyari({ rol }: { rol: string | null }) {
  const t = useTranslations('lisansKilidi');
  const yonetici = rol === 'KurumYoneticisi';
  const ogretmen = rol === 'Ogretmen';

  const baslik = yonetici ? t('yoneticiBaslik') : ogretmen ? t('ogretmenBaslik') : t('ogrenciBaslik');
  const mesaj = yonetici ? t('yoneticiMesaj') : ogretmen ? t('ogretmenMesaj') : t('ogrenciMesaj');

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
      <div className="text-4xl mb-3">🔒</div>
      <p className="text-lg font-bold text-amber-900 mb-2">{baslik}</p>
      <p className="text-sm text-amber-800 mb-4">{mesaj}</p>
      {yonetici && (
        <Link
          href="/kurum-yoneticisi"
          className="inline-block rounded-xl bg-amber-500 px-6 py-3 font-bold text-white hover:bg-amber-600"
        >
          {t('yoneticiButon')}
        </Link>
      )}
    </div>
  );
}
