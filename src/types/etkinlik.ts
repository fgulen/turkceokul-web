export interface EtkinlikDetay {
  id: string;
  description: string | null;
  resimLink: string | null;
  sesLink: string | null;
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
  orderNo: number;
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
