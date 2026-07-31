import { api } from '@/lib/api';

export interface EtkinlikDetay {
  id: string;
  description: string | null;
  resimLink: string | null;
  sesLink: string | null;
  cevap: string | null;   // doğru cevap (CoktanSecmeli/Quiz/BoslukDoldurma/DogruYanlis)
  kelime1: string | null;
  kelime2: string | null;
  kelime3: string | null;
  kelime4: string | null;
  kelime5: string | null;
  kelime6: string | null;
  kelime7: string | null;
  kelime8: string | null;
  kelime9: string | null;
  kelime10: string | null;
  // Quiz/CoktanSecmeli/ResimlerdenBiriniSecme: sunucuda karıştırılmış, kimliksiz
  // seçenek listesi (2026-07-31 cevap-gizli mimari fix'i — Kelime1..10 bu tiplerde
  // artık öğrenciye gönderilmiyor, doğru/yanlış yalnızca kontrolEt ile öğrenilir).
  secenekler?: string[] | null;
  orderNo: number;
}

export interface SesSecenegi {
  id: string;
  audioSrc: string | null;
}

export interface EtkinlikData {
  id: string;
  name: string;
  bolum: string;
  soruYonergesi: string | null;
  description: string | null;
  resimLink: string | null;
  sesLink: string | null;
  videoLink: string | null;
  etkinlikTuru: string;
  etkinlikTuruId: string;
  uniteAdi?: string;
  uniteId?: string;
  kitapAdi?: string;
  kitapId?: string;
  // KelimeleriEslestir: sağ sütun için sunucuda karıştırılmış, detaydan kopuk değer listesi.
  sagSecenekleri?: string[] | null;
  // ResminSesiHangisi: ses havuzu — id ile keyleniyor, Kelime1 artık ayrı per-detay gitmiyor.
  sesSecenekleri?: SesSecenegi[] | null;
  detaylar: EtkinlikDetay[];
}

export type Cevap = { id: string; cevap: string };

export interface PlayerProps {
  etkinlik: EtkinlikData;
  onComplete: (cevaplar: Cevap[]) => void;
  kitapId?: string | null;
  uniteId?: string | null;
}

export function getKelimeler(d: EtkinlikDetay): string[] {
  return [
    d.kelime1, d.kelime2, d.kelime3, d.kelime4, d.kelime5,
    d.kelime6, d.kelime7, d.kelime8, d.kelime9, d.kelime10,
  ].filter(Boolean) as string[];
}

// Soru bazlı anlık doğru/yanlış "peek" (2026-07-31 cevap-gizli mimari fix'i) — GetEtkinlik
// artık Quiz/CoktanSecmeli/ResimlerdenBiriniSecme/ResminSesiHangisi/KelimeleriEslestir için
// doğru cevabı göndermiyor, bu yüzden client-side karşılaştırma kalktı; her seçimde bu
// endpoint'e sorulup gerçek sonuç bekleniyor. Asıl ödül (XP/kalp/history) hâlâ yalnızca
// aktivite sonunda cevapla ile kazanılıyor — bu sadece erken görsel geri bildirim içindir.
export async function kontrolEt(etkinlikId: string, detayId: string, cevap: string) {
  const { data } = await api.post<{ id: string; dogruCevap: string | null; sonuc: boolean }>(
    '/api/etkinlik/kontrol',
    { etkinlikId, detayId, cevap },
  );
  return data;
}

// MetinCheckBox: kelime1-9 şıklar, DB'deki Cevap mask'i (ör. "1,0,1,...") pozisyoneldir
// (mask[i] ↔ kelimeN, N=i+1) — kelime10 bu tipte hiç kullanılmıyor (DB'de doğrulandı).
// Boş şıkları elerken orijinal index korunmalı, aksi halde gönderilen mask kayar.
export function getKelimelerIndexed(d: EtkinlikDetay): { index: number; text: string }[] {
  return [
    d.kelime1, d.kelime2, d.kelime3, d.kelime4, d.kelime5,
    d.kelime6, d.kelime7, d.kelime8, d.kelime9,
  ]
    .map((text, index) => ({ index, text }))
    .filter((o): o is { index: number; text: string } => !!o.text && o.text.trim() !== '');
}
