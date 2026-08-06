import { test, expect } from '@playwright/test';
import { loginAsTeacher, loginAsStudent } from './helpers/auth';

test.describe('Okuma kitapları ücretsiz erişim — smoke', () => {
  test('öğretmen sınıf okuma sayfasını açabilir, checkbox atama modalını görür', async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/tr/ogretmen');
    // İlk sınıfa git
    const sinifLink = page.locator('a[href*="/ogretmen/sinif/"]').first();
    await sinifLink.waitFor({ state: 'visible', timeout: 20_000 });
    const href = await sinifLink.getAttribute('href');
    const sinifId = href!.match(/\/sinif\/(\d+)/)![1];

    await page.goto(`/tr/ogretmen/sinif/${sinifId}/okuma`);
    await page.waitForLoadState('networkidle');

    // "Kitap Ata" butonu her durumda (boş ya da dolu) görünür olmalı
    const ataBtn = page.getByRole('button', { name: /Kitap Ata/ });
    await expect(ataBtn).toBeVisible({ timeout: 15_000 });
    await ataBtn.click();

    // Modal açılmalı, checkbox listesi ya da "bulunamadı" mesajı görünmeli
    await expect(page.getByText('Okuma Kitapları Seç')).toBeVisible({ timeout: 10_000 });
  });

  test('kurumsal-satış sayfası okuma kitapları hediye notunu gösterir', async ({ page }) => {
    await page.goto('/tr/kurumsal-satis');
    await expect(page.getByText('PDF versiyonları hediye · 1 kitap etkileşimli ücretsiz')).toBeVisible({ timeout: 15_000 });
  });

  test('öğrenci pano sayfası ve okuma sayfası hatasız açılır', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/tr/pano');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Runtime Error');

    await page.goto('/tr/okuma');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).not.toContainText('Runtime Error');
  });
});
