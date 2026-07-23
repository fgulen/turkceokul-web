import { Page } from '@playwright/test';

const SUPER_ADMIN_EMAIL = process.env.TEST_SUPER_ADMIN_EMAIL ?? 'admin@turkceokulu.com';
const SUPER_ADMIN_PASS  = process.env.TEST_SUPER_ADMIN_PASS  ?? 'Admin123!';

export async function loginAsSuperAdmin(page: Page) {
  await page.goto('/tr/giris');
  await page.getByPlaceholder('ornek@email.com').fill(SUPER_ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••').fill(SUPER_ADMIN_PASS);
  await page.getByRole('button', { name: 'Giriş Yap' }).click();
  // Başarılı giriş: URL dashboard'a yönlenmeli
  await page.waitForURL(/\/(tr|en)\/(pano|super-admin|ogretmen)/, { timeout: 10_000 });
}

export async function goToSuperAdminUlkeler(page: Page) {
  // Sidebar linkine tıklayıp SPA nav'ı beklemek yerine doğrudan rotaya git —
  // auth zaten localStorage'da, ve sidebar-click yaklaşımı hydration bitmeden
  // tıklarsa (veya /super-admin genel bakış sayfası henüz hazır değilse) ara
  // sıra "/tr"ye düşen bir race'e yol açıyordu (tests 1/2/3/6/10'da gözlendi).
  await page.goto('/tr/super-admin/ulkeler');
  await page.getByRole('heading', { name: 'Ülkeler' }).waitFor({ timeout: 8_000 });
}
