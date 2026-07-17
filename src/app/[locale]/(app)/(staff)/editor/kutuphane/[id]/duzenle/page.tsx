'use client';

// Düzenleme artık liste sayfasında SlideOver ile yapılıyor (4 Şablon Kuralı).
// Bu route eski derin linkler için korunuyor: ?duzenle= parametresiyle yönlendirir.

import { useEffect, use } from 'react';
import { useRouter } from '@/navigation';

export default function KitapDuzenleRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  useEffect(() => {
    router.replace(`/editor/kutuphane?duzenle=${encodeURIComponent(id)}`);
  }, [router, id]);
  return null;
}
