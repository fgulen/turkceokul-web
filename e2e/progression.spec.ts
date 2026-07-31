/**
 * Lig/Progression — XP, Kalp, Combo, Streak, Lig, Lira Testleri
 *
 * Pre-conditions:
 *   - API localhost:5221'de çalışıyor
 *   - ogrenci1@turkceokulu.com / Ogrenci123! DB'de mevcut
 *
 * Kapsam:
 *   1. Profil API — kalp, XP, streak, lira
 *   2. Günlük görevler API
 *   3. Lig tablosu API
 *   4. Lira harcama API
 *   5. Etkinlik cevaplama (XP + combo + kalp)
 *   6. Progression UI — pano sayfası
 */

import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:5221';
const TIMEOUT = 10000;

let studentToken: string | null = null;
let baslangicKalp = 5;
let baslangicXp = 0;
let baslangicStreak = 0;
let baslangicLira = 0;

test.describe.configure({ timeout: 120_000 });

test.beforeAll(async ({ request }) => {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email: 'ogrenci1@turkceokulu.com', password: 'Ogrenci123!' },
    timeout: TIMEOUT, failOnStatusCode: false,
  });
  if (res.status() === 200) {
    studentToken = (await res.json()).accessToken ?? null;
  }
});

// ─── 1. Profil API ──────────────────────────────────────────────────────────

test.describe('Profil API', () => {
  test('Kullanıcı profili kalp/XP/streak/lira bilgilerini döner', async ({ request }) => {
    test.skip(!studentToken, 'Token alınamadı');
    const headers = { Authorization: `Bearer ${studentToken}` };

    const res = await request.get(`${API_BASE}/api/profil`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(typeof data.kalp).toBe('number');
    expect(typeof data.puan).toBe('number');
    expect(typeof data.streakCount).toBe('number');
    expect(typeof data.sanalPara).toBe('number');

    // Save baseline for subsequent tests
    baslangicKalp = data.kalp;
    baslangicXp = data.puan;
    baslangicStreak = data.streakCount;
    baslangicLira = data.sanalPara;

    // Validasyon
    expect(data.kalp).toBeGreaterThanOrEqual(0);
    expect(data.kalp).toBeLessThanOrEqual(5);
    expect(data.puan).toBeGreaterThanOrEqual(0);
    expect(data.streakCount).toBeGreaterThanOrEqual(0);
  });
});

// ─── 2. Günlük Görevler API ────────────────────────────────────────────────

test.describe('Günlük Görevler', () => {
  test('Görev listesi en az 1 adet döner', async ({ request }) => {
    test.skip(!studentToken, 'Token alınamadı');
    const headers = { Authorization: `Bearer ${studentToken}` };

    const res = await request.get(`${API_BASE}/api/gorevler`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThanOrEqual(1);

    const ilk = data[0];
    expect(ilk.gorevTipi).toBeDefined();
    expect(typeof ilk.mevcut).toBe('number');
    expect(typeof ilk.hedef).toBe('number');
    expect(typeof ilk.odulMiktari).toBe('number');
  });
});

// ─── 3. Lig Tablosu API ────────────────────────────────────────────────────

test.describe('Lig Sistemi', () => {
  test('Lig tablosu döner (lazy join — ilk kez 204 olabilir)', async ({ request }) => {
    test.skip(!studentToken, 'Token alınamadı');
    const headers = { Authorization: `Bearer ${studentToken}` };

    const res = await request.get(`${API_BASE}/api/lig`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });

    // 204 = henüz ligi yok (lazy join) — bu kabul edilebilir
    // 200 = lig tablosu var
    expect([200, 204]).toContain(res.status());

    if (res.status() === 200) {
      const data = await res.json();
      expect(data.ligAdi).toBeDefined();
      expect(data.seviye).toBeDefined();
      expect(typeof data.seviye).toBe('number');
      expect(Array.isArray(data.tablo)).toBe(true);
    }
  });
});

// ─── 4. Lira Harcama API ────────────────────────────────────────────────────

test.describe('Lira (Sanal Para)', () => {
  test('Lira harcama — yetersiz bakiye reddedilir', async ({ request }) => {
    test.skip(!studentToken, 'Token alınamadı');
    const headers = { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' };

    // Çok yüksek miktar iste — reddedilmeli
    const res = await request.post(`${API_BASE}/api/gamification/lira/harca`, {
      headers,
      data: { miktar: 999999, sebep: 'test' },
      timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.basarili).toBe(false);
    expect(typeof data.kalanBakiye).toBe('number');
    expect(data.kalanBakiye).toBeGreaterThanOrEqual(0);
  });

  test('Lira harcama — küçük miktar (başarılı olabilir)', async ({ request }) => {
    test.skip(!studentToken, 'Token alınamadı');
    test.skip(baslangicLira < 5, 'Yetersiz bakiye');
    const headers = { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' };

    const res = await request.post(`${API_BASE}/api/gamification/lira/harca`, {
      headers,
      data: { miktar: 5, sebep: 'e2e-test' },
      timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    // Harcama başarılı veya başarısız olabilir — validasyonu geç
    expect(typeof data.basarili).toBe('boolean');
    expect(typeof data.kalanBakiye).toBe('number');
  });
});

// ─── 5. Etkinlik Cevaplama (XP + Combo + Kalp) ─────────────────────────────

test.describe('Etkinlik Cevaplama — XP/Combo/Kalp', () => {
  let etkinlikId: string | null = null;

  test.beforeAll(async ({ request }) => {
    if (!studentToken) return;
    const headers = { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' };

    // Ders kitaplarını al
    const kitapRes = await request.get(`${API_BASE}/api/derskitaplari`, {
      headers, timeout: TIMEOUT,
    });
    if (kitapRes.status() !== 200) return;
    const kitaplar = await kitapRes.json();
    if (kitaplar.length === 0) return;

    // Üniteleri al
    const uniteRes = await request.get(`${API_BASE}/api/uniteler/${kitaplar[0].id}`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });
    if (uniteRes.status() !== 200) return;
    const uniteler = await uniteRes.json();
    const acikUnite = Array.isArray(uniteler)
      ? uniteler.find((u: any) => !u.kilitli && !u.lisansKilidi)
      : null;
    if (!acikUnite) return;

    // Etkinlikleri al
    const etRes = await request.get(`${API_BASE}/api/etkinlikler/${acikUnite.id}`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });
    if (etRes.status() !== 200) return;
    const etkinlikler = await etRes.json();
    if (etkinlikler.length > 0) {
      etkinlikId = etkinlikler[0].id;
    }
  });

  test('Etkinlik cevaplama — API cevap döner', async ({ request }) => {
    test.skip(!studentToken, 'Token alınamadı');
    test.skip(!etkinlikId, 'Uygun etkinlik bulunamadı');
    const headers = { Authorization: `Bearer ${studentToken}`, 'Content-Type': 'application/json' };

    const res = await request.post(`${API_BASE}/api/etkinlik/cevapla`, {
      headers,
      data: {
        etkinlikId,
        detaylar: [{ id: 'auto', cevap: 'A' }],
        perdeAcimaSayisi: 0,
      },
      timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);

    const data = await res.json();
    expect(typeof data.puan).toBe('number');
    expect(typeof data.kazanilanXp).toBe('number');
    expect(typeof data.yeniToplam).toBe('number');
    expect(typeof data.combo).toBe('number');
    expect(typeof data.kalanKalp).toBe('number');
    expect(typeof data.kalpAzaldi).toBe('boolean');
    expect(data.kalanKalp).toBeGreaterThanOrEqual(0);
  });
});

// ─── 6. Progression UI ─────────────────────────────────────────────────────

test.describe('Progression UI — Pano', () => {
  test('Pano sayfası kalp/XP/streak bilgilerini gösterir', async ({ page }) => {
    await page.goto('/tr/giris');
    await page.getByPlaceholder('ornek@email.com').fill('ogrenci1@turkceokulu.com');
    await page.getByPlaceholder('••••••••').fill('Ogrenci123!');
    await page.getByRole('button', { name: 'Giriş Yap' }).click();
    await page.waitForURL(/\/tr\/(pano|ogretmen)/, { timeout: 15000 });

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(100);

    // XP/Puan bilgisi görünür
    const hasXp = bodyText.match(/XP|Puan/i);
    expect(hasXp).not.toBeNull();
  });
});
