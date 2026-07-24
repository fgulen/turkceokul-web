'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Modül seviyesinde singleton: auth.ts (logout) ve impersonation akışları
// (kullanicilar/page.tsx, impersonation-banner.tsx) kimlik değişiminde
// queryClient.clear() çağırabilsin diye — component-local useState ile
// bu dosyaların dışından erişilemezdi.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
