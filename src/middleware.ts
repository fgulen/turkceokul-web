import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

// Sayfa-seviyesi rota koruması: sadece "hasSession" cookie'sinin varlığına bakar,
// JWT doğrulamaz — asıl yetki sınırı her zaman API'deki [Authorize]. Amaç: JS
// kapalıyken veya doğrudan URL/curl ile korumalı bir sayfanın server-render'da hiç
// görünmemesi (öncesinde sadece client-side useAuthGuard'ın flash'ını engelliyordu).
// Liste, next.config.ts'teki noindex privatePaths ile aynı köke dayanır: (app)/(learn)
// ve (app)/(staff) route grupları altındaki tüm sayfalar — route grupları URL'e
// yansımadığı için burada tek tek segment adıyla eşleştiriliyor.
const PROTECTED_PREFIXES = [
  '/pano', '/profil', '/lig', '/ders', '/etkinlik', '/okuma', '/kahoot',
  '/kutuphane', '/sinif', '/ogretmen', '/editor', '/admin', '/super-admin',
  '/kurum-yoneticisi', '/ulke-temsilcisi',
];

function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(tr|en)(\/.*|$)/);
  if (!match) return pathname;
  return match[2] && match[2] !== '' ? match[2] : '/';
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const bare = stripLocale(pathname);

  if (isProtectedPath(bare) && !request.cookies.get('hasSession')) {
    const localeMatch = pathname.match(/^\/(tr|en)\b/);
    const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/giris`, request.url);
    loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)'],
};
