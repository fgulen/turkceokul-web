import { Page, APIRequestContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const TRACKER_PATH = path.join(__dirname, 'tested-activities.json');

export interface Etkinlik {
  id: string;
  etkinlikAdi: string;
  etkinlikTuru: string;
  uniteId: string;
  kitapId: string;
  kitapAdi: string;
  uniteAdi: string;
}

export interface Kitap {
  id: number;
  name: string;
}

export interface Unite {
  id: number;
  name: string;
}

/** Reads the tracker file to get list of already-tested activity IDs */
export function readTestedIds(): Set<string> {
  try {
    const raw = fs.readFileSync(TRACKER_PATH, 'utf-8');
    return new Set(Object.keys(JSON.parse(raw)));
  } catch {
    return new Set();
  }
}

/** Records an activity ID as tested */
export function recordTested(id: string, type: string, name: string) {
  const registry: Record<string, { type: string; name: string; testedAt: string }> = {};
  try {
    const raw = fs.readFileSync(TRACKER_PATH, 'utf-8');
    Object.assign(registry, JSON.parse(raw));
  } catch { /* ignore */ }
  registry[id] = { type, name, testedAt: new Date().toISOString() };
  fs.writeFileSync(TRACKER_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

/** Returns tracker stats */
export function getTrackerStats() {
  const ids = readTestedIds();
  const registry: Record<string, { type: string; name: string }> = {};
  try {
    const raw = fs.readFileSync(TRACKER_PATH, 'utf-8');
    Object.assign(registry, JSON.parse(raw));
  } catch { /* ignore */ }
  const byType: Record<string, number> = {};
  for (const [, v] of Object.entries(registry)) {
    byType[v.type] = (byType[v.type] ?? 0) + 1;
  }
  return { total: ids.size, byType };
}

/** Fetches all textbooks from the API */
export async function fetchKitaplar(request: APIRequestContext, token: string): Promise<Kitap[]> {
  const res = await request.get('http://localhost:5221/api/derskitaplari', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return [];
  const data: any[] = await res.json();
  return data.map((d: any) => ({ id: d.id, name: d.name }));
}

/** Fetches all units for a given book */
export async function fetchUniteler(request: APIRequestContext, token: string, kitapId: number): Promise<Unite[]> {
  const res = await request.get(`http://localhost:5221/api/uniteler/${kitapId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return [];
  const data: any[] = await res.json();
  return data.map((d: any) => ({ id: d.id, name: d.name }));
}

/** Fetches activities for a unit */
export async function fetchEtkinlikler(
  request: APIRequestContext,
  token: string,
  kitapId: number,
  uniteId: number,
  kitapAdi: string,
  uniteAdi: string
): Promise<Etkinlik[]> {
  const res = await request.get(`http://localhost:5221/api/etkinlikler/${uniteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return [];
  const data: any[] = await res.json();
  return data.map((h: any) => ({
    id: h.id,
    etkinlikAdi: h.name,
    etkinlikTuru: h.etkinlikTuru,
    uniteId: String(uniteId),
    kitapId: String(kitapId),
    kitapAdi,
    uniteAdi,
  }));
}

/** Fetches ALL activities across all books/units */
export async function fetchAllActivities(
  request: APIRequestContext,
  token: string
): Promise<Etkinlik[]> {
  const kitaplar = await fetchKitaplar(request, token);
  const all: Etkinlik[] = [];

  for (const kitap of kitaplar) {
    const uniteler = await fetchUniteler(request, token, kitap.id);
    for (const unite of uniteler) {
      const etkinlikler = await fetchEtkinlikler(request, token, kitap.id, unite.id, kitap.name, unite.name);
      all.push(...etkinlikler);
    }
  }

  return all;
}

/** Groups activities by type and picks one random untested per type */
export function pickRandomUntestedPerType(
  activities: Etkinlik[],
  testedIds: Set<string>
): Map<string, Etkinlik> {
  const byType = new Map<string, Etkinlik[]>();
  for (const a of activities) {
    if (!byType.has(a.etkinlikTuru)) byType.set(a.etkinlikTuru, []);
    byType.get(a.etkinlikTuru)!.push(a);
  }

  const result = new Map<string, Etkinlik>();
  for (const [type, acts] of byType) {
    const untested = acts.filter(a => !testedIds.has(a.id));
    if (untested.length === 0) continue;
    const picked = untested[Math.floor(Math.random() * untested.length)];
    result.set(type, picked);
  }
  return result;
}

/** Checks page for player errors or content load failure */
export async function pageHasError(page: Page): Promise<string | null> {
  try {
    const text = await page.evaluate(() => document.body.innerText);
    if (/404|bulunamadı|hata|yetkiniz yok/i.test(text) && text.length < 300) {
      return text.substring(0, 200);
    }
    return null;
  } catch {
    return 'page-error';
  }
}
