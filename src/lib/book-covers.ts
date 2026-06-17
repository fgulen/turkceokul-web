const BASE = "https://turkceokulu.com/UserFiles/css/kitap/";

export const BOOK_COVERS = {
  CAN:     Array.from({ length: 4 }, (_, i) => `${BASE}c${i + 1}.png`),
  YAGMUR:  Array.from({ length: 5 }, (_, i) => `${BASE}y${i + 1}.png`),
  HARMONI: Array.from({ length: 4 }, (_, i) => `${BASE}h${i + 1}.png`),
} as const;

export type BookSeries = keyof typeof BOOK_COVERS;

function normalizeSeriesName(kitapSeti: string | null | undefined): BookSeries | null {
  if (!kitapSeti) return null;
  const s = kitapSeti
    .toLocaleUpperCase('tr')
    .replace(/[ĞĞ]/g, 'G')
    .replace(/[İI]/g, 'I')
    .replace(/[Üü]/g, 'U')
    .replace(/[Öö]/g, 'O')
    .replace(/[Şş]/g, 'S')
    .replace(/[Çç]/g, 'C');

  if (s.startsWith('CAN'))     return 'CAN';
  if (s.startsWith('YAGMUR')) return 'YAGMUR';
  if (s.startsWith('HARMON')) return 'HARMONI';
  return null;
}

/** kitapSeti: "Can", "Yağmur", "Harmoni" (veya uzun hali), no: 1-tabanlı kitap sırası */
export function bookCoverUrl(kitapSeti: string | null | undefined, no = 1): string {
  const key = normalizeSeriesName(kitapSeti);
  if (!key) return '';
  const list = BOOK_COVERS[key];
  return list[Math.min(Math.max(no - 1, 0), list.length - 1)];
}
