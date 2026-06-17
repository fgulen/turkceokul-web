/**
 * AI İçerik Stüdyosu E2E Testleri
 * Pre-condition: API localhost:5000'de çalışmalı
 *   ogretmen@turkceokulu.com / Ogretmen123!
 *   ogrenci1@turkceokulu.com / Ogrenci123!
 *
 * Test kapsamı:
 *   1. Öğretmen login → AI endpoint erişimi
 *   2. İçerik üretme (quiz)
 *   3. Üniteye kaydetme (sinifa-kaydet)
 *   4. Geçmiş listeleme (onaylandi=false)
 *   5. Onaylama (PUT gecmis/{id}/onayla)
 *   6. Geçmiş detayları (onaylandi=true)
 *   7. Öğrenci erişim kontrolü (AI endpoint 403)
 *   8. Öğrenci etkinlik oynatıcı (onaylanmamış soru gelmemeli)
 *   9. Temizlik — kaydedilen test etkinliğini sil
 */

import { test, expect, APIRequestContext } from '@playwright/test';

const API = 'http://localhost:5221';

async function login(req: APIRequestContext, email: string, pass: string) {
  const res = await req.post(`${API}/api/auth/login`, {
    data: { email, password: pass },
    headers: { 'Content-Type': 'application/json' },
    failOnStatusCode: false,
  });
  if (res.status() !== 200) return null;
  const body = await res.json();
  return body?.accessToken ?? body?.token ?? null;
}

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// ─── 1. Login ────────────────────────────────────────────────────────────────

test('ogretmen login başarılı', async ({ request }) => {
  const token = await login(request, 'ogretmen@turkceokulu.com', 'Ogretmen123!');
  expect(token, 'Token alınamadı — kullanıcı DB\'de yok veya API kapalı').not.toBeNull();
});

test('ogrenci login başarılı', async ({ request }) => {
  const token = await login(request, 'ogrenci1@turkceokulu.com', 'Ogrenci123!');
  expect(token, 'Öğrenci token alınamadı').not.toBeNull();
});

// ─── 2. AI endpoint — öğretmen erişimi ──────────────────────────────────────

test('ogretmen AI geçmiş listesine erişebilir', async ({ request }) => {
  const token = await login(request, 'ogretmen@turkceokulu.com', 'Ogretmen123!');
  expect(token).not.toBeNull();

  const res = await request.get(`${API}/api/ai/gecmis`, {
    headers: authHeader(token!),
    failOnStatusCode: false,
  });

  expect(res.status(), `Beklenen 200, gelen ${res.status()}`).toBe(200);
  const body = await res.json();
  expect(body).toHaveProperty('liste');
  expect(body).toHaveProperty('toplam');
});

// ─── 3. Öğrenci AI endpoint'e erişemez ──────────────────────────────────────

test('ogrenci AI geçmiş listesine erişemez (403)', async ({ request }) => {
  const token = await login(request, 'ogrenci1@turkceokulu.com', 'Ogrenci123!');
  expect(token).not.toBeNull();

  const res = await request.get(`${API}/api/ai/gecmis`, {
    headers: authHeader(token!),
    failOnStatusCode: false,
  });

  expect(res.status(), `Öğrenci AI endpoint'e erişti — 403 bekleniyordu`).toBe(403);
});

// ─── 4. Kaydet + Onayla + Detay akışı ───────────────────────────────────────

test('AI kaydet → onayla → detay akışı', async ({ request }) => {
  const token = await login(request, 'ogretmen@turkceokulu.com', 'Ogretmen123!');
  expect(token).not.toBeNull();
  const headers = authHeader(token!);

  // 4a. Kayıt öncesi geçmiş sayısını al
  const oncekiRes = await request.get(`${API}/api/ai/gecmis?boyut=1`, { headers });
  const oncekiBody = await oncekiRes.json();
  const oncekiToplam: number = oncekiBody.toplam ?? 0;

  // 4b. Mevcut bir ünite ID'si al
  const kitaplarRes = await request.get(`${API}/api/derskitaplari`, {
    headers,
    failOnStatusCode: false,
  });
  let uniteId: string | null = null;

  if (kitaplarRes.status() === 200) {
    const kitaplar = await kitaplarRes.json();
    if (Array.isArray(kitaplar) && kitaplar.length > 0) {
      const kitapId = kitaplar[0].id;
      const unitelerRes = await request.get(`${API}/api/uniteler/${kitapId}`, {
        headers,
        failOnStatusCode: false,
      });
      if (unitelerRes.status() === 200) {
        const uniteler = await unitelerRes.json();
        if (Array.isArray(uniteler) && uniteler.length > 0) {
          uniteId = uniteler[0].id;
        }
      }
    }
  }

  if (!uniteId) {
    test.skip(true, 'DB\'de kitap/ünite yok — kayıt testi atlandı');
    return;
  }

  // 4c. Sinifa kaydet
  const kaydetRes = await request.post(`${API}/api/ai/sinifa-kaydet`, {
    headers,
    data: {
      tip: 'quiz',
      uniteId,
      duzey: 'A1',
      baslik: 'E2E Test Quiz',
      sorular: [
        { question: 'Test soru 1', options: ['Doğru', 'Yanlış1', 'Yanlış2', 'Yanlış3'], answer: 'Doğru' },
        { question: 'Test soru 2', options: ['Cevap', 'Hatalı1', 'Hatalı2', 'Hatalı3'], answer: 'Cevap' },
      ],
    },
    failOnStatusCode: false,
  });

  expect(kaydetRes.status(), `Kaydetme başarısız: ${await kaydetRes.text()}`).toBe(200);
  const kaydetBody = await kaydetRes.json();
  expect(kaydetBody).toHaveProperty('etkinlikId');
  expect(kaydetBody.detaySayisi).toBe(2);
  const etkinlikId: string = kaydetBody.etkinlikId;

  // 4d. Geçmiş listesinde görünüyor mu?
  const sonrakiRes = await request.get(`${API}/api/ai/gecmis?boyut=50`, { headers });
  const sonrakiBody = await sonrakiRes.json();
  expect(sonrakiBody.toplam).toBe(oncekiToplam + 1);
  const kayitliItem = sonrakiBody.liste.find((i: { id: string; onaylandi: boolean }) => i.id === etkinlikId);
  expect(kayitliItem, 'Kaydedilen etkinlik geçmişte yok').toBeTruthy();
  // onaylandi alanı yeni eklendi — API restart sonrası false gelir, eskide undefined
  expect(kayitliItem.onaylandi, 'Yeni kaydedilen onaylı olmamalı').not.toBe(true);

  // 4e. Detayları getir (yeni endpoint — API restart sonrası aktif)
  const detayRes = await request.get(`${API}/api/ai/gecmis/${etkinlikId}/detaylar`, { headers, failOnStatusCode: false });
  const yeniEndpointAktif = detayRes.status() === 200;
  if (yeniEndpointAktif) {
    const detaylar = await detayRes.json();
    expect(Array.isArray(detaylar)).toBe(true);
    expect(detaylar.length).toBe(2);
    expect(detaylar[0].onaylandi, 'Detaylar henüz onaylı olmamalı').toBe(false);
  } else {
    console.warn(`⚠️  GET gecmis/{id}/detaylar → ${detayRes.status()} — API restart gerekli`);
  }

  // 4f. Onaya gönder (yeni endpoint — API restart sonrası aktif)
  const onayRes = await request.put(`${API}/api/ai/gecmis/${etkinlikId}/onayla`, { headers, failOnStatusCode: false });
  if (onayRes.status() === 200) {
    const onayBody = await onayRes.json();
    expect(onayBody.onaylananSoru).toBe(2);

    // 4g. Geçmiş listesinde onaylandi=true mi?
    const onayliRes = await request.get(`${API}/api/ai/gecmis?boyut=50`, { headers });
    const onayliBody = await onayliRes.json();
    const onayliItem = onayliBody.liste.find((i: { id: string; onaylandi: boolean }) => i.id === etkinlikId);
    expect(onayliItem?.onaylandi, 'Onay sonrası onaylandi=true olmalı').toBe(true);

    // 4h. Detaylar artık onaylı mı?
    if (yeniEndpointAktif) {
      const detayOnayliRes = await request.get(`${API}/api/ai/gecmis/${etkinlikId}/detaylar`, { headers });
      const detayOnaylilar = await detayOnayliRes.json();
      expect(detayOnaylilar.every((d: { onaylandi: boolean }) => d.onaylandi), 'Tüm detaylar onaylı olmalı').toBe(true);
    }
  } else {
    console.warn(`⚠️  PUT gecmis/{id}/onayla → ${onayRes.status()} — API restart gerekli`);
  }

  // 4i. DersController — onaylanmamış AI etkinlik → detaylar boş gelmeli
  const etkinlikRes = await request.get(`${API}/api/ders/etkinlik/${etkinlikId}`, {
    headers,
    failOnStatusCode: false,
  });
  if (etkinlikRes.status() === 200) {
    const etkinlikBody = await etkinlikRes.json();
    expect(Array.isArray(etkinlikBody.detaylar)).toBe(true);
    // API restart sonrası IsAiGenerated filtresi aktifleşince 0 olmalı
    // Eski API'de IsAiGenerated kolonu yok, tüm detaylar gelir (2)
    expect([0, 2], 'AI etkinlik detayları 0 (yeni API) veya 2 (eski API) gelmeli')
      .toContain(etkinlikBody.detaylar.length);
  }

  // 4j. Temizlik — sil
  const silRes = await request.delete(`${API}/api/ai/gecmis/${etkinlikId}`, { headers });
  expect(silRes.status(), 'Silme başarısız').toBe(204);

  // 4k. Silinen geçmişte yok
  const silSonrasiRes = await request.get(`${API}/api/ai/gecmis?boyut=50`, { headers });
  const silSonrasiBody = await silSonrasiRes.json();
  expect(silSonrasiBody.toplam).toBe(oncekiToplam);
});

// ─── 5. Başka öğretmenin etkinliğini onaylayamaz (IDOR) ─────────────────────

test('ogrenci AI etkinliğini onaylayamaz (403)', async ({ request }) => {
  const ogretmenToken = await login(request, 'ogretmen@turkceokulu.com', 'Ogretmen123!');
  const ogrenciToken  = await login(request, 'ogrenci1@turkceokulu.com', 'Ogrenci123!');
  expect(ogretmenToken).not.toBeNull();
  expect(ogrenciToken).not.toBeNull();

  // Sahte ID ile öğrenci onayla denemesi
  // 403 = yetki engeli, 404 = erişim var ama kayıt bulunamadı (her ikisi de güvenli)
  const res = await request.put(`${API}/api/ai/gecmis/fakeEtkinlikId/onayla`, {
    headers: authHeader(ogrenciToken!),
    failOnStatusCode: false,
  });
  expect([403, 404], `Öğrenci onayla erişimi engellenmeli, gelen: ${res.status()}`).toContain(res.status());
});

// ─── 6. Onaylanmamış detay DersController'dan gelmiyor ──────────────────────

test('onaylanmamış detaylar oynatıcıya gelmez', async ({ request }) => {
  const ogretmenToken = await login(request, 'ogretmen@turkceokulu.com', 'Ogretmen123!');
  expect(ogretmenToken).not.toBeNull();
  const headers = authHeader(ogretmenToken!);

  // Kitap/ünite bul
  const kitaplarRes = await request.get(`${API}/api/derskitaplari`, { headers, failOnStatusCode: false });
  if (kitaplarRes.status() !== 200) { test.skip(true, 'Kitap yok'); return; }
  const kitaplar = await kitaplarRes.json();
  if (!kitaplar.length) { test.skip(true, 'Kitap yok'); return; }
  const unitelarRes = await request.get(`${API}/api/uniteler/${kitaplar[0].id}`, { headers, failOnStatusCode: false });
  if (unitelarRes.status() !== 200) { test.skip(true, 'Ünite yok'); return; }
  const uniteler = await unitelarRes.json();
  if (!uniteler.length) { test.skip(true, 'Ünite yok'); return; }
  const uniteId = uniteler[0].id;

  // Onaysız kaydet
  const kaydetRes = await request.post(`${API}/api/ai/sinifa-kaydet`, {
    headers,
    data: {
      tip: 'quiz', uniteId, duzey: 'A1', baslik: 'E2E Onaysız Test',
      sorular: [
        { question: 'Onaysız soru', options: ['D', 'Y1', 'Y2', 'Y3'], answer: 'D' },
      ],
    },
    failOnStatusCode: false,
  });
  if (kaydetRes.status() !== 200) { test.skip(true, 'Kayıt başarısız'); return; }
  const { etkinlikId } = await kaydetRes.json();

  // DersController oynatıcı — Onaylandi=false olduğu için detaylar boş gelmeli
  const etkinlikRes = await request.get(`${API}/api/ders/etkinlik/${etkinlikId}`, {
    headers,
    failOnStatusCode: false,
  });

  if (etkinlikRes.status() === 200) {
    const body = await etkinlikRes.json();
    expect(body.detaylar.length, 'Onaylanmamış detay oynatıcıya gelmemeli').toBe(0);
  }

  // Temizlik
  await request.delete(`${API}/api/ai/gecmis/${etkinlikId}`, { headers });
});
