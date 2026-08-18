'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { toMediaUrl } from '@/lib/utils';
import { MediaPicker } from '@/components/media/media-picker';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

// Kitap kapağı düzenleme ekranlarında (editor/kutuphane) ortak kullanılır —
// picker'dan seçim + hâlâ elle URL girme/düzeltme (harici/henüz-R2'de-olmayan kapaklar için).
export function KapakSecici({ value, onChange }: Props) {
  const [secOpen, setSecOpen] = useState(false);

  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1">Kapak Görseli</label>
      <div className="flex items-center gap-3">
        {value ? (
          <div className="relative size-20 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            <Image src={toMediaUrl(value) ?? ''} alt="Kapak önizleme" fill unoptimized sizes="80px" className="object-cover" />
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
              aria-label="Seçimi kaldır"
            >
              <X className="size-2.5" />
            </button>
          </div>
        ) : (
          <div className="flex size-20 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-200 text-[10px] text-slate-400">
            Yok
          </div>
        )}
        <div className="flex-1 min-w-0 space-y-1.5">
          <input
            type="text"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="/Medya/... veya https://..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={() => setSecOpen(true)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            R2&apos;den Seç
          </button>
        </div>
      </div>
      <MediaPicker open={secOpen} tip="resim" onClose={() => setSecOpen(false)} onSelect={onChange} />
    </div>
  );
}
