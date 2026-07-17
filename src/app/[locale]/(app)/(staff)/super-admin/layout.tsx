'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { TurkishLetterBackdrop } from '@/components/turkish-letter-backdrop';

// Tüm /super-admin/* sayfalarının ortak çerçevesi: yetki koruması + konteyner.
// "Super Admin Paneli" büyük başlığı kaldırıldı — bağlamı breadcrumb veriyor,
// her sayfanın kimliği kendi kart toolbar'ında (tutarlılık: editor ile aynı).
// min-h 100dvh DEĞİL: shell zaten tam yükseklik; içerik min-h'ı viewport'tan
// küçük tutulur ki kısa sayfalarda gereksiz scroll çıkmasın (8rem = header+padding).
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuthGuard('SuperAdmin');
  if (!ready || !user) return null;

  return (
    <>
      <TurkishLetterBackdrop variant="super-admin" opacity={0.04} />
      <main className="max-w-[1200px] mx-auto px-4 py-8" style={{ position: 'relative', zIndex: 1 }}>
        <div className="min-h-[calc(100dvh-8rem)]">
          {children}
        </div>
      </main>
    </>
  );
}
