/**
 * Sınıf Katılım (QR / Kod) E2E API Testleri
 * Pre-condition: API localhost:5000'de çalışmalı
 * Test kullanıcıları DB'de olmalı:
 *   - ogretmen@test.com / Test123! (Ogretmen rolü)
 *   - ogrenci@test.com  / Test123! (Ogrenci rolü)
 */

import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = 'http://localhost:5000';

async function getToken(request: APIRequestContext, email: string, password = 'Test123!'): Promise<string | null> {
  try {
    const res = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email, password },
      headers: { 'Content-Type': 'application/json' },
      failOnStatusCode: false,
    });
    if (res.status() === 200) {
      const body = await res.json();
      return body?.accessToken ?? body?.token ?? null;
    }
    return null;
  } catch {
    return null; // API erişilemez
  }
}

test.describe('Sınıf Katılım — /api/sinif/katil', () => {
  let ogretmenToken: string | null = null;
  let ogrenciToken: string | null = null;
  let sinifId: number | null = null;
  let katilimKodu: string | null = null;

  test.beforeAll(async ({ request }) => {
    ogretmenToken = await getToken(request, 'ogretmen@test.com');
    ogrenciToken = await getToken(request, 'ogrenci@test.com');

    if (!ogretmenToken) return;

    // Test sınıfı oluştur ve katılım kodunu al
    try {
      const res = await request.post(`${API_BASE}/api/ogretmen/sinif`, {
        data: { name: 'Katılım Test Sınıfı', dersKitabiId: null },
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${ogretmenToken}`,
        },
        failOnStatusCode: false,
      });
      if (res.status() === 200 || res.status() === 201) {
        const body = await res.json();
        sinifId = body.id;
        katilimKodu = body.katilimKodu;
      }
    } catch {
      // API erişilemez — testler skip edilir
    }
  });

  test.afterAll(async ({ request }) => {
    if (!ogretmenToken || !sinifId) return;
    // Test sınıfını temizle
    await request.delete(`${API_BASE}/api/ogretmen/sinif/${sinifId}`, {
      headers: { Authorization: `Bearer ${ogretmenToken}` },
      failOnStatusCode: false,
    });
  });

  test('Geçerli kod ile öğrenci sınıfa katılır', async ({ request }) => {
    if (!ogrenciToken) {
      test.skip(true, 'API erişilemez veya ogrenci@test.com DB\'de yok — test atlandı');
      return;
    }
    if (!katilimKodu) {
      test.skip(true, 'katilimKodu alınamadı — sınıf oluşturma başarısız olmuş olabilir');
      return;
    }

    const res = await request.post(`${API_BASE}/api/sinif/katil?kod=${katilimKodu}`, {
      headers: { Authorization: `Bearer ${ogrenciToken}` },
      failOnStatusCode: false,
    });

    expect([200, 201]).toContain(res.status());
    const body = await res.json();
    expect(body.mesaj).toBeDefined();
    expect(body.id).toBe(sinifId);
  });

  test('Aynı kodu ikinci kez kullanamazsın (zaten kayıtlı)', async ({ request }) => {
    if (!ogrenciToken || !katilimKodu) {
      test.skip(true, 'Ön koşul sağlanamadı — test atlandı');
      return;
    }

    const res = await request.post(`${API_BASE}/api/sinif/katil?kod=${katilimKodu}`, {
      headers: { Authorization: `Bearer ${ogrenciToken}` },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(400);
    const body = await res.json();
    const mesaj: string = body.mesaj ?? body ?? '';
    expect(mesaj.toLowerCase()).toMatch(/zaten|kayıtlı|mevcut/);
  });

  test('Geçersiz kod 400 veya 404 döner', async ({ request }) => {
    if (!ogrenciToken) {
      test.skip(true, 'API erişilemez veya ogrenci@test.com DB\'de yok — test atlandı');
      return;
    }

    const res = await request.post(`${API_BASE}/api/sinif/katil?kod=GECERSIZ`, {
      headers: { Authorization: `Bearer ${ogrenciToken}` },
      failOnStatusCode: false,
    });

    expect([400, 404]).toContain(res.status());
  });

  test('Token olmadan katılım engellenir (401)', async ({ request }) => {
    if (!katilimKodu) {
      test.skip(true, 'katilimKodu alınamadı — test atlandı');
      return;
    }

    const res = await request.post(`${API_BASE}/api/sinif/katil?kod=${katilimKodu}`, {
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(401);
  });

  test('Küçük harf kod büyük harfe normalize edilir', async ({ request }) => {
    if (!ogrenciToken || !katilimKodu) {
      test.skip(true, 'Ön koşul sağlanamadı — test atlandı');
      return;
    }

    // Zaten katılmış olduğu için 400 bekliyoruz — ama 404 değil (kod tanınıyor)
    const res = await request.post(`${API_BASE}/api/sinif/katil?kod=${katilimKodu.toLowerCase()}`, {
      headers: { Authorization: `Bearer ${ogrenciToken}` },
      failOnStatusCode: false,
    });

    // Kod tanınmalı: ya "zaten kayıtlı" (400) ya da başka bir kullanıcı için 200
    expect(res.status()).not.toBe(404);
  });
});
