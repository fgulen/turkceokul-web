// web/src/components/satis/KitapKarti.tsx
'use client';

import { useState } from 'react';
import type { KatalogKitap } from '@/lib/katalog-api';
import { DemoTalepModal } from '@/components/satis/DemoTalepModal';

interface Props {
  kitap: KatalogKitap;
  birimFiyatEurCent: number;
  locale: string;
}

const C = {
  tr: { cta: 'Demo / Teklif Talep Et' },
  en: { cta: 'Request Demo / Quote' },
};

export function KitapKarti({ kitap, birimFiyatEurCent, locale }: Props) {
  const isEn = locale === 'en';
  const c = isEn ? C.en : C.tr;
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 14,
        padding: 16,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    >
      <div
        style={{
          width: '100%',
          aspectRatio: '4 / 3',
          borderRadius: 10,
          marginBottom: 12,
          overflow: 'hidden',
          background: '#eef0f3',
        }}
      >
        {kitap.kapakResimUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={kitap.kapakResimUrl}
            alt={kitap.ad}
            width={300}
            height={225}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#1e1b1c', lineHeight: '20px' }}>{kitap.ad}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
        {kitap.seviye && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.04em',
              color: '#1b75bc',
              background: '#eff6ff',
              borderRadius: 999,
              padding: '2px 8px',
            }}
          >
            CEFR {kitap.seviye}
          </span>
        )}
        {kitap.seri && <span style={{ fontSize: 11, color: '#9ca3af' }}>{kitap.seri}</span>}
      </div>
      <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: '#1e1b1c' }}>
        €{(birimFiyatEurCent / 100).toFixed(2)}{' '}
        <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af' }}>
          / {isEn ? 'student / year' : 'öğrenci / yıl'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setModalOpen(true)}
        style={{
          marginTop: 12,
          width: '100%',
          padding: '9px 12px',
          borderRadius: 10,
          border: '1px solid #1b75bc',
          background: '#fff',
          color: '#1b75bc',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
        }}
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
    </div>
  );
}
