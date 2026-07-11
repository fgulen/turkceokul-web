import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';
import { loginAsSuperAdmin } from './helpers/auth';

// Test unitesi etkinliklerinde a11y: dokunma alani + renk kontrasti.
// Tip basina ILK etkinlik yeterli (ayni player'i tekrar taramak gurultu).
//
// KOSUM: npx playwright test test-unitesi-a11y --reporter=line --workers=1 --timeout=90000 --retries=1
// - workers=1 ZORUNLU: `bulgular` dizisi worker-process bazli, afterAll her worker'da ayri kosar;
//   coklu worker'da son yazan oncekini ezerdi (afterAll artik dosyayla birlestirip tekilliyor,
//   yine de tek worker en guvenli yol).
// - timeout=90000: login + axe analyze agir player sayfalarinda 30sn'lik varsayilani asabiliyor.
// - retries=1: Windows'ta nadir worker crash (0xC0000142) icin; dedupe sayesinde retry bulgu cogaltmaz.
const tsv = fs.readFileSync(path.join(__dirname, 'test-unitesi-idler.tsv'), 'utf8');
const tipBasinaIlk = new Map<string, string>();
for (const satir of tsv.split('\n').filter(Boolean)) {
  const [id, tip] = satir.split('\t');
  if (id && tip && id !== 'Id' && !tipBasinaIlk.has(tip)) tipBasinaIlk.set(tip, id);
}

const bulgular: { etkinlikId: string; ruleId: string; impact: string; aciklama: string }[] = [];

test.describe('Test ünitesi a11y', () => {
  test.beforeEach(async ({ page }) => { await loginAsSuperAdmin(page); });

  for (const [tip, id] of tipBasinaIlk) {
    test(`a11y: ${tip} (${id})`, async ({ page }) => {
      await page.goto(`/tr/etkinlik/${id}`);
      // Perde varsa gec
      const basla = page.getByRole('button', { name: /^(Başla|Etkinliğe Dön)$/ });
      if (await basla.isVisible().catch(() => false)) await basla.click();
      await page.waitForTimeout(800);
      const sonuc = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag22aa'])
        .analyze();
      for (const v of sonuc.violations)
        for (const n of v.nodes.slice(0, 3))
          bulgular.push({ etkinlikId: id, ruleId: v.id, impact: v.impact ?? 'minor',
                          aciklama: `${v.help} — ${n.target.join(' ')}` });
      const kritik = sonuc.violations.filter(v => v.impact === 'critical');
      expect.soft(kritik, `kritik a11y ihlali: ${kritik.map(v => v.id).join(',')}`).toHaveLength(0);
    });
  }

  test.afterAll(() => {
    const out = path.join(__dirname, '../test-results/a11y-bulgular.json');
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // Worker crash/retry durumunda ezme: mevcut dosyayla birlestir + tekille.
    let mevcut: typeof bulgular = [];
    try { mevcut = JSON.parse(fs.readFileSync(out, 'utf8')); } catch { /* ilk yazim */ }
    const tekil = new Map(
      [...mevcut, ...bulgular].map(b => [`${b.etkinlikId}|${b.ruleId}|${b.aciklama}`, b]),
    );
    fs.writeFileSync(out, JSON.stringify([...tekil.values()], null, 2));
  });
});
