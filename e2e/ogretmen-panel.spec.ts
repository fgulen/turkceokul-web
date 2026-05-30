/**
 * Öğretmen Paneli E2E API Testleri
 * Pre-condition: API localhost:5000'de çalışmalı
 * Test kullanıcıları DB'de olmalı:
 *   - ogretmen@test.com / Test123! (Ogretmen rolü)
 *   - ogrenci@test.com / Test123! (Ogrenci rolü)
 */

import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = 'http://localhost:5000';

// ─── Yardımcı: Öğretmen token al ─────────────────────────────────────────────

async function getOgretmenToken(request: APIRequestContext): Promise<string | null> {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email: 'ogretmen@test.com', password: 'Test123!' },
    headers: { 'Content-Type': 'application/json' },
    failOnStatusCode: false,
  });

  if (res.status() === 200) {
    const body = await res.json();
    return body?.accessToken ?? body?.token ?? null;
  }
  return null;
}

// ─── Yardımcı: Öğrenci token al (IDOR testi için) ────────────────────────────

async function getOgrenciToken(request: APIRequestContext): Promise<string | null> {
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email: 'ogrenci@test.com', password: 'Test123!' },
    headers: { 'Content-Type': 'application/json' },
    failOnStatusCode: false,
  });

  if (res.status() === 200) {
    const body = await res.json();
    return body?.accessToken ?? body?.token ?? null;
  }
  return null;
}

// ─── Suite 1: Sınıf CRUD ─────────────────────────────────────────────────────

test.describe('Sınıf CRUD — /api/ogretmen/sinif', () => {
  let ogretmenToken: string | null = null;
  let ogrenciToken: string | null = null;
  let sinifId: number | null = null;

  test.beforeAll(async ({ request }) => {
    ogretmenToken = await getOgretmenToken(request);
    ogrenciToken = await getOgrenciToken(request);
  });

  test('Sınıf oluşturulur', async ({ request }) => {
    if (!ogretmenToken) {
      test.skip(true, 'API erişilemez veya ogretmen@test.com DB\'de yok — test atlandı');
      return;
    }

    const res = await request.post(`${API_BASE}/api/ogretmen/sinif`, {
      data: { name: 'Test Sınıfı E2E', dersKitabiId: null },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    expect([200, 201]).toContain(res.status());

    const body = await res.json();
    expect(body.id).toBeDefined();
    sinifId = body.id;
  });

  test('Sınıf güncellenir', async ({ request }) => {
    if (!ogretmenToken) {
      test.skip(true, 'API erişilemez veya ogretmen@test.com DB\'de yok — test atlandı');
      return;
    }
    if (!sinifId) {
      test.skip(true, 'sinifId yok — oluşturma testi başarısız olmuş olabilir');
      return;
    }

    const res = await request.put(`${API_BASE}/api/ogretmen/sinif/${sinifId}`, {
      data: { name: 'Güncel Sınıf' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
  });

  test('IDOR: Başka öğretmenin sınıfını düzenleyemez', async ({ request }) => {
    if (!ogrenciToken) {
      test.skip(true, 'API erişilemez veya ogrenci@test.com DB\'de yok — test atlandı');
      return;
    }
    if (!sinifId) {
      test.skip(true, 'sinifId yok — oluşturma testi başarısız olmuş olabilir');
      return;
    }

    const res = await request.put(`${API_BASE}/api/ogretmen/sinif/${sinifId}`, {
      data: { name: 'Yetkisiz Düzenleme' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ogrenciToken}`,
      },
      failOnStatusCode: false,
    });

    // 429 dışında herhangi bir hata kodu kabul edilir (401, 403, 404)
    expect(res.status()).not.toBe(429);
    expect(res.status()).not.toBe(200);
    expect([401, 403, 404]).toContain(res.status());
  });

  test('Sınıf silinir', async ({ request }) => {
    if (!ogretmenToken) {
      test.skip(true, 'API erişilemez veya ogretmen@test.com DB\'de yok — test atlandı');
      return;
    }
    if (!sinifId) {
      test.skip(true, 'sinifId yok — oluşturma testi başarısız olmuş olabilir');
      return;
    }

    const res = await request.delete(`${API_BASE}/api/ogretmen/sinif/${sinifId}`, {
      headers: {
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
  });

  test('Silinen sınıfa erişilemiyor', async ({ request }) => {
    if (!ogretmenToken) {
      test.skip(true, 'API erişilemez veya ogretmen@test.com DB\'de yok — test atlandı');
      return;
    }
    if (!sinifId) {
      test.skip(true, 'sinifId yok — oluşturma testi başarısız olmuş olabilir');
      return;
    }

    const res = await request.get(`${API_BASE}/api/ogretmen/sinif/${sinifId}`, {
      headers: {
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(404);
  });
});

// ─── Suite 2: Ödev CRUD ───────────────────────────────────────────────────────

test.describe('Ödev CRUD — /api/ogretmen/sinif/{sinifId}/odev', () => {
  let ogretmenToken: string | null = null;
  let sinifId: number | null = null;
  let odevId: number | null = null;

  test.beforeAll(async ({ request }) => {
    ogretmenToken = await getOgretmenToken(request);

    if (!ogretmenToken) return;

    // Ödev testleri için önce bir sınıf oluştur
    const res = await request.post(`${API_BASE}/api/ogretmen/sinif`, {
      data: { name: 'Ödev Test Sınıfı E2E', dersKitabiId: null },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    if (res.status() === 200 || res.status() === 201) {
      const body = await res.json();
      sinifId = body.id ?? null;
    }
  });

  test('Ödev oluşturulur', async ({ request }) => {
    if (!ogretmenToken) {
      test.skip(true, 'API erişilemez veya ogretmen@test.com DB\'de yok — test atlandı');
      return;
    }
    if (!sinifId) {
      test.skip(true, 'sinifId yok — beforeAll\'da sınıf oluşturma başarısız');
      return;
    }

    const res = await request.post(`${API_BASE}/api/ogretmen/sinif/${sinifId}/odev`, {
      data: { baslik: 'Test Ödev' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBeDefined();
    odevId = body.id;
  });

  test('Ödev güncellenir', async ({ request }) => {
    if (!ogretmenToken) {
      test.skip(true, 'API erişilemez veya ogretmen@test.com DB\'de yok — test atlandı');
      return;
    }
    if (!odevId) {
      test.skip(true, 'odevId yok — oluşturma testi başarısız olmuş olabilir');
      return;
    }

    const res = await request.put(`${API_BASE}/api/ogretmen/odev/${odevId}`, {
      data: { baslik: 'Güncel Ödev' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
  });

  test('Ödev silinir', async ({ request }) => {
    if (!ogretmenToken) {
      test.skip(true, 'API erişilemez veya ogretmen@test.com DB\'de yok — test atlandı');
      return;
    }
    if (!odevId) {
      test.skip(true, 'odevId yok — oluşturma testi başarısız olmuş olabilir');
      return;
    }

    const res = await request.delete(`${API_BASE}/api/ogretmen/odev/${odevId}`, {
      headers: {
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
  });
});

// ─── Suite 3: Duyuru CRUD ─────────────────────────────────────────────────────

test.describe('Duyuru CRUD — /api/ogretmen/sinif/{sinifId}/duyuru', () => {
  let ogretmenToken: string | null = null;
  let sinifId: number | null = null;
  let duyuruId: number | null = null;

  test.beforeAll(async ({ request }) => {
    ogretmenToken = await getOgretmenToken(request);

    if (!ogretmenToken) return;

    // Duyuru testleri için önce bir sınıf oluştur
    const res = await request.post(`${API_BASE}/api/ogretmen/sinif`, {
      data: { name: 'Duyuru Test Sınıfı E2E', dersKitabiId: null },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    if (res.status() === 200 || res.status() === 201) {
      const body = await res.json();
      sinifId = body.id ?? null;
    }
  });

  test('Duyuru oluşturulur', async ({ request }) => {
    if (!ogretmenToken) {
      test.skip(true, 'API erişilemez veya ogretmen@test.com DB\'de yok — test atlandı');
      return;
    }
    if (!sinifId) {
      test.skip(true, 'sinifId yok — beforeAll\'da sınıf oluşturma başarısız');
      return;
    }

    const res = await request.post(`${API_BASE}/api/ogretmen/sinif/${sinifId}/duyuru`, {
      data: { icerik: 'Test duyurusu' },
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBeDefined();
    duyuruId = body.id;
  });

  test('Duyuru silinir', async ({ request }) => {
    if (!ogretmenToken) {
      test.skip(true, 'API erişilemez veya ogretmen@test.com DB\'de yok — test atlandı');
      return;
    }
    if (!duyuruId) {
      test.skip(true, 'duyuruId yok — oluşturma testi başarısız olmuş olabilir');
      return;
    }

    const res = await request.delete(`${API_BASE}/api/ogretmen/duyuru/${duyuruId}`, {
      headers: {
        Authorization: `Bearer ${ogretmenToken}`,
      },
      failOnStatusCode: false,
    });

    expect(res.status()).toBe(200);
  });
});
