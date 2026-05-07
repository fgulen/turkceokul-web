import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const ETKINLIK_LABELS: Record<string, string> = {
  AkilliKart: 'Akıllı Kart',
  Quiz: 'Quiz',
  KelimeleriEslestir: 'Kelimeleri Eşleştir',
  CoktanSecmeliBoslukDoldurma: 'Çoktan Seçmeli',
  ResimSesEslestirme: 'Resim–Ses Eşleştirme',
  OkuGec: 'Oku & Geç',
  BoslukDoldurma: 'Boşluk Doldurma',
  MetinDogruYanlis: 'Doğru / Yanlış',
  MetinCheckBox: 'Doğru / Yanlış',
  ResimMetinEslestirmeDogruYanlis: 'Doğru / Yanlış',
  ResmeTiklaDinle: 'Resme Tıkla & Dinle',
  YaziyaTiklaDinle: 'Yazıya Tıkla & Dinle',
  ResimMetinEslestirme: 'Resim–Metin Eşleştirme',
  MetinSesEslestirme: 'Metin–Ses Eşleştirme',
  ResminSesiHangisi: 'Resmin Sesi Hangisi?',
  ResimlerdenBiriniSecme: 'Resimlerden Birini Seç',
  KelimeleriSirala: 'Kelimeleri Sırala',
  SesiDinleveKelimeYaz: 'Dinle & Yaz',
  KelimelerdenCumleYap: 'Cümle Kur',
  ResimKartliHafizaOyunu: 'Hafıza Oyunu',
  KelimeleriGrupla: 'Kelimeleri Grupla',
  ResmeKelimeYaz: 'Resme Kelime Yaz',
  DiyalogYap: 'Diyalog Yap',
};

export function etkinlikLabel(tur: string): string {
  return ETKINLIK_LABELS[tur] ?? tur;
}

const BOLUM_COLORS: Record<string, string> = {
  Kelime:        'bg-blue-100   text-blue-700   dark:bg-blue-950   dark:text-blue-300',
  Okuma:         'bg-green-100  text-green-700  dark:bg-green-950  dark:text-green-300',
  Dinleme:       'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  Yazma:         'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  Dilbilgisi:    'bg-pink-100   text-pink-700   dark:bg-pink-950   dark:text-pink-300',
  Değerlendirme: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
};

export function bolumColor(bolum: string): string {
  return BOLUM_COLORS[bolum] ?? 'bg-muted text-muted-foreground';
}

// Pedagojik bölüm sırası: Kelime→Okuma→Dinleme→Yazma→Dilbilgisi→Değerlendirme
const BOLUM_SIRASI: Record<string, number> = {
  Kelime: 0, Okuma: 1, Dinleme: 2, Yazma: 3, Dilbilgisi: 4, Değerlendirme: 5,
};

export function bolumSirasi(bolum: string): number {
  return BOLUM_SIRASI[bolum] ?? 99;
}

const BOLUM_ICONS: Record<string, string> = {
  Kelime:        'BookOpen',
  Okuma:         'BookMarked',
  Dinleme:       'Headphones',
  Yazma:         'PenLine',
  Dilbilgisi:    'Languages',
  Değerlendirme: 'Trophy',
};

export function bolumIconName(bolum: string): string {
  return BOLUM_ICONS[bolum] ?? 'Layers';
}

// Medya URL'i çöz: R2 varsa R2, yoksa public/ klasöründen serve et
const R2 = process.env.NEXT_PUBLIC_R2_URL ?? '';

export function toMediaUrl(link: string | null | undefined): string | null {
  if (!link) return null;
  if (link.startsWith('http')) return link;
  const clean = link.startsWith('/') ? link : `/${link}`;
  if (!R2) return clean;
  return `${R2}/${clean.replace(/^\//, '')}`;
}

export const BOLUM_ZIGZAG = {
  Kelime: {
    active: 'bg-blue-500',
    ring: 'ring-blue-200',
    shadow: 'shadow-blue-200',
    connector: 'border-blue-200',
    label: 'bg-blue-100 text-blue-700',
    activeLabel: 'text-blue-600',
  },
  Okuma: {
    active: 'bg-emerald-500',
    ring: 'ring-emerald-200',
    shadow: 'shadow-emerald-200',
    connector: 'border-emerald-200',
    label: 'bg-emerald-100 text-emerald-700',
    activeLabel: 'text-emerald-600',
  },
  Dinleme: {
    active: 'bg-purple-500',
    ring: 'ring-purple-200',
    shadow: 'shadow-purple-200',
    connector: 'border-purple-200',
    label: 'bg-purple-100 text-purple-700',
    activeLabel: 'text-purple-600',
  },
  Yazma: {
    active: 'bg-orange-500',
    ring: 'ring-orange-200',
    shadow: 'shadow-orange-200',
    connector: 'border-orange-200',
    label: 'bg-orange-100 text-orange-700',
    activeLabel: 'text-orange-600',
  },
  Dilbilgisi: {
    active: 'bg-pink-500',
    ring: 'ring-pink-200',
    shadow: 'shadow-pink-200',
    connector: 'border-pink-200',
    label: 'bg-pink-100 text-pink-700',
    activeLabel: 'text-pink-600',
  },
  Değerlendirme: {
    active: 'bg-amber-500',
    ring: 'ring-amber-200',
    shadow: 'shadow-amber-200',
    connector: 'border-amber-200',
    label: 'bg-amber-100 text-amber-700',
    activeLabel: 'text-amber-600',
  },
};

export type BolumZigzagColor = typeof BOLUM_ZIGZAG[keyof typeof BOLUM_ZIGZAG];

export function getBolumZigzagColor(bolum: string): BolumZigzagColor {
  return BOLUM_ZIGZAG[bolum as keyof typeof BOLUM_ZIGZAG] ?? {
    active: 'bg-primary',
    ring: 'ring-primary/20',
    shadow: 'shadow-primary/20',
    connector: 'border-border',
    label: 'bg-muted text-muted-foreground',
    activeLabel: 'text-primary',
  };
}
