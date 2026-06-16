# Player Bileşeni — Geliştirme Standardı

> Yeni etkinlik tipi eklerken bu dosyayı oku ve her maddeyi uygula.
> Kaynak: `TURKCEOKULU_MODERNIZASYON_PLANI.md` → "Player Bileşeni — Geliştirme Standardı"

---

## 1. Wrapper Boyutu

```tsx
// Kart/soru tipi (CoktanSecmeli, Quiz, DogruYanlis, BoslukDoldurma, AkilliKart):
<div className="max-w-sm mx-auto">   // 384px max, ortalı

// Eşleştirme/grid tipi (KelimeleriEslestir, ResimSesEslestirme, OkuGec):
<div className="max-w-lg mx-auto">   // 512px max, ortalı
```

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

## 8. ActivityHint

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

- [ ] Wrapper: `max-w-sm` veya `max-w-lg` seçildi
- [ ] `GameHUD` veya `ProgressDots` var (ikisi birden değil)
- [ ] Doğru/yanlış varsa `useGameSound` kullanılıyor
- [ ] `onComplete` doğru pattern (adım-adım / toplu / pasif)
- [ ] `toMediaUrl()` null kontrolü yapıldı
- [ ] `ActivityHint` ile kullanım talimatı yazıldı
- [ ] Kalp eksilme ve combo artışı GameHUD'a yansıtılıyor

---

## Audit Durumu (2026-06-16)

| Player | Wrapper | Progress | Ses | Notlar |
|--------|---------|----------|-----|--------|
| quiz | sm ✅ | GameHUD ✅ | ✅ | Referans implementasyon |
| akilli-kart | sm ✅ | GameHUD ✅ | ✅ | Referans implementasyon |
| coktan-secmeli | sm ✅ | GameHUD ✅ | ✅ | Düzeltildi 2026-06-16 |
| dogru-yanlis | sm ✅ | GameHUD ✅ | ✅ | Düzeltildi 2026-06-16 |
| bosluk-doldurma | sm ✅ | raw bar | ❌ | Backend değerlendiriyor — lokal ses yok |
| kelimeleri-eslestir | lg ✅ | X/Y bar ✅ | ✅ | Düzeltildi 2026-06-16 |
| resim-ses-eslestirme | lg ✅ | X/Y bar ✅ | ✅ | Düzeltildi 2026-06-16; usePlayerAudio |
| resim-metin-eslestirme | lg ✅ | X/Y bar ✅ | ✅ | Düzeltildi 2026-06-16 |
| metin-ses-eslestirme | lg ✅ | X/Y bar ✅ | ✅ | Düzeltildi 2026-06-16 |
| oku-gec | lg ✅ | raw bar | N/A | Pasif geçiş, ses yok — OK |
| resme-tikla-dinle | sm ✅ | ProgressDots ✅ | N/A | ✅ OK |
| yaziya-tikla-dinle | sm ✅ | ProgressDots ✅ | N/A | ✅ OK |
| resmin-sesi-hangisi | sm ✅ | ProgressDots ✅ | ✅ | ✅ OK |
| resimlerden-birini-secme | sm ✅ | GameHUD ✅ | ✅ | Eklendi 2026-06-16 |
