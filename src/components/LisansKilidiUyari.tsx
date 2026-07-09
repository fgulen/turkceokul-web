'use client';

import { Link } from '@/navigation';

// Lisans duvari (spec: "Unite Kilidi"): ogrenci/ogretmen bilgilendirilir,
// KurumYoneticisi dogrudan Satin Al CTA'sina yonlendirilir.
export function LisansKilidiUyari({ rol }: { rol: string | null }) {
  const yonetici = rol === 'KurumYoneticisi';
  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-6 text-center">
      <div className="text-4xl mb-3">🔒</div>
      <p className="text-lg font-bold text-amber-900 mb-2">
        {yonetici ? 'Tam sürüme geçin' : 'Tam sürüm gereklidir'}
      </p>
      <p className="text-sm text-amber-800 mb-4">
        {yonetici
          ? 'Bu üniteye ve sonrasına erişmek için lisansınızı yükseltin.'
          : 'Bu üniteyi görüntülemek için tam sürüm gereklidir. Lütfen kurum koordinatörünüz ile iletişime geçin.'}
      </p>
      {yonetici && (
        <Link
          href="/kurum-yoneticisi"
          className="inline-block rounded-xl bg-amber-500 px-6 py-3 font-bold text-white hover:bg-amber-600"
        >
          Satın Al / Lisansı Yükselt
        </Link>
      )}
    </div>
  );
}
