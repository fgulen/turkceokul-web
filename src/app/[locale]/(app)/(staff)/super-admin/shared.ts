// Super Admin alt sayfalarının ortak sabit ve yardımcıları.
// Route bölünmesi (v1b) sırasında monolit page.tsx'ten çıkarıldı.

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

// Backend hata gövdesi iki biçimde gelebilir: düz string (BadRequest("..."))
// veya { hata: "..." } nesnesi — ikisini de kullanıcıya göster.
export function apiHataMesaji(err: any): string {
  const data = err?.response?.data;
  if (typeof data === 'string' && data) return data;
  return data?.hata ?? 'İşlem başarısız.';
}

// Sayfalama: 1 ... (current-1, current, current+1) ... total
export function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
