'use client';

import { KurumsalSatisSayfasi } from '@/components/staff/kurumsal-satis-sayfasi';

export default function KurumsalSatisPage() {
  return (
    <KurumsalSatisSayfasi
      apiBase="/api/super-admin"
      listQueryKey={['sa-siparisler']}
      extraInvalidateKeys={[['sa-siparisler-bekleyen'], ['sa-istatistikler']]}
    />
  );
}
