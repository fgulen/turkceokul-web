import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ogretmen/page.tsx ve kurum-yoneticisi/page.tsx'te ayni ayna sinif-silme
// mutation'i + confirm() akisi kopyaydi (code review bulgu #8) — burada
// birlestirildi, yalniz invalidate edilecek query key'i degisiyor.
export function useSinifSilMutation(invalidateKey: QueryKey) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sinifId: number) => api.delete(`/api/ogretmen/sinif/${sinifId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: invalidateKey }),
  });
}

export function sinifSilOnayi(name: string): boolean {
  return confirm(
    `"${name}" sınıfını silmek istediğinizden emin misiniz?\n\n` +
    'Bu işlem geri alınamaz. Bu sınıftaki öğrencilerin tükettiği lisans koltukları ' +
    'da kalıcı olarak tüketilmiş sayılmaya devam eder (kurumun kotasından düşmez).'
  );
}
