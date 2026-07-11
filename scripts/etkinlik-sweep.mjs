#!/usr/bin/env node
// Etkinlik sayfalarini gezer: screenshot (desktop+mobil), console hatasi,
// perde-kapaninca-medya-durmasi asserti. Kaldigi yerden devam eder.
// Kullanim (web/ klasorunden): node scripts/etkinlik-sweep.mjs [--limit N]
// On kosul: web dev server (3000) ve API (5221) ayakta.
import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const KOK = path.join(import.meta.dirname, '../..');          // turkceokulu-yeni/
const OUT = path.join(KOK, 'scripts/out');
const LISTE = path.join(OUT, 'sweep-liste.tsv');
const SERT = path.join(OUT, 'sert-kirik-idler.txt');
const PROGRESS = path.join(OUT, 'sweep-progress.json');
const BULGULAR = path.join(OUT, 'sweep-bulgular.json');
const SS_DIR = path.join(import.meta.dirname, '../test-results/etkinlik-sweep');
const BASE = 'http://localhost:3000';
const DESKTOP = { width: 1280, height: 800 }, MOBILE = { width: 390, height: 844 };

const limitArg = process.argv.indexOf('--limit');
const LIMIT = limitArg > -1 ? parseInt(process.argv[limitArg + 1], 10) : Infinity;

fs.mkdirSync(SS_DIR, { recursive: true });
const sert = fs.existsSync(SERT) ? new Set(fs.readFileSync(SERT, 'utf8').split('\n').filter(Boolean)) : new Set();
const done = fs.existsSync(PROGRESS) ? new Set(JSON.parse(fs.readFileSync(PROGRESS, 'utf8'))) : new Set();
const bulgular = fs.existsSync(BULGULAR) ? JSON.parse(fs.readFileSync(BULGULAR, 'utf8')) : [];

// TSV -> id bazinda tekillestir (sebepleri birlestir)
const kayitlar = new Map();
for (const satir of fs.readFileSync(LISTE, 'utf8').split('\n').filter(Boolean)) {
  const [id, tip, sebep] = satir.split('\t');
  if (!id || id === 'EtkinlikId' || sert.has(id) || done.has(id)) continue;
  const k = kayitlar.get(id) ?? { id, tip, sebepler: [] };
  k.sebepler.push(sebep); kayitlar.set(id, k);
}
const kuyruk = [...kayitlar.values()].slice(0, LIMIT);
console.log(`${kuyruk.length} etkinlik gezilecek (sert-kirik dislanan: ${sert.size}, onceden biten: ${done.size})`);

function bulgu(etkinlikId, sorunTipi, severity, aciklama) {
  bulgular.push({ etkinlikId, sorunTipi, severity, aciklama });
}
function kaydet() {
  fs.writeFileSync(PROGRESS, JSON.stringify([...done]));
  fs.writeFileSync(BULGULAR, JSON.stringify(bulgular, null, 2));
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: DESKTOP });
// Medya enstrumantasyonu: olusturulan TUM media elementlerini kaydet
// (perde new Audio() DOM'a eklenmiyor — querySelector goremez).
await ctx.addInitScript(() => {
  window.__media = [];
  const orijinalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...a) {
    if (!window.__media.includes(this)) window.__media.push(this);
    return orijinalPlay.apply(this, a);
  };
});
const page = await ctx.newPage();

// Login (web/e2e/helpers/auth.ts ile ayni akis, admin hesabi)
await page.goto(`${BASE}/tr/giris`);
await page.getByPlaceholder('ornek@email.com').fill('admin@turkceokulu.com');
await page.getByPlaceholder('••••••••').fill('Admin123!');
await page.getByRole('button', { name: 'Giriş Yap' }).click();
await page.waitForURL(/\/(tr|en)\/(pano|super-admin|ogretmen)/, { timeout: 15_000 });

for (const { id, tip, sebepler } of kuyruk) {
  let hataOldu = false;
  const konsolHatalari = [];
  const errHandler = (m) => { if (m.type() === 'error') konsolHatalari.push(m.text()); };
  const pageErrHandler = (e) => konsolHatalari.push(String(e));
  page.on('console', errHandler); page.on('pageerror', pageErrHandler);
  try {
    const resp = await page.goto(`${BASE}/tr/etkinlik/${id}`, { waitUntil: 'load', timeout: 30_000 });
    if (!resp || resp.status() >= 400) { bulgu(id, 'sayfa-yuklenemedi', 'kritik', `HTTP ${resp?.status()}`); continue; }
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000); // perde animasyonu + medya settle

    const perdeVar = await page.getByRole('button', { name: /^(Başla|Etkinliğe Dön)$/ }).isVisible().catch(() => false);
    if (perdeVar) {
      // Perde ekran goruntusu (animasyonlar screenshot aninda durdurulur)
      await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
      await page.screenshot({ path: path.join(SS_DIR, `${id}-perde.png`) });
      // DOM'daki medyayi baslat (video/audio), sonra Basla'ya bas -> hepsi durmali
      await page.evaluate(() => document.querySelectorAll('video,audio').forEach(m => m.play().catch(() => {})));
      const perdeRoot = page.locator('div.fixed.z-50').first();
      const sesBtn = perdeRoot.locator('button').filter({ has: page.locator('.lucide-volume-2, .lucide-play') }).first();
      if (await sesBtn.isVisible().catch(() => false)) await sesBtn.click({ timeout: 2000 }).catch(() => {});
      const kayitliMedya = await page.evaluate(() => (window.__media ?? []).length + document.querySelectorAll('video,audio').length);
      const perdeMedyaBekleniyor = await page.evaluate(() =>
        !!document.querySelector('div.fixed.z-50 video, div.fixed.z-50 audio') ||
        !!document.querySelector('div.fixed.z-50 .lucide-volume-2, div.fixed.z-50 .lucide-play'));
      if (perdeMedyaBekleniyor && kayitliMedya === 0)
        bulgu(id, 'assert-enstrumantasyon', 'dusuk', 'Perdede medya var ama enstrumantasyon hicbir medya yakalamadi (kor assert riski)');
      await page.waitForTimeout(600);
      await page.getByRole('button', { name: /^(Başla|Etkinliğe Dön)$/ }).click();
      await page.waitForTimeout(800);
      const calan = await page.evaluate(() =>
        (window.__media ?? []).filter(m => !m.paused).map(m => m.currentSrc || m.src || 'bilinmiyor'));
      if (calan.length > 0)
        bulgu(id, 'perde-medya-durmuyor', 'kritik', `Perde kapandi ama calmaya devam eden medya: ${calan.join(' | ')}`);
    }

    // Player ekran goruntuleri
    await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' });
    await page.screenshot({ path: path.join(SS_DIR, `${id}-desktop.png`) });
    await page.setViewportSize(MOBILE);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(SS_DIR, `${id}-mobile.png`) });
    await page.setViewportSize(DESKTOP);

    // Yatay tasma kontrolu (govde asla yatay scroll etmemeli)
    const tasma = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    if (tasma) bulgu(id, 'yatay-tasma', 'orta', 'documentElement yatay scroll uretiyor');

    for (const h of [...new Set(konsolHatalari)].slice(0, 5))
      bulgu(id, 'console-hatasi', 'orta', h.slice(0, 300));
  } catch (e) {
    bulgu(id, 'sweep-hatasi', 'orta', String(e).slice(0, 300));
    hataOldu = true;
  } finally {
    page.off('console', errHandler); page.off('pageerror', pageErrHandler);
    done.add(id);
    if (hataOldu || done.size % 20 === 0) kaydet();
  }
}
kaydet();
await browser.close();
console.log(`Bitti. ${done.size} sayfa gezildi, ${bulgular.length} bulgu -> ${BULGULAR}`);
