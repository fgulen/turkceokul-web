'use client';

// DataTable şablonunun ortak parçaları (4 Şablon Kuralı: Liste).
// Küçük veri setleri için client-side sıralama/sayfalama desenini standartlaştırır.

import { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Search, X } from 'lucide-react';

// Standart arama kutusu (referans: Ülkeler "Ülke ara..."): kompakt, ikonlu,
// doluyken X ile temizlenir. Tüm staff listelerinde bu kullanılır.
// onChange 300ms debounce'lu çağrılır — Kullanıcılar/Ders Kitapları server-side
// arama sorgusunu her tuş vuruşunda tetikliyordu (code review efficiency bulgusu);
// input'un kendisi yine anlık (local state), yalnız onChange'e giden değer gecikir.
interface AramaInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function AramaInput({ value, onChange, placeholder = 'Ara...' }: AramaInputProps) {
  const [local, setLocal] = useState(value);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dışarıdan value değişirse (örn. filtre sıfırlama) local input'u senkronla.
  useEffect(() => { setLocal(value); }, [value]);

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  function handleChange(v: string) {
    setLocal(v);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onChange(v), 300);
  }

  function handleClear() {
    setLocal('');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onChange('');
  }

  return (
    <div className="relative flex-1 min-w-[180px] max-w-xs">
      <Search className="absolute left-2.5 top-2 size-3.5 text-slate-400" />
      <input
        value={local}
        onChange={e => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-300" />
      {local && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label="Aramayı temizle">
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

// Türkçe locale ile karışık tip sıralama (string'ler localeCompare, sayılar sayısal)
export function trSirala<T>(liste: T[], key: keyof T & string, dir: 'asc' | 'desc'): T[] {
  const yon = dir === 'asc' ? 1 : -1;
  return [...liste].sort((a: T, b: T) => {
    const av = a[key], bv = b[key];
    if (typeof av === 'string' || typeof bv === 'string')
      return yon * String(av ?? '').localeCompare(String(bv ?? ''), 'tr');
    return yon * ((av ?? 0) === (bv ?? 0) ? 0 : (av ?? 0) > (bv ?? 0) ? 1 : -1);
  });
}

// UTF-8 BOM'lu CSV indir — Excel Türkçe karakterleri ancak BOM ile doğru açar
export function csvIndir(dosyaAdi: string, basliklar: string[], satirlar: (string | number)[][]) {
  const hucre = (v: string | number) =>
    typeof v === 'number' ? String(v) : `"${(v ?? '').replace(/"/g, '""')}"`;
  const csv = [basliklar.join(';'), ...satirlar.map(r => r.map(hucre).join(';'))].join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = dosyaAdi;
  a.click();
  URL.revokeObjectURL(url);
}

// Toplu seçim + toplu silme standardı (referans: Ülkeler). Set<ID> tabanlı seçim
// state'i + header/row checkbox'ları + "Toplu Sil (n)" butonu. Her listede tekrar
// yazılan Set<number> boilerplate'inin yerini alır.
export function useTopluSecim<ID extends string | number>() {
  const [secili, setSecili] = useState<Set<ID>>(new Set());

  function toggleBir(id: ID) {
    setSecili(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleHepsi(gorunenIdler: ID[]) {
    setSecili(prev => (prev.size === gorunenIdler.length && gorunenIdler.length > 0) ? new Set() : new Set(gorunenIdler));
  }

  function temizle() {
    setSecili(new Set());
  }

  return { secili, toggleBir, toggleHepsi, temizle };
}

interface TopluSecimThProps<ID extends string | number> {
  gorunenIdler: ID[];
  secili: Set<ID>;
  onToggleHepsi: (idler: ID[]) => void;
}

export function TopluSecimTh<ID extends string | number>({ gorunenIdler, secili, onToggleHepsi }: TopluSecimThProps<ID>) {
  return (
    <th className="w-10 px-4 py-2.5">
      <input type="checkbox"
        checked={secili.size === gorunenIdler.length && gorunenIdler.length > 0}
        onChange={() => onToggleHepsi(gorunenIdler)} />
    </th>
  );
}

interface TopluSecimTdProps<ID extends string | number> {
  id: ID;
  secili: Set<ID>;
  onToggle: (id: ID) => void;
}

export function TopluSecimTd<ID extends string | number>({ id, secili, onToggle }: TopluSecimTdProps<ID>) {
  return (
    <td className="px-4 py-2" onClick={e => e.stopPropagation()}>
      <input type="checkbox" checked={secili.has(id)} onChange={() => onToggle(id)} />
    </td>
  );
}

export function TopluSilButton({ sayi, onClick }: { sayi: number; onClick: () => void }) {
  if (sayi === 0) return null;
  return (
    <button onClick={onClick}
      className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors">
      Toplu Sil ({sayi})
    </button>
  );
}

// Bulk endpoint yoksa: tekil DELETE'leri paralel çalıştırır, başarısız sayısını
// döner (referans: Ülkeler toplu silme — "bağlı kurum/kayıt" gibi sebeplerle
// bazı silmeler reddedilebilir, hepsi başarısız olmadan diğerleri uygulanır).
export async function topluSilParalel<ID>(ids: ID[], silFn: (id: ID) => Promise<unknown>): Promise<number> {
  const sonuclar = await Promise.allSettled(ids.map(id => silFn(id)));
  return sonuclar.filter(s => s.status === 'rejected').length;
}

// Sıralama state + toggle standardı (bkz. useTopluSecim) — aynı 3 satırlık
// toggleSort mantığı 6 dosyada/9 yerde kopyalanıyordu (code review reuse bulgusu).
// onToggle: sayfalı listelerde her sıralama değişiminde sayfa 1'e dönmek için
// (örn. `() => setSayfa(1)`); sayfasız panellerde/görünümlerde opsiyoneldir.
export function useSiralama<K extends string>(baslangicKey: K, onToggle?: () => void, baslangicDir: 'asc' | 'desc' = 'asc') {
  const [sortKey, setSortKey] = useState<K>(baslangicKey);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(baslangicDir);

  function toggleSort(key: K) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
    onToggle?.();
  }

  return { sortKey, sortDir, toggleSort };
}

interface SortThProps<K extends string> {
  colKey: K;
  sortKey: K;
  sortDir: 'asc' | 'desc';
  onSort: (key: K) => void;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function SortTh<K extends string>({ colKey, sortKey, sortDir, onSort, children, align = 'left', className = '' }: SortThProps<K>) {
  const aktif = sortKey === colKey;
  const Icon = !aktif ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
  const hiza = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return (
    <th className={`px-4 py-2.5 font-medium text-slate-600 ${hiza} ${className}`}>
      <button
        onClick={() => onSort(colKey)}
        className={`inline-flex items-center gap-1 hover:text-slate-900 transition-colors ${aktif ? 'text-slate-900' : ''}`}>
        {children}
        <Icon className={`size-3 ${aktif ? 'text-purple-600' : 'text-slate-300'}`} />
      </button>
    </th>
  );
}

interface SayfalamaProps {
  sayfa: number;
  totalPages: number;
  toplam: number;
  sayfaBoyutu: number;
  onSayfa: (s: number) => void;
}

export function Sayfalama({ sayfa, totalPages, toplam, sayfaBoyutu, onSayfa }: SayfalamaProps) {
  if (totalPages <= 1) return null;
  return (
    // Kartın DIŞINA, kardeş olarak yerleştirilir (kartın overflow-hidden'ı
    // sticky'yi etkisizleştirir). Uzun listede viewport altına yapışır —
    // sayfa değiştirmek için en alta kaydırmak gerekmez.
    <div className="sticky bottom-0 z-10 mt-2 bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-2 flex items-center justify-between">
      <span className="text-xs text-slate-400 tabular-nums">
        {(sayfa - 1) * sayfaBoyutu + 1}–{Math.min(sayfa * sayfaBoyutu, toplam)} / {toplam}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          disabled={sayfa === 1}
          onClick={() => onSayfa(sayfa - 1)}
          className="size-7 flex items-center justify-center rounded text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          ‹
        </button>
        {buildPageRange(sayfa, totalPages).map((p, i) =>
          p === '...'
            ? <span key={`d${i}`} className="px-1 text-slate-400 text-xs">…</span>
            : <button
                key={p}
                onClick={() => onSayfa(Number(p))}
                className={`size-7 flex items-center justify-center rounded text-xs transition-colors ${
                  sayfa === p ? 'bg-purple-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}>
                {p}
              </button>
        )}
        <button
          disabled={sayfa === totalPages}
          onClick={() => onSayfa(sayfa + 1)}
          className="size-7 flex items-center justify-center rounded text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
          ›
        </button>
      </div>
    </div>
  );
}
