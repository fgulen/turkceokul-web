import { cookies } from 'next/headers';
import { StaffShell } from '@/components/staff/staff-shell';

// Sidebar aç/kapa durumu cookie'den SSR'da okunur — hydration sonrası
// genişlik zıplaması (FOUC/CLS) olmaz. localStorage bilinçli olarak kullanılmıyor.
export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultCollapsed = cookieStore.get('staff-sidebar')?.value === '1';
  return <StaffShell defaultCollapsed={defaultCollapsed}>{children}</StaffShell>;
}
