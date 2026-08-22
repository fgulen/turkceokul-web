/**
 * Tam Kapsamlı Yayın-Öncesi Smoke Test
 *
 * Uçtan uca, gerçek rol zincirini takip eder:
 *   0. Public demo-talep (anonim kurum adayı)
 *   1. Admin/SuperAdmin: bekleyen talebi bulur, yeni ülke + ülke temsilcisi daveti oluşturur
 *   2. Ülke temsilcisi daveti kabul eder
 *   3. Ülke temsilcisi talebi kuruma dönüştürür (Deneme lisansı otomatik açılır)
 *   4. Ülke temsilcisi kurum yöneticisi (KurumYoneticisi) davet eder
 *   5. Kurum yöneticisi daveti kabul eder, öğretmen davet eder
 *   6. Öğretmen daveti kabul eder — UI üzerinden sınıf oluşturur, okuma kitabı atar
 *   7. Öğrenci ekleme üç yöntemle: toplu-isim (PIN/QR), tekli e-posta, katılım kodu (UI, yeni kayıt)
 *   8. Öğrenciler sınıfı görür, bir etkinliğin player'ı hatasız açılır
 *
 * Admin/kurum/ülke temsilcisi zinciri API üzerinden (request fixture) yürütülür — bu adımlar
 * çoğunlukla tek-seferlik onay/davet akışları, UI'da tekrar tekrar tıklamak yerine API'nin
 * kendisini doğrulamak daha hızlı ve güvenilir. Öğretmen ve öğrenci adımları GERÇEK UI
 * üzerinden yürütülür — bunlar günlük kullanılan asıl müşteri yolculuğu.
 *
 * Ön koşullar:
 *   - Next.js dev server + API ayakta (PLAYWRIGHT_BASE_URL / PLAYWRIGHT_API_URL ile prod'a
 *     yönlendirilebilir — varsayılan localhost)
 *   - admin@turkceokulu.com / Admin123! (SuperAdmin) hesabı var ve çalışıyor
 *   - DersKitabiId '04POV146VVFZ' (Yağmur 1, A1) visible=1
 *
 * Temizlik: test sonunda oluşturulan TÜM ID'ler `full-launch-smoke-cleanup.json` dosyasına
 * yazılır — gerçek silme burada YAPILMAZ (prod'da API'de "kurum sil" gibi tehlikeli
 * endpoint'leri script'ten tetiklemek riskli), silme /db skill'iyle elle onaylanarak yapılır.
 *
 * Çalıştırma:
 *   npx playwright test full-launch-smoke --headed                                  # local
 *   PLAYWRIGHT_BASE_URL=https://turkceokulu.vercel.app \
 *   PLAYWRIGHT_API_URL=https://turkceokulu-api-production.up.railway.app \
 *     npx playwright test full-launch-smoke                                          # prod
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { loginAs } from './helpers/auth';
import { assertStudentIsInClassRoster } from './helpers/classroom-flow';

const API_BASE = process.env.PLAYWRIGHT_API_URL || 'http://localhost:5221';
const RUN_ID = Date.now();
const TAG = `E2E-${RUN_ID}`;
const DERS_KITABI_ID = '04POV146VVFZ'; // Yağmur Türkçe Ders Kitabı 1 (A1)
const OKUMA_KITABI_ID = '9aeddc197f44'; // Kibritçi Kız (A1)
const CLEANUP_PATH = path.join(__dirname, 'full-launch-smoke-cleanup.json');

const SUPER_ADMIN_EMAIL = process.env.TEST_SUPER_ADMIN_EMAIL ?? 'admin@turkceokulu.com';
const SUPER_ADMIN_PASS = process.env.TEST_SUPER_ADMIN_PASS ?? 'Admin123!';
const TEST_PASS = 'E2eSmokeTest123!';

test.describe.configure({ mode: 'serial', timeout: 300_000 });

// Temizlik için toplanan kayıtlar — test sonunda dosyaya yazılır, silme buradan tetiklenmez.
const cleanup: Record<string, unknown> = { runId: RUN_ID, tag: TAG, createdAt: new Date().toISOString() };

function writeCleanupFile() {
  fs.writeFileSync(CLEANUP_PATH, JSON.stringify(cleanup, null, 2), 'utf-8');
}

test('Tam kapsamlı launch smoke: lead → admin onay → ülke temsilcisi → kurum → öğretmen → öğrenci → etkinlik', async ({ request, page }) => {
  const ulkeAdi = `${TAG} Ulkesi`;
  const kurumAdi = `${TAG} Kurumu`;
  const yetkiliEmail = `yetkili+${RUN_ID}@turkceokulu.com`;
  // Ülke temsilcisi daveti yeni-ulke-ve-temsilci endpoint'inde demo-talep'teki YetkiliEmail'e
  // hedeflenir (DavetService: hedefli davette kabul eden e-posta eşleşmezse 400) — bu yüzden
  // ayrı bir e-posta değil, aynı yetkiliEmail kullanılıyor.
  const ulkeTemsilciEmail = yetkiliEmail;
  const kurumYoneticisiEmail = `kurumyonetici+${RUN_ID}@turkceokulu.com`;
  const ogretmenEmail = `ogretmen+${RUN_ID}@turkceokulu.com`;
  const ogrenciTekliEmail = `ogrenci-tekli+${RUN_ID}@turkceokulu.com`;
  const ogrenciKatilimEmail = `ogrenci-katilim+${RUN_ID}@turkceokulu.com`;

  cleanup.emails = {
    yetkiliEmail, ulkeTemsilciEmail, kurumYoneticisiEmail, ogretmenEmail,
    ogrenciTekliEmail, ogrenciKatilimEmail,
  };

  let ulkeTemsilciToken = '';
  let kurumYoneticisiToken = '';
  let ogretmenToken = '';
  let kurumId = 0;
  let sinifId = 0;
  let katilimKodu = '';
  let uniteId = '';
  let etkinlikId = '';

  await test.step('0. Public demo-talep gönderilir (anonim)', async () => {
    const res = await request.post(`${API_BASE}/api/katalog/demo-talep`, {
      data: {
        kurumAdi,
        yetkiliAdi: 'E2E Yetkili',
        yetkiliEmail,
        ulkeAdi,
        dersKitabiId: DERS_KITABI_ID,
      },
    });
    expect(res.ok(), `demo-talep başarısız: ${await res.text()}`).toBeTruthy();
  });

  await test.step('1. Admin: bekleyen talebi bulur, yeni ülke + ülke temsilcisi daveti oluşturur', async () => {
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: SUPER_ADMIN_EMAIL, password: SUPER_ADMIN_PASS },
    });
    expect(loginRes.ok(), `admin login başarısız: ${await loginRes.text()}`).toBeTruthy();
    const { accessToken: adminToken } = await loginRes.json();

    const listRes = await request.get(`${API_BASE}/api/admin/siparisler?durum=Beklemede`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(listRes.ok()).toBeTruthy();
    const talepler = (await listRes.json()) as Array<{ id: number; kurumAdi: string }>;
    const talep = talepler.find(t => t.kurumAdi === kurumAdi);
    if (!talep) throw new Error(`Demo talep bulunamadı: ${kurumAdi}`);
    cleanup.siparisId = talep.id;

    const res = await request.post(`${API_BASE}/api/admin/siparis/${talep.id}/yeni-ulke-ve-temsilci`, {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: { ulkeAdi },
    });
    expect(res.ok(), `yeni-ulke-ve-temsilci başarısız: ${await res.text()}`).toBeTruthy();
    const sonuc = await res.json();
    cleanup.ulkeId = sonuc.ulkeId;
    // YeniUlkeVeTemsilciSonucu record'unda ayrı bir Token alanı yok, yalnızca DavetUrl
    // ({appUrl}/davet/{token}) — token'ı URL'in son segmentinden çıkarıyoruz.
    const token = sonuc.davetUrl?.split('/').filter(Boolean).pop();
    cleanup.ulkeTemsilciDavetToken = token;

    expect(token, `davet token dönmedi, davetUrl: ${sonuc.davetUrl}`).toBeTruthy();
    (cleanup as { _ulkeTemsilciToken?: string })._ulkeTemsilciToken = token;
  });

  await test.step('2. Ülke temsilcisi daveti kabul eder', async () => {
    const token = (cleanup as { _ulkeTemsilciToken?: string })._ulkeTemsilciToken!;
    const res = await request.post(`${API_BASE}/api/davet/${token}/kabul`, {
      data: { ad: 'Smoke', soyad: 'UlkeTemsilcisi', sifre: TEST_PASS, email: ulkeTemsilciEmail },
    });
    expect(res.ok(), `ülke temsilcisi davet kabul başarısız: ${await res.text()}`).toBeTruthy();
    const sonuc = await res.json();
    ulkeTemsilciToken = sonuc.accessToken;
    expect(ulkeTemsilciToken).toBeTruthy();
  });

  await test.step('3. Ülke temsilcisi: bekleyen talebi kuruma dönüştürür', async () => {
    const listRes = await request.get(`${API_BASE}/api/ulke-temsilcisi/bekleyen-talepler`, {
      headers: { Authorization: `Bearer ${ulkeTemsilciToken}` },
    });
    expect(listRes.ok(), `bekleyen-talepler başarısız: ${await listRes.text()}`).toBeTruthy();
    const talepler = (await listRes.json()) as Array<{ id: number; kurumAdi: string }>;
    const talep = talepler.find(t => t.kurumAdi === kurumAdi);
    if (!talep) throw new Error(`Ülke temsilcisi panelinde talep bulunamadı: ${kurumAdi}`);

    const res = await request.post(`${API_BASE}/api/ulke-temsilcisi/talep/${talep.id}/kuruma-donustur`, {
      headers: { Authorization: `Bearer ${ulkeTemsilciToken}` },
      data: {},
    });
    expect(res.ok(), `kuruma-donustur başarısız: ${await res.text()}`).toBeTruthy();
    const sonuc = await res.json();
    kurumId = sonuc.kurumId;
    cleanup.kurumId = kurumId;
    expect(kurumId).toBeGreaterThan(0);
  });

  await test.step('4. Ülke temsilcisi: kurum yöneticisi davet eder', async () => {
    const res = await request.post(`${API_BASE}/api/davet/olustur`, {
      headers: { Authorization: `Bearer ${ulkeTemsilciToken}` },
      data: { hedefRol: 'KurumYoneticisi', kurumId, hedefEmail: kurumYoneticisiEmail },
    });
    expect(res.ok(), `kurum yöneticisi daveti başarısız: ${await res.text()}`).toBeTruthy();
    const sonuc = await res.json();
    (cleanup as { _kurumYoneticisiToken?: string })._kurumYoneticisiToken = sonuc.token;
  });

  await test.step('5. Kurum yöneticisi daveti kabul eder, öğretmen davet eder', async () => {
    const davetToken = (cleanup as { _kurumYoneticisiToken?: string })._kurumYoneticisiToken!;
    const kabulRes = await request.post(`${API_BASE}/api/davet/${davetToken}/kabul`, {
      data: { ad: 'Smoke', soyad: 'KurumYoneticisi', sifre: TEST_PASS, email: kurumYoneticisiEmail },
    });
    expect(kabulRes.ok(), `kurum yöneticisi davet kabul başarısız: ${await kabulRes.text()}`).toBeTruthy();
    const kabulSonuc = await kabulRes.json();
    kurumYoneticisiToken = kabulSonuc.accessToken;
    expect(kurumYoneticisiToken).toBeTruthy();

    const davetRes = await request.post(`${API_BASE}/api/davet/olustur`, {
      headers: { Authorization: `Bearer ${kurumYoneticisiToken}` },
      data: { hedefRol: 'Ogretmen', hedefEmail: ogretmenEmail },
    });
    expect(davetRes.ok(), `öğretmen daveti başarısız: ${await davetRes.text()}`).toBeTruthy();
    const davetSonuc = await davetRes.json();
    (cleanup as { _ogretmenDavetToken?: string })._ogretmenDavetToken = davetSonuc.token;
  });

  await test.step('6. Öğretmen daveti kabul eder', async () => {
    const davetToken = (cleanup as { _ogretmenDavetToken?: string })._ogretmenDavetToken!;
    const res = await request.post(`${API_BASE}/api/davet/${davetToken}/kabul`, {
      data: { ad: 'Smoke', soyad: 'Ogretmen', sifre: TEST_PASS, email: ogretmenEmail },
    });
    expect(res.ok(), `öğretmen davet kabul başarısız: ${await res.text()}`).toBeTruthy();
    const sonuc = await res.json();
    ogretmenToken = sonuc.accessToken;
    expect(ogretmenToken).toBeTruthy();
  });

  await test.step('7. UI: Öğretmen giriş yapar, sınıf oluşturur', async () => {
    await loginAs(page, ogretmenEmail, TEST_PASS);
    await page.goto('/tr/ogretmen');

    await page.getByRole('button', { name: 'Yeni Sınıf' }).first().click();
    await page.getByRole('textbox', { name: /Sınıf adı/ }).fill(`${TAG} Sinifi`);
    // sinif-form-slideover.tsx: <option>{k.name} ({k.seviye})</option> — seviye eki zorunlu.
    await page.getByRole('combobox').selectOption({ label: 'Yağmur Türkçe Ders Kitabı 1 (A1)' });
    await page.getByRole('button', { name: 'Oluştur' }).click();

    await expect(page.getByRole('heading', { name: /Sınıf Oluşturuldu/i })).toBeVisible({ timeout: 15_000 });
    const codeElement = page.locator('.font-mono.font-bold.text-3xl');
    await codeElement.waitFor({ state: 'visible', timeout: 15_000 });
    katilimKodu = (await codeElement.textContent())?.trim() ?? '';
    expect(katilimKodu.length, 'katılım kodu okunamadı').toBeGreaterThanOrEqual(4);
    await page.getByRole('button', { name: 'Tamam' }).click();

    await page.goto('/tr/ogretmen');
    const classLink = page.locator('a[href*="/ogretmen/sinif/"]').filter({ hasText: `${TAG} Sinifi` }).first();
    await classLink.waitFor({ state: 'visible', timeout: 15_000 });
    const href = await classLink.getAttribute('href');
    sinifId = Number(href?.match(/\/sinif\/(\d+)/)?.[1]);
    expect(sinifId).toBeGreaterThan(0);
    cleanup.sinifId = sinifId;
    cleanup.katilimKodu = katilimKodu;
  });

  await test.step('8. API: Öğretmen okuma kitabı atar', async () => {
    const res = await request.post(`${API_BASE}/api/ogretmen/okuma/ata`, {
      headers: { Authorization: `Bearer ${ogretmenToken}` },
      // OkumaAtaDto(SinifId, DersKitabiId, Baslik, TeslimTarihi, QuizZorunlu)
      data: { sinifId, dersKitabiId: OKUMA_KITABI_ID, baslik: 'Kibritçi Kız', teslimTarihi: null, quizZorunlu: false },
    });
    expect(res.ok(), `okuma kitabı atama başarısız: ${await res.text()}`).toBeTruthy();
  });

  await test.step('9a. Öğrenci ekleme — toplu isim (PIN/QR hesap)', async () => {
    const res = await request.post(`${API_BASE}/api/ogretmen/sinif/${sinifId}/ogrenci-toplu-ekle`, {
      headers: { Authorization: `Bearer ${ogretmenToken}` },
      data: { isimler: [`${TAG} Toplu Ogrenci`] },
    });
    expect(res.ok(), `toplu ekleme başarısız: ${await res.text()}`).toBeTruthy();
    const sonuc = await res.json();
    const eklenen = sonuc.eklenenler[0];
    cleanup.topluOgrenciUserId = eklenen.userId;

    // QR token ile giriş — PIN API yanıtında dönmüyor (yalnızca ekran/PDF'te gösteriliyor),
    // QR-login aynı "öğretmenin eklediği PIN hesabı" senaryosunu API'den doğrulanabilir kılıyor.
    const qrRes = await request.post(`${API_BASE}/api/auth/qr-login`, {
      data: { userId: eklenen.userId, qrToken: eklenen.qrToken },
    });
    expect(qrRes.ok(), `QR login başarısız: ${await qrRes.text()}`).toBeTruthy();
  });

  await test.step('9b. Öğrenci ekleme — e-posta ile tekli (önce kayıt, sonra öğretmen ekler)', async () => {
    const registerRes = await request.post(`${API_BASE}/api/auth/register`, {
      data: { email: ogrenciTekliEmail, password: TEST_PASS, name: 'Smoke', surname: 'TekliOgrenci' },
    });
    expect(registerRes.ok(), `tekli öğrenci kayıt başarısız: ${await registerRes.text()}`).toBeTruthy();
    // Cleanup DB'de e-posta ile eşleştirilecek — dönen response'un tam alan adına
    // (id vs userId) bağımlı kalmamak için burada userId ayrıştırılmıyor.
    cleanup.tekliOgrenciEmail = ogrenciTekliEmail;

    const ekleRes = await request.post(`${API_BASE}/api/ogretmen/sinif/${sinifId}/ogrenci-ekle`, {
      headers: { Authorization: `Bearer ${ogretmenToken}` },
      data: { email: ogrenciTekliEmail },
    });
    expect(ekleRes.ok(), `tekli öğrenci ekleme başarısız: ${await ekleRes.text()}`).toBeTruthy();
  });

  await test.step('9c. UI: Öğrenci — kayıt olup katılım koduyla sınıfa katılır', async () => {
    // page hâlâ öğretmen olarak giriş yapmış durumda (adım 7-8) — temizlenmezse
    // sinif/katil sayfası "zaten giriş yapmış kullanıcı" dalına düşüp öğretmeni doğrudan
    // sınıfa katar, kayıt formuna hiç uğramaz (bu adımın asıl test ettiği anonim-ziyaretçi
    // akışını atlar). Anonim bir ziyaretçiyi simüle etmek için oturumu tamamen temizliyoruz.
    await page.context().clearCookies();
    await page.goto('/tr/sinif/katil');
    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.reload();
    // Çerezleri temizledik, o yüzden onay banner'ı burada tekrar taze görünür ve
    // "Sınıfa Katıl" butonunu kaplayıp tıklamayı yutabilir (auth.ts:login() içindeki
    // aynı dersle aynı fix).
    const cerezKabul = page.getByRole('button', { name: 'Kabul Et' });
    if (await cerezKabul.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await cerezKabul.click();
    }
    const codeInput = page.locator('input[placeholder="ABCD12"]');
    await codeInput.waitFor({ state: 'visible', timeout: 15_000 });
    await codeInput.fill(katilimKodu);
    await page.getByRole('button', { name: /Sınıfa Katıl|Devam/i }).click();

    // Giriş yapılmamış kullanıcı -> kayıt formuna yönlendirilir (redirect=...sinif/katil
    // sayesinde form adımları atlanıp doğrudan ad/email/şifre alanları görünür — kayit/page.tsx
    // sinifKatilRedirect mantığı). Label'lar htmlFor ile input'a bağlı değil, autocomplete/type
    // kullanmak daha güvenilir (i18n metnine bağımlı olmaz).
    await page.waitForURL(/\/kayit/, { timeout: 10_000 });
    await page.locator('input[autocomplete="given-name"]').fill('Smoke');
    await page.locator('input[autocomplete="family-name"]').fill('KatilimOgrenci');
    await page.locator('input[type="email"]').fill(ogrenciKatilimEmail);
    await page.locator('input[type="password"]').fill(TEST_PASS);
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByRole('heading', { name: /Sınıfa katıldın!/i })).toBeVisible({ timeout: 20_000 });
  });

  await test.step('10. Öğretmen panelinde öğrenci görünüyor', async () => {
    // 9c'de yeni öğrenci hesabıyla giriş yapıldı — page artık o oturumda, öğretmen
    // rotasına gitmeden önce tekrar öğretmen olarak giriş yapmak gerekiyor.
    await loginAs(page, ogretmenEmail, TEST_PASS);
    await page.goto(`/tr/ogretmen/sinif/${sinifId}`);
    await expect(page.getByText('3 öğrenci')).toBeVisible({ timeout: 15_000 });
    // Roster isimleri "Genel" değil "Öğrenciler" sekmesinde.
    await page.getByRole('button', { name: 'Öğrenciler' }).click();
    await assertStudentIsInClassRoster(page, `${TAG} Toplu Ogrenci`);
  });

  await test.step('11. Öğrenci: sınıfı ve atanmış kitabı görür, bir etkinlik açılır', async () => {
    await loginAs(page, ogrenciKatilimEmail, TEST_PASS);
    await page.goto('/tr/pano');
    // Pano sınıf adını göstermiyor — bunun yerine sınıfa atanmış ders/okuma kitaplarını
    // gösteriyor, bu da zaten adım 7-8'in (sınıf+okuma ataması) öğrenciye gerçekten
    // yansıdığını daha anlamlı doğruluyor.
    await expect(page.getByText('Yağmur Türkçe Ders Kitabı 1')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Kibritçi Kız')).toBeVisible({ timeout: 15_000 });

    // /api/uniteler ve /api/etkinlikler [Authorize] altında — page'in oturumu (httpOnly
    // cookie) request context'e otomatik taşınmıyor, ayrı bir token gerekiyor.
    const ogrenciLoginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: ogrenciKatilimEmail, password: TEST_PASS },
    });
    expect(ogrenciLoginRes.ok(), `öğrenci login başarısız: ${await ogrenciLoginRes.text()}`).toBeTruthy();
    const { accessToken: ogrenciToken } = await ogrenciLoginRes.json();
    const authHeaders = { Authorization: `Bearer ${ogrenciToken}` };

    const uniteRes = await request.get(`${API_BASE}/api/uniteler/${DERS_KITABI_ID}`, { headers: authHeaders });
    const uniteler = (await uniteRes.json()) as Array<{ id: string; name: string }>;
    expect(uniteler.length, 'ders kitabında ünite yok').toBeGreaterThan(0);
    uniteId = uniteler[0].id;

    const etkinlikRes = await request.get(`${API_BASE}/api/etkinlikler/${uniteId}`, { headers: authHeaders });
    const etkinlikler = (await etkinlikRes.json()) as Array<{ id: string }>;
    expect(etkinlikler.length, 'ünitede etkinlik yok').toBeGreaterThan(0);
    etkinlikId = etkinlikler[0].id;

    await page.goto(`/tr/etkinlik/${etkinlikId}?uniteId=${uniteId}&kitapId=${DERS_KITABI_ID}`);
    await page.waitForTimeout(2000);
    const bodyText = await page.evaluate(() => document.body.innerText);
    expect(bodyText.length, 'etkinlik player boş/hatalı yüklendi').toBeGreaterThan(100);
    expect(bodyText).not.toMatch(/404|bulunamadı|beklenmeyen bir hata/i);
  });

  await test.step('12. Temizlik listesi yazılır', async () => {
    writeCleanupFile();
    console.log(`Temizlik dosyası yazıldı: ${CLEANUP_PATH}`);
    console.log(JSON.stringify(cleanup, null, 2));
  });
});
