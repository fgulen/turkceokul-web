// web/src/lib/katalog-api.ts
// GET /api/katalog (public, no-auth) — kurumsal satış sayfası için katalog verisi.
import { api } from '@/lib/api';

export interface KatalogKitap {
  id: string;
  ad: string;
  seviye?: string;
  seri?: string;
  kapakResimUrl?: string;
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

// Client-side fetch — bu proje `api` (axios) örneğini yalnızca client bileşenlerinde
// kullanıyor (bkz. super-admin/page.tsx). Server Component içinde çağırmak, build
// sırasında API'ye erişilemediğinde `next build`'i kırar; bu yüzden bu fonksiyon
// 'use client' bir bileşen içinden (useQuery ile) çağrılmalı.
export async function getKatalog(): Promise<Katalog> {
  const { data } = await api.get<Katalog>('/api/katalog');
  return data;
}
