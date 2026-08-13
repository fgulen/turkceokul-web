import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['tr', 'en'],
  defaultLocale: 'tr',
  localePrefix: 'always',
  // Prefix'siz giriş (çıplak domain) her zaman TR açsın — tarayıcı Accept-Language
  // header'ına göre otomatik İngilizce'ye düşmesin (kullanıcı kararı, 2026-08-13).
  // /en sayfaları ve dil değiştirici bundan etkilenmiyor, sadece ilk-temas algılaması kapanıyor.
  localeDetection: false,
});