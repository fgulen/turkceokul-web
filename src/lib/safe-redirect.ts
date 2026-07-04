// Login/kayıt sonrası ?redirect= parametresi için güvenli site-içi path doğrulaması.
// Yalnızca site-içi mutlak path'e izin verilir; harici/protocol-relative URL reddedilir.
//
// Backslash özellikle tehlikeli: tarayıcılar http(s) şeması altında "\" karakterini "/"
// olarak normalize eder, yani "/\evil.com" → "//evil.com" (protocol-relative) → evil.com'a
// gider. Eski "startsWith('/') && !startsWith('//')" kontrolü bu bypass'i yakalamıyordu.
export function safeRedirect(target: string | null | undefined): string | null {
  if (!target) return null;
  if (!target.startsWith('/')) return null; // mutlak path olmalı
  if (target.startsWith('//')) return null;  // protocol-relative (//evil.com) engelle
  if (target.includes('\\')) return null;    // backslash → '/' normalize bypass'ini engelle
  return target;
}
