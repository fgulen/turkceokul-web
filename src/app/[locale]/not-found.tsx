import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';

export default async function NotFound() {
  const t = await getTranslations('error');

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-[2rem] p-8 text-center max-w-xs w-full shadow-xl">
        <div className="text-6xl font-extrabold text-primary mb-2">404</div>
        <h2 className="text-xl font-bold mb-2">{t('notFoundTitle')}</h2>
        <p className="text-muted-foreground text-sm mb-7">
          {t('notFoundDescription')}
        </p>
        <Link
          href="/pano"
          className="block w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
        >
          {t('backToDashboard')}
        </Link>
      </div>
    </div>
  );
}
