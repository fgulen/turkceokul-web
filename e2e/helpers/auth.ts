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
  await page.goto('/tr/super-admin');
  await page.getByRole('button', { name: /ülkeler/i }).click();
  // Sidebar görünmeli
  await page.waitForSelector('text=Ülkeler', { timeout: 8_000 });
}
