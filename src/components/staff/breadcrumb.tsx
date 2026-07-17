'use client';

import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, usePathname } from '@/navigation';
import { SEGMENT_LABELS, DYNAMIC_SEGMENT_LABEL, STAFF_NAV } from '@/config/navigation';

// URL segmentlerinden otomatik breadcrumb. Ara segment yalnızca gerçek bir nav
// hedefiyse link olur; sayısal id'ler "Detay" olarak düz metin kalır.
const NAV_HREFS = new Set(STAFF_NAV.flatMap((g) => g.items.map((i) => i.href)));

export function Breadcrumb() {
  const pathname = usePathname();
  if (!pathname) return null;

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length < 2) return null; // panel kökünde breadcrumb gereksiz

  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    const label = /^\d+$/.test(seg)
      ? DYNAMIC_SEGMENT_LABEL
      : SEGMENT_LABELS[seg] ?? seg;
    const isLast = i === segments.length - 1;
    return { href, label, isLast, linkable: !isLast && NAV_HREFS.has(href) };
  });

  return (
    <nav aria-label="Breadcrumb" className="hidden lg:flex items-center gap-1.5 text-sm text-slate-400 min-w-0">
      {crumbs.map((c) => (
        <Fragment key={c.href}>
          {c.href !== crumbs[0].href && <ChevronRight className="size-3.5 shrink-0" />}
          {c.linkable ? (
            <Link href={c.href} className="hover:text-slate-600 transition-colors truncate">
              {c.label}
            </Link>
          ) : (
            <span className={c.isLast ? 'text-slate-700 font-medium truncate' : 'truncate'}>
              {c.label}
            </span>
          )}
        </Fragment>
      ))}
    </nav>
  );
}
