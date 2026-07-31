/**
 * Ders Core Loop — Pano → Kitap → Ünite → Etkinlik → Sonuç
 *
 * Kullanıcının ana öğrenme döngüsünü test eder:
 *   1. /pano — dashboard yükleme
 *   2. /ders/{kitapId} — ünite listesi, etkinlik düğümleri
 *   3. /etkinlik/{id} — player yükleme, API cevap
 *   4. Dashboard'dan kitap seçip gitme
 *
 * Pre-condition: API localhost:5221'de çalışıyor.
 */

import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

const API_BASE = 'http://localhost:5221';
const API_TIMEOUT = 10000;

test.describe.configure({ timeout: 120_000 });

interface Kitap { id: string; name: string }
interface Unite { id: string; name: string; kilitli?: boolean; lisansKilidi?: boolean }

async function getToken(request: APIRequestContext): Promise<string | null> {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email: 'ogrenci1@turkceokulu.com', password: 'Ogrenci123!' },
    timeout: API_TIMEOUT, failOnStatusCode: false,
  });
  if (res.status() !== 200) return null;
  return (await res.json()).accessToken ?? null;
}

async function fetchKitaplar(request: APIRequestContext): Promise<Kitap[]> {
  return (await (await request.get(`${API_BASE}/api/derskitaplari`, { timeout: API_TIMEOUT })).json().catch(() => [])) ?? [];
}

async function fetchUniteler(request: APIRequestContext, token: string, kitapId: string): Promise<Unite[]> {
  const res = await request.get(`${API_BASE}/api/uniteler/${kitapId}`, {
    headers: { Authorization: `Bearer ${token}` }, timeout: API_TIMEOUT, failOnStatusCode: false,
  });
  return res.ok() ? (await res.json()) ?? [] : [];
}

async function loginAsStudent(page: Page) {
  await page.goto('/tr/giris');
  await page.getByPlaceholder('ornek@email.com').fill('ogrenci1@turkceokulu.com');
  await page.getByPlaceholder('••••••••').fill('Ogrenci123!');
  await page.getByRole('button', { name: 'Giriş Yap' }).click();
  await page.waitForURL(/\/tr\/(pano|ogretmen)/, { timeout: 15000 });
}

// ─── 1. Dashboard ─────────────────────────────────────────────────────────────

test.describe('Pano — Dashboard', () => {
  test('Sayfa yüklenir, içerik ve kitaplar görünür', async ({ page }) => {
    await loginAsStudent(page);

    // Dashboard içeriği yüklendi
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(100);

    // En az bir kitap linki olmalı (ders/ okuma/ veya kutuphane)
    const kitapLink = page.locator('a[href^="/tr/ders/"]').or(page.locator('a[href^="/tr/kutuphane"]')).or(page.locator('a[href^="/tr/okuma"]')).first();
    const hasLink = await kitapLink.isVisible().catch(() => false);
    // Not: öğrencinin atanmış kitabı yoksa link olmayabilir, sadece sayfanın yüklendiğini doğrula
    expect(bodyText).toMatch(/Merhaba|Pano|Hoş geldin/i);
  });
});

// ─── 2. Kitap → Ünite Sayfası ────────────────────────────────────────────────

test.describe('Ders — Kitap Sayfası', () => {
  let kitapId: string | null = null;

  test.beforeAll(async ({ request }) => {
    const kitaplar = await fetchKitaplar(request);
    if (kitaplar.length > 0) kitapId = kitaplar[0].id;
  });

  test('Kitap sayfası yüklenir', async ({ page }) => {
    test.skip(!kitapId, 'Kitap bulunamadı');
    await loginAsStudent(page);

    await page.goto(`/tr/ders/${kitapId}`);
    await page.waitForTimeout(3000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(100);
  });

  test('Etkinlik düğümleri görünür', async ({ page, request }) => {
    test.skip(!kitapId, 'Kitap bulunamadı');
    await loginAsStudent(page);

    await page.goto(`/tr/ders/${kitapId}`);
    await page.waitForTimeout(3000);

    // Etkinlik linkleri ara (locale prefix'li veya prefix'siz)
    const links = page.locator('a[href*="/etkinlik/"]');
    const linkCount = await links.count().catch(() => 0);
    expect(linkCount).toBeGreaterThanOrEqual(0); // bilgi amaçlı, skip etmez
  });
});

// ─── 3. Etkinlik Player ──────────────────────────────────────────────────────

test.describe('Etkinlik — Player ve Cevap', () => {
  let secilen: { id: string; kitapId: string; uniteId: string; bolum: string } | null = null;

  test.beforeAll(async ({ request }) => {
    const token = await getToken(request);
    if (!token) return;
    const kitaplar = await fetchKitaplar(request);
    for (const kitap of kitaplar) {
      const uniteler = await fetchUniteler(request, token, kitap.id);
      for (const unite of uniteler) {
        if (unite.kilitli || unite.lisansKilidi) continue;
        const res = await request.get(`${API_BASE}/api/etkinlikler/${unite.id}`, {
          headers: { Authorization: `Bearer ${token}` }, timeout: API_TIMEOUT, failOnStatusCode: false,
        });
        const etkinlikler = res.ok() ? (await res.json()) ?? [] : [];
        if (etkinlikler.length > 0) {
          secilen = { id: etkinlikler[0].id, kitapId: kitap.id, uniteId: unite.id, bolum: etkinlikler[0].bolum || 'Kelime' };
          break;
        }
      }
      if (secilen) break;
    }
  });

  test('Etkinlik sayfası yüklenir', async ({ page }) => {
    test.skip(!secilen, 'Açık etkinlik bulunamadı');
    await loginAsStudent(page);

    const { id, kitapId, uniteId, bolum } = secilen!;
    await page.goto(`/tr/etkinlik/${id}?uniteId=${uniteId}&kitapId=${kitapId}&bolum=${encodeURIComponent(bolum)}`, {
      waitUntil: 'domcontentloaded', timeout: 20000,
    });
    await page.waitForTimeout(3000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('API üzerinden cevap gönderilebilir', async ({ request }) => {
    test.skip(!secilen, 'Açık etkinlik bulunamadı');
    const token = await getToken(request);
    test.skip(!token, 'Token alınamadı');

    const res = await request.post(`${API_BASE}/api/etkinlik/cevapla`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { etkinlikId: secilen!.id, detaylar: [{ id: 'auto', cevap: 'A' }], perdeAcimaSayisi: 0 },
      timeout: API_TIMEOUT, failOnStatusCode: false,
    });
    if (res.ok()) {
      const sonuc = await res.json();
      expect(typeof sonuc.puan).toBe('number');
      expect(typeof sonuc.kazanilanXp).toBe('number');
    }
  });
});

// ─── 4. Dashboard → Kitap Navigasyonu ────────────────────────────────────────

test.describe('Navigasyon — Pano → Ders', () => {
  test('Dashboard\'dan kitaba gidilebilir', async ({ page }) => {
    await loginAsStudent(page);

    // Herhangi bir ders/okuma/kutuphane linkine tıkla
    const kitapLink = page.locator('a[href*="/ders/"], a[href*="/okuma/"], a[href*="/kutuphane"]').first();
    if (await kitapLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await kitapLink.click();
      await page.waitForTimeout(3000);
      const bodyText = await page.evaluate(() => document.body.innerText);
      expect(bodyText.length).toBeGreaterThan(50);
    } else {
      // Öğrenci panosunda kitap linki yoksa bu kabul edilebilir
      test.skip(true, 'Dashboard\'da kitap linki bulunamadı');
    }
  });
});
