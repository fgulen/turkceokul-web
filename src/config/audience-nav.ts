// web/src/config/audience-nav.ts
// Öğrenciler / Öğretmenler / Kurumsal Satış segment-değiştirme navbar'ı — bu üç
// sayfa birbirine link verir. Tek kaynak burada: sayfaların kendi links={[...]}
// tanımlamasına izin verirsek biri eksik/boş kalabiliyor (yaşandı — turkce-ogren
// ve ogretmenler sayfaları tutarsızdı). Server Component sayfalardan (page.tsx,
// 'use client' yok) çağrılabilmesi için bu fonksiyon landing-nav.tsx'in dışında,
// ayrı bir client-olmayan modülde tutulur.

export interface NavLink {
  label: string;
  href: string;
  active?: boolean;
}

export type AudienceSegment = 'students' | 'teachers' | 'institutional';

export function audienceNavLinks(locale: string, active: AudienceSegment): NavLink[] {
  const isEn = locale === 'en';
  return [
    { label: isEn ? 'Students' : 'Öğrenciler', href: isEn ? '/learn-turkish-online' : '/turkce-ogren', active: active === 'students' },
    { label: isEn ? 'Teachers' : 'Öğretmenler', href: isEn ? '/for-teachers' : '/ogretmenler', active: active === 'teachers' },
    { label: isEn ? 'Institutional Sales' : 'Kurumsal Satış', href: '/kurumsal-satis', active: active === 'institutional' },
  ];
}
