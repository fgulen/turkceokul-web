'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';

// /editor/* sayfalarının ortak çerçevesi — super-admin layout ile aynı desen.
// min-h 100dvh değil: shell zaten tam yükseklik; kısa sayfada scroll çıkmasın.
export default function EditorLayout({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuthGuard('Editor');
  if (!ready || !user) return null;

  return (
    <main className="max-w-[1200px] px-4 py-8">
      <div className="min-h-[calc(100dvh-8rem)]">
        {children}
      </div>
    </main>
  );
}
