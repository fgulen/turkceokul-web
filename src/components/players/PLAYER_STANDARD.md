# Player Bileşeni — Geliştirme Standardı

> Yeni etkinlik tipi eklerken bu dosyayı oku ve her maddeyi uygula.
> Kaynak: `TURKCEOKULU_MODERNIZASYON_PLANI.md` → "Player Bileşeni — Geliştirme Standardı"

---

## 1. Wrapper Boyutu

```tsx
// Kart/soru tipi (CoktanSecmeli, Quiz, DogruYanlis, BoslukDoldurma, AkilliKart):
<div className="max-w-sm md:max-w-lg mx-auto">   // 384px mobil → 512px tablet, ortalı

// Eşleştirme/grid tipi (KelimeleriEslestir, ResimSesEslestirme, OkuGec):
<div className="max-w-lg md:max-w-2xl mx-auto">   // 512px mobil → 672px tablet, ortalı
```

> **Tablet notu:** Traffic'in %54.6'sı tablet. Sabit `max-w-sm` verildiğinde 768px ekranın
> %50'si boş kalır. `md:` breakpoint (≥768px) ile içerik yeterli alana yayılır.

---

## 2. GameHUD (kalp + combo + progress)

Doğru/yanlış cevap mantığı olan her player `GameHUD` kullanır. Raw progress bar YAZMA.

```tsx
import { GameHUD } from '@/components/game/game-hud';

<GameHUD
  soruNo={index}
  toplamSoru={detaylar.length}
  kalp={localKalp}
  combo={combo}
  etiket="Quiz"           // player adı
/>
```

Kalp ve combo state'i:
```tsx
const initKalp = useAuthStore((s) => s.user?.kalp ?? 5);
const [localKalp, setLocalKalp] = useState(initKalp);
const [combo, setCombo] = useState(0);

// Doğruda:
setCombo((c) => c + 1);
// Yanlışta:
setCombo(0);
setLocalKalp((k) => Math.max(0, k - 1));
```

**İstisna:** Eşleştirme/okuma tipler (`KelimeleriEslestir`, `ResimSesEslestirme`, `OkuGec`, `ResmeTiklaDinle`) GameHUD yerine `ProgressDots` kullanır — bu player'larda adım adım doğru/yanlış mantığı yoktur.

---

## 3. ProgressDots (eşleştirme/okuma tipler için)

```tsx
import { ProgressDots } from './ui';

<ProgressDots total={detaylar.length} activeIndex={index} />
```

---

## 4. Ses Geri Bildirimi

Doğru/yanlış seçim olan her player'da `useGameSound` kullan:

```tsx
import { useGameSound } from '@/hooks/use-game-sound';

const { play } = useGameSound();
play('correct');   // doğru seçimde
play('wrong');     // yanlış seçimde
play('combo');     // combo eşiklerinde: [2, 3, 5, 10].includes(newCombo)
```

**Kural:** Raw `new Audio(url)` kullanma. Eğer kelimenin kendi sesini çalacaksan `usePlayerAudio` kullan.

---

## 5. onComplete Pattern

```tsx
// Adım adım (kart/soru tipler):
const yeni = [...cevaplar, { id: current.id, cevap: opt }];
if (index + 1 >= detaylar.length) onComplete(yeni);

// Toplu (eşleştirme tipler):
const cevaplar: Cevap[] = detaylar.map((d) => ({ id: d.id, cevap: matched.get(d.id) ?? '' }));
onComplete(cevaplar);

// Pasif geçiş (okuma/dinleme tipler — her zaman doğru):
onComplete(detaylar.map((d) => ({ id: d.id, cevap: '1' })));
```

---

## 6. Medya URL

```tsx
import { toMediaUrl } from '@/lib/utils';

const url = toMediaUrl(link);    // null döndürebilir — kontrol et
if (url) playAudio(url);

// Resim için:
src={toMediaUrl(x) ?? ''}
```

---

## 7. Resim Gösterimi

```tsx
// Kart içi (kırpma yok — AkilliKart gibi):
<img src={imgUrl} className="w-full h-auto block" />

// Sabit yükseklik, içerik resmi:
<img src={imgUrl} className="w-full max-h-56 object-contain rounded-2xl" />

// Resim yoksa fallback:
{imgUrl ? <img ... /> : <div className="...bg-muted"><ImageOff .../></div>}
```

---

## 8. Hint Sistemi

**ActivityHint** — statik, her zaman görünür talimat (oyun mekaniğini açıklar):
```tsx
import { ActivityHint } from './ui';
<ActivityHint>Sol taraftan bir kelime seç, sağ taraftan eşleştir.</ActivityHint>
```

---

## 9. NextButton / NavCounter (okuma/dinleme tipler)

```tsx
import { NextButton, NavCounter } from './ui';

<NextButton isLast={index === detaylar.length - 1} onClick={handleNext} />
<NavCounter index={index} total={detaylar.length} />
```

---

## Checklist — Yeni Player Yazarken

- [ ] Wrapper: kart için `max-w-sm md:max-w-lg`, grid için `max-w-lg md:max-w-2xl`
- [ ] `GameHUD` veya `ProgressDots` var (ikisi birden değil)
- [ ] Doğru/yanlış varsa `useGameSound` kullanılıyor
- [ ] `onComplete` doğru pattern (adım-adım / toplu / pasif)
- [ ] `toMediaUrl()` null kontrolü yapıldı
- [ ] Statik talimat varsa `ActivityHint` kullanıldı
- [ ] Kalp eksilme ve combo artışı GameHUD'a yansıtılıyor
- [ ] **[Tablet]** Dokunma hedefleri ≥44px (mobil), ≥48px (tablet md:)
- [ ] **[Tablet]** Input focus anında `scrollIntoView({ block: 'nearest' })` çağrısı var
- [ ] **[Tablet]** Yazı tipi sınıf projeksiyonunda okunabilir (`text-lg` min, okuma tiplerinde `md:text-xl`)

---

## 10. Tablet Kriterleri (≥768px — sınıf cihazı)

Tablet traffic **%54.6** — birincil sınıf cihazı. Her yeni player bu kriterleri karşılamalı.

### 10.1 Wrapper genişliği
- Kart tipler: `max-w-sm md:max-w-lg` → 512px (ekran 768px → %67 doluluk)
- Grid tipler: `max-w-lg md:max-w-2xl` → 672px (ekran 768px → %88 doluluk)

### 10.2 Dokunma hedefleri
| Eleman | Mobil minimum | Tablet hedef |
|--------|---------------|--------------|
| Cevap butonu | `h-14` (56px) | `h-14 md:h-16` |
| Ikon butonu (Dinle, vb.) | `w-16 h-14` | `w-16 md:w-20 h-14 md:h-16` |
| Özel karakter klavyesi | `min-w-[44px] h-11` | `md:min-w-[52px] md:h-12` |
| İleri / Tamamla | `py-3.5 w-full` | değişmez (zaten yeterli) |

### 10.3 Input ve klavye çakışması
Sanal klavye açıldığında input'u görünür tut:
```tsx
setTimeout(() => {
  inputRef.current?.focus();
  inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}, 150);
```
`block: 'nearest'` — progress bar/HUD'u viewport dışına çıkarmaz; sadece input görünür olur.

### 10.4 Yazı boyutu (sınıf projeksiyonu)
- Okuma metinleri (`OkuGec`, metin kartlar): `text-lg md:text-xl md:leading-loose`
- Soru metni: `text-lg` minimum — küçültme
- Buton etiketleri: `text-sm md:text-base`

### 10.5 Grid düzeni
Eşleştirme/grid tipler için `grid-cols-2` → `md:grid-cols-3` veya `md:grid-cols-4`
olmaz — çünkü fazla kolon satır yüksekliğini azaltır, dokunma zorlaşır.
**Kural:** Grid kolonları artırma, genişlik artır (wrapper responsive).

---

## Audit Durumu (2026-06-18)

| Player | Wrapper | Progress | Ses | Tablet | Notlar |
|--------|---------|----------|-----|--------|--------|
| quiz | sm→lg ✅ | GameHUD ✅ | ✅ | ✅ | Referans implementasyon |
| akilli-kart | sm→lg ✅ | GameHUD ✅ | ✅ | ✅ | |
| coktan-secmeli | sm→lg ✅ | GameHUD ✅ | ✅ | ✅ | |
| dogru-yanlis | sm→lg ✅ | GameHUD ✅ | ✅ | ✅ | |
| bosluk-doldurma | sm→lg ✅ | GameHUD ✅ | ✅ | ✅ | scrollIntoView eklendi |
| coktan-secmeli-bosluk-doldurma | sm→lg ✅ | GameHUD ✅ | ✅ | ✅ | |
| kelimeleri-eslestir | lg→2xl ✅ | X/Y bar ✅ | ✅ | ✅ | |
| kelimeleri-sirala | lg→2xl ✅ | GameHUD ✅ | ✅ | ✅ | |
| resim-ses-eslestirme | lg→2xl ✅ | X/Y bar ✅ | ✅ | ✅ | |
| resim-metin-eslestirme | lg→2xl ✅ | X/Y bar ✅ | ✅ | ✅ | |
| metin-ses-eslestirme | lg→2xl ✅ | X/Y bar ✅ | ✅ | ✅ | Dinle btn md:w-20 md:h-16 |
| oku-gec | lg→2xl ✅ | raw bar | N/A | ✅ | md:text-xl projeksiyon için |
| resme-tikla-dinle | sm→lg ✅ | ProgressDots ✅ | N/A | ✅ | |
| yaziya-tikla-dinle | sm→lg ✅ | ProgressDots ✅ | N/A | ✅ | |
| resmin-sesi-hangisi | sm→lg ✅ | ProgressDots ✅ | ✅ | ✅ | |
| resimlerden-birini-secme | sm→lg ✅ | GameHUD ✅ | ✅ | ✅ | |
| resme-kelime-yaz | sm→lg ✅ | GameHUD ✅ | ✅ | ✅ | klavye md:min-w-[52px], scrollIntoView |
| sesi-dinle-ve-kelime-yaz | sm→lg ✅ | GameHUD ✅ | ✅ | ✅ | |
