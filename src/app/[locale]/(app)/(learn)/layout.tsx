import { AppNav } from '@/components/app-nav';
import { AppPageWrapper } from '@/components/app-page-wrapper';

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <AppPageWrapper>{children}</AppPageWrapper>
    </>
  );
}
