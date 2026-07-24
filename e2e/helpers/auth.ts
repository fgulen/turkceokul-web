import { Page } from '@playwright/test';

const SUPER_ADMIN_EMAIL = process.env.TEST_SUPER_ADMIN_EMAIL ?? 'admin@turkceokulu.com';
const SUPER_ADMIN_PASS  = process.env.TEST_SUPER_ADMIN_PASS  ?? 'Admin123!';
const TEACHER_EMAIL     = process.env.TEST_TEACHER_EMAIL     ?? 'ogretmen@turkceokulu.com';
const TEACHER_PASS      = process.env.TEST_TEACHER_PASS      ?? 'Ogretmen123!';
const STUDENT_EMAIL     = process.env.TEST_STUDENT_EMAIL     ?? 'ogrenci1@turkceokulu.com';
const STUDENT_PASS      = process.env.TEST_STUDENT_PASS      ?? 'Ogrenci123!';

async function login(page: Page, email: string, password: string, expectedUrlPattern: RegExp) {
  await page.goto('/tr/giris');
  await page.waitForSelector('input[type="email"]', { timeout: 10_000 });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(expectedUrlPattern, { timeout: 15_000 });
}

export async function loginAsSuperAdmin(page: Page) {
  await login(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASS, /\/(tr|en)\/(pano|super-admin|ogretmen)/);
}

export async function loginAsTeacher(page: Page) {
  await login(page, TEACHER_EMAIL, TEACHER_PASS, /\/(tr|en)\/(ogretmen|pano)/);
}

export async function loginAsStudent(page: Page) {
  await login(page, STUDENT_EMAIL, STUDENT_PASS, /\/(tr|en)\/pano/);
}

export async function goToSuperAdminUlkeler(page: Page) {
  await page.goto('/tr/super-admin/ulkeler');
  await page.getByRole('heading', { name: 'Ülkeler' }).waitFor({ timeout: 8_000 });
}
