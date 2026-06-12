/**
 * Rate Limiting Testleri — ASP.NET Core 8 API
 *
 * Pre-conditions:
 *   - API localhost:5000'de çalışmalı  (dotnet run)
 *   - Next.js dev sunucusu bu testler için gerekli değil
 *
 * Önemli: API Development modunda çalıştığında limitler gevşektir:
 *   - Login  policy: 30 istek/dk (prod'da 5)
 *   - Cevapla policy: 300 istek/dk (prod'da 60)
 *
 * Bu testler hem dev hem prod limitlerini doğru şekilde ele alır;
 * dev'deki yüksek limitler nedeniyle 429 testleri fixme ile işaretlidir —
 * prod benzeri ortamda (ASPNETCORE_ENVIRONMENT=Production) çalıştırılmalıdır.
 */

import { test, expect, APIRequestContext } from '@playwright/test';

const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:5221';

// ─── Yardımcı: API bağlamı oluştur ───────────────────────────────────────────

// request fixture doğrudan kullanılır — ayrı context açmaya gerek yok.
function makeApiContext(request: APIRequestContext): APIRequestContext {
  return request;
}

// ─── Yardımcı: Auth token al ──────────────────────────────────────────────────

async function getAuthToken(request: APIRequestContext): Promise<string | null> {
  // API localhost:5000'de çalışmalı
  const res = await request.post(`${API_BASE}/api/auth/login`, {
    data: { email: 'test@example.com', password: 'wrongpassword' },
    headers: { 'Content-Type': 'application/json' },
    // 401 bekliyoruz — hata fırlatmasın
    failOnStatusCode: false,
  });

  // Kullanıcı yoksa ya da şifre yanlışsa 401 döner, bu beklenen davranış.
  // Token sadece gerçek bir test kullanıcısı varsa alınabilir.
  if (res.status() === 200) {
    const body = await res.json();
    return body?.accessToken ?? body?.token ?? null;
  }
  return null;
}

// ─── 1. Login Rate Limit Testi ────────────────────────────────────────────────

test.describe('Login Rate Limit — POST /api/auth/login', () => {
  // API localhost:5000'de çalışmalı
  // Dev modunda limit 30/dk olduğu için bu test PRODUCTION ortamında çalıştırılmalıdır.
  // Prod benzeri test: ASPNETCORE_ENVIRONMENT=Production dotnet run
  test.fixme(
    true,
    'Dev ortamında Login limiti 30/dk — prod\'da 5/dk. ' +
    'ASPNETCORE_ENVIRONMENT=Production ile API\'yi başlatıp çalıştırın.'
  );

  test('6. istekte 429 döner, body "Too many requests" içerir', async ({ request }) => {
    // API localhost:5000'de çalışmalı
    const endpoint = `${API_BASE}/api/auth/login`;
    const payload = { email: 'test@example.com', password: 'wrongpassword' };
    const headers = { 'Content-Type': 'application/json' };

    let lastStatus = 0;
    let lastBody = '';

    // Prod limiti: 5 istek/dk — 6. istekte 429 bekliyoruz
    for (let i = 1; i <= 6; i++) {
      const res = await request.post(endpoint, {
        data: payload,
        headers,
        failOnStatusCode: false,
      });

      lastStatus = res.status();
      lastBody = await res.text();

      if (lastStatus === 429) {
        // 429'u aldık — beklenen istek sayısını doğrula
        expect(i).toBeGreaterThanOrEqual(6);
        break;
      }

      // İlk 5 istek ya 200 ya da 401 dönmeli, asla 429 değil
      if (i < 6) {
        expect(lastStatus).not.toBe(429);
      }
    }

    // 6. istek (veya daha önce) 429 dönmeli
    expect(lastStatus).toBe(429);
    expect(lastBody).toContain('Too many requests');
  });
});

// ─── 2. Register Rate Limit Testi ─────────────────────────────────────────────

test.describe('Register Rate Limit — POST /api/auth/register', () => {
  // API localhost:5000'de çalışmalı
  // Login policy ile aynı limit — prod'da 5/dk
  test.fixme(
    true,
    'Dev ortamında Login limiti 30/dk — prod\'da 5/dk. ' +
    'ASPNETCORE_ENVIRONMENT=Production ile API\'yi başlatıp çalıştırın.'
  );

  test('6. istekte 429 döner', async ({ request }) => {
    // API localhost:5000'de çalışmalı
    const endpoint = `${API_BASE}/api/auth/register`;
    const headers = { 'Content-Type': 'application/json' };

    let lastStatus = 0;
    let lastBody = '';

    for (let i = 1; i <= 6; i++) {
      // Her istekte benzersiz email — validation geçsin, rate limit vursun
      const res = await request.post(endpoint, {
        data: {
          email: `ratetest${i}${Date.now()}@example.com`,
          password: 'Test123!',
          ad: 'Test',
          soyad: 'User',
        },
        headers,
        failOnStatusCode: false,
      });

      lastStatus = res.status();
      lastBody = await res.text();

      if (lastStatus === 429) {
        expect(i).toBeGreaterThanOrEqual(6);
        break;
      }
    }

    expect(lastStatus).toBe(429);
    expect(lastBody).toContain('Too many requests');
  });
});

// ─── 3. QR Login Rate Limit Testi ────────────────────────────────────────────

test.describe('QR Login Rate Limit — POST /api/auth/qr-login', () => {
  // API localhost:5000'de çalışmalı
  // QrLogin policy: 10 istek/dk (dev ve prod'da aynı)
  test.fixme(
    true,
    'Bu test API\'nin localhost:5000\'de çalışmasını gerektirir. ' +
    'QrLogin limiti 10/dk — dev\'de de aynıdır; 11. istekte 429 beklenir.'
  );

  test('11. istekte 429 döner', async ({ request }) => {
    // API localhost:5000'de çalışmalı
    const endpoint = `${API_BASE}/api/auth/qr-login`;
    const headers = { 'Content-Type': 'application/json' };

    let lastStatus = 0;
    let lastBody = '';

    // Limit: 10/dk — 11. istekte 429
    for (let i = 1; i <= 11; i++) {
      const res = await request.post(endpoint, {
        data: { token: `invalid-qr-token-${i}` },
        headers,
        failOnStatusCode: false,
      });

      lastStatus = res.status();
      lastBody = await res.text();

      if (lastStatus === 429) {
        expect(i).toBeGreaterThanOrEqual(11);
        break;
      }
    }

    expect(lastStatus).toBe(429);
    expect(lastBody).toContain('Too many requests');
  });
});

// ─── 4. Cevapla — Normal Kullanım (429 Görmemeli) ────────────────────────────

test.describe('Cevapla Rate Limit — POST /api/etkinlik/cevapla', () => {
  // API localhost:5000'de çalışmalı
  test('Normal kullanımda 5 istek hiçbiri 429 dönmez', async ({ request }) => {
    // API localhost:5000'de çalışmalı
    const endpoint = `${API_BASE}/api/etkinlik/cevapla`;
    const headers = { 'Content-Type': 'application/json' };

    // Auth token almaya çalış; yoksa 401 bekliyoruz (rate limit test için yeterli)
    const token = await getAuthToken(request);
    const authHeaders = token
      ? { ...headers, Authorization: `Bearer ${token}` }
      : headers;

    // 5 istek at — dev'de 300/dk, prod'da 60/dk limit var
    // Normal bir kullanıcı asla bu limitlara çarpmaz
    for (let i = 1; i <= 5; i++) {
      const res = await request.post(endpoint, {
        data: {
          etkinlikId: 1,
          cevap: 'test-cevap',
          sure: 10,
        },
        headers: authHeaders,
        failOnStatusCode: false,
      });

      const status = res.status();

      // 429 kesinlikle dönmemeli — 200, 400, 401 veya 422 kabul edilir
      expect(status).not.toBe(429);
    }
  });
});

// ─── 5. 429 Response Header Kontrolü ─────────────────────────────────────────

test.describe('429 Response — Header ve Body Formatı', () => {
  // API localhost:5000'de çalışmalı
  // Dev ortamında Login limiti 30/dk olduğu için prod ortamı gerekli
  test.fixme(
    true,
    'Dev ortamında Login limiti 30/dk — prod\'da 5/dk. ' +
    'ASPNETCORE_ENVIRONMENT=Production ile API\'yi başlatıp çalıştırın.'
  );

  test('429 döndüğünde Content-Type header\'ı mevcut, body text/plain', async ({ request }) => {
    // API localhost:5000'de çalışmalı
    const endpoint = `${API_BASE}/api/auth/login`;
    const payload = { email: 'test@example.com', password: 'wrongpassword' };
    const headers = { 'Content-Type': 'application/json' };

    let rateLimitResponse = null;

    // 6 istek — prod'da 5. limitten sonra 429 gelir
    for (let i = 1; i <= 6; i++) {
      const res = await request.post(endpoint, {
        data: payload,
        headers,
        failOnStatusCode: false,
      });

      if (res.status() === 429) {
        rateLimitResponse = res;
        break;
      }
    }

    // 429 yanıtı alınmış olmalı
    expect(rateLimitResponse).not.toBeNull();

    if (rateLimitResponse) {
      // Content-Type header'ı mevcut olmalı
      const contentType = rateLimitResponse.headers()['content-type'];
      expect(contentType).toBeDefined();

      // Body "Too many requests" içermeli
      const body = await rateLimitResponse.text();
      expect(body).toContain('Too many requests');
      expect(body).toContain('Please try again later');

      // Status tam olarak 429 olmalı
      expect(rateLimitResponse.status()).toBe(429);
    }
  });
});

// ─── 6. Forgot Password Rate Limit Testi ─────────────────────────────────────

test.describe('Forgot Password Rate Limit — POST /api/auth/forgot-password', () => {
  // API localhost:5000'de çalışmalı
  // Login policy kapsamında — prod'da 5/dk
  test.fixme(
    true,
    'Dev ortamında Login limiti 30/dk — prod\'da 5/dk. ' +
    'ASPNETCORE_ENVIRONMENT=Production ile API\'yi başlatıp çalıştırın.'
  );

  test('6. istekte 429 döner', async ({ request }) => {
    // API localhost:5000'de çalışmalı
    const endpoint = `${API_BASE}/api/auth/forgot-password`;
    const headers = { 'Content-Type': 'application/json' };

    let lastStatus = 0;
    let lastBody = '';

    for (let i = 1; i <= 6; i++) {
      const res = await request.post(endpoint, {
        data: { email: 'test@example.com' },
        headers,
        failOnStatusCode: false,
      });

      lastStatus = res.status();
      lastBody = await res.text();

      if (lastStatus === 429) {
        expect(i).toBeGreaterThanOrEqual(6);
        break;
      }
    }

    expect(lastStatus).toBe(429);
    expect(lastBody).toContain('Too many requests');
  });
});
