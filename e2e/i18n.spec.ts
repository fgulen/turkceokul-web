/**
 * i18n — Dil Değiştirme ve İçerik Tutarlılığı Testleri
 *
 * Pre-conditions:
 *   - API localhost:5221'de çalışıyor
 *   - Test kullanıcıları DB'de mevcut
 *
 * Kapsam:
 *   1. TR landing page — Türkçe içerik
 *   2. EN landing page — İngilizce içerik
 *   3. TR ↔ EN nav butonu ile geçiş
 *   4. TR giriş sayfası
 *   5. EN giriş sayfası
 *   6. TR kayıt sayfası
 *   7. EN kayıt sayfası
 *   8. TR giriş — forgot link text
 *   9. EN login — forgot link text
 *  10. TR kayıt — hesap link text
 *  11. EN register — account link text
 *  12. TR şifremi unuttum
 *  13. EN forgot password
 *  14. TR şifre sıfırla
 *  15. EN reset password
 *  16. Navigation — login↔forgot↔reset
 *  17. Locale switching from subpages
 *  18. EN pano (login sonrası)
 *  19. TR pano (login sonrası)
 */

import { test, expect } from '@playwright/test';

const testAccount = { email: 'ogrenci1@turkceokulu.com', password: 'Ogrenci123!' };

test.describe.configure({ timeout: 60_000 });

async function login(page: any, locale: string) {
  await page.goto(`/${locale}/giris`);
  const emailPlaceholder = locale === 'tr' ? 'ornek@email.com' : 'you@example.com';
  await page.getByPlaceholder(emailPlaceholder).fill(testAccount.email);
  await page.getByPlaceholder('••••••••').fill(testAccount.password);
  await page.getByRole('button', { name: locale === 'tr' ? 'Giriş Yap' : 'Log In' }).click();
  await page.waitForURL(new RegExp(`/${locale}/(pano|ogretmen)`), { timeout: 15000 });
}

// ─── 1. TR Landing ──────────────────────────────────────────────────────────

test.describe('TR — Anasayfa', () => {
  test('Türkçe içerik gösterir', async ({ page }) => {
    await page.goto('/tr');
    const text = await page.evaluate(() => document.body.innerText);

    expect(text).toMatch(/Türkçe(Ö|o)kulu|Türkçe öğren/i);
    // Türkçe'ye özgü kelimeler
    const trIndicators = ['Giriş Yap', 'Ücretsiz', 'Kaydol', 'Hemen Başla', 'Türkçe'].filter(w => text.includes(w));
    expect(trIndicators.length).toBeGreaterThan(0);
  });
});

// ─── 2. EN Landing ──────────────────────────────────────────────────────────

test.describe('EN — Homepage', () => {
  test('English content displayed', async ({ page }) => {
    await page.goto('/en');
    const text = await page.evaluate(() => document.body.innerText);

    expect(text).toMatch(/Turkce?Okulu|Learn Turkish/i);
    // İngilizce'ye özgü kelimeler
    const enIndicators = ['Log In', 'Free', 'Sign Up', 'Get Started', 'Turkish'].filter(w =>
      text.match(new RegExp(w, 'i'))
    );
    // "Giriş Yap" olmamalı
    expect(text).not.toMatch(/Giriş Yap/);
    expect(enIndicators.length).toBeGreaterThan(0);
  });
});

// ─── 3. Dil Değiştirme ──────────────────────────────────────────────────────

test.describe('Locale Switching', () => {
  test('TR → EN nav butonu ile geçiş', async ({ page }) => {
    await page.goto('/tr');
    // Dil değiştirme butonu — class'ında hidden md:flex olan link
    const enBtn = page.locator('a[href="/en"]').filter({ hasText: 'EN' }).first();
    await expect(enBtn).toBeVisible();
    await enBtn.click();
    await page.waitForURL('/en', { timeout: 10000 });

    const text = await page.evaluate(() => document.body.innerText);
    const enIndicators = ['Log In', 'Free', 'Sign Up', 'Get Started'].filter(w =>
      text.match(new RegExp(w, 'i'))
    );
    expect(enIndicators.length).toBeGreaterThan(0);
  });

  test('EN → TR nav butonu ile geçiş', async ({ page }) => {
    await page.goto('/en');
    const trBtn = page.locator('a[href="/tr"]').filter({ hasText: 'TR' }).first();
    await expect(trBtn).toBeVisible();
    await trBtn.click();
    await page.waitForURL('/tr', { timeout: 10000 });

    const text = await page.evaluate(() => document.body.innerText);
    expect(text).toMatch(/Giriş Yap/);
  });
});

// ─── 4. TR Giriş ────────────────────────────────────────────────────────────

test.describe('TR — Giriş Sayfası', () => {
  test('Türkçe form etiketleri gösterir', async ({ page }) => {
    await page.goto('/tr/giris');
    const text = await page.evaluate(() => document.body.innerText);

    expect(text).toMatch(/Giriş Yap/i);
    // Placeholder text için input'ları kontrol et
    const emailInput = page.getByPlaceholder('ornek@email.com');
    await expect(emailInput).toBeVisible();
  });
});

// ─── 5. EN Giriş ────────────────────────────────────────────────────────────

test.describe('EN — Login Page', () => {
  test('English form labels displayed', async ({ page }) => {
    await page.goto('/en/giris');
    const text = await page.evaluate(() => document.body.innerText);

    expect(text).toMatch(/Log In/i);
    expect(text).not.toMatch(/Giriş Yap/);
  });
});

// ─── 6. TR Kayıt ────────────────────────────────────────────────────────────

test.describe('TR — Kayıt Sayfası', () => {
  test('Türkçe kayıt formu', async ({ page }) => {
    await page.goto('/tr/kayit');
    const text = await page.evaluate(() => document.body.innerText);

    // Türkçe onboarding metni
    expect(text).toMatch(/Kaydol|Ücretsiz|Hesap Oluştur/i);
  });
});

// ─── 7. EN Kayıt ────────────────────────────────────────────────────────────

test.describe('EN — Register Page', () => {
  test('English registration form', async ({ page }) => {
    await page.goto('/en/kayit');
    const text = await page.evaluate(() => document.body.innerText);

    expect(text).toMatch(/Sign Up|Create Account|Free/i);
    expect(text).not.toMatch(/Kaydol/);
  });
});

// ─── 8. TR Giriş — Forgot Link ──────────────────────────────────────────────

test.describe('TR — Giriş sayfası forgot linki', () => {
  test('Şifremi unuttum bağlantısı görünür ve tıklayınca yönlendirir', async ({ page }) => {
    await page.goto('/tr/giris');
    const link = page.getByText('Şifremi unuttum');
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL('/tr/sifremi-unuttum', { timeout: 10000 });
  });
});

// ─── 9. EN Login — Forgot Link ──────────────────────────────────────────────

test.describe('EN — Login page forgot link', () => {
  test('Forgot password link visible and navigates correctly', async ({ page }) => {
    await page.goto('/en/giris');
    const link = page.getByText(/forgot password/i);
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL('/en/sifremi-unuttum', { timeout: 10000 });
  });
});

// ─── 10. TR Kayıt — Hesap Linki ─────────────────────────────────────────────

test.describe('TR — Kayıt sayfası hesap linki', () => {
  test('Zaten hesabın var mı? bağlantısı görünür ve tıklayınca yönlendirir', async ({ page }) => {
    await page.goto('/tr/kayit');
    const text = page.getByText(/Zaten hesab/i);
    await expect(text).toBeVisible();
    const link = page.getByText('Giriş yap');
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL('/tr/giris', { timeout: 10000 });
  });
});

// ─── 11. EN Register — Account Link ─────────────────────────────────────────

test.describe('EN — Register page account link', () => {
  test('Already have an account link visible and navigates correctly', async ({ page }) => {
    await page.goto('/en/kayit');
    const text = page.getByText(/already have an account/i);
    await expect(text).toBeVisible();
    const link = page.getByText('Log in');
    await expect(link).toBeVisible();
    await link.click();
    await page.waitForURL('/en/giris', { timeout: 10000 });
  });
});

// ─── 12. TR Şifremi Unuttum ────────────────────────────────────────────────

test.describe('TR — Şifremi Unuttum', () => {
  test('Türkçe şifre sıfırlama sayfası', async ({ page }) => {
    await page.goto('/tr/sifremi-unuttum');
    const text = await page.evaluate(() => document.body.innerText);

    expect(text).toMatch(/Şifremi unuttum|Sıfırlama Bağlantısı/i);
  });
});

// ─── 13. EN Forgot Password ─────────────────────────────────────────────────

test.describe('EN — Forgot Password', () => {
  test('English forgot password page', async ({ page }) => {
    await page.goto('/en/sifremi-unuttum');
    const text = await page.evaluate(() => document.body.innerText);

    expect(text).toMatch(/Forgot password|Reset Link/i);
    expect(text).not.toMatch(/Şifremi unuttum/);
  });
});

// ─── 14. TR Şifre Sıfırla ──────────────────────────────────────────────────

test.describe('TR — Şifre Sıfırla', () => {
  test('Türkçe şifre sıfırlama sayfası (token yok — hata mesaji)', async ({ page }) => {
    await page.goto('/tr/sifremi-sifirla');
    const text = await page.evaluate(() => document.body.innerText);

    expect(text).toMatch(/Geçersiz|Yeni şifre belirle/i);
  });
});

// ─── 15. EN Reset Password ─────────────────────────────────────────────────

test.describe('EN — Reset Password', () => {
  test('English reset password page (no token — error message)', async ({ page }) => {
    await page.goto('/en/sifremi-sifirla');
    const text = await page.evaluate(() => document.body.innerText);

    expect(text).toMatch(/Invalid|Set a new password/i);
    expect(text).not.toMatch(/Geçersiz/);
  });
});

// ─── 16. Navigation — Forgot→Login ──────────────────────────────────────────

test.describe('Navigation — Forgot to Login', () => {
  test('TR sifremi-unuttum → giris sayfasina don', async ({ page }) => {
    await page.goto('/tr/sifremi-unuttum');
    const backBtn = page.getByText('Giriş sayfasına dön');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await page.waitForURL('/tr/giris', { timeout: 10000 });
  });

  test('EN forgot password → back to login', async ({ page }) => {
    await page.goto('/en/sifremi-unuttum');
    const backBtn = page.getByText(/back to log in/i);
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await page.waitForURL('/en/giris', { timeout: 10000 });
  });
});

// ─── 17. Navigation — Reset→Login ───────────────────────────────────────────

test.describe('Navigation — Reset to Login', () => {
  test('TR sifremi-sifirla → giris sayfasina don', async ({ page }) => {
    await page.goto('/tr/sifremi-sifirla');
    const backBtn = page.getByText('Giriş sayfasına dön');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await page.waitForURL('/tr/giris', { timeout: 10000 });
  });

  test('EN reset password → back to login', async ({ page }) => {
    await page.goto('/en/sifremi-sifirla');
    const backBtn = page.getByText(/back to log in/i);
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await page.waitForURL('/en/giris', { timeout: 10000 });
  });
});

// ─── 18. Giriş Sayfası — Link Metinleri ─────────────────────────────────────

test.describe('Giriş sayfası — link text', () => {
  test('TR: Şifremi unuttum + Hesabın yok mu?', async ({ page }) => {
    await page.goto('/tr/giris');
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).toMatch(/Şifremi unuttum/);
    expect(text).toMatch(/Hesabın yok mu\?/);
    expect(text).toMatch(/Ücretsiz kayıt ol/);
  });

  test('EN: Forgot password + No account', async ({ page }) => {
    await page.goto('/en/giris');
    const text = await page.evaluate(() => document.body.innerText);
    expect(text).toMatch(/forgot password/i);
    expect(text).toMatch(/don't have an account/i);
    expect(text).toMatch(/sign up/i);
    expect(text).not.toMatch(/Şifremi|Hesabın/);
  });
});

// ─── 19. EN Dashboard (authenticated) ───────────────────────────────────────

test.describe('EN — Dashboard (authenticated)', () => {
  test('English dashboard after login', async ({ page }) => {
    await login(page, 'en');

    const text = await page.evaluate(() => document.body.innerText);
    // "XP" her iki dilde de aynı ama "Streak" vs "Gün" farklı
    // Dashboard İngilizce kelimeler
    const hasEn = text.match(/Dashboard|XP|Streak|Profile/i);
    expect(hasEn).not.toBeNull();
  });
});

// ─── 20. TR Pano (giriş sonrası) ────────────────────────────────────────────

test.describe('TR — Pano (giriş sonrası)', () => {
  test('Türkçe pano', async ({ page }) => {
    await login(page, 'tr');

    const text = await page.evaluate(() => document.body.innerText);
    // Pano için Türkçe kelimeler
    const hasTr = text.match(/Pano|Görevler|Görev|Lig|Streak/i);
    expect(hasTr).not.toBeNull();
  });
});
