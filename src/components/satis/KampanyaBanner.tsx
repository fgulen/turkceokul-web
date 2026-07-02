// web/src/components/satis/KampanyaBanner.tsx
import type { KatalogKampanya } from '@/lib/katalog-api';

interface Props {
  kampanya: KatalogKampanya;
  locale: string;
}

export function KampanyaBanner({ kampanya, locale }: Props) {
  const isEn = locale === 'en';
  const bitis = new Date(kampanya.bitisTarihi);
  const kalanGun = Math.ceil((bitis.getTime() - Date.now()) / 86400000);

  return (
    <div
      style={{
        background: 'linear-gradient(135deg,#f59e0b 0%,#f97316 100%)',
        borderRadius: 14,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>
        {kampanya.ad} — %{kampanya.indirimOrani} {isEn ? 'discount' : 'indirim'}!
      </span>
      {kalanGun > 0 && (
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#7c2d12',
            background: 'rgba(255,255,255,0.85)',
            borderRadius: 999,
            padding: '3px 12px',
          }}
        >
          {isEn ? `${kalanGun} days left` : `Son ${kalanGun} gün`}
        </span>
      )}
    </div>
  );
}
