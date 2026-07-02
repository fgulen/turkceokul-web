// web/src/lib/katalog-api.ts
// GET /api/katalog (public, no-auth) — kurumsal satış sayfası için katalog verisi.
import { api } from '@/lib/api';

export interface KatalogKitap {
  id: string;
  ad: string;
  seviye?: string;
  seri?: string;
  kapakResimUrl?: string;
  kitapTuru: string;
}

export interface KatalogPaket {
  id: number;
  ad: string;
  aciklama?: string;
  kitapIdler: string[];
  kitapAdlari: string[];
}

export interface KatalogKampanya {
  id: number;
  ad: string;
  indirimOrani: number;
  bitisTarihi: string;
}

export interface KatalogKademe {
  minOgrenci: number;
  indirimOrani: number;
}

export interface Katalog {
  kitaplar: KatalogKitap[];
  paketler: KatalogPaket[];
  aktifKampanya?: KatalogKampanya;
  hacimKademeler: KatalogKademe[];
  birimFiyatEurCent: number;
}

// Server Component'ten çağrılabilir — `api` (axios) örneği `typeof window === 'undefined'`
// durumunda server base URL'ini kullanacak şekilde tasarlandı (bkz. lib/api.ts). Bu fonksiyon
// `/kurumsal-satis` sayfasında `export const dynamic = 'force-dynamic'` ile birlikte
// çağrılıyor; bu sayede `next build` sırasında prerender denenmez, fetch yalnızca
// istek anında (runtime) çalışır — build-time ECONNREFUSED riski yok.
export async function getKatalog(): Promise<Katalog> {
  const { data } = await api.get<Katalog>('/api/katalog');
  return data;
}
