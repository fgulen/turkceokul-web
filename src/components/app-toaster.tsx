'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Toaster } from 'sonner';

// Bazı sayfa/layout'lar arka plan desenini öne çıkarmak için
// position:relative+zIndex:1 kullanıyor (super-admin/layout.tsx, ogretmen/page.tsx).
// Toaster o ağacın içinde mount edilirse sabit z-index'i o trapped stacking
// context'e hapsolur ve sticky header'ın altında kalır — SlideOver'ın portal
// kullanma sebebiyle aynı sorun. Body'ye portallayınca tamamen atlanır.
export function AppToaster() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<Toaster richColors position="top-center" />, document.body);
}
