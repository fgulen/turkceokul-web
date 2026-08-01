'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';
import { KurumsalSatisSayfasi } from '@/components/staff/kurumsal-satis-sayfasi';

export default function AdminKurumsalSatisPage() {
  const { user, ready } = useAuthGuard('Koordinator');

  if (!ready) return <div className="py-24 flex items-center justify-center"><div className="size-8 rounded-full border-4 border-primary border-t-transparent animate-spin" /></div>;
  if (!user) return null;

  return (
    <main className="px-4 py-8">
      <KurumsalSatisSayfasi
        apiBase="/api/admin"
        listQueryKey={['admin-kurumsal-siparisler']}
        extraInvalidateKeys={[['admin-siparisler-bekleyen']]}
      />
    </main>
  );
}
