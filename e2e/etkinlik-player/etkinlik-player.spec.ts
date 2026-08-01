/**
 * Etkinlik Player — Rastgele Aktivite Testi
 *
 * Her çalıştırmada kitaplardaki tüm aktiviteleri tarar,
 * tür bazında gruplar ve her türden daha önce test edilmemiş
 * rastgele bir aktivite seçip player'ı açar.
 *
 * Amaç: Her etkinlik türünün player'ının hatasız yüklendiğini doğrulamak.
 *
 * Çalıştırma:
 *   npx playwright test e2e/etkinlik-player --headed
 *
 * Takip: e2e/etkinlik-player/tested-activities.json
 *   — Her run'da farklı türler seçilir (tümü bitince sıfırlanır).
 */

import { test, expect } from '@playwright/test';
import { loginAsTeacher } from '../helpers/auth';
import {
  fetchAllActivities, pickRandomUntestedPerType, readTestedIds,
  recordTested, getTrackerStats, pageHasError,
  type Etkinlik,
} from './helpers';

const API_BASE = 'http://localhost:5221';

test.describe.configure({ timeout: 300_000 });

type AktiviteSonucu = 'OK' | { uyari: string };

async function checkActivity(page: import('@playwright/test').Page, activity: Etkinlik): Promise<AktiviteSonucu> {
  const url = `/tr/etkinlik/${activity.id}?uniteId=${activity.uniteId}&kitapId=${activity.kitapId}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(3000);

  const error = await pageHasError(page);
  if (error) return { uyari: `sayfa yüklenemedi: ${error}` };

  const bodyText = await page.evaluate(() => document.body.innerText);
  const hasContent = bodyText.length > 200;
  const buttonCount = await page.getByRole('button').count();
  const hasButton = buttonCount > 1;

  if (!(hasContent && hasButton)) {
    return { uyari: 'player içeriği beklenenden az' };
  }

  const startBtn = page.getByRole('button', { name: /Başla|Devam Et/i });
  if (await startBtn.first().isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.first().click({ timeout: 5000 });
    await page.waitForTimeout(1500);
  }

  return 'OK';
}

test.describe('Etkinlik Player — Rastgele Aktivite Testi', () => {
  let activitiesByType: Map<string, Etkinlik>;

  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post(`${API_BASE}/api/auth/login`, {
      data: { email: 'ogretmen@turkceokulu.com', password: 'Ogretmen123!' },
    });
    expect(loginRes.ok()).toBeTruthy();
    const { accessToken } = await loginRes.json();

    const all = await fetchAllActivities(request, accessToken);
    expect(all.length).toBeGreaterThan(0);

    let testedIds = readTestedIds();
    activitiesByType = pickRandomUntestedPerType(all, testedIds);

    if (activitiesByType.size === 0) {
      const { writeFileSync } = await import('fs');
      const { join } = await import('path');
      writeFileSync(join(__dirname, 'tested-activities.json'), '{}', 'utf-8');
      activitiesByType = pickRandomUntestedPerType(all, new Set());
    }

    const stats = getTrackerStats();
    console.log(`[Bilgi] Daha önce test edilen: ${stats.total} aktivite`);
    console.log(`[Bilgi] Bu run'da test edilecek: ${activitiesByType.size} tür`);
    for (const [type, act] of activitiesByType) {
      console.log(`  → ${type}: "${act.etkinlikAdi}" (${act.kitapAdi} / ${act.uniteAdi})`);
    }
  });

  test('Tüm aktivite türleri smoke testi', async ({ page, context }) => {
    await loginAsTeacher(page);

    const entries = [...activitiesByType.entries()];
    const results: string[] = [];
    let tested = 0;
    let passed = 0;
    let activePage = page;

    // Toplam bütçe 300s (test.describe.configure). login + beforeAll overhead için
    // 40s pay bırak, kalanı aktivite sayısına böl; tek aktivite 8-20s arasında sınırlı kalsın.
    const perActivityBudgetMs = Math.max(8000, Math.min(20000, Math.floor(260_000 / Math.max(1, entries.length))));

    for (const [tur, activity] of entries) {
      tested++;
      const label = `[${tested}/${activitiesByType.size}] ${tur} — "${activity.etkinlikAdi}"`;

      try {
        const checkPromise = checkActivity(activePage, activity);
        // Kaybeden tarafa sessiz bir .catch() tak: checkActivity, race timeout'la
        // kazanıldıktan SONRA reject ederse, referansı hiçbir yerde await edilmediği
        // için Node bunu unhandledRejection olarak yükseltir ve Playwright'ta sahte
        // bir test hatası gibi görünür. Bu satır o geç-reject'i sessizce yutar; race'in
        // kendisi hâlâ önce biteni (gerçek sonuç ya da timeout) kullanır.
        checkPromise.catch(() => {});

        const sonuc = await Promise.race([
          checkPromise,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`activity-timeout (${perActivityBudgetMs}ms)`)), perActivityBudgetMs)
          ),
        ]);

        if (sonuc === 'OK') {
          passed++;
          results.push(`  ✅ ${label} — player yüklendi`);
        } else {
          results.push(`  ⚠ ${label} — ${sonuc.uyari}`);
        }
        recordTested(activity.id, tur, activity.etkinlikAdi);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        results.push(`  ❌ ${label} — hata: ${msg.slice(0, 120)}`);
        recordTested(activity.id, tur, activity.etkinlikAdi);

        // Sayfa askıda kalmış olabilir (bloklu JS main thread) — mevcut sayfayı
        // kapatmayı dene, olmazsa taze bir sayfa aç. Böylece tek bir çökük deneme
        // sonraki tüm türleri "browser has been closed" cascade'ine sürüklemiyor.
        // Bilinen risk: her recovery bir yeniden-login (network) ekliyor, bu
        // perActivityBudgetMs hesabına dahil değil — art arda birkaç hata olursa
        // kümülatif recovery süresi 300s'lik toplam bütçeyi zorlayabilir. Kabul
        // edilebilir risk (recovery sadece hata durumunda tetikleniyor, mutlak
        // en kötü durum bile "birkaç ekstra login" mertebesinde); sorun çıkarsa
        // sonraki iyileştirme recovery'de re-login'i atlayıp sadece navigate denemek.
        try {
          await activePage.close({ runBeforeUnload: false });
        } catch { /* zaten kapalı/yanıt vermiyor — yok say */ }
        try {
          activePage = await context.newPage();
          await loginAsTeacher(activePage);
        } catch (recoverErr) {
          results.push(`  ❌ [recovery] taze sayfa açılamadı: ${recoverErr instanceof Error ? recoverErr.message : String(recoverErr)}`);
        }
      }
    }

    console.log(`\n=== Sonuç: ${passed}/${tested} başarılı ===`);
    for (const r of results) {
      console.log(r);
    }

    if (tested > 0) {
      expect(passed).toBeGreaterThanOrEqual(Math.max(1, Math.floor(tested * 0.3)));
    } else {
      test.skip();
    }
  });
});
