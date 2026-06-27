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
  Kelime:         'bg-blue-100   text-blue-700   dark:bg-blue-950   dark:text-blue-300',
  Okuma:          'bg-green-100  text-green-700  dark:bg-green-950  dark:text-green-300',
  Dinleme:        'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300',
  Yazma:          'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  DilBilgisi:     'bg-pink-100   text-pink-700   dark:bg-pink-950   dark:text-pink-300',
  Degerlendirme:  'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
  'AI Generated':  'bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300',
  'Okuma Kitabı': 'bg-amber-100  text-amber-700  dark:bg-amber-950  dark:text-amber-300',
};

export function bolumColor(bolum: string): string {
  return BOLUM_COLORS[bolum] ?? 'bg-muted text-muted-foreground';
}

// Pedagojik bölüm sırası: Kelime→Okuma→Dinleme→Yazma→Dilbilgisi→Değerlendirme→AI Generated
const BOLUM_SIRASI: Record<string, number> = {
  Kelime: 0, Okuma: 1, Dinleme: 2, Yazma: 3, DilBilgisi: 4, Degerlendirme: 5, 'AI Generated': 6, 'Okuma Kitabı': 7,
};

export function bolumSirasi(bolum: string): number {
  return BOLUM_SIRASI[bolum] ?? 99;
}

const BOLUM_ICONS: Record<string, string> = {
  Kelime:         'BookOpen',
  Okuma:          'BookMarked',
  Dinleme:        'Headphones',
  Yazma:          'PenLine',
  DilBilgisi:     'Languages',
  Degerlendirme:  'Trophy',
  'AI Generated': 'Sparkles',
  'Okuma Kitabı': 'BookOpen',
};

export function bolumIconName(bolum: string): string {
  return BOLUM_ICONS[bolum] ?? 'Layers';
}

// Medya URL'i çöz: R2 varsa R2, yoksa API'den serve et
// DB'de /Medya/... (büyük M), R2'de medya/... (küçük m) — normalize et
// Dosya isimlerinde boşluk + Türkçe karakter olabilir — encodeURI ile encode et
const R2 = process.env.NEXT_PUBLIC_R2_URL ?? '';

export function toMediaUrl(link: string | null | undefined): string | null {
  if (!link) return null;
  if (link.startsWith('http')) return link;
  const withoutSlash = link.startsWith('/') ? link.slice(1) : link;
  if (!R2) return `/${withoutSlash}`;
  return `${R2}/${encodeURI(withoutSlash)}`;
}

export const BOLUM_ZIGZAG = {
  Kelime: {
    active: 'bg-primary',
    ring: 'ring-primary/30',
    shadow: 'shadow-primary/20',
    connector: 'border-primary/20',
    label: 'bg-primary/10 text-primary',
    activeLabel: 'text-primary',
  },
  Okuma: {
    active: 'bg-teal-500',
    ring: 'ring-teal-200',
    shadow: 'shadow-teal-200',
    connector: 'border-teal-200',
    label: 'bg-teal-100 text-teal-700',
    activeLabel: 'text-teal-600',
  },
  Dinleme: {
    active: 'bg-violet-600',
    ring: 'ring-violet-200',
    shadow: 'shadow-violet-200',
    connector: 'border-violet-200',
    label: 'bg-violet-100 text-violet-700',
    activeLabel: 'text-violet-600',
  },
  Yazma: {
    active: 'bg-cyan-600',
    ring: 'ring-cyan-200',
    shadow: 'shadow-cyan-200',
    connector: 'border-cyan-200',
    label: 'bg-cyan-100 text-cyan-700',
    activeLabel: 'text-cyan-600',
  },
  DilBilgisi: {
    active: 'bg-rose-500',
    ring: 'ring-rose-200',
    shadow: 'shadow-rose-200',
    connector: 'border-rose-200',
    label: 'bg-rose-100 text-rose-700',
    activeLabel: 'text-rose-600',
  },
  Degerlendirme: {
    active: 'bg-amber-500',
    ring: 'ring-amber-200',
    shadow: 'shadow-amber-200',
    connector: 'border-amber-200',
    label: 'bg-amber-100 text-amber-700',
    activeLabel: 'text-amber-600',
  },
  'AI Generated': {
    active: 'bg-fuchsia-600',
    ring: 'ring-fuchsia-200',
    shadow: 'shadow-fuchsia-200',
    connector: 'border-fuchsia-200',
    label: 'bg-fuchsia-100 text-fuchsia-700',
    activeLabel: 'text-fuchsia-600',
  },
  'Okuma Kitabı': {
    active: 'bg-orange-500',
    ring: 'ring-orange-200',
    shadow: 'shadow-orange-200',
    connector: 'border-orange-200',
    label: 'bg-orange-100 text-orange-700',
    activeLabel: 'text-orange-600',
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
