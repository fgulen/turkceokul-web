'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import * as Sentry from '@sentry/nextjs';
import { Link } from '@/navigation';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
      <div className="bg-card border border-border rounded-[2rem] p-8 text-center max-w-xs w-full shadow-xl">
        <h2 className="text-xl font-bold mb-2">{t('error.title')}</h2>
        <p className="text-muted-foreground text-sm mb-7">
          {t('error.description')}
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-colors"
          >
            {t('error.retry')}
          </button>
          <Link
            href="/pano"
            className="w-full py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {t('error.backToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
