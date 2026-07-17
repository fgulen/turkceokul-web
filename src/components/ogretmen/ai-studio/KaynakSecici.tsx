'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, X } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface KaynakSecim {
  kitapTuru: 'DersKitabi' | 'OkumaKitabi';
  kitapId: string;
  kitapAdi: string;
  seviye: string;        // kitaptan otomatik (boşsa 'A1' varsayma — chip gizlenir)
  uniteId: string;
  uniteAdi: string;
}

interface KitapDto {
  id: string;
  name: string;
  seviye?: string | null;
  kitapSeti?: string | null;
  kitapTuru?: string | null;
  orderNo?: number;
  thumbnailPicture?: string | null;
  description?: string | null;
}

interface UniteDto {
  id: string;
  name: string;
}

const SEGMENTLER: { id: KaynakSecim['kitapTuru']; label: string }[] = [
  { id: 'DersKitabi', label: 'Ders Kitapları' },
  { id: 'OkumaKitabi', label: 'Okuma Kitapları' },
];

export function KaynakSecici({ secim, onChange }: {
  secim: KaynakSecim | null;
  onChange: (s: KaynakSecim | null) => void;
}) {
  const [tur, setTur] = useState<KaynakSecim['kitapTuru']>(secim?.kitapTuru ?? 'DersKitabi');
  const [kitapId, setKitapId] = useState('');

  const { data: kitaplar = [] } = useQuery<KitapDto[]>({
    queryKey: ['derskitaplari', tur],
    queryFn: () => api.get(`/api/derskitaplari?tur=${tur}`).then(r => r.data),
    enabled: !secim,
  });

  const { data: uniteler = [] } = useQuery<UniteDto[]>({
    queryKey: ['uniteler', kitapId],
    queryFn: () => api.get(`/api/uniteler/${kitapId}`).then(r => r.data),
    enabled: !secim && !!kitapId,
  });

  const seciliKitap = kitaplar.find(k => k.id === kitapId);
  const uniteLabel = tur === 'OkumaKitabi' ? 'Bölüm' : 'Ünite';

  function segmentDegistir(yeniTur: KaynakSecim['kitapTuru']) {
    if (yeniTur === tur) return;
    setTur(yeniTur);
    setKitapId('');
    onChange(null);
  }

  function kitapDegistir(yeniKitapId: string) {
    setKitapId(yeniKitapId);
  }

  function uniteSec(uniteId: string) {
    if (!uniteId || !seciliKitap) return;
    const unite = uniteler.find(u => u.id === uniteId);
    if (!unite) return;
    onChange({
      kitapTuru: tur,
      kitapId,
      kitapAdi: seciliKitap.name,
      seviye: seciliKitap.seviye ?? '',
      uniteId: unite.id,
      uniteAdi: unite.name,
    });
  }

  function temizle() {
    onChange(null);
    setKitapId('');
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
        İçerik Kaynağı
      </label>

      {secim ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/8 border border-primary/20 rounded-lg">
          <BookOpen className="size-3.5 text-primary shrink-0" />
          <span className="text-xs text-primary font-medium flex-1 min-w-0 truncate">
            {secim.kitapAdi} — {secim.uniteAdi}
          </span>
          <button
            type="button"
            onClick={temizle}
            className="text-primary/60 hover:text-primary transition-colors"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {SEGMENTLER.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => segmentDegistir(s.id)}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  tur === s.id
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-primary/40',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={kitapId}
              onChange={e => kitapDegistir(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">Kitap seçin...</option>
              {kitaplar.map(k => (
                <option key={k.id} value={k.id}>{k.name}</option>
              ))}
            </select>
            {seciliKitap?.seviye && (
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-500 text-xs font-medium">
                🏷 {seciliKitap.seviye}
              </span>
            )}
          </div>

          {kitapId && (
            <select
              value=""
              onChange={e => uniteSec(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-white"
            >
              <option value="">{uniteLabel} seçin...</option>
              {uniteler.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}
        </div>
      )}
    </div>
  );
}
