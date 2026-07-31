import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5221';
const TIMEOUT = 10000;

let adminToken: string | null = null;
let olusanKurumId: number | null = null;

test.describe.configure({ timeout: 120_000 });

async function getAdminToken(request: any): Promise<string | null> {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email: 'admin@turkceokulu.com', password: 'Admin123!' },
    timeout: TIMEOUT, failOnStatusCode: false,
  });
  if (res.status() !== 200) return null;
  return (await res.json()).accessToken ?? null;
}

test.beforeAll(async ({ request }) => {
  adminToken = await getAdminToken(request);
});

test.afterAll(async ({ request }) => {
  if (!adminToken || !olusanKurumId) return;
  const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
  await request.delete(`${API_BASE}/api/super-admin/kurum/${olusanKurumId}`, {
    headers, timeout: TIMEOUT, failOnStatusCode: false,
  });
});

// ─── 1. SuperAdmin Dashboard UI ─────────────────────────────────────────────

test.describe('SuperAdmin Dashboard — UI', () => {
  test('Sayfa yüklenir', async ({ page }) => {
    await page.goto('/tr/giris');
    await page.getByPlaceholder('ornek@email.com').fill('admin@turkceokulu.com');
    await page.getByPlaceholder('••••••••').fill('Admin123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForURL(/\/tr\/(super-admin|pano|ogretmen)/, { timeout: 15000 });

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('Kullanıcılar sayfası yüklenir', async ({ page }) => {
    await page.goto('/tr/giris');
    await page.getByPlaceholder('ornek@email.com').fill('admin@turkceokulu.com');
    await page.getByPlaceholder('••••••••').fill('Admin123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForURL(/\/tr\/(super-admin|pano|ogretmen)/, { timeout: 15000 });

    await page.goto('/tr/super-admin/kullanicilar', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(50);
  });

  test('Ülkeler sayfası yüklenir', async ({ page }) => {
    await page.goto('/tr/giris');
    await page.getByPlaceholder('ornek@email.com').fill('admin@turkceokulu.com');
    await page.getByPlaceholder('••••••••').fill('Admin123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForURL(/\/tr\/(super-admin|pano|ogretmen)/, { timeout: 15000 });

    await page.goto('/tr/super-admin/ulkeler', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(50);
  });
});

// ─── 2. API — İstatistik ─────────────────────────────────────────────────────

test.describe('API — İstatistikler', () => {
  test('Dashboard istatistikleri döner', async ({ request }) => {
    test.skip(!adminToken, 'Admin token alınamadı');
    const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    const res = await request.get(`${API_BASE}/api/super-admin/istatistikler`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(typeof data.toplamKullanici).toBe('number');
    expect(typeof data.yayindaKitap).toBe('number');
    expect(typeof data.toplamSinif).toBe('number');
    expect(typeof data.askidaKullanici).toBe('number');
    expect(typeof data.bekleyenSiparis).toBe('number');
  });
});

// ─── 3. API — Kullanıcı Yönetimi ─────────────────────────────────────────────

test.describe('API — Kullanıcı Yönetimi', () => {
  test('Kullanıcı listesi döner (pagination wrapper)', async ({ request }) => {
    test.skip(!adminToken, 'Admin token alınamadı');
    const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    const res = await request.get(`${API_BASE}/api/super-admin/kullanicilar`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.liste)).toBe(true);
    expect(data.toplam).toBeDefined();
    expect(typeof data.toplam).toBe('number');
  });

  test('Kullanıcı listesi filtre ile çalışır (rol=Ogrenci)', async ({ request }) => {
    test.skip(!adminToken, 'Admin token alınamadı');
    const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    const res = await request.get(`${API_BASE}/api/super-admin/kullanicilar?rol=Ogrenci`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.liste)).toBe(true);
  });
});

// ─── 4. API — Ülke Yönetimi ──────────────────────────────────────────────────

test.describe('API — Ülke Yönetimi', () => {
  test('Ülke listesi döner (pagination wrapper)', async ({ request }) => {
    test.skip(!adminToken, 'Admin token alınamadı');
    const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    const res = await request.get(`${API_BASE}/api/super-admin/ulkeler`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.liste)).toBe(true);
    expect(typeof data.totalCount).toBe('number');
  });
});

// ─── 5. API — Kurum Yönetimi ─────────────────────────────────────────────────

test.describe('API — Kurum Yönetimi', () => {
  test('Kurum listesi döner', async ({ request }) => {
    test.skip(!adminToken, 'Admin token alınamadı');
    const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    const res = await request.get(`${API_BASE}/api/super-admin/kurumlar`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.liste)).toBe(true);
    expect(typeof data.toplam).toBe('number');
  });

  test('Kurum oluşturma ve silme', async ({ request }) => {
    test.skip(!adminToken, 'Admin token alınamadı');
    const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    const ad = `E2E Test Kurumu ${Date.now()}`;
    const createRes = await request.post(`${API_BASE}/api/super-admin/kurum`, {
      headers,
      data: { Name: ad },
      timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(createRes.status()).toBe(200);
    const data = await createRes.json();
    expect(data.id).toBeDefined();
    expect(data.name).toContain('E2E Test Kurumu');
    olusanKurumId = data.id;

    const deleteRes = await request.delete(`${API_BASE}/api/super-admin/kurum/${data.id}`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect([200, 204]).toContain(deleteRes.status());
    olusanKurumId = null;
  });
});

// ─── 6. API — Kitap Yönetimi ────────────────────────────────────────────────

test.describe('API — Kitap Yönetimi', () => {
  test('Kitap listesi döner', async ({ request }) => {
    test.skip(!adminToken, 'Admin token alınamadı');
    const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    const res = await request.get(`${API_BASE}/api/super-admin/kitaplar`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0].id).toBeDefined();
      expect(data[0].name).toBeDefined();
    }
  });
});

// ─── 7. API — Sipariş Yönetimi ─────────────────────────────────────────────

test.describe('API — Sipariş Yönetimi', () => {
  test('Sipariş listesi döner', async ({ request }) => {
    test.skip(!adminToken, 'Admin token alınamadı');
    const headers = { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' };

    const res = await request.get(`${API_BASE}/api/super-admin/siparisler`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });
});
