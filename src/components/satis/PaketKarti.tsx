// web/src/components/satis/PaketKarti.tsx
import { CheckCircle2, Package } from 'lucide-react';
import type { KatalogPaket } from '@/lib/katalog-api';

interface Props {
  paket: KatalogPaket;
  birimFiyatEurCent: number;
  locale: string;
}

export function PaketKarti({ paket, birimFiyatEurCent, locale }: Props) {
  const isEn = locale === 'en';

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: '22px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: '#eef2ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Package style={{ width: 16, height: 16, color: '#4f46e5' }} />
        </div>
        <span style={{ fontSize: 16, fontWeight: 800, color: '#1e1b1c' }}>{paket.ad}</span>
      </div>

      {paket.aciklama && (
        <p style={{ fontSize: 13, color: '#717882', lineHeight: '20px', marginBottom: 14 }}>{paket.aciklama}</p>
      )}

      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
        {paket.kitapAdlari.map((ad, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: '#414751', marginBottom: 7 }}>
            <CheckCircle2 style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0 }} />
            {ad}
          </li>
        ))}
      </ul>

      <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 12, fontSize: 13, fontWeight: 700, color: '#1e1b1c' }}>
        {paket.kitapIdler.length} {isEn ? 'books' : 'kitap'} · €{(birimFiyatEurCent / 100).toFixed(2)}{' '}
        <span style={{ fontSize: 11, fontWeight: 500, color: '#9ca3af' }}>
          / {isEn ? 'student / year' : 'öğrenci / yıl'}
        </span>
      </div>
    </div>
  );
}
