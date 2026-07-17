'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';

// /editor/* sayfalarının ortak çerçevesi — super-admin layout ile aynı desen:
// yetki koruması + konteyner + ortak min-height (menü geçişinde boy zıplamasın).
// Sayfa başlıkları sayfada kalır (Kitap Ekle / Kitabı Düzenle bağlama özel).
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuthGuard('Editor');
  if (!ready || !user) return null;

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <main className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="min-h-[calc(100dvh-13rem)]">
          {children}
        </div>
      </main>
    </div>
  );
}
