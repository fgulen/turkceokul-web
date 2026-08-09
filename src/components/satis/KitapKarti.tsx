// web/src/components/satis/KitapKarti.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import type { KatalogKitap } from '@/lib/katalog-api';
import { bookCoverUrl } from '@/lib/book-covers';
import { toMediaUrl } from '@/lib/utils';
import { DemoTalepModal } from '@/components/satis/DemoTalepModal';

interface Props {
  kitap: KatalogKitap;
  birimFiyatEurCent: number;
  locale: string;
  /** Kitabın serideki 1-tabanlı sırası — statik kapak fallback'inde (c1/c2/... vb.) doğru görseli seçmek için. */
  seriNo?: number;
  /** Okuma kitapları ayrı fiyatlanmıyor — herhangi bir ders kitabı lisansıyla dahil geliyor
   * (bkz. TURKCEOKULU_MODERNIZASYON_PLANI.md madde 73). true ise fiyat/CTA yerine "dahil" rozeti gösterilir. */
  dahil?: boolean;
}

const C = {
  tr: { cta: 'Demo / Teklif Talep Et', dahilRozeti: 'Ders kitabı lisansıyla dahil' },
  en: { cta: 'Request Demo / Quote', dahilRozeti: 'Included with any course-book licence' },
};

// "Düz renk sırt" — kapak görseli hiç yoksa (API'de kapakResimUrl boş, seri de
// eşlenemiyorsa) fiziksel kitap sırtı gibi düz renkli bir arka plan + kitap adı.
// Sabit palet, kitap id'sinden basit bir hash ile deterministik seçilir (aynı kitap
// her zaman aynı rengi alır, render'lar arası flicker olmaz).
const SPINE_PALETTE = ['#1b75bc', '#4f46e5', '#0ea5e9', '#059669', '#d97706', '#7c3aed'];
function spineColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return SPINE_PALETTE[Math.abs(hash) % SPINE_PALETTE.length];
}

export function KitapKarti({ kitap, birimFiyatEurCent, locale, seriNo = 1, dahil = false }: Props) {
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;
  const [modalOpen, setModalOpen] = useState(false);

  // Kapak fallback zinciri: API kapak görseli (öğretmen serbest URL'i) → resmi
  // ThumbnailPicture (R2/CDN, toMediaUrl ile çözülür) → BOOK_COVERS (seri + seriNo'ya
  // göre, statik c1-c4/y1-y5/h1-h4) → düz renk sırt. seriNo geçilmezse (default 1)
  // seri içindeki TÜM kitaplar aynı statik kapağı alır — bu yüzden çağıran taraf
  // (KatalogContent) rafın içindeki gerçek sırayı geçmek zorunda.
  const fallbackCover = kitap.seri ? bookCoverUrl(kitap.seri, seriNo) : '';
  const coverSrc = toMediaUrl(kitap.kapakResimUrl) || toMediaUrl(kitap.thumbnailPicture) || fallbackCover || '';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-primary/40">
      <div className="relative mb-3 aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-50">
        {coverSrc ? (
          // Kapak görselleri eski ASP.NET CDN'inde ya da öğretmenin girdiği serbest URL'de
          // olabilir — next.config.ts remotePatterns'e alınmadı, unoptimized ile next/image
          // kullanılıyor (CLS koruması için sabit aspect-ratio container + fill).
          <Image
            src={coverSrc}
            alt={kitap.ad}
            fill
            unoptimized
            sizes="200px"
            className="object-contain p-2"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center p-3 text-center"
            style={{ background: spineColor(kitap.id) }}
          >
            <span className="text-xs font-bold leading-tight text-white/95">{kitap.ad}</span>
          </div>
        )}
        {/* Raf efekti — kapağın altında ince gölge/çizgi, fiziksel raf üstünde duruyormuş hissi */}
        <div className="pointer-events-none absolute inset-x-1 bottom-0 h-2 rounded-full bg-black/15 blur-[3px]" />
      </div>

      <div className="min-h-[2.5rem] text-sm font-bold leading-5 text-slate-900 line-clamp-2">{kitap.ad}</div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {kitap.seviye && (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold tracking-[0.04em] text-primary">
            CEFR {kitap.seviye}
          </span>
        )}
        {kitap.seri && <span className="text-[11px] text-slate-400">{kitap.seri}</span>}
      </div>
      {dahil ? (
        <div className="mt-2.5 flex items-center gap-1.5 text-[12px] font-semibold text-green-700">
          <Check className="h-3.5 w-3.5 flex-shrink-0" />
          {c.dahilRozeti}
        </div>
      ) : (
        <>
          <div className="mt-2.5 text-[13px] font-bold text-slate-900">
            €{(birimFiyatEurCent / 100).toFixed(2)}{' '}
            <span className="text-[11px] font-medium text-slate-400">
              / {isEn ? 'student / year' : 'öğrenci / yıl'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-3 w-full rounded-[10px] border border-primary bg-white px-3 py-[9px] text-xs font-bold text-primary"
          >
            {c.cta}
          </button>

          {modalOpen && (
            <DemoTalepModal
              kitapId={kitap.id}
              kitapAdi={kitap.ad}
              locale={locale}
              onClose={() => setModalOpen(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
