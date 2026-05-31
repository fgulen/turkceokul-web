import DOMPurify from 'dompurify';

// DB'den gelen HTML içeriği için güvenli sanitizasyon.
// Yalnızca metin biçimlendirme tag'lerine izin verilir; script/iframe/object çıkarılır.
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return dirty;
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['span', 'br', 'strong', 'em', 'b', 'i', 'p'],
    ALLOWED_ATTR: ['class', 'title'],
  });
}
