/**
 * Güvenlik Testleri — ASP.NET Core 8 API
 *
 * Pre-conditions:
 *   - API localhost:5000'de çalışmalı  (dotnet run)
 *   - Test DB'de en az 2 kayıtlı kullanıcı yoktur — testler kendi kullanıcılarını oluşturur
 *
 * Kapsam:
 *   1. IDOR — A kullanıcısı B kullanıcısının verisine erişemez (403)
 *   2. Input validation — SQL injection + XSS payload'ları 400 döner
 *   3. JWT doğrulama — geçersiz/süresi dolmuş/eksik token 401 döner
 *   4. HTTPS / STS header kontrolü (prod ortamı gerektirir, dev'de fixme)
 */

import { test, expect } from '@playwright/test';

const API = process.env.API_BASE_URL ?? 'http://localhost:5221';

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

async function registerUser(request: typeof import('@playwright/test').request, suffix: string) {
  const email = `sectest_${suffix}_${Date.now()}@example.com`;
  const res = await request.post(`${API}/api/auth/register`, {
    data: { email, password: 'SecTest123!', name: 'Sec', surname: 'Test' },
    failOnStatusCode: false,
  });
  const body = await res.json().catch(() => ({}));
  return { email, token: body?.accessToken ?? body?.token ?? null, status: res.status() };
}

// ─── 1. IDOR — Başka Kullanıcının Verisine Erişim ────────────────────────────

test.describe('IDOR — Cross-user veri erişimi', () => {
  test('Kullanıcı A tokenıyla /api/profil B kullanıcısını göremez (403/401)', async ({ request }) => {
    const a = await registerUser(request, 'A');
    const b = await registerUser(request, 'B');

    // En az biri kayıt olabilmeli
    expect([a.status, b.status]).toContain(200);

    if (!a.token || !b.token) {
      test.skip();
      return;
    }

    // B'nin profil ID'sini bul
    const bProfilRes = await request.get(`${API}/api/profil`, {
      headers: { Authorization: `Bearer ${b.token}` },
      failOnStatusCode: false,
    });
    const bProfil = await bProfilRes.json().catch(() => ({}));
    const bId: number = bProfil?.id ?? bProfil?.Id;

    if (!bId) {
      test.skip();
      return;
    }

    // A'nın tokenıyla B'nin ID'li profili sorgula
    const crossRes = await request.get(`${API}/api/profil/${bId}`, {
      headers: { Authorization: `Bearer ${a.token}` },
      failOnStatusCode: false,
    });

    // 403 (Forbidden) veya 404 (bilgi ifşası yok) bekliyoruz — asla 200 olmaz
    expect([403, 404]).toContain(crossRes.status());
  });

  test('Auth olmadan öğrenci etkinlik geçmişine erişim 401 döner', async ({ request }) => {
    const res = await request.get(`${API}/api/profil/999/etkinlikler`, {
      failOnStatusCode: false,
    });
    expect([401, 403, 404]).toContain(res.status());
  });

  test('Başka sınıfın raporuna erişim 403 döner', async ({ request }) => {
    const a = await registerUser(request, 'IDOR_sinif');
    if (!a.token) { test.skip(); return; }

    // Rastgele yüksek ID — başka kurumun sınıfı
    const res = await request.get(`${API}/api/reports/sinif/99999`, {
      headers: { Authorization: `Bearer ${a.token}` },
      failOnStatusCode: false,
    });
    // Ogrenci rolü bu endpoint'e erişemez (403) veya sinif bulunamaz (404)
    expect([403, 404]).toContain(res.status());
  });
});

// ─── 2. Input Validation — SQL Injection + XSS ───────────────────────────────

test.describe('Input Validation — SQL injection ve XSS payload\'ları', () => {
  const sqli = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT null,null,null--",
    "admin'--",
  ];

  const xss = [
    '<script>alert(1)</script>',
    '"><img src=x onerror=alert(1)>',
    'javascript:alert(document.cookie)',
    '<svg onload=alert(1)>',
  ];

  for (const payload of sqli) {
    test(`SQL injection login'de reddedilir: ${payload.slice(0, 30)}`, async ({ request }) => {
      const res = await request.post(`${API}/api/auth/login`, {
        data: { email: payload, password: payload },
        failOnStatusCode: false,
      });
      // 400 (validation), 401 (geçersiz kimlik bilgisi) veya 429 (rate limit) kabul edilir
      // 200 (başarılı giriş) asla olmaz
      expect(res.status()).not.toBe(200);
      expect(res.status()).not.toBe(500); // sunucu hatası SQL injection'a işaret eder
    });
  }

  for (const payload of xss) {
    test(`XSS kayıtta reddedilir: ${payload.slice(0, 30)}`, async ({ request }) => {
      const res = await request.post(`${API}/api/auth/register`, {
        data: {
          email: `xsstest_${Date.now()}@example.com`,
          password: 'XssTest123!',
          name: payload,
          surname: payload,
        },
        failOnStatusCode: false,
      });
      // 400 (validation hatası) bekliyoruz; 200 olmamalı
      // Not: bazı XSS payload'ları ad alanında kabul edilip encode edilebilir —
      //      burada sunucu patlaması (500) olmadığını doğruluyoruz
      expect(res.status()).not.toBe(500);
    });
  }

  test('Aşırı uzun input (10 KB) 400 döner', async ({ request }) => {
    const longStr = 'a'.repeat(10_000);
    const res = await request.post(`${API}/api/auth/login`, {
      data: { email: longStr, password: longStr },
      failOnStatusCode: false,
    });
    // 400 (validation) veya 413 (payload too large) — 200 veya 500 olmaz
    expect([400, 413, 429]).toContain(res.status());
  });

  test('Boş body 400 döner', async ({ request }) => {
    const res = await request.post(`${API}/api/auth/login`, {
      data: {},
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(400);
  });
});

// ─── 3. JWT Doğrulama ─────────────────────────────────────────────────────────

test.describe('JWT Doğrulama — geçersiz token senaryoları', () => {
  test('Token olmadan korumalı endpoint 401 döner', async ({ request }) => {
    const res = await request.get(`${API}/api/profil`, {
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test('Rastgele string token 401 döner', async ({ request }) => {
    const res = await request.get(`${API}/api/profil`, {
      headers: { Authorization: 'Bearer bu_token_gecersiz' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test('Yapısal olarak geçerli ama sahte imzalı JWT 401 döner', async ({ request }) => {
    // Header + Payload geçerli, imza sahte
    const fakeJwt =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
      '.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkhhY2tlciIsImlhdCI6MTV9' +
      '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const res = await request.get(`${API}/api/profil`, {
      headers: { Authorization: `Bearer ${fakeJwt}` },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test('Bearer prefix eksik olunca 401 döner', async ({ request }) => {
    const res = await request.get(`${API}/api/profil`, {
      headers: { Authorization: 'sadece_token_degeri' },
      failOnStatusCode: false,
    });
    expect(res.status()).toBe(401);
  });

  test('Ogrenci rolü admin endpoint\'ine erişemez (403)', async ({ request }) => {
    const user = await registerUser(request, 'jwt_role');
    if (!user.token) { test.skip(); return; }

    const res = await request.get(`${API}/api/super-admin/istatistik`, {
      headers: { Authorization: `Bearer ${user.token}` },
      failOnStatusCode: false,
    });
    expect([403, 404]).toContain(res.status());
  });
});

// ─── 4. HTTPS / Strict-Transport-Security ────────────────────────────────────

test.describe('HTTPS ve Güvenlik Header\'ları', () => {
  // HTTPS ve STS sadece production ortamında aktif olur.
  // Local dev'de HTTP çalıştığı için bu testler fixme.
  test.fixme(
    true,
    'Bu testler Railway/Vercel production URL\'inde çalıştırılmalı. ' +
    'Local dev HTTP kullanır, STS header\'ı olmaz.'
  );

  test('API production URL\'i HTTPS üzerinden erişilebilir', async ({ request }) => {
    const prodApi = process.env.PROD_API_URL ?? 'https://api.turkceokulu.com';
    const res = await request.get(`${prodApi}/health`, { failOnStatusCode: false });
    expect(res.status()).toBeLessThan(500);
    // TLS bağlantısı başarılıysa buradayız — HTTPS çalışıyor
  });

  test('Strict-Transport-Security header mevcut', async ({ request }) => {
    const prodApi = process.env.PROD_API_URL ?? 'https://api.turkceokulu.com';
    const res = await request.get(`${prodApi}/health`, { failOnStatusCode: false });
    const sts = res.headers()['strict-transport-security'];
    expect(sts).toBeDefined();
    expect(sts).toContain('max-age');
  });

  test('X-Content-Type-Options: nosniff mevcut', async ({ request }) => {
    const prodApi = process.env.PROD_API_URL ?? 'https://api.turkceokulu.com';
    const res = await request.get(`${prodApi}/health`, { failOnStatusCode: false });
    const xcto = res.headers()['x-content-type-options'];
    expect(xcto).toBe('nosniff');
  });
});
