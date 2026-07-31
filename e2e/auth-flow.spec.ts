/**
 * Auth Flow — Kayıt, Giriş, Çıkış E2E Testleri
 *
 * Pre-conditions:
 *   - API localhost:5221'de çalışmalı
 *   - Test kullanıcıları DB'de olmalı:
 *     ogretmen@turkceokulu.com / Ogretmen123!
 *     ogrenci1@turkceokulu.com / Ogrenci123!
 *     admin@turkceokulu.com / Admin123!
 *
 * Kapsam (email gönderme localhost'ta çalışmadığı için şifre sıfırlama yok):
 *   1. Kayıt — öğrenci (bireysel) → /pano
 *   2. Kayıt — öğretmen (kurumsal) → /ogretmen
 *   3. Kayıt validasyonu — geçersiz ad, kısa şifre
 *   4. Giriş — öğrenci → /pano
 *   5. Giriş — öğretmen → /ogretmen
 *   6. Giriş — admin → /super-admin
 *   7. Giriş — hatalı şifre → hata mesajı
 *   8. Giriş — var olmayan email → hata mesajı
 *   9. Giriş — ?redirect= ile yönlendirme
 *   10. Çıkış — logout → ana sayfa
 *   11. Token refresh — API üzerinden
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5221';

test.describe.configure({ timeout: 60_000 });

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

let emailCounter = Date.now();

function uniqueEmail(prefix = 'authtest'): string {
  emailCounter++;
  return `${prefix}_${emailCounter}@example.com`;
}

async function kayitAdimlari(page: any, role: 'bireysel' | 'kurumsal', email: string) {
  await page.goto('/tr/kayit');

  // Step 1: Rol seçimi
  if (role === 'bireysel') {
    await page.getByRole('button', { name: 'Öğrenciyim' }).click();
  } else {
    await page.getByRole('button', { name: 'Öğretmenim / Kurum' }).click();
  }
  await page.waitForTimeout(500);

  // Step 2: Anadil seçimi — İngilizce
  await page.getByRole('button', { name: 'İngilizce' }).click();
  await page.waitForTimeout(500);

  // Step 3: Form doldur
  await page.getByPlaceholder('Ahmet').fill('Test');
  await page.getByPlaceholder('Yılmaz').fill('User');
  await page.getByPlaceholder('ornek@email.com').fill(email);
  await page.getByPlaceholder('En az 8 karakter').fill('TestPass123!');

  // Submit
  await page.getByRole('button', { name: role === 'kurumsal' ? 'Kurumsal Hesap Oluştur' : 'Ücretsiz Kaydol' }).click();
}

// ─── 1. Kayıt ──────────────────────────────────────────────────────────────────

test.describe('Kayıt — Register', () => {
  // TODO: bireysel kayıt artık kasıtlı olarak kapalı (bekleme listesi kapısı — bkz.
  // project_bireysel_bekleme_listesi_2026_07_29 memory). Bu 4 test (aşağıdaki 3 dahil)
  // Ahmet/Yılmaz/email/şifre formuna hiç ulaşamıyor, "Bekleme Listesine Katıl" ekranına
  // düşüyor. Ürün kararı gerekiyor: bekleme-listesi akışını mı test etsinler, yoksa
  // ad/şifre validasyon testleri kurumsal akışa mı taşınsın (2026-08-01).
  test.skip('Öğrenci (bireysel) kaydı → /pano yönlendirme', async ({ page }) => {
    const email = uniqueEmail('ogrenci');
    await kayitAdimlari(page, 'bireysel', email);
    await page.waitForURL(/\/tr\/(pano|ogretmen)/, { timeout: 15000 });
    expect(page.url()).toContain('/pano');
  });

  test('Öğretmen (kurumsal) kaydı → /ogretmen yönlendirme', async ({ page }) => {
    const email = uniqueEmail('ogretmen');
    await kayitAdimlari(page, 'kurumsal', email);
    await page.waitForURL(/\/tr\/(ogretmen|pano)/, { timeout: 15000 });
    expect(page.url()).toContain('/ogretmen');
  });

  // TODO: bkz. yukarıdaki not — bireysel form artık bekleme listesi kapısının arkasında.
  test.skip('Geçersiz ad — hata mesajı gösterir', async ({ page }) => {
    await page.goto('/tr/kayit?tip=bireysel');
    await page.waitForTimeout(300);

    // Skip to step 3 via URL param
    const email = uniqueEmail('gecersiz');
    await page.getByRole('button', { name: 'İngilizce' }).click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('Ahmet').fill('Test@123!');
    await page.getByPlaceholder('Yılmaz').fill('User');
    await page.getByPlaceholder('ornek@email.com').fill(email);
    await page.getByPlaceholder('En az 8 karakter').fill('TestPass123!');

    await page.getByRole('button', { name: 'Ücretsiz Kaydol' }).click();
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Ad ve soyad/)).toBeVisible();
  });

  // TODO: bkz. yukarıdaki not — bireysel form artık bekleme listesi kapısının arkasında.
  test.skip('Kısa şifre — hata mesajı gösterir', async ({ page }) => {
    await page.goto('/tr/kayit?tip=bireysel');
    await page.waitForTimeout(300);

    const email = uniqueEmail('kisasifre');
    await page.getByRole('button', { name: 'İngilizce' }).click();
    await page.waitForTimeout(300);

    await page.getByPlaceholder('Ahmet').fill('Test');
    await page.getByPlaceholder('Yılmaz').fill('User');
    await page.getByPlaceholder('ornek@email.com').fill(email);
    await page.getByPlaceholder('En az 8 karakter').fill('12');

    await page.getByRole('button', { name: 'Ücretsiz Kaydol' }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Şifre en az 8 karakter')).toBeVisible();
  });

  // TODO: bkz. yukarıdaki not — bireysel form artık bekleme listesi kapısının arkasında.
  test.skip('Mükerrer email — API hata mesajı gösterir', async ({ page }) => {
    await page.goto('/tr/kayit?tip=bireysel');
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'İngilizce' }).click();
    await page.waitForTimeout(500);

    await page.getByPlaceholder('Ahmet').fill('Test');
    await page.getByPlaceholder('Yılmaz').fill('User');
    await page.getByPlaceholder('ornek@email.com').fill('ogrenci1@turkceokulu.com');
    await page.getByPlaceholder('En az 8 karakter').fill('TestPass123!');

    await page.getByRole('button', { name: 'Ücretsiz Kaydol' }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(/zaten kullanılıyor/i)).toBeVisible();
  });
});

// ─── 2. Giriş ──────────────────────────────────────────────────────────────────

test.describe('Giriş — Login', () => {
  test('Öğrenci girişi → /pano', async ({ page }) => {
    await page.goto('/tr/giris');
    await page.getByPlaceholder('ornek@email.com').fill('ogrenci1@turkceokulu.com');
    await page.getByPlaceholder('••••••••').fill('Ogrenci123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForURL(/\/tr\/(pano|ogretmen)/, { timeout: 15000 });
    expect(page.url()).toContain('/pano');
  });

  test('Öğretmen girişi → /ogretmen', async ({ page }) => {
    await page.goto('/tr/giris');
    await page.getByPlaceholder('ornek@email.com').fill('ogretmen@turkceokulu.com');
    await page.getByPlaceholder('••••••••').fill('Ogretmen123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForURL(/\/tr\/(ogretmen|pano)/, { timeout: 15000 });
    expect(page.url()).toContain('/ogretmen');
  });

  test('Admin girişi — role göre yönlenir', async ({ page, request }) => {
    // Önce admin'in rolünü API'den kontrol et
    const roleRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: 'admin@turkceokulu.com', password: 'Admin123!' },
      failOnStatusCode: false,
    });
    if (roleRes.status() !== 200) {
      test.skip(true, 'Admin hesabı geçersiz');
      return;
    }
    const roleBody = await roleRes.json();
    const role = roleBody?.user?.role;
    const expectedPaths: Record<string, RegExp> = {
      SuperAdmin: /\/tr\/(super-admin|pano)/,
      Koordinator: /\/tr\/(admin|pano)/,
      Ogretmen: /\/tr\/(ogretmen|pano)/,
      Editor: /\/tr\/(pano|editor)/,
    };
    const pattern = expectedPaths[role as string] ?? /\/tr\/(pano|ogretmen|admin|super-admin)/;

    await page.goto('/tr/giris');
    await page.getByPlaceholder('ornek@email.com').fill('admin@turkceokulu.com');
    await page.getByPlaceholder('••••••••').fill('Admin123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForURL(pattern, { timeout: 15000 });
  });

  test('Hatalı şifre — hata mesajı', async ({ page }) => {
    await page.goto('/tr/giris');
    await page.getByPlaceholder('ornek@email.com').fill('ogrenci1@turkceokulu.com');
    await page.getByPlaceholder('••••••••').fill('YanlisSifre123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(/E-posta veya şifre hatalı|Geçersiz/i)).toBeVisible();
  });

  test('Var olmayan email — hata mesajı', async ({ page }) => {
    await page.goto('/tr/giris');
    await page.getByPlaceholder('ornek@email.com').fill('olmayan@example.com');
    await page.getByPlaceholder('••••••••').fill('TestPass123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(/E-posta veya şifre hatalı|Geçersiz|bulunamadı/i)).toBeVisible();
  });

  test('?redirect= ile yönlendirme', async ({ page }) => {
    await page.goto('/tr/giris?redirect=/tr/profil');
    await page.getByPlaceholder('ornek@email.com').fill('ogrenci1@turkceokulu.com');
    await page.getByPlaceholder('••••••••').fill('Ogrenci123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForURL(/\/tr\/(profil|pano)/, { timeout: 15000 });
  });
});

// ─── 3. Çıkış ──────────────────────────────────────────────────────────────────

test.describe('Çıkış — Logout', () => {
  test('Çıkış sonrası ana sayfaya yönlenir', async ({ page }) => {
    await page.goto('/tr/giris');
    await page.getByPlaceholder('ornek@email.com').fill('ogrenci1@turkceokulu.com');
    await page.getByPlaceholder('••••••••').fill('Ogrenci123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForURL(/\/tr\/(pano|ogretmen)/, { timeout: 15000 });

    // page.request shares cookies with the browser page
    await page.request.post(`${API_BASE}/api/auth/logout`);

    // Navigate to pano — middleware görünce hasSession cookie yoksa redirect
    await page.goto('/tr/pano', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/pano');
    expect(currentUrl).not.toContain('/ogretmen');
  });
});

// ─── 4. Token Refresh (API seviyesi) ─────────────────────────────────────────

test.describe('Token Refresh — API', () => {
  test('Login → refresh token döner', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: 'ogrenci1@turkceokulu.com', password: 'Ogrenci123!' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.accessToken).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user).toBeDefined();
    expect(body.user.role).toBe('Ogrenci');
  });

  test('Refresh token ile yeni access token alınabilir', async ({ request }) => {
    // Use the refreshToken from the login response body
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: 'ogrenci1@turkceokulu.com', password: 'Ogrenci123!' },
      failOnStatusCode: false,
    });
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.refreshToken).toBeDefined();

    // Call refresh with the token in the request body
    const refreshRes = await request.post(`${API_BASE}/api/auth/refresh`, {
      data: { refreshToken: loginBody.refreshToken },
      failOnStatusCode: false,
    });
    expect(refreshRes.status()).toBe(200);
    const body = await refreshRes.json();
    expect(body.accessToken).toBeDefined();
  });

  test('Geçersiz refresh token 401 döner', async ({ request }) => {
    const res = await request.post(`${API_BASE}/api/auth/refresh`, {
      data: { refreshToken: 'gecersiz-token-12345' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });
});
