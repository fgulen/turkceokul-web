'use client';

// DataTable şablonunun ortak parçaları (4 Şablon Kuralı: Liste).
// Küçük veri setleri için client-side sıralama/sayfalama desenini standartlaştırır.

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

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
  return [...liste].sort((a: any, b: any) => {
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

interface SortThProps<K extends string> {
  colKey: K;
  sortKey: K;
  sortDir: 'asc' | 'desc';
  onSort: (key: K) => void;
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

export function SortTh<K extends string>({ colKey, sortKey, sortDir, onSort, children, align = 'left' }: SortThProps<K>) {
  const aktif = sortKey === colKey;
  const Icon = !aktif ? ArrowUpDown : sortDir === 'asc' ? ArrowUp : ArrowDown;
  const hiza = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
  return (
    <th className={`px-4 py-2.5 font-medium text-slate-600 ${hiza}`}>
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
    <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
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
