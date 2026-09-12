// BoslukDoldurma / CoktanSecmeliBoslukDoldurma paylaşılan boşluk-tespit mantığı.
// İkisi de aynı Description formatını kullanıyor; tek dosyada tutulmazsa biri
// güncellenip diğeri unutulabilir (nitekim table desteği ilk turda sadece
// birine eklenmişti).

export const BLANK_RE = /\.{3,}|…|\[___\]|_{3,}/g;
const BLANK_TEST_RE = /\.{3,}|…|\[___\]|_{3,}/;

export function splitByBlanks(text: string): string[] {
  return text.split(BLANK_RE);
}

export type TableCell = { html: string; isBlank: boolean };

// İçerik bir <table> ise (ör. Ülke/Milliyet/Dil grid'i) hücreleri satır/sütun
// yapısıyla parse et — ham HTML'i BLANK_RE ile bölmek tag'leri ortadan kesip
// tabloyu bozardı (sanitizeHtml de zaten table/tr/td'yi allowlist dışı bırakıyor).
export function parseTableCells(html: string): TableCell[][] | null {
  if (typeof window === 'undefined' || !/<table/i.test(html)) return null;
  const table = new DOMParser().parseFromString(html, 'text/html').querySelector('table');
  if (!table) return null;
  const rows: TableCell[][] = [];
  table.querySelectorAll('tr').forEach((tr) => {
    const cells: TableCell[] = [];
    tr.querySelectorAll('td, th').forEach((cell) => {
      cells.push({
        html: cell.innerHTML ?? '',
        isBlank: BLANK_TEST_RE.test((cell.textContent ?? '').trim()),
      });
    });
    if (cells.length) rows.push(cells);
  });
  return rows.length ? rows : null;
}

export function countBlanks(sentence: string, tableRows: TableCell[][] | null): number {
  return tableRows
    ? tableRows.flat().filter((c) => c.isBlank).length
    : splitByBlanks(sentence).length - 1;
}
