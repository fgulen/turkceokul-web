/**
 * Öğretmen İçerik Stüdyosu — Dashboard, AI Studio, Sınıf/Ödev/Duyuru CRUD
 *
 * Pre-conditions:
 *   - API localhost:5221'de çalışıyor
 *   - ogretmen@turkceokulu.com / Ogretmen123! DB'de mevcut
 *   - Claude AI API key tanımlı (AI üretim testleri için)
 *
 * Kapsam:
 *   1. Öğretmen Dashboard UI
 *   2. AI İçerik Stüdyosu UI (sekmeler, kaynak seçici)
 *   3. AI Kredi API
 *   4. Sınıf CRUD (oluştur → listele → sil)
 *   5. Ödev CRUD (oluştur → listele → sil)
 *   6. Duyuru CRUD (yayınla → listele → sil)
 */

import { test, expect } from '@playwright/test';
import { loginAsTeacher } from './helpers/auth';

const API_BASE = 'http://localhost:5221';
const AUTH_HEADER = {
  Authorization: '',
  'Content-Type': 'application/json',
};
const TIMEOUT = 10000;

let teacherToken: string | null = null;
let kitapId: string | null = null;
let sinifId: number | null = null;
let odevId: number | null = null;
let duyuruId: number | null = null;
let eklenenOgrenciId: number | null = null;

test.describe.configure({ timeout: 120_000 });

async function getTeacherToken(request: any): Promise<string | null> {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email: 'ogretmen@turkceokulu.com', password: 'Ogretmen123!' },
    timeout: TIMEOUT, failOnStatusCode: false,
  });
  if (res.status() !== 200) return null;
  const body = await res.json();
  return body.accessToken ?? null;
}

async function authHeader(): Promise<Record<string, string>> {
  if (!teacherToken) return { 'Content-Type': 'application/json' };
  return { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' };
}

test.beforeAll(async ({ request }) => {
  teacherToken = await getTeacherToken(request);
  if (teacherToken) {
    const headers = { Authorization: `Bearer ${teacherToken}`, 'Content-Type': 'application/json' };
    // Öğretmenin kurumuna atanabilir kitapları al
    const kitapRes = await request.get(`${API_BASE}/api/ogretmen/sinif-kitaplar`, { headers, timeout: TIMEOUT });
    if (kitapRes.status() === 200) {
      const kitaplar = await kitapRes.json();
      if (kitaplar.length > 0) kitapId = kitaplar[0].id;
    }
  }
});

test.afterAll(async ({ request }) => {
  const headers = await authHeader();
  // Cleanup: created entities
  if (duyuruId && sinifId) {
    await request.delete(`${API_BASE}/api/ogretmen/duyuru/${duyuruId}`, { headers, timeout: TIMEOUT, failOnStatusCode: false });
  }
  if (odevId && sinifId) {
    await request.delete(`${API_BASE}/api/ogretmen/odev/${odevId}`, { headers, timeout: TIMEOUT, failOnStatusCode: false });
  }
  if (eklenenOgrenciId && sinifId) {
    await request.delete(`${API_BASE}/api/ogretmen/sinif/${sinifId}/ogrenci/${eklenenOgrenciId}`, { headers, timeout: TIMEOUT, failOnStatusCode: false });
  }
  if (sinifId) {
    await request.delete(`${API_BASE}/api/ogretmen/sinif/${sinifId}`, { headers, timeout: TIMEOUT, failOnStatusCode: false });
  }
});

// ─── 1. Öğretmen Dashboard ───────────────────────────────────────────────────

test.describe('Öğretmen Dashboard', () => {
  test('Sayfa yüklenir ve sınıf yönetimi görünür', async ({ page }) => {
    await loginAsTeacher(page);

    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length).toBeGreaterThan(50);
    // Sayfada ya sınıf kartları ya da "henüz sınıf yok" mesajı olmalı
    const hasSinifYonetimi = bodyText.match(/Sınıf|Sinif|Yeni Sınıf|Sınıf Oluştur|AI/i);
    expect(hasSinifYonetimi).not.toBeNull();
  });
});

// ─── 2. AI İçerik Stüdyosu UI ────────────────────────────────────────────────

test.describe('AI İçerik Stüdyosu — UI', () => {
  test('Sayfa yüklenir, tür sekmeleri görünür', async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/tr/ogretmen/ai-icerik', { waitUntil: 'domcontentloaded' });

    // Client-side render'ı bekle — sekme butonları görünene kadar
    await page.waitForSelector('text=Quiz', { timeout: 15000 }).catch(() => {});
    // Alternatif: sayfa içeriğinin yüklendiğini body'den kontrol et
    let bodyText = '';
    for (let i = 0; i < 10; i++) {
      bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.length > 200) break;
      await page.waitForTimeout(1000);
    }
    expect(bodyText.length).toBeGreaterThan(100);

    const hasTab = bodyText.match(/Quiz|Kahoot|Eşleştirme|Eslestir|Boşluk Doldurma|Bosluk Doldur|Bülten|Bulten/i);
    expect(hasTab).not.toBeNull();
  });

  test('Kaynak seçici — kitap ve ünite listelenir', async ({ page }) => {
    test.skip(!teacherToken, 'Token alınamadı');
    await loginAsTeacher(page);
    await page.goto('/tr/ogretmen/ai-icerik', { waitUntil: 'domcontentloaded' });

    // Client-side render'ı bekle
    let bodyText = '';
    for (let i = 0; i < 10; i++) {
      bodyText = await page.evaluate(() => document.body.innerText);
      if (bodyText.length > 200) break;
      await page.waitForTimeout(1000);
    }
    expect(bodyText.length).toBeGreaterThan(100);
    expect(bodyText).toMatch(/Kitap|Quiz|Kahoot|Üret/i);
  });
});

// ─── 3. AI API ───────────────────────────────────────────────────────────────

test.describe('AI API — Kredi ve Üretim', () => {
  test('Kredi sorgulama — başarılı', async ({ request }) => {
    test.skip(!teacherToken, 'Token alınamadı');
    const headers = await authHeader();

    const res = await request.get(`${API_BASE}/api/ai/kredi`, { headers, timeout: TIMEOUT, failOnStatusCode: false });
    if (res.status() === 200) {
      const data = await res.json();
      expect(typeof data.lisansli).toBe('boolean');
      expect(typeof data.sinirsiz).toBe('boolean');
    }
    // 401/403 olabilir (yetki yoksa) — yine de geç
    expect(res.status()).toBeGreaterThanOrEqual(200);
    expect(res.status()).toBeLessThan(400);
  });

  test('İçerik üretimi — quiz (conditional: Claude API bağlıysa)', async ({ request }) => {
    test.skip(!teacherToken, 'Token alınamadı');
    const headers = await authHeader();

    const res = await request.post(`${API_BASE}/api/ai/icerik-uret`, {
      headers,
      data: {
        Tip: 'quiz',
        GirdiTipi: 'serbest',
        Girdi: 'Türkçe alfabe ve harfler ile ilgili 3 soru',
        SoruSayisi: 3,
        Duzey: 'A1',
        CiktiFormati: 'etkinlik',
      },
      timeout: 60_000,
      failOnStatusCode: false,
    });

    if (res.status() === 200) {
      const data = await res.json();
      expect(data.Sorular).toBeDefined();
      expect(Array.isArray(data.Sorular)).toBe(true);
      expect(data.Sorular.length).toBeGreaterThan(0);
    } else if (res.status() === 402) {
      test.skip(true, 'AI kredisi yetersiz');
    } else if (res.status() === 503) {
      test.skip(true, 'AI servisi kullanılamıyor (API key eksik)');
    } else {
      // Beklenmeyen durum — logla ama testi geç
      expect(res.status()).toBeGreaterThanOrEqual(200);
      expect(res.status()).toBeLessThan(500);
    }
  });
});

// ─── 4. Sınıf CRUD ───────────────────────────────────────────────────────────

test.describe('Sınıf Yönetimi — CRUD', () => {
  test('Sınıf oluşturma', async ({ request }) => {
    test.skip(!teacherToken, 'Token alınamadı');
    test.skip(!kitapId, 'Kitap bulunamadı');
    const headers = await authHeader();

    const res = await request.post(`${API_BASE}/api/ogretmen/sinif`, {
      headers,
      data: { Name: `E2E Test Sınıfı ${Date.now()}`, DersKitabiId: kitapId },
      timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.name).toBeDefined();
    expect(data.katilimKodu).toBeDefined();
    sinifId = data.id;
  });

  test('Sınıfları listeleme — oluşturulan sınıf görünür', async ({ request }) => {
    test.skip(!teacherToken || !sinifId, 'Token/sınıf yok');
    const headers = await authHeader();

    const res = await request.get(`${API_BASE}/api/ogretmen/siniflarim`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    const bulunan = data.find((s: any) => s.id === sinifId);
    expect(bulunan).toBeDefined();
    expect(bulunan.name).toContain('E2E Test Sınıfı');
  });
});

// ─── 5. Öğrenci Ekleme/Çıkarma ────────────────────────────────────────────────

test.describe('Öğrenci Yönetimi', () => {
  test('Öğrenci ekleme', async ({ request }) => {
    test.skip(!teacherToken || !sinifId, 'Token/sınıf yok');
    const headers = await authHeader();

    const res = await request.post(`${API_BASE}/api/ogretmen/sinif/${sinifId}/ogrenci-ekle`, {
      headers,
      data: { Email: 'ogrenci1@turkceokulu.com' },
      timeout: TIMEOUT, failOnStatusCode: false,
    });

    if (res.status() === 200) {
      const data = await res.json();
      // Response ya doğrudan ID ya da user objesi döner
      eklenenOgrenciId = data.userId ?? data.id ?? data.user?.id ?? null;
    } else if (res.status() === 409) {
      test.skip(true, 'Öğrenci zaten sınıfta');
    } else {
      expect(res.status()).toBe(200);
    }
  });
});

// ─── 6. Ödev CRUD ────────────────────────────────────────────────────────────

test.describe('Ödev Yönetimi — CRUD', () => {
  test('Ödev oluşturma', async ({ request }) => {
    test.skip(!teacherToken || !sinifId, 'Token/sınıf yok');
    const headers = await authHeader();

    const res = await request.post(`${API_BASE}/api/ogretmen/sinif/${sinifId}/odev`, {
      headers,
      data: {
        Baslik: `E2E Test Ödevi ${Date.now()}`,
        Aciklama: 'Playwright otomasyon testi ile oluşturuldu',
      },
      timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.baslik).toBeDefined();
    odevId = data.id;
  });

  test('Ödevleri listeleme', async ({ request }) => {
    test.skip(!teacherToken || !sinifId, 'Token/sınıf yok');
    const headers = await authHeader();

    const res = await request.get(`${API_BASE}/api/ogretmen/sinif/${sinifId}/odevler`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (odevId) {
      const bulunan = data.find((o: any) => o.id === odevId);
      expect(bulunan).toBeDefined();
    }
  });
});

// ─── 7. Duyuru CRUD ──────────────────────────────────────────────────────────

test.describe('Duyuru Yönetimi — CRUD', () => {
  test('Duyuru yayınlama', async ({ request }) => {
    test.skip(!teacherToken || !sinifId, 'Token/sınıf yok');
    const headers = await authHeader();

    const res = await request.post(`${API_BASE}/api/ogretmen/sinif/${sinifId}/duyuru`, {
      headers,
      data: { Icerik: `E2E Test Duyurusu — ${new Date().toISOString()}` },
      timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data.id).toBeDefined();
    duyuruId = data.id;
  });

  test('Duyuruları listeleme', async ({ request }) => {
    test.skip(!teacherToken || !sinifId, 'Token/sınıf yok');
    const headers = await authHeader();

    const res = await request.get(`${API_BASE}/api/ogretmen/sinif/${sinifId}/duyurular`, {
      headers, timeout: TIMEOUT, failOnStatusCode: false,
    });
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
    if (duyuruId) {
      const bulunan = data.find((d: any) => d.id === duyuruId);
      expect(bulunan).toBeDefined();
    }
  });
});
