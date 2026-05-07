import { createNavigation } from 'next-intl/navigation';
import { useLocale } from 'next-intl';

export { useLocale };

// Projenizde desteklediğiniz diller
export const locales = ['tr', 'en'] as const;

// URL'de dil takısının nasıl görüneceği ('always' veya 'as-needed')
export const localePrefix = 'always';

export const { Link, redirect, usePathname, useRouter } =
    createNavigation({ locales, localePrefix });