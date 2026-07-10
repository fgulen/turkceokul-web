import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:5221';
const KITAP_ID = '04POV146VVFZ';
const UNITE_ID = 'NOMRZL2DRWVQ'; // 1. Ders - Merhaba

interface Bulgu {
  tip: 'HATA' | 'UYARI' | 'BILGI';
  etkinlikId: string;
  etkinlikAdi: string;
  etkinlikTuru: string;
  bolum: string;
  alan: string;
  mesaj: string;
}

const bulgular: Bulgu[] = [];

function bulguEkle(tip: Bulgu['tip'], etkinlikId: string, etkinlikAdi: string, etkinlikTuru: string, bolum: string, alan: string, mesaj: string) {
  bulgular.push({ tip, etkinlikId, etkinlikAdi, etkinlikTuru, bolum, alan, mesaj });
}

function dosyaVarMi(url: string | null): boolean {
  if (!url || !url.trim()) return false;
  // Sadece URL formatını kontrol et — dosyanın varlığını kontrol etmiyoruz
  return url.startsWith('/Medya/') || url.startsWith('http');
}

function cevapKontrol(tur: string, detay: any): string | null {
  // Her etkinlik türü için cevap alanının doğru olup olmadığını kontrol et
  // AkilliKart: cevap boş olmalı (flashcard)
  if (tur === 'AkilliKart') {
    if (detay.cevap && detay.cevap.trim()) {
      return `AkilliKart'ta cevap olmamalı ama "${detay.cevap}" var`;
    }
    return null;
  }
  // CoktanSecmeli, BoslukDoldurma: cevap dolu olmalı
  if (['CoktanSecmeli', 'CoktanSecmeliBoslukDoldurma', 'BoslukDoldurma', 'DogruYanlis', 'Quiz'].includes(tur)) {
    if (!detay.cevap || !detay.cevap.trim()) {
      return `${tur} tipinde cevap boş`;
    }
    return null;
  }
  return null;
}

async function loginViaApi(): Promise<string> {
  const r = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@turkceokulu.com', password: 'Admin123!' }),
  });
  const data = await r.json();
  return data.accessToken;
}

async function getActivityDetail(etkinlikId: string, token: string): Promise<any> {
  const r = await fetch(`${API_BASE}/api/etkinlik/${etkinlikId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return r.json();
}

test('Zağmur Kitabı Denetimi - 1. Ders', async ({ page }) => {
  test.setTimeout(300000); // 5 dakika

  // 1. API'den login ol
  const token = await loginViaApi();

  // 2. Unit 1'deki tüm etkinlikleri API'den al
  const etkinliklerResponse = await fetch(`${API_BASE}/api/etkinlikler/${UNITE_ID}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const etkinlikler = await etkinliklerResponse.json();

  // 3. Her etkinlik için API'den detayları al
  for (const etkinlik of etkinlikler) {
    let detay: any;
    try {
      detay = await getActivityDetail(etkinlik.id, token);
    } catch {
      bulguEkle('HATA', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum, 'API', 'API detay alınamadı');
      continue;
    }

    // Perde alanları kontrolü
    if (!detay.soruYonergesi || !detay.soruYonergesi.trim()) {
      bulguEkle('UYARI', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum, 'perdeMetni', 'Perde metni (soruYonergesi) boş');
    }

    // Resim link kontrolü
    if (detay.resimLink && !dosyaVarMi(detay.resimLink)) {
      bulguEkle('HATA', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum, 'resimLink', `Geçersiz resim linki: ${detay.resimLink}`);
    }

    // Ses link kontrolü
    if (detay.sesLink && !dosyaVarMi(detay.sesLink)) {
      bulguEkle('HATA', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum, 'sesLink', `Geçersiz ses linki: ${detay.sesLink}`);
    }

    // Detaylar kontrolü
    if (!detay.detaylar || detay.detaylar.length === 0) {
      bulguEkle('HATA', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum, 'detaylar', 'Hiç detay (soru) yok');
      continue;
    }

    const cevapKullanTipler = ['CoktanSecmeli', 'Quiz', 'DogruYanlis', 'MetinDogruYanlis', 'MetinCheckBox', 'ResimMetinEslestirmeDogruYanlis', 'MetinSesEslestirmeDogruYanlis', 'ResimSesEslestirmeDogruYanlis'];
    const kelimeCevapTipler = ['BoslukDoldurma', 'CoktanSecmeliBoslukDoldurma', 'KelimeleriEslestir', 'KelimeleriSirala', 'KelimelerdenCumleYap'];
    const descCevapTipler = ['SesiDinleveKelimeYaz', 'ResmeKelimeYaz'];

    for (const d of detay.detaylar) {
      const cevapVar = d.cevap !== undefined && d.cevap !== null && d.cevap !== '';
      const kelimeVar = [d.kelime1, d.kelime2, d.kelime3, d.kelime4, d.kelime5, d.kelime6, d.kelime7, d.kelime8, d.kelime9, d.kelime10].some(k => k && k.trim());

      if (cevapKullanTipler.includes(detay.etkinlikTuru)) {
        if (!cevapVar) {
          bulguEkle('HATA', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum,
            `detay.cevap(sıra:${d.orderNo})`, `${detay.etkinlikTuru} tipinde cevap boş`);
        }
      } else if (kelimeCevapTipler.includes(detay.etkinlikTuru)) {
        if (!kelimeVar) {
          bulguEkle('HATA', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum,
            `detay.kelime(sıra:${d.orderNo})`, `${detay.etkinlikTuru} tipinde hiç kelime yok (cevap eksik)`);
        }
      } else if (descCevapTipler.includes(detay.etkinlikTuru)) {
        // Bu tiplerde cevap description'da saklanır
        if (!d.description || !d.description.trim()) {
          bulguEkle('HATA', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum,
            `detay.description(sıra:${d.orderNo})`, `${detay.etkinlikTuru} tipinde description boş (cevap eksik)`);
        }
      }

      // Detaylardaki resim/ses linkleri
      if (d.resimLink && !dosyaVarMi(d.resimLink)) {
        bulguEkle('HATA', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum,
          `detay.resimLink(sıra:${d.orderNo})`, `Geçersiz: ${d.resimLink}`);
      }
      if (d.sesLink && !dosyaVarMi(d.sesLink)) {
        bulguEkle('HATA', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum,
          `detay.sesLink(sıra:${d.orderNo})`, `Geçersiz: ${d.sesLink}`);
      }

      // description kontrolü — sadece anlamlı olması gereken türler
      const aciklamaGerekli = !['ResmeTiklaDinle', 'ResminSesiHangisi', 'KelimeleriSirala', 'SesiDinleveKelimeYaz'].includes(detay.etkinlikTuru);
      if (aciklamaGerekli && (!d.description || !d.description.trim())) {
        bulguEkle('UYARI', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum,
          `detay.description(sıra:${d.orderNo})`, 'Açıklama boş');
      }
    }

    // Detay sayısına göre bilgi
    bulguEkle('BILGI', etkinlik.id, etkinlik.name, etkinlik.etkinlikTuru, etkinlik.bolum,
      'detaySayisi', `${detay.detaylar?.length ?? 0} detay`);
  }

  // 4. Şimdi Playwright ile UI kontrolü
  await page.goto('/tr/giris');
  await page.getByPlaceholder('ornek@email.com').fill('admin@turkceokulu.com');
  await page.getByPlaceholder('••••••••').fill('Admin123!');
  await page.getByRole('button', { name: 'Giriş Yap' }).click();
  await page.waitForURL(/\/(tr|en)\/(pano|super-admin|ogretmen)/, { timeout: 10000 });

  // Kütüphane sayfasına git
  await page.goto('/tr/kutuphane');
  await page.waitForLoadState('networkidle');

  // Kitap linkine tıkla
  const kitapLink = page.locator(`a[href="/tr/ders/${KITAP_ID}"]`);
  await expect(kitapLink.first()).toBeVisible({ timeout: 10000 });
  await kitapLink.first().click();
  await page.waitForLoadState('networkidle');

  // Unit 1'i seç (zaten seçili olmalı)
  const uniteButon = page.locator('button:has-text("1. Ders - Merhaba")');
  if (await uniteButon.isVisible()) {
    await uniteButon.click();
    await page.waitForLoadState('networkidle');
  }

  // Her bölüm sekmesini kontrol et
  const tabs = ['Kelime', 'Dinleme', 'Yazma', 'Okuma', 'AI Generated'];
  for (const tab of tabs) {
    const tabButton = page.locator(`button[title="${tab}"]`);
    if (!(await tabButton.isVisible())) continue;
    await tabButton.click();
    await page.waitForTimeout(500);

    // Bu bölümdeki etkinlikleri bul
    const bolumEtkinlikler = etkinlikler.filter((e: any) => e.bolum === tab);
    if (bolumEtkinlikler.length === 0) continue;

    // İlk 3 etkinliği UI'da kontrol et
    const kontrolEdilecekler = bolumEtkinlikler.slice(0, 3);
    for (const etk of kontrolEdilecekler) {
      // Etkinlik linkini bul ve tıkla
      const activityLink = page.locator(`a[href*="/tr/etkinlik/${etk.id}"]`).first();
      if (!(await activityLink.isVisible({ timeout: 3000 }).catch(() => false))) {
        bulguEkle('UYARI', etk.id, etk.name, etk.etkinlikTuru, etk.bolum, 'UI', 'Etkinlik linki sayfada görünmüyor');
        continue;
      }

      // Sayfa URL'sini al
      const href = await activityLink.getAttribute('href');
      await page.goto(href!);
      await page.waitForLoadState('networkidle');

      // Düzenle butonunu kontrol et
      const duzenleLink = page.locator('a:has-text("Düzenle")');
      if (!(await duzenleLink.isVisible({ timeout: 5000 }).catch(() => false))) {
        bulguEkle('HATA', etk.id, etk.name, etk.etkinlikTuru, etk.bolum, 'UI', 'Düzenle butonu görünmüyor');
        await page.goBack();
        continue;
      }

      // Düzenle sayfasına git
      const duzenleHref = await duzenleLink.getAttribute('href');
      await page.goto(duzenleHref!);
      await page.waitForLoadState('networkidle');

      // Perde Metni textarea'sını kontrol et
      const perdeTextarea = page.locator('textarea').first();
      if (await perdeTextarea.isVisible()) {
        const perdeMetni = await perdeTextarea.inputValue();
        if (!perdeMetni.trim()) {
          bulguEkle('UYARI', etk.id, etk.name, etk.etkinlikTuru, etk.bolum, 'UI/perdeMetni', 'Perde metni boş (UI)');
        }
      }

      // Resim/Ses/Video link inputlarını kontrol et
      const inputs = page.locator('input[type="text"]');
      const inputCount = await inputs.count();
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const label = await page.locator('label').nth(i).textContent().catch(() => '');
        const value = await input.inputValue();
        if (value && !dosyaVarMi(value)) {
          bulguEkle('UYARI', etk.id, etk.name, etk.etkinlikTuru, etk.bolum, `UI/${label?.trim()}`, `Geçersiz link: ${value}`);
        }
      }

      // Aktivite sayfasına geri dön
      await page.goBack();
      await page.waitForLoadState('networkidle');

      // Ders sayfasına geri dön
      await page.goBack();
      await page.waitForLoadState('networkidle');
    }
  }

  // 5. Rapor yaz
  const raporYolu = path.resolve(__dirname, '../denetim-bulgu-zagmur-unit1.md');
  let md = `# Zağmur Kitabı Denetim Raporu — 1. Ders (Merhaba)\n\n`;
  md += `- **Kitap:** Yağmur Türkçe Ders Kitabı 1 (04POV146VVFZ)\n`;
  md += `- **Ünite:** 1. Ders - Merhaba (NOMRZL2DRWVQ)\n`;
  md += `- **Tarih:** ${new Date().toISOString()}\n`;
  md += `- **Toplam Etkinlik:** ${etkinlikler.length}\n`;
  md += `- **Hata:** ${bulgular.filter(b => b.tip === 'HATA').length}\n`;
  md += `- **Uyarı:** ${bulgular.filter(b => b.tip === 'UYARI').length}\n`;
  md += `- **Bilgi:** ${bulgular.filter(b => b.tip === 'BILGI').length}\n\n`;

  md += `---\n\n`;

  // Bölümlere göre grupla
  const bolumler = [...new Set(bulgular.map(b => b.bolum))].sort();
  for (const bolum of bolumler) {
    md += `## Bölüm: ${bolum}\n\n`;
    const bolumBulgulari = bulgular.filter(b => b.bolum === bolum);
    for (const b of bolumBulgulari) {
      const icon = b.tip === 'HATA' ? '❌' : b.tip === 'UYARI' ? '⚠️' : 'ℹ️';
      md += `### ${icon} [${b.tip}] ${b.etkinlikAdi} (${b.etkinlikTuru})\n\n`;
      md += `- **Etkinlik ID:** \`${b.etkinlikId}\`\n`;
      md += `- **Alan:** \`${b.alan}\`\n`;
      md += `- **Mesaj:** ${b.mesaj}\n\n`;
    }
  }

  // Özet tablo
  md += `---\n\n## Özet Tablo\n\n`;
  md += `| # | Etkinlik | Tür | Bölüm | Hata | Uyarı |\n`;
  md += `|---|----------|-----|-------|------|-------|\n`;

  const uniqueEtkinlikler = [...new Set(bulgular.map(b => b.etkinlikId))];
  for (let i = 0; i < uniqueEtkinlikler.length; i++) {
    const eid = uniqueEtkinlikler[i];
    const b = bulgular.find(x => x.etkinlikId === eid)!;
    const hataSayisi = bulgular.filter(x => x.etkinlikId === eid && x.tip === 'HATA').length;
    const uyariSayisi = bulgular.filter(x => x.etkinlikId === eid && x.tip === 'UYARI').length;
    md += `| ${i + 1} | ${b.etkinlikAdi} | ${b.etkinlikTuru} | ${b.bolum} | ${hataSayisi} | ${uyariSayisi} |\n`;
  }

  fs.writeFileSync(raporYolu, md, 'utf-8');
  console.log(`\n📄 Rapor yazıldı: ${raporYolu}`);
  console.log(`📊 Özet: ${bulgular.filter(b => b.tip === 'HATA').length} hata, ${bulgular.filter(b => b.tip === 'UYARI').length} uyarı`);

  // Bulguları konsola yazdır
  for (const b of bulgular) {
    const icon = b.tip === 'HATA' ? '❌' : b.tip === 'UYARI' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${b.tip}] ${b.etkinlikAdi} (${b.etkinlikTuru}) — ${b.alan}: ${b.mesaj}`);
  }

  // Not: audit modu — hatalar rapora yazıldı, assertion atlanıyor
  // (kullanıcı "düzeltme yapma" talimatı verdi)
});
