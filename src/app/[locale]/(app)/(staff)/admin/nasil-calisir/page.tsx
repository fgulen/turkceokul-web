'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { NasilCalisirSayfasi } from '@/components/staff/nasil-calisir-sayfasi';

export default function AdminNasilCalisirPage() {
  const { user, ready } = useAuthGuard('Koordinator');

  if (!ready) return <div className="py-24 flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <main className="px-4 py-8">
      <NasilCalisirSayfasi />
    </main>
  );
}
