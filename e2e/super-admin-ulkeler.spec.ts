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
    // Başlık (h2) — "text=Ülkeler" hem sidebar linkine hem bu başlığa eşleşiyordu
    await expect(page.getByRole('heading', { name: 'Ülkeler' })).toBeVisible();

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

  test('4. Search input filters the visible list client-side', async () => {
    const searchInput = page.getByPlaceholder('Ülke ara...');
    const rows = page.locator('table tbody tr.group');
    // İlk fetch tamamlanmadan sayılırsa 0 döner (henüz "isLoading") — önce bekle.
    await expect(rows.first()).toBeVisible();
    const before = await rows.count();

    // page.tsx tek fetch yapıp `tumUlkeler`i lokal filtreliyor (bkz. dosya üstü
    // yorum: "tek fetch + client-side arama") — arama bir REST çağrısı değil.
    await searchInput.fill('zzzzznotexistszzz');
    await page.waitForTimeout(500); // 300ms debounce + render
    await expect(rows).toHaveCount(0);

    // Temizle ki sonraki testler tam listeyi görsün
    await searchInput.clear();
    await page.waitForTimeout(500);
    await expect(rows).not.toHaveCount(0);
    expect(await rows.count()).toBe(before);
  });

  test('5. X (clear) button appears while typing and resets search', async () => {
    const searchInput = page.getByPlaceholder('Ülke ara...');
    await searchInput.fill('xyz');
    await page.waitForTimeout(400); // debounce

    const clearBtn = page.locator('.relative').filter({ has: searchInput }).locator('button');
    await expect(clearBtn).toBeVisible();

    await clearBtn.click();

    // Input temizlendi
    await expect(searchInput).toHaveValue('');
    // X butonu kayboldu
    await expect(clearBtn).toHaveCount(0);
  });

  test('6. Empty state message shown when search yields no results', async () => {
    // Arama client-side filtre — network isteği atmıyor (bkz. test 4), o yüzden
    // waitForResponse burada hiç gelmeyecek bir yanıtı bekleyip 30sn'de patlıyordu.
    const searchInput = page.getByPlaceholder('Ülke ara...');
    await searchInput.fill('zzzzznotexistszzz');
    await expect(page.locator('text=/için sonuç bulunamadı/')).toBeVisible();
  });

  // ─── 4. Ülke Ekleme ──────────────────────────────────────────────────────

  test('7. Adding a new country: appears in list, list refreshes', async () => {
    const timestamp = Date.now();
    const newName = `QA-Ulke-${timestamp}`;

    // "Yeni Ülke" butonuna tıkla — generic svg-filtreli buton seçici mobil
    // hamburger menüsünü (md:hidden) yakalıyordu; metne göre hedefle.
    await page.getByRole('button', { name: /yeni ülke/i }).click();
    const nameInput = page.getByPlaceholder('Ülke adı...');
    await expect(nameInput).toBeVisible();

    await nameInput.fill(newName);

    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/super-admin/ulke') && r.request().method() === 'POST' && r.status() === 200),
      page.getByRole('button', { name: 'Ekle' }).click(),
    ]);

    // Liste yenilendi (invalidateQueries → refetch)
    await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler?') && r.status() === 200);

    // Input kapandı
    await expect(nameInput).toHaveCount(0);

    // Varsayılan sıralama isim-artan (CreatedDate DESC değil) — "QA-..." alfabetik
    // olarak sayfa 1'de olmayabilir (client-side sayfalama); arayarak bul.
    await page.getByPlaceholder('Ülke ara...').fill(newName);
    await page.waitForTimeout(400);
    const newRow = page.locator('table tbody tr.group').filter({ hasText: newName });
    await expect(newRow).toBeVisible();

    // Cleanup: sil (DeleteConfirmModal: "DELETE" yazılan input + "Sil" butonu)
    await newRow.hover();
    await newRow.locator('button').last().click(); // Trash butonu
    await page.getByPlaceholder('DELETE').fill('DELETE');
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/super-admin/ulke/') && r.request().method() === 'DELETE'),
      page.getByRole('button', { name: 'Sil' }).click(),
    ]);
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
    const inputValue = await page.locator('label:has-text("Ülke Adı") + input, label:has-text("Ülke Adı") ~ input').inputValue();
    expect(inputValue).toBe(countryName?.trim());

    // Kaydet butonu başlangıçta disabled (dirty değil)
    const saveBtn = page.getByRole('button', { name: /kaydet/i });
    await expect(saveBtn).toBeDisabled();

    // Kapat
    // /iptal/i regex hiç eşleşmiyordu: JS'in case-insensitive regex'i Türkçe
    // büyük İ'yi (U+0130) ASCII 'i'ye fold etmiyor ('İ'.toLowerCase() === 'i̇',
    // iki karakter) — buton metni sabit "İptal" olduğu için tam eşleşme kullan.
    await page.getByRole('button', { name: 'İptal' }).click();
    await expect(page.locator('text=Ülke Düzenle')).toHaveCount(0);
  });

  test('9. Edit SlideOver: changing name enables Save, saves correctly', async () => {
    const firstRow = page.locator('table tbody tr.group').first();
    // .text-sm.font-medium yanlıştı — text-sm ata <table>'da, isim hücresinde sadece font-medium var
    const originalName = (await firstRow.locator('.font-medium').first().textContent())!.trim();
    await firstRow.hover();
    await firstRow.locator('button').nth(0).click();

    // İsim değiştir
    const nameInput = page.locator('label:has-text("Ülke Adı") ~ input');
    await nameInput.clear();
    await nameInput.fill(originalName + '-EDITED');

    // Kaydet aktif
    const saveBtn = page.getByRole('button', { name: /kaydet/i });
    await expect(saveBtn).toBeEnabled();

    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/super-admin/ulke/') && r.request().method() === 'PUT' && r.status() === 200),
      saveBtn.click(),
    ]);

    // SlideOver kapandı
    await expect(page.locator('text=Ülke Düzenle')).toHaveCount(0);

    // v1b DataTable: ayrı bir "detay paneli" yok — invalidateQueries sonrası
    // liste yeniden çekiliyor, güncel isim satırda görünmeli.
    const editedRow = page.locator('table tbody tr.group').filter({ hasText: `${originalName}-EDITED` });
    await expect(editedRow).toBeVisible({ timeout: 3000 });

    // Geri al (cleanup)
    await editedRow.hover();
    await editedRow.locator('button').nth(0).click();
    const nameInput2 = page.locator('label:has-text("Ülke Adı") ~ input');
    await nameInput2.clear();
    await nameInput2.fill(originalName);
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/super-admin/ulke/') && r.request().method() === 'PUT'),
      page.getByRole('button', { name: /kaydet/i }).click(),
    ]);
  });

  test('10. noDim SlideOver: background list remains clickable', async () => {
    const rows = page.locator('table tbody tr.group');
    const firstRow = rows.first();
    await firstRow.hover();
    await firstRow.locator('button').nth(0).click();
    await expect(page.locator('text=Ülke Düzenle')).toBeVisible();

    // Arka planda overlay (bg-black/30) yok — listedeki ikinci satır SlideOver açıkken
    // gerçek tıklamayla ulaşılabilir olmalı (overlay pointer-events engellemez).
    // Satır tıklaması detay rotasına (/ulkeler/[ulkeId]) navigate eder — bu, tıklamanın
    // gerçekten geçtiğinin (force değil) kanıtı.
    const secondRow = rows.nth(1);
    await expect(secondRow).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/super-admin\/ulkeler\/\d+/),
      secondRow.click({ force: false }),
    ]);
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
    const firstRow = page.locator('table tbody tr.group').first();
    await firstRow.hover();
    await firstRow.locator('button').nth(0).click();
    await expect(page.locator('text=Ülke Düzenle')).toBeVisible();

    // Placeholder duruma göre değişir: atanmışsa "Değiştirmek için ara…",
    // boşsa "Öğretmen ara…" — genel /ara/i regex'i sayfanın "Ülke ara..."
    // arama kutusuyla da eşleşip strict-mode ihlali veriyordu; ikisine özel eşleş.
    const teacherInput = page.getByPlaceholder(/değiştirmek için ara|öğretmen ara/i);
    await teacherInput.fill('a');

    // API çağrısını bekle
    await page.waitForResponse(r =>
      r.url().includes('/api/super-admin/kullanicilar') &&
      r.url().includes('rol=Ogretmen') &&
      r.status() === 200,
      { timeout: 8000 }
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
    // /iptal/i regex hiç eşleşmiyordu: JS'in case-insensitive regex'i Türkçe
    // büyük İ'yi (U+0130) ASCII 'i'ye fold etmiyor ('İ'.toLowerCase() === 'i̇',
    // iki karakter) — buton metni sabit "İptal" olduğu için tam eşleşme kullan.
    await page.getByRole('button', { name: 'İptal' }).click();
  });

  // ─── 8. Silme & Tam Reset ────────────────────────────────────────────────

  test('13. Deleting a country removes it from the list', async () => {
    // v1b DataTable'da satır tıklaması artık /ulkeler/[id] detay rotasına
    // navigate ediyor (eski inline "detay panel" yok) — o yüzden burada satıra
    // hiç tıklamıyoruz, sadece hover+trash ile listeden siliyoruz.
    const newName = `QA-Delete-${Date.now()}`;

    await page.getByRole('button', { name: /yeni ülke/i }).click();
    await page.getByPlaceholder('Ülke adı...').fill(newName);
    await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/super-admin/ulke') && r.request().method() === 'POST' && r.status() === 200),
      page.getByRole('button', { name: 'Ekle' }).click(),
    ]);
    await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler?') && r.status() === 200);

    // "QA-..." alfabetik sırada sayfa 1'de olmayabilir (client-side sayfalama) — arayarak bul.
    await page.getByPlaceholder('Ülke ara...').fill(newName);
    await page.waitForTimeout(400);
    const newRow = page.locator('table tbody tr.group').filter({ hasText: newName });
    await expect(newRow).toBeVisible();

    await newRow.hover();
    await newRow.locator('button').last().click(); // Trash butonu
    await page.getByPlaceholder('DELETE').fill('DELETE');

    const [delRes] = await Promise.all([
      page.waitForResponse(r => r.url().includes('/api/super-admin/ulke/') && r.request().method() === 'DELETE'),
      page.getByRole('button', { name: 'Sil' }).click(),
    ]);
    expect(delRes.status()).toBe(200);

    // Liste yenilendi, silinen ülke artık listede yok (arama hâlâ o isimle filtreli)
    await page.waitForResponse(r => r.url().includes('/api/super-admin/ulkeler?') && r.status() === 200);
    await expect(page.locator('table tbody tr.group').filter({ hasText: newName })).toHaveCount(0);
  });
});

// ─── 9. API Yanıt Yapısı ───────────────────────────────────────────────────
//
// Ayrı describe + kendi page'i: yukarıdaki 13 UI testiyle aynı paylaşılan
// oturumu/page'i kullanmıyor. Token'ı localStorage'dan okumaya çalışmak GERÇEK
// KÖK NEDENDİ: src/stores/auth.ts'nin partialize'ı accessToken'ı bilinçli
// olarak persist ETMİYOR (15 dk TTL, memory-only) — sadece user+refreshToken
// localStorage'a yazılıyor. Bu yüzden UI login + localStorage okuma hiçbir
// zaman çalışmayacaktı; token'ı login API'sinin response body'sinden al.
test.describe('Ülkeler Tab — API yanıt şekli', () => {
  let apiPage: Page;
  let token: string;

  test.beforeAll(async ({ browser }) => {
    apiPage = await browser.newPage();
    const email = process.env.TEST_SUPER_ADMIN_EMAIL ?? 'admin@turkceokulu.com';
    const password = process.env.TEST_SUPER_ADMIN_PASS ?? 'Admin123!';
    const res = await apiPage.request.post('http://localhost:5221/api/auth/login', {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
    });
    const body = await res.json();
    token = body?.accessToken ?? body?.token ?? '';
  });

  test.afterAll(async () => {
    await apiPage.close();
  });

  test('14. API response shape: liste, totalCount, currentPage, totalPages', async () => {
    const response = await apiPage.request.get('http://localhost:5221/api/super-admin/ulkeler?pageNumber=1&pageSize=20', {
      headers: { Authorization: `Bearer ${token}` },
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
    const response = await apiPage.request.get('http://localhost:5221/api/super-admin/ulkeler?pageNumber=1&pageSize=20', {
      headers: { Authorization: `Bearer ${token}` },
    });

    type UlkeListeItem = { createdDate?: string; CreatedDate?: string };
    const body = await response.json() as { liste: UlkeListeItem[] };
    const liste = body.liste;

    if (liste.length >= 2) {
      const dates = liste.map((u) => new Date(u.createdDate ?? u.CreatedDate ?? 0).getTime());
      // Azalan sırada olmalı
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
      }
    }
  });
});
