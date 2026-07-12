import DOMPurify from 'dompurify';

// DB'den gelen HTML içeriği için güvenli sanitizasyon.
// Yalnızca metin biçimlendirme tag'lerine izin verilir; script/iframe/object çıkarılır.
export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined') return dirty;
  // Plain text \n → <br> (HTML içermeyen ya da editörden gelen düz metin için)
  // Legacy içerikte diyalog satırları <div>Satır1</div><div>Satır2</div> şeklinde
  // ayrılıyor. 'div' bilinçli olarak ALLOWED_TAGS dışında bırakıldı: sanitizeHtml
  // çıktısı bazı bileşenlerde <p>/<span> gibi inline bağlamlara yerleştiriliyor
  // (örn. coktan-secmeli.tsx, bosluk-doldurma.tsx, metin-checkbox.tsx) ve orada
  // block-level <div> geçersiz iç içe HTML üretir (tarayıcı <p>'yi otomatik kapatır).
  // Bunun yerine kapanış </div>'i <br>'a çeviriyoruz: satır ayrımı korunur, DOMPurify
  // eşlenmemiş <div> sarmalayıcıyı (ALLOWED_TAGS dışı) tag'i söküp metnini bırakarak
  // zaten temizler.
  const withBr = dirty
    .replace(/\r?\n/g, '<br>')
    .replace(/<\/div>/gi, '<br>');
  return DOMPurify.sanitize(withBr, {
    ALLOWED_TAGS: ['span', 'br', 'strong', 'em', 'b', 'i', 'p'],
    ALLOWED_ATTR: ['class', 'title'],
  });
}
