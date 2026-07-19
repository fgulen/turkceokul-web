// Super Admin alt sayfalarının ortak sabit ve yardımcıları.
// Route bölünmesi (v1b) sırasında monolit page.tsx'ten çıkarıldı.

// Tek kaynak lib/utils.ts / table-kit.tsx'te — buradan re-export edilir ki mevcut
// '../shared' import'ları (çoğu super-admin sayfası) değişmeden çalışmaya devam etsin.
export { apiHataMesaji } from '@/lib/utils';
export { buildPageRange } from '@/components/staff/table-kit';

export const ROL_RENKLERI: Record<string, string> = {
  SuperAdmin: 'bg-purple-100 text-purple-700',
  Koordinator: 'bg-red-100 text-red-700',
  Editor: 'bg-indigo-100 text-indigo-700',
  UlkeTemsilcisi: 'bg-orange-100 text-orange-700',
  KurumYoneticisi: 'bg-blue-100 text-blue-700',
  Ogretmen: 'bg-green-100 text-green-700',
  Ogrenci: 'bg-slate-100 text-slate-600',
};

export const TUM_ROLLER = ['SuperAdmin', 'Koordinator', 'Editor', 'UlkeTemsilcisi', 'KurumYoneticisi', 'Ogretmen', 'Ogrenci'];
