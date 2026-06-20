import DOMPurify from 'dompurify';

// DB'den gelen HTML içeriği için güvenli sanitizasyon.
// Yalnızca metin biçimlendirme tag'lerine izin verilir; script/iframe/object çıkarılır.
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return dirty;
  // Plain text \n → <br> (HTML içermeyen ya da editörden gelen düz metin için)
  const withBr = dirty.replace(/\r?\n/g, '<br>');
  return DOMPurify.sanitize(withBr, {
    ALLOWED_TAGS: ['span', 'br', 'strong', 'em', 'b', 'i', 'p'],
    ALLOWED_ATTR: ['class', 'title'],
  });
}
