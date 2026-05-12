/**
 * Super Admin — Ülkeler Tab
 * Test scope: pagination, search/clear, add, edit (SlideOver), dirty-state guard, delete reset
 *
 * Pre-conditions:
 *   - Next.js dev server running on localhost:3000
 *   - API running on localhost:5221
 *   - DB has the AddUlkeCreatedDateOgretmen migration applied
 *   - env vars: TEST_SUPER_ADMIN_EMAIL, TEST_SUPER_ADMIN_PASS
 */

import { test, expect, Page } from '@playwright/test';
import { loginAsSuperAdmin, goToSuperAdminUlkeler } from './helpers/auth';

// ─── Shared setup ────────────────────────────────────────────────────────────

test.describe('Ülkeler Tab — Country Management', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsSuperAdmin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test.beforeEach(async () => {
    await goToSuperAdminUlkeler(page);
  });

  // ─── 1. Sayfa Yükleme & Temel Yapı ──────────────────────────────────────

  test('1. Sidebar renders: header, search, list, pagination controls', async () => {
    // Başlık
    await expect(page.locator('text=Ülkeler')).toBeVisible();

    // Arama kutusu
    await expect(page.getByPlaceholder('Ülke ara...')).toBeVisible();

    // En az bir ülke satırı — Globe ikonu içeren
    const rows = page.locator('[data-testid="ulke-row"], .group').filter({ has: page.locator('svg') });
    await expect(rows.first()).toBeVisible();

    // Toplam sayı badge'i görünmeli (totalCount > 0)
    const countBadge = page.locator('text=/^\\d+$/').first();
    await expect(countBadge).toBeVisible();
  });

  // ─── 2. Server-Side Pagination ──────────────────────────────────────────

  test('2. Pagination bar appears when totalPages > 1', async () => {
    // Eğer yeterli ülke varsa pagination gösterilmeli
    const nextBtn = page.locator('button', { hasText: '›' });
    const paginationExists = await nextBtn.count() > 0;

    if (paginationExists) {
      await expect(nextBtn).toBeVisible();
      // İlk sayfa: "‹" disabled
      const prevBtn = page.locator('button', { hasText: '‹' });
      await expect(prevBtn).toBeDisabled();

      // 2. sayfaya git
      await nextBtn.click();
      await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler') && r.status() === 200);

      // Önceki tuşu artık aktif olmalı
      await expect(prevBtn).toBeEnabled();

      // Aktif sayfa butonu bg-purple-600 sınıfına sahip
      const activePage = page.locator('button.bg-purple-600');
      await expect(activePage).toBeVisible();
      await expect(activePage).toHaveText('2');

      // Geri dön
      await prevBtn.click();
      await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler') && r.status() === 200);
    } else {
      test.skip(); // 20'den az ülke var, pagination yok
    }
  });

  test('3. Clicking a page number navigates and highlights correctly', async () => {
    const pageBtns = page.locator('button').filter({ hasText: /^[0-9]+$/ });
    const count = await pageBtns.count();

    if (count >= 2) {
      const secondPageBtn = pageBtns.nth(1);
      const pageNum = await secondPageBtn.textContent();
      await secondPageBtn.click();
      await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler'));
      const active = page.locator('button.bg-purple-600');
      await expect(active).toHaveText(pageNum!.trim());
    } else {
      test.skip();
    }
  });

  // ─── 3. Arama (Search) ───────────────────────────────────────────────────

  test('4. Search input fires API request with arama param after debounce', async () => {
    const searchInput = page.getByPlaceholder('Ülke ara...');
    const searchTerm = 'Test';

    const [response] = await Promise.all([
      page.waitForResponse(r =>
        r.url().includes('/api/super-admin/ulkeler') &&
        r.url().includes(`arama=${searchTerm}`) &&
        r.status() === 200
      ),
      searchInput.fill(searchTerm),
    ]);

    expect(response.url()).toContain('pageNumber=1'); // her aramada sayfa 1'e döner
  });

  test('5. X (clear) button appears while typing and resets search + page', async () => {
    const searchInput = page.getByPlaceholder('Ülke ara...');
    await searchInput.fill('xyz');

    // X butonu görünmeli
    const clearBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
    // Daha güvenilir: X butonunu aria ya da konumuna göre bul
    const xBtn = page.locator('input[placeholder="Ülke ara..."] ~ button').or(
      page.locator('div').filter({ hasText: /ülke ara/i }).locator('button').last()
    );

    await expect(page.locator('.relative').filter({ has: searchInput }).locator('button')).toBeVisible();

    // X'e tıkla
    const [resetResponse] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler') && r.status() === 200),
      page.locator('.relative').filter({ has: searchInput }).locator('button').click(),
    ]);

    // Input temizlendi
    await expect(searchInput).toHaveValue('');
    // Sayfa 1'e döndü
    expect(resetResponse.url()).toContain('pageNumber=1');
    // X butonu kayboldu
    await expect(page.locator('.relative').filter({ has: searchInput }).locator('button')).toHaveCount(0);
  });

  test('6. Empty state message shown when search yields no results', async () => {
    const searchInput = page.getByPlaceholder('Ülke ara...');
    await searchInput.fill('zzzzznotexistszzz');
    await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler'));
    await expect(page.locator('text=/için sonuç bulunamadı/')).toBeVisible();
  });

  // ─── 4. Ülke Ekleme ──────────────────────────────────────────────────────

  test('7. Adding a new country: appears on page 1, list refreshes', async () => {
    const timestamp = Date.now();
    const newName = `QA-Ulke-${timestamp}`;

    // + butonuna tıkla
    await page.locator('button').filter({ has: page.locator('svg[data-lucide="plus"], svg') }).first().click();
    const nameInput = page.getByPlaceholder('Ülke adı...');
    await expect(nameInput).toBeVisible();

    await nameInput.fill(newName);

    const [addResponse] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/super-admin/ulke') && r.request().method() === 'POST' && r.status() === 200),
      page.getByRole('button', { name: 'Ekle' }).click(),
    ]);

    // Sayfalama 1'e döndü, yeni ülke listenin başında
    await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler?') && r.status() === 200);

    // Input kapandı
    await expect(nameInput).toHaveCount(0);

    // Yeni ülke sayfanın başında görünmeli (CreatedDate DESC sort)
    const firstRow = page.locator('.group').first();
    await expect(firstRow).toContainText(newName);

    // Cleanup: sil
    await firstRow.hover();
    await firstRow.locator('button').last().click(); // Trash butonu
    await page.locator('input[type="text"]').last().fill('DELETE');
    await page.getByRole('button', { name: /onayla|sil/i }).last().click();
    await page.waitForResponse(r => r.url().includes('/api/super-admin/ulke/') && r.request().method() === 'DELETE');
  });

  // ─── 5. Ülke Düzenleme (Edit SlideOver) ────────────────────────────────

  test('8. Edit pencil icon opens SlideOver with correct country data', async () => {
    // İlk ülke satırını hover'la
    const firstRow = page.locator('.group').first();
    const countryName = await firstRow.locator('.font-medium').first().textContent();
    await firstRow.hover();

    // Pencil (düzenle) butonuna tıkla
    const editBtn = firstRow.locator('button').nth(0); // ilk buton = edit
    await editBtn.click();

    // SlideOver açıldı
    await expect(page.locator('text=Ülke Düzenle')).toBeVisible();

    // İsim input dolu
    const nameField = page.locator('input').filter({ hasText: '' }).first();
    const inputValue = await page.locator('label:has-text("Ülke Adı") + input, label:has-text("Ülke Adı") ~ input').inputValue();
    expect(inputValue).toBe(countryName?.trim());

    // Kaydet butonu başlangıçta disabled (dirty değil)
    const saveBtn = page.getByRole('button', { name: /kaydet/i });
    await expect(saveBtn).toBeDisabled();

    // Kapat
    await page.getByRole('button', { name: /iptal/i }).click();
    await expect(page.locator('text=Ülke Düzenle')).toHaveCount(0);
  });

  test('9. Edit SlideOver: changing name enables Save, saves correctly', async () => {
    const firstRow = page.locator('.group').first();
    const originalName = await firstRow.locator('.text-sm.font-medium').first().textContent();
    await firstRow.hover();
    await firstRow.locator('button').nth(0).click();

    // İsim değiştir
    const nameInput = page.locator('label:has-text("Ülke Adı") ~ input');
    await nameInput.clear();
    await nameInput.fill(originalName + '-EDITED');

    // Kaydet aktif
    const saveBtn = page.getByRole('button', { name: /kaydet/i });
    await expect(saveBtn).toBeEnabled();

    const [putRes] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/super-admin/ulke/') && r.request().method() === 'PUT' && r.status() === 200),
      saveBtn.click(),
    ]);

    // SlideOver kapandı
    await expect(page.locator('text=Ülke Düzenle')).toHaveCount(0);

    // Optimistic cache: detail panel isim güncellendi (seçili ülke başlığı)
    await expect(page.locator('h2').filter({ hasText: '-EDITED' })).toBeVisible({ timeout: 3000 });

    // Geri al (cleanup)
    await firstRow.hover();
    await firstRow.locator('button').nth(0).click();
    const nameInput2 = page.locator('label:has-text("Ülke Adı") ~ input');
    await nameInput2.clear();
    await nameInput2.fill(originalName!.trim());
    await page.getByRole('button', { name: /kaydet/i }).click();
    await page.waitForResponse(r => r.url().includes('/api/super-admin/ulke/') && r.request().method() === 'PUT');
  });

  test('10. noDim SlideOver: background list remains clickable', async () => {
    const firstRow = page.locator('.group').first();
    await firstRow.hover();
    await firstRow.locator('button').nth(0).click();
    await expect(page.locator('text=Ülke Düzenle')).toBeVisible();

    // Arka planda overlay (bg-black/30) yok — listedeki ikinci satıra tıklanabilmeli
    const secondRow = page.locator('.group').nth(1);
    await expect(secondRow).toBeVisible();

    // Direkt tıklanabilir (overlay pointer-events engellemez)
    await secondRow.click({ force: false }); // force:false = gerçek tıklama testi

    // Detail panel 2. ülke adını göstermeli
    const secondName = await secondRow.locator('.font-medium').first().textContent();
    await expect(page.locator('h2').filter({ hasText: secondName!.trim() })).toBeVisible();
  });

  // ─── 6. Dirty State Guard ────────────────────────────────────────────────

  test('11. Dirty state guard: switching country with unsaved changes triggers confirm', async () => {
    const firstRow = page.locator('.group').first();
    await firstRow.hover();
    await firstRow.locator('button').nth(0).click();

    // Değişiklik yap (dirty)
    const nameInput = page.locator('label:has-text("Ülke Adı") ~ input');
    await nameInput.fill('__dirty_test__');

    // Dialog'u yakala (window.confirm)
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('Kaydedilmemiş');
      await dialog.dismiss(); // İptal — geçiş yapılmamalı
    });

    // Başka ülkeye tıkla
    const secondRow = page.locator('.group').nth(1);
    await secondRow.click();

    // SlideOver hâlâ açık (geçiş iptal edildi)
    await expect(page.locator('text=Ülke Düzenle')).toBeVisible();

    // Bu sefer onayla
    page.once('dialog', async dialog => {
      await dialog.accept();
    });

    await secondRow.click();
    // SlideOver kapandı, geçiş oldu
    await expect(page.locator('text=Ülke Düzenle')).toHaveCount(0);
  });

  // ─── 7. Öğretmen Type-Ahead ──────────────────────────────────────────────

  test('12. Teacher type-ahead shows results in "Name Surname (email)" format', async () => {
    const firstRow = page.locator('.group').first();
    await firstRow.hover();
    await firstRow.locator('button').nth(0).click();
    await expect(page.locator('text=Ülke Düzenle')).toBeVisible();

    const teacherInput = page.getByPlaceholder(/öğretmen ara/i);
    await teacherInput.fill('a');

    // API çağrısını bekle
    await page.waitForResponse(r =>
      r.url().includes('/api/super-admin/kullanicilar') &&
      r.url().includes('rol=Ogretmen') &&
      r.status() === 200,
      { timeout: 5000 }
    );

    const dropdown = page.locator('.absolute.z-20');
    const dropdownVisible = await dropdown.isVisible().catch(() => false);

    if (dropdownVisible) {
      // İlk sonuçta email parantez formatı var mı
      const firstResult = dropdown.locator('button').first();
      await expect(firstResult).toBeVisible();
      const text = await firstResult.textContent();
      expect(text).toMatch(/@/); // email içermeli

      // Email stili: text-[11px] text-slate-400
      const emailSpan = firstResult.locator('span').last();
      await expect(emailSpan).toHaveClass(/text-slate-400/);
    }

    // Kapat
    await page.getByRole('button', { name: /iptal/i }).click();
  });

  // ─── 8. Silme & Tam Reset ────────────────────────────────────────────────

  test('13. Deleting a country: resets to page 1, clears search, deselects detail', async () => {
    // Önce arama yap ve bir sayfa ilerle (eğer pagination varsa)
    const nextBtn = page.locator('button', { hasText: '›' });
    if (await nextBtn.count() > 0 && await nextBtn.isEnabled()) {
      await nextBtn.click();
      await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler'));
    }

    // Yeni ülke ekle (test için temiz bir hedef)
    await page.locator('button').filter({ has: page.locator('svg') }).first().click();
    const addInput = page.getByPlaceholder('Ülke adı...');
    await addInput.fill(`QA-Delete-${Date.now()}`);
    await page.getByRole('button', { name: 'Ekle' }).click();
    await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler?'));

    // Yeni ülke page 1'de, başta
    const newRow = page.locator('.group').first();
    await newRow.click(); // detayı seç
    await expect(page.locator('h2').filter({ hasText: /QA-Delete/ })).toBeVisible();

    // Sil
    await newRow.hover();
    const trashBtn = newRow.locator('button').last();
    await trashBtn.click();

    // DeleteConfirmModal
    const modal = page.locator('[role="dialog"], .fixed').last();
    const deleteInput = modal.locator('input[type="text"]').or(page.locator('input[placeholder*="DELETE"]'));
    if (await deleteInput.count() > 0) {
      await deleteInput.fill('DELETE');
    }
    const confirmBtn = page.getByRole('button', { name: /onayla|sil|evet/i }).last();

    const [delRes] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/super-admin/ulke/') && r.request().method() === 'DELETE'),
      confirmBtn.click(),
    ]);

    expect(delRes.status()).toBe(200);

    // Sayfa 1'e döndü
    await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler?') && r.status() === 200);

    // Detay panel temizlendi
    await expect(page.locator('text=Sol listeden bir ülke seçin')).toBeVisible();

    // Arama temizlendi
    await expect(page.getByPlaceholder('Ülke ara...')).toHaveValue('');
  });

  // ─── 9. API Yanıt Yapısı ─────────────────────────────────────────────────

  test('14. API response shape: liste, totalCount, currentPage, totalPages', async () => {
    const response = await page.request.get('http://localhost:5221/api/super-admin/ulkeler?pageNumber=1&pageSize=20', {
      headers: {
        Authorization: `Bearer ${await getStoredToken(page)}`,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('liste');
    expect(body).toHaveProperty('totalCount');
    expect(body).toHaveProperty('currentPage', 1);
    expect(body).toHaveProperty('totalPages');
    expect(Array.isArray(body.liste)).toBe(true);
    expect(typeof body.totalCount).toBe('number');

    // Liste boyutu max pageSize
    expect(body.liste.length).toBeLessThanOrEqual(20);

    // Her kayıtta beklenen alanlar
    if (body.liste.length > 0) {
      const first = body.liste[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('name');
      expect(first).toHaveProperty('visible');
      expect(first).toHaveProperty('kurumSayisi');
      expect(first).toHaveProperty('ogrenciSayisi');
    }
  });

  test('15. Newest country sorts first (CreatedDate DESC)', async () => {
    const response = await page.request.get('http://localhost:5221/api/super-admin/ulkeler?pageNumber=1&pageSize=20', {
      headers: { Authorization: `Bearer ${await getStoredToken(page)}` },
    });

    const body = await response.json();
    const liste: any[] = body.liste;

    if (liste.length >= 2) {
      const dates = liste.map((u: any) => new Date(u.createdDate ?? u.CreatedDate ?? 0).getTime());
      // Azalan sırada olmalı
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    }
  });
});

// ─── Yardımcı: Auth token'ı localStorage'dan al ───────────────────────────

async function getStoredToken(page: Page): Promise<string> {
  const raw = await page.evaluate(() => localStorage.getItem('auth'));
  if (!raw) return '';
  try {
    const parsed = JSON.parse(raw);
    // Zustand persist: { state: { accessToken } }
    return parsed?.state?.accessToken ?? parsed?.accessToken ?? '';
  } catch {
    return '';
  }
}
