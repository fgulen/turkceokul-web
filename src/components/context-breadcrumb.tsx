import { Fragment } from 'react';
import { ChevronRight, Globe, Building2, GraduationCap, type LucideIcon } from 'lucide-react';

type CrumbLevel = 'ulke' | 'kurum' | 'sinif';

export interface Crumb {
  level: CrumbLevel;
  label: string;
}

const LEVEL_CONFIG: Record<CrumbLevel, { icon: LucideIcon; badgeClass: string; title: string }> = {
  ulke: { icon: Globe, badgeClass: 'bg-blue-100 text-blue-600', title: 'Ülke' },
  kurum: { icon: Building2, badgeClass: 'bg-amber-100 text-amber-600', title: 'Kurum' },
  sinif: { icon: GraduationCap, badgeClass: 'bg-emerald-100 text-emerald-600', title: 'Sınıf' },
};

// Bilgilendirici konum şeridi — site navigasyonu değil (bkz. staff/breadcrumb.tsx,
// o URL'den otomatik türer ve sayısal id'lerde gerçek isim yerine "Detay" yazar).
// Bu bileşen tıklanamaz: amaç yalnızca "şu an hangi ülke/kurum/sınıftasın"ı göstermek.
export function ContextBreadcrumb({ crumbs }: { crumbs: (Crumb | null | undefined | false)[] }) {
  const visible = crumbs.filter((c): c is Crumb => Boolean(c));
  if (visible.length === 0) return null;

  return (
    <div role="group" aria-label="Konum" className="flex items-center gap-1.5 flex-wrap text-sm text-slate-600">
      {visible.map((crumb, i) => {
        const { icon: Icon, badgeClass, title } = LEVEL_CONFIG[crumb.level];
        return (
          <Fragment key={`${crumb.level}-${crumb.label}`}>
            {i > 0 && <ChevronRight className="size-3.5 text-slate-300 shrink-0" aria-hidden="true" />}
            <span className="inline-flex items-center gap-1.5 min-w-0">
              <span
                className={`size-5 rounded-full flex items-center justify-center shrink-0 ${badgeClass}`}
                title={title}
                aria-label={title}
              >
                <Icon className="size-3" aria-hidden="true" />
              </span>
              <span className="font-medium truncate">{crumb.label}</span>
            </span>
          </Fragment>
        );
      })}
    </div>
  );
}
