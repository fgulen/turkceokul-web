import { AppNav } from '@/components/app-nav';
import { AppPageWrapper } from '@/components/app-page-wrapper';
import { ImpersonationBanner } from '@/components/impersonation-banner';

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* StaffShell'de zaten var — impersonation sırasında (staff)'tan (learn)'e
          geçildiğinde (örn. Kütüphane) bant kaybolmasın diye burada da render edilir. */}
      <ImpersonationBanner />
      <AppNav />
      <AppPageWrapper>{children}</AppPageWrapper>
    </>
  );
}
